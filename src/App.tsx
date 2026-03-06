import React, { useState, useEffect } from 'react';
import { FilterProvider } from './context/FilterContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast/ToastContainer';
import { Header } from './components/Header/Header';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ActivityPage } from './pages/ActivityPage';
import { SearchOverlay } from './components/Search/SearchOverlay';
import type { Member } from './api/mockApi';
import './App.css';

type Page = 'dashboard' | 'activity';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingMember, setPendingMember] = useState<Member | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKey);

    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleSelectMember = (member: Member) => {
    setPendingMember(member);
    setCurrentPage('dashboard');
  };

  return (
    <ThemeProvider>
      <FilterProvider>
        <ToastProvider>
          <div className="app-layout">
            <Header
              onNavigate={(page) => setCurrentPage(page as Page)}
              onSelectMember={handleSelectMember}
              onMenuClick={() => setSidebarOpen(true)}
            />

            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
              <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
            )}

            <div className="app-body">
              <Sidebar
                currentPage={currentPage}
                onNavigate={(page) => { setCurrentPage(page); setSidebarOpen(false); }}
                onOpenSearch={() => { setSearchOpen(true); setSidebarOpen(false); }}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
              <main className="main-content">
                <div className="dashboard-content">
                  {currentPage === 'dashboard' && (
                    <Dashboard
                      initialMember={pendingMember}
                      onMemberModalClosed={() => setPendingMember(null)}
                    />
                  )}
                  {currentPage === 'activity' && <ActivityPage />}
                </div>
              </main>
            </div>
            <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
          </div>
        </ToastProvider>
      </FilterProvider>
    </ThemeProvider>
  );
};

export default App;
