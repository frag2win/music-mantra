import { describe, it, expect } from 'vitest';
import { generate45DayIcsCalendar } from '../../src/utils/calendar';

describe('Phase 2: RFC 5545 iCalendar Generator', () => {
  it('generates a valid 45-day calendar with correct event counts', () => {
    const ics = generate45DayIcsCalendar({
      conditionName: 'Diabetes (Manipura Chakra)',
      mantra: 'Ram',
      swar: 'Ga',
      totalDays: 45,
      timeOfDayHour: 7,
      timeOfDayMinute: 30,
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('X-WR-CALNAME:Swara Healing 45-Day Chanting Practice');

    // Count VEVENT blocks
    const veventMatches = ics.match(/BEGIN:VEVENT/g);
    expect(veventMatches?.length).toBe(45);

    // Verify Day 1 and Day 45 summaries
    expect(ics).toContain('SUMMARY:🧘 Music Mantra — Day 1 of 45 (Diabetes (Manipura Chakra))');
    expect(ics).toContain('SUMMARY:🧘 Music Mantra — Day 45 of 45 (Diabetes (Manipura Chakra))');

    // Verify reminder alarm exists
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-PT15M');
  });
});
