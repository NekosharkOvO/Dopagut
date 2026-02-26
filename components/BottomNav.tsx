import React from 'react';
import { Tab } from '../types';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  t: any;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, t }) => {
  const [hasNew, setHasNew] = React.useState(false);

  React.useEffect(() => {
    const checkNew = () => {
      setHasNew(localStorage.getItem('has_new_achievements') === 'true');
    };
    checkNew();
    window.addEventListener('achievement-dot-refresh', checkNew);
    return () => window.removeEventListener('achievement-dot-refresh', checkNew);
  }, []);

  const navItemClass = (tab: Tab, color: string) => `
    flex-1 flex flex-col items-center justify-center gap-1 transition-colors group h-full cursor-pointer pb-2 pt-2
    ${activeTab === tab ? color : 'text-gray-500'}
  `;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-md mx-auto">
      <nav className="bg-black text-white border-t-4 border-black h-20 shadow-neo flex items-end justify-between px-0 relative">

        {/* Daily Report */}
        <button
          className={navItemClass(Tab.Daily, 'text-dopa-cyan')}
          onClick={() => onTabChange(Tab.Daily)}
        >
          <span className={`material-symbols-outlined text-2xl group-hover:-translate-y-1 transition-transform ${activeTab === Tab.Daily ? 'filled' : ''}`}>
            receipt_long
          </span>
          <span className="text-[10px] font-bold uppercase">{t.nav.daily}</span>
        </button>

        {/* Achievements */}
        <button
          className={navItemClass(Tab.Achievements, 'text-dopa-yellow')}
          onClick={() => onTabChange(Tab.Achievements)}
        >
          <div className="relative">
            <span className={`material-symbols-outlined text-2xl group-hover:-translate-y-1 transition-transform ${activeTab === Tab.Achievements ? 'filled' : ''}`}>
              emoji_events
            </span>
            {hasNew && activeTab !== Tab.Achievements && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-dopa-pink border-2 border-black rounded-full animate-bounce"></div>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase">{t.nav.achievements}</span>
        </button>

        {/* Center Action Button (Tracker) */}
        <div className="w-20 relative flex justify-center items-end h-full pb-3 z-10">
          <button
            className={`
              w-16 h-16 rounded-full border-4 border-black flex items-center justify-center 
              shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] transition-transform active:translate-y-1 active:shadow-none
              ${activeTab === Tab.Tracker ? 'bg-dopa-lime' : 'bg-dopa-yellow hover:scale-105'}
            `}
            onClick={() => onTabChange(Tab.Tracker)}
          >
            <span className="material-symbols-outlined text-4xl text-black font-black">add</span>
          </button>
        </div>

        {/* Map */}
        <button
          className={navItemClass(Tab.Map, 'text-dopa-lime')}
          onClick={() => onTabChange(Tab.Map)}
        >
          <span className={`material-symbols-outlined text-2xl group-hover:-translate-y-1 transition-transform ${activeTab === Tab.Map ? 'filled' : ''}`}>
            podium
          </span>
          <span className="text-[10px] font-bold uppercase">{t.nav.map}</span>
        </button>

        {/* Profile */}
        <button
          className={navItemClass(Tab.Profile, 'text-dopa-pink')}
          onClick={() => onTabChange(Tab.Profile)}
        >
          <span className={`material-symbols-outlined text-2xl group-hover:-translate-y-1 transition-transform ${activeTab === Tab.Profile ? 'filled' : ''}`}>
            account_circle
          </span>
          <span className="text-[10px] font-bold uppercase">{t.nav.profile}</span>
        </button>

      </nav>
    </div>
  );
};

export default BottomNav;