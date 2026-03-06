import React, { useState, useEffect, useRef } from 'react';
import { NotificationDropdown } from '../NotificationDropdown/NotificationDropdown';
import { searchMembers } from '../../api/mockApi';
import type { Member } from '../../api/mockApi';
import './Header.css';

function computeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export const Header: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [query, setQuery] = useState<string>('');
  const [greeting, setGreeting] = useState(() => computeGreeting());
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const greetInterval = setInterval(() => {

      setGreeting(computeGreeting());
    }, 60000)

    return () => clearInterval(greetInterval);
  }, [])

  useEffect(() => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    const queryTimeout = setTimeout(() => {
      searchMembers(query).then(results => {
        setSearchResults(results);
      });
    }, 300);

    return () => clearTimeout(queryTimeout);
  }, [query]);

  return (
    <header className="header">
      <div className="header__left">
        <h1 className="header__logo" onClick={() => onNavigate('dashboard')}>TeamPulse</h1>
      </div>
      <div className="header__center">
        <div className="header__search-container">
          <input
            className="header__search"
            type="text"
            placeholder="Search members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {searchResults.length > 0 && query && (
            <div className="header__search-results">
              {searchResults.map(m => (
                <div key={m.id} className="header__search-result-item">
                  <strong>{m.name}</strong>
                  <span>{m.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="header__right">
        <span className="header__greeting">{greeting}, John</span>
        <div ref={notificationRef} style={{ position: 'relative' }}>
          <button
            className="header__notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔
          </button>
          {showNotifications && <NotificationDropdown />}
        </div>
        <div className="header__avatar">JD</div>
      </div>
    </header>
  );
};
