import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { OnboardingChecklist, createInitialChecklist, markStepComplete } from '@/lib/onboarding/types';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

async function getChecklist(workspaceId: string, userId: string): Promise<OnboardingChecklist | null> {
  const { data, error } = await supabase
    .from('onboarding_checklists')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    workspaceId: data.workspace_id,
    userId: data.user_id,
    steps: data.steps,
    totalXp: data.total_xp,
    earnedXp: data.earned_xp,
    completedAt: data.completed_at,
    currentStep: data.current_step,
  };
}

async function upsertChecklist(checklist: OnboardingChecklist): Promise<OnboardingChecklist> {
  const { data, error } = await supabase
    .from('onboarding_checklists')
    .upsert({
      workspace_id: checklist.workspaceId,
      user_id: checklist.userId,
      steps: checklist.steps,
      total_xp: checklist.totalXp,
      earned_xp: checklist.earnedXp,
      completed_at: checklist.completedAt,
      current_step: checklist.currentStep,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return {
    workspaceId: data.workspace_id,
    userId: data.user_id,
    steps: data.steps,
    totalXp: data.total_xp,
    earnedXp: data.earned_xp,
    completedAt: data.completed_at,
    currentStep: data.current_step,
  };
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');

    if (!userId || !workspaceId) {
      return NextResponse.json({ error: 'Missing userId or workspaceId' }, { status: 400 });
    }

    let checklist = await getChecklist(workspaceId, userId);

    if (!checklist) {
      const initialSteps = createInitialChecklist();
      checklist = {
        workspaceId,
        userId,
        steps: initialSteps,
        totalXp: initialSteps.reduce((sum, s) => sum + s.xp, 0),
        earnedXp: 0,
        completedAt: null,
        currentStep: 0,
      };
      await upsertChecklist(checklist);
    }

    const progress = checklist.steps.filter(s => s.required && s.completedAt).length /
                    Math.max(1, checklist.steps.filter(s => s.required).length) * 100;

    const nextStep = checklist.steps.find(s => !s.completedAt);

    return NextResponse.json({
      checklist,
      progress: Math.round(progress),
      nextStep,
      isComplete: checklist.completedAt !== null,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Get onboarding checklist failed', { error: err });
    return NextResponse.json({ error: 'Failed to fetch onboarding checklist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { workspaceId, stepId, metadata } = await request.json();

    if (!userId || !workspaceId || !stepId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let checklist = await getChecklist(workspaceId, userId);
    if (!checklist) {
      const initialSteps = createInitialChecklist();
      checklist = {
        workspaceId,
        userId,
        steps: initialSteps,
        totalXp: initialSteps.reduce((sum, s) => sum + s.xp, 0),
        earnedXp: 0,
        completedAt: null,
        currentStep: 0,
      };
    }

    const updated = markStepComplete(checklist, stepId, metadata);
    await upsertChecklist(updated);

    const progress = updated.steps.filter(s => s.required && s.completedAt).length /
                    Math.max(1, updated.steps.filter(s => s.required).length) * 100;

    return NextResponse.json({
      checklist: updated,
      progress: Math.round(progress),
      completed: stepId,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Complete onboarding step failed', { error: err });
    return NextResponse.json({ error: 'Failed to complete step' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');

    if (!userId || !workspaceId) {
      return NextResponse.json({ error: 'Missing userId or workspaceId' }, { status: 400 });
    }

    const { error } = await supabase
      .from('onboarding_checklists')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Reset onboarding checklist failed', { error: err });
    return NextResponse.json({ error: 'Failed to reset onboarding' }, { status: 500 });
  }
}