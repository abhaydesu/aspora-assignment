import React, { useState, useEffect } from 'react';
import { fetchMembers } from '../../api/mockApi';
import { MemberCard } from '../MemberCard/MemberCard';
import { useFilters } from '../../context/FilterContext';
import type { Member } from '../../api/mockApi';
import './MemberGrid.css';

interface MemberGridProps {
  onSelectMember: (member: Member) => void;
  columns?: number;
}

export const MemberGrid: React.FC<MemberGridProps> = ({ onSelectMember, columns = 3 }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const { filters } = useFilters();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchMembers(filters)
      .then(data => {
        setMembers(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Failed to load team members. Please try again.");
        setIsLoading(false);
      })
  }, [ filters.status, filters.role]);

  const handleBookmark = (id: number) => {
    const next = new Set(bookmarks);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setBookmarks(next);
  };

  const displayMembers = members
    .map(m => ({ ...m, bookmarked: bookmarks.has(m.id) }))
    .filter(m => !showBookmarkedOnly || m.bookmarked);

  if (isLoading) return <div className='member-grid__loading'>Loading team data...</div>

  if (error) return <div className='member-grid__error'>{error}</div>

  const presentBookmarksCount = members.filter(m => bookmarks.has(m.id)).length;

  return (
    <div className="member-grid">
      <div className="member-grid__header">
        <h2>Team Members ({displayMembers.length})</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Bookmarked: {presentBookmarksCount}</span>
          <button
            className={`member-grid__bookmark-filter${showBookmarkedOnly ? ' member-grid__bookmark-filter--active' : ''}`}
            onClick={() => setShowBookmarkedOnly(v => !v)}
          >
            ★ {showBookmarkedOnly ? 'All Members' : 'Bookmarked'}
          </button>
        </div>
      </div>
      <div className="member-grid__cards" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {displayMembers.length === 0 && <p className="member-grid__empty">No members found</p>}
        {displayMembers.map(member => (
          <MemberCard
            key={member.id}
            member={member}
            onBookmark={handleBookmark}
            onClick={onSelectMember}
          />
        ))}
      </div>
    </div>
  );
};
