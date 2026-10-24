import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGate } from '@/lib/follow-gate/service';
import { FollowGateCard } from '@/components/follow-gate/FollowGateCard';
import { Instagram, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import '@/components/follow-gate/FollowGateCard.css';

interface PageProps {
  params: Promise<{ gateId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { gateId } = await params;
  try {
    const gate = await getGate(gateId);
    if (!gate) {
      return { title: 'Gate Not Found | UNOOL' };
    }
    return {
      title: `${gate.title} — Follow @${gate.igUsername} to Unlock | UNOOL`,
      description: gate.description || `Follow @${gate.igUsername} on Instagram to unlock exclusive content.`,
      openGraph: {
        title: `${gate.title} — Unlock Exclusive Access`,
        description: gate.description || `Follow @${gate.igUsername} on Instagram to unlock exclusive content.`,
        images: gate.thumbnailUrl ? [{ url: gate.thumbnailUrl }] : [],
      },
    };
  } catch {
    return { title: 'Unlock Gate | UNOOL' };
  }
}

export default async function GatePublicPage({ params }: PageProps) {
  const { gateId } = await params;
  const gate = await getGate(gateId);

  if (!gate) {
    notFound();
  }

  const isInactive = !gate.isActive;

  const publicGateMeta = {
    id: gate.id,
    title: gate.title,
    description: gate.description,
    igUsername: gate.igUsername,
    ctaText: gate.ctaText || 'Follow to unlock',
    thumbnailUrl: gate.thumbnailUrl,
    unlockCount: gate.unlockCount,
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF7F2',
      color: '#2C1E16',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
    }}>
      {/* Background ambient lighting */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(223, 91, 76, 0.12) 0%, rgba(196, 162, 101, 0.06) 50%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Top Bar / Branding */}
      <header style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 540,
        margin: '0 auto 24px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 4px',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255, 253, 249, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #E8E0D4',
          padding: '6px 14px',
          borderRadius: 999,
          boxShadow: '0 2px 10px rgba(61, 43, 31, 0.04)',
        }}>
          <Instagram size={14} color="#DF5B4C" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#3D2B1F' }}>
            @{gate.igUsername}
          </span>
          <span style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: '#8B7355',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            paddingLeft: 4,
            borderLeft: '1px solid #E8E0D4',
          }}>
            Exclusive Drop
          </span>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 11.5,
          fontWeight: 600,
          color: '#8B7355',
        }}>
          <ShieldCheck size={14} color="#22C55E" />
          <span>Verified Gate</span>
        </div>
      </header>

      {/* Main Hero Card Container */}
      <main style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 460,
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {isInactive ? (
          <div style={{
            background: '#FFFDF9',
            border: '1.5px solid #E8E0D4',
            borderRadius: 24,
            padding: '40px 24px',
            textAlign: 'center',
            boxShadow: '0 12px 32px rgba(61, 43, 31, 0.08)',
            width: '100%',
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: '#F4EFE6',
              color: '#8B7355',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Lock size={26} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#3D2B1F', margin: '0 0 8px' }}>
              Drop Currently Paused
            </h2>
            <p style={{ fontSize: 14, color: '#8B7355', margin: '0 0 24px', lineHeight: 1.5 }}>
              The creator @{gate.igUsername} has temporarily paused this unlock gate. Please check back later or visit their Instagram profile.
            </p>
            <a
              href={`https://instagram.com/${gate.igUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#3D2B1F',
                color: '#FAF7F2',
                padding: '12px 20px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Instagram size={16} />
              <span>Visit @{gate.igUsername}</span>
            </a>
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <FollowGateCard gateId={gate.id} gateMeta={publicGateMeta} />

            {/* Quick 3-Step Trust Card below */}
            <div style={{
              marginTop: 20,
              background: 'rgba(255, 253, 249, 0.7)',
              border: '1px solid #E8E0D4',
              borderRadius: 16,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(223, 91, 76, 0.1)',
                  color: '#DF5B4C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#3D2B1F' }}>
                    How it works
                  </div>
                  <div style={{ fontSize: 11.5, color: '#8B7355' }}>
                    Follow @{gate.igUsername} on Instagram → tap verify → unlocks automatically!
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 540,
        margin: '32px auto 0',
        width: '100%',
        textAlign: 'center',
        padding: '12px 0 4px',
        borderTop: '1px solid rgba(232, 224, 212, 0.6)',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: '#8B7355',
        }}>
          <span>Powered by</span>
          <Link
            href="/"
            style={{
              color: '#3D2B1F',
              fontWeight: 800,
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            UNOOL
          </Link>
          <span>•</span>
          <span>Growth OS for Creators</span>
        </div>
      </footer>
    </div>
  );
}
