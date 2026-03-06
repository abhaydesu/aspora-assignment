import React, { useState, useEffect } from 'react';
import { StatsCards } from '../components/StatsCards/StatsCards';
import { MemberGrid } from '../components/MemberGrid/MemberGrid';
import { StandupTimer } from '../components/Timer/StandupTimer';
import { MemberModal } from '../components/MemberModal/MemberModal';
import type { Member } from '../api/mockApi';
import './Dashboard.css';

function calculateColumns() { 
  return window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
}

export const Dashboard: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [gridCols, setGridCols] = useState(() => calculateColumns());

  useEffect(() => {
    const resizeEvent = () => {
      setGridCols(calculateColumns());
    }
    window.addEventListener('resize', resizeEvent);

    return () => window.removeEventListener('resize', resizeEvent);
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard__title">
        <h1>Dashboard</h1>
        <p>Team overview and activity at a glance</p>
      </div>
      <div className="dashboard__top">
        <StatsCards />
        <StandupTimer />
      </div>
      <MemberGrid onSelectMember={setSelectedMember} columns={gridCols} />
      {selectedMember && (
        <MemberModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onUpdateMember={(updated) => setSelectedMember(updated)}
        />
      )}
    </div>
  );
};
