import React, { useState, useEffect } from 'react';
import './StandupTimer.css';

function getSecondsUntilStandup(): number {
  const now = new Date();
  const standup = new Date(now);
  standup.setHours(9, 0, 0, 0);
  if (now >= standup) {
    standup.setDate(standup.getDate() + 1);
  }
  return Math.floor((standup.getTime() - now.getTime()) / 1000);
}

function formatTimeParts(totalSeconds: number): { h: string; m: string; s: string } {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  };
}

export const StandupTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(getSecondsUntilStandup());

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setTimeLeft(getSecondsUntilStandup());
    }, 1000);

    return () => clearInterval(clockTimer);
  }, []);

  const { h, m, s } = formatTimeParts(timeLeft);

  return (
    <div className="standup-timer">
      <span className="standup-timer__icon">⏰</span>
      <h3>Next Standup</h3>
      <div className="standup-timer__display">
        <span className="standup-timer__segment">{h}</span>
        <span className="standup-timer__sep">:</span>
        <span className="standup-timer__segment">{m}</span>
        <span className="standup-timer__sep">:</span>
        <span className="standup-timer__segment">{s}</span>
      </div>
      <p className="standup-timer__label">until 9:00 AM</p>
    </div>
  );
};
