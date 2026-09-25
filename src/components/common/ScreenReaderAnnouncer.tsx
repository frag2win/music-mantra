import React, { useEffect, useRef, useState } from 'react';

interface ScreenReaderAnnouncerProps {
  /** The message to announce */
  message: string;
  /** Minimum interval between announcements in milliseconds (default: 3500ms) */
  minIntervalMs?: number;
  /** Politeness level */
  politeness?: 'polite' | 'assertive';
}

/**
 * WCAG 2.1 AA Rate-Limited Screen Reader Announcer
 *
 * Ensures that high-frequency audio updates (e.g. 86 frames/sec from YIN pitch tracker)
 * are throttled down to a comfortable rate (e.g. once every 3.5s) for screen reader users.
 */
export const ScreenReaderAnnouncer: React.FC<ScreenReaderAnnouncerProps> = ({
  message,
  minIntervalMs = 3500,
  politeness = 'polite'
}) => {
  const [announcedText, setAnnouncedText] = useState('');
  const lastAnnouncedAt = useRef<number>(0);
  const pendingTimer = useRef<any>(null);

  useEffect(() => {
    if (!message) return;

    const now = Date.now();
    const elapsed = now - lastAnnouncedAt.current;

    if (elapsed >= minIntervalMs) {
      lastAnnouncedAt.current = now;
      setAnnouncedText(message);
    } else {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      pendingTimer.current = setTimeout(() => {
        lastAnnouncedAt.current = Date.now();
        setAnnouncedText(message);
      }, minIntervalMs - elapsed);
    }

    return () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
    };
  }, [message, minIntervalMs]);

  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        margin: '-1px',
        padding: '0',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        border: '0',
        whiteSpace: 'nowrap',
      }}
    >
      {announcedText}
    </div>
  );
};
