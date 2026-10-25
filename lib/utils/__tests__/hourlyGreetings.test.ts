import { describe, it, expect } from 'vitest';
import {
  HOURLY_GREETINGS,
  formatHourlyGreeting,
  getHourlyGreetingForDate,
} from '../hourlyGreetings';

describe('HOURLY_GREETINGS configuration', () => {
  it('covers all 24 hours (0 through 23)', () => {
    for (let h = 0; h <= 23; h++) {
      expect(HOURLY_GREETINGS[h]).toBeDefined();
      expect(HOURLY_GREETINGS[h].hour).toBe(h);
      expect(HOURLY_GREETINGS[h].template).toContain('{name}');
      expect(HOURLY_GREETINGS[h].timeLabel).toBeTruthy();
    }
  });

  it('matches all exact templates and categories from user specification', () => {
    const expected = [
      // Late night (12 AM - 4 AM)
      { hour: 0, time: '12 AM', phase: 'late-night', phaseLabel: 'Late night', text: 'Still building, {name}. That’s how brands are made.' },
      { hour: 1, time: '1 AM', phase: 'late-night', phaseLabel: 'Late night', text: 'Your queue runs while you rest, {name}.' },
      { hour: 2, time: '2 AM', phase: 'late-night', phaseLabel: 'Late night', text: 'Great ideas don’t keep office hours, {name}.' },
      { hour: 3, time: '3 AM', phase: 'late-night', phaseLabel: 'Late night', text: 'Quiet hours, clear thinking, {name}.' },
      { hour: 4, time: '4 AM', phase: 'late-night', phaseLabel: 'Late night', text: 'Ahead of the world again, {name}.' },

      // Morning (5 AM - 11 AM)
      { hour: 5, time: '5 AM', phase: 'morning', phaseLabel: 'Morning', text: 'The early start is your edge, {name}.' },
      { hour: 6, time: '6 AM', phase: 'morning', phaseLabel: 'Morning', text: 'A new day to grow your audience, {name}.' },
      { hour: 7, time: '7 AM', phase: 'morning', phaseLabel: 'Morning', text: 'Good morning, {name}. Let’s make it count.' },
      { hour: 8, time: '8 AM', phase: 'morning', phaseLabel: 'Morning', text: 'Your audience is waking up, {name}. Be there.' },
      { hour: 9, time: '9 AM', phase: 'morning', phaseLabel: 'Morning', text: 'Consistency wins. Let’s publish, {name}.' },
      { hour: 10, time: '10 AM', phase: 'morning', phaseLabel: 'Morning', text: 'Your followers are online, {name}. Show up.' },
      { hour: 11, time: '11 AM', phase: 'morning', phaseLabel: 'Morning', text: 'Great brands are built on mornings like this, {name}.' },

      // Afternoon (12 PM - 4 PM)
      { hour: 12, time: '12 PM', phase: 'afternoon', phaseLabel: 'Afternoon', text: 'Midday momentum, {name}. Keep it going.' },
      { hour: 13, time: '1 PM', phase: 'afternoon', phaseLabel: 'Afternoon', text: 'Peak attention hour, {name}. Make it matter.' },
      { hour: 14, time: '2 PM', phase: 'afternoon', phaseLabel: 'Afternoon', text: 'Stay sharp, {name}. Your content is working.' },
      { hour: 15, time: '3 PM', phase: 'afternoon', phaseLabel: 'Afternoon', text: 'Your numbers are telling a story, {name}.' },
      { hour: 16, time: '4 PM', phase: 'afternoon', phaseLabel: 'Afternoon', text: 'Plan tomorrow’s wins today, {name}.' },

      // Evening (5 PM - 8 PM)
      { hour: 17, time: '5 PM', phase: 'evening', phaseLabel: 'Evening', text: 'Finish strong, {name}.' },
      { hour: 18, time: '6 PM', phase: 'evening', phaseLabel: 'Evening', text: 'Golden hour for engagement, {name}.' },
      { hour: 19, time: '7 PM', phase: 'evening', phaseLabel: 'Evening', text: 'Prime time, {name}. This is when it counts.' },
      { hour: 20, time: '8 PM', phase: 'evening', phaseLabel: 'Evening', text: 'Your audience is listening, {name}. Say something worth hearing.' },

      // Night (9 PM - 11 PM)
      { hour: 21, time: '9 PM', phase: 'night', phaseLabel: 'Night', text: 'One more strategic move, {name}?' },
      { hour: 22, time: '10 PM', phase: 'night', phaseLabel: 'Night', text: 'Queue set, mind clear. Well done, {name}.' },
      { hour: 23, time: '11 PM', phase: 'night', phaseLabel: 'Night', text: 'A day of real work behind you, {name}. Rest well.' },
    ];

    expected.forEach((item) => {
      const config = HOURLY_GREETINGS[item.hour];
      expect(config.timeLabel).toBe(item.time);
      expect(config.phase).toBe(item.phase);
      expect(config.phaseLabel).toBe(item.phaseLabel);
      expect(config.template).toBe(item.text);
    });
  });
});

describe('formatHourlyGreeting', () => {
  it('correctly interpolates custom user name', () => {
    const greeting = formatHourlyGreeting(7, 'Alex');
    expect(greeting.headline).toBe('Good morning, Alex. Let’s make it count.');
    expect(greeting.timeLabel).toBe('7 AM');
    expect(greeting.phase).toBe('morning');
    expect(greeting.phaseLabel).toBe('Morning');
    expect(greeting.cleanName).toBe('Alex');
    expect(greeting.parts.prefix).toBe('Good morning, ');
    expect(greeting.parts.name).toBe('Alex');
    expect(greeting.parts.suffix).toBe('. Let’s make it count.');
  });

  it('interpolates question mark correctly for 9 PM', () => {
    const greeting = formatHourlyGreeting(21, 'Jordan');
    expect(greeting.headline).toBe('One more strategic move, Jordan?');
    expect(greeting.timeLabel).toBe('9 PM');
    expect(greeting.phase).toBe('night');
    expect(greeting.parts.suffix).toBe('?');
  });

  it('falls back to "there" when name is null or undefined or whitespace', () => {
    const gNull = formatHourlyGreeting(0, null);
    expect(gNull.headline).toBe('Still building, there. That’s how brands are made.');

    const gUndef = formatHourlyGreeting(17, undefined);
    expect(gUndef.headline).toBe('Finish strong, there.');

    const gEmpty = formatHourlyGreeting(12, '   ');
    expect(gEmpty.headline).toBe('Midday momentum, there. Keep it going.');
  });

  it('clamps out of range hours', () => {
    const underflow = formatHourlyGreeting(-1, 'Alex');
    expect(underflow.timeLabel).toBe('12 AM');
    expect(underflow.headline).toBe('Still building, Alex. That’s how brands are made.');

    const overflow = formatHourlyGreeting(29, 'Alex');
    expect(overflow.timeLabel).toBe('11 PM');
    expect(overflow.headline).toBe('A day of real work behind you, Alex. Rest well.');
  });
});

describe('getHourlyGreetingForDate', () => {
  it('reads hour from supplied Date object', () => {
    const date = new Date(2026, 9, 25, 18, 30); // 6:30 PM
    const greeting = getHourlyGreetingForDate(date, 'Taylor');
    expect(greeting.timeLabel).toBe('6 PM');
    expect(greeting.headline).toBe('Golden hour for engagement, Taylor.');
    expect(greeting.phase).toBe('evening');
  });
});
