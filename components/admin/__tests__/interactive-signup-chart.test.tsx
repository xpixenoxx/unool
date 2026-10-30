import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InteractiveSignupChart } from '../interactive-signup-chart';

describe('InteractiveSignupChart', () => {
  const sampleData = [
    { date: '2026-10-01', count: 0 },
    { date: '2026-10-02', count: 1 },
    { date: '2026-10-03', count: 4 }, // Peak
    { date: '2026-10-04', count: 2 },
    { date: '2026-10-05', count: 0 },
    { date: '2026-10-06', count: 3 },
    { date: '2026-10-07', count: 1 },
  ];

  it('renders default timeframe title, total signups, and peak badge', () => {
    render(<InteractiveSignupChart data={sampleData} initialNewUsersCount={11} />);

    expect(screen.getByText('30-Day Signups')).toBeDefined();
    expect(screen.getByText('+11')).toBeDefined();
    expect(screen.getByText('new users this month')).toBeDefined();
    expect(screen.getByText(/\+4/)).toBeDefined(); // Peak badge
  });

  it('allows switching timeframes (7D, 14D, 30D)', () => {
    render(<InteractiveSignupChart data={sampleData} initialNewUsersCount={11} />);

    const btn7d = screen.getByRole('button', { name: '7D' });
    fireEvent.click(btn7d);

    expect(screen.getByText('7D Signups')).toBeDefined();
    expect(screen.getByText('new users in last 7 days')).toBeDefined();
  });

  it('updates display to inspecting state on keyboard arrow navigation', () => {
    render(<InteractiveSignupChart data={sampleData} initialNewUsersCount={11} />);

    const region = screen.getByRole('region', { name: /Interactive signup trend graph/i });
    fireEvent.keyDown(region, { key: 'ArrowRight' });

    expect(screen.getByText('Inspecting')).toBeDefined();
  });

  it('renders empty fallback when data is empty', () => {
    render(<InteractiveSignupChart data={[]} />);

    expect(screen.getByText('No registration data recorded for this period')).toBeDefined();
  });
});
