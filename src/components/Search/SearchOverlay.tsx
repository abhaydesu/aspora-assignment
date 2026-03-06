import React from 'react';

export const SearchOverlay: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="search-overlay">
      <div className="search-overlay__content">
        <h2>Search</h2>
        <p>Search feature not yet implemented. Build this using the JSONPlaceholder comments API.</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
