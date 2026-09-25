/**
 * iCalendar (.ics) Generator for Music Mantra 45-Day Healing Program
 * Compliant with RFC 5545 specifications.
 */

export interface CalendarOptions {
  startDate?: Date;
  timeOfDayHour?: number; // 0-23, default 7 (7:00 AM)
  timeOfDayMinute?: number; // 0-59, default 0
  conditionName?: string;
  mantra?: string;
  swar?: string;
  totalDays?: number;
}

export function generate45DayIcsCalendar(options: CalendarOptions = {}): string {
  const {
    startDate = new Date(),
    timeOfDayHour = 7,
    timeOfDayMinute = 0,
    conditionName = 'Swara Healing Chanting',
    mantra = 'Seed Mantra',
    swar = 'Target Swar',
    totalDays = 45,
  } = options;

  const pad = (n: number) => n.toString().padStart(2, '0');

  const formatIcsDate = (date: Date): string => {
    return (
      date.getUTCFullYear() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      'T' +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      'Z'
    );
  };

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Music Mantra//Swara Healing 45-Day Program//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Swara Healing 45-Day Chanting Practice',
  ];

  for (let day = 1; day <= totalDays; day++) {
    const sessionDate = new Date(startDate);
    sessionDate.setDate(sessionDate.getDate() + (day - 1));
    sessionDate.setHours(timeOfDayHour, timeOfDayMinute, 0, 0);

    const endDate = new Date(sessionDate.getTime() + 15 * 60 * 1000); // 15 mins (10 min hold + prep)

    const uid = `swara-healing-day-${day}-${sessionDate.getTime()}@musicmantra.internal`;
    const summary = `🧘 Music Mantra — Day ${day} of 45 (${conditionName})`;
    const description = `Daily 10-minute guided Swara chanting practice for ${conditionName}. Seed mantra: "${mantra}" (${swar}). Open the app to practice.`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(sessionDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: Your Swara Healing session starts in 15 minutes!`,
      'END:VALARM',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
