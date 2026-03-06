import React from 'react';
import { useFilters } from '../../context/FilterContext';
import './Sidebar.css';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: 'dashboard' | 'activity') => void;
  onOpenSearch?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const statuses = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'on-leave', label: 'On Leave' },
  { value: 'offline', label: 'Offline' },
];

const roles = [
  { value: '', label: 'All Roles' },
  { value: 'Engineering Lead', label: 'Engineering Lead' },
  { value: 'Senior Engineer', label: 'Senior Engineer' },
  { value: 'Junior Engineer', label: 'Junior Engineer' },
  { value: 'Product Manager', label: 'Product Manager' },
  { value: 'Designer', label: 'Designer' },
  { value: 'QA Engineer', label: 'QA Engineer' },
  { value: 'DevOps Engineer', label: 'DevOps Engineer' },
];

const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, onOpenSearch, isOpen, onClose }) => {
  const { filters, updateFilter, clearFilters } = useFilters();
  const hasActiveFilters = !!(filters.status || filters.role);

  return (
    <>
      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
        <button className="sidebar__close-btn" onClick={onClose} aria-label="Close menu">✕</button>
      <nav className="sidebar__nav">
        <button
          className={`sidebar__nav-item ${currentPage === 'dashboard' ? 'sidebar__nav-item--active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          <span className="sidebar__nav-icon">📊</span>
          Dashboard
        </button>
        <button
          className={`sidebar__nav-item ${currentPage === 'activity' ? 'sidebar__nav-item--active' : ''}`}
          onClick={() => onNavigate('activity')}
        >
          <span className="sidebar__nav-icon">📋</span>
          Activity Feed
        </button>
        {onOpenSearch && (
          <button
            className="sidebar__nav-item sidebar__nav-item--search"
            onClick={onOpenSearch}
          >
            <span className="sidebar__nav-icon">🔍</span>
            Search Comments
            <kbd className="sidebar__shortcut">{isMac ? '⌘K' : 'Ctrl+K'}</kbd>
          </button>
        )}
      </nav>

      {currentPage === 'dashboard' && (
        <div className="sidebar__filters">
          <div className="sidebar__filters-header">
            <h3 className="sidebar__section-title">Filters</h3>
            {hasActiveFilters && (
              <button className="sidebar__clear-filters" onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>

          <div className="sidebar__filter-group">
            <label className="sidebar__label">Status</label>
            {statuses.map(s => (
              <label key={s.value} className="sidebar__checkbox">
                <input
                  type="radio"
                  name="status-filter"
                  checked={filters.status === s.value}
                  onChange={() => updateFilter('status', s.value)}
                />
                <span className={`sidebar__status-dot sidebar__status-dot--${s.value || 'all'}`} />
                {s.label}
              </label>
            ))}
          </div>

          <div className="sidebar__filter-group">
            <label className="sidebar__label">Role</label>
            <select
              className="sidebar__select"
              value={filters.role}
              onChange={(e) => updateFilter('role', e.target.value)}
            >
              {roles.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </aside>
    </>
  );
};
