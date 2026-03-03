import React, { useState, useEffect } from 'react';
import { Tab, TrackerState, INITIAL_TRACKER_STATE } from './types';
import Dashboard from './screens/Dashboard';
import Tracker from './screens/Tracker';
import Profile from './screens/Profile';
import Achievements from './screens/Achievements';
import Map from './screens/Map';
import BottomNav from './components/BottomNav';
import Auth from './screens/Auth';
import { AuthProvider, useAuth } from './contexts/auth-context';
import AchievementToast from './components/AchievementToast';

// NOTE: 国际化资源从 TS 文件导入
import { zh, en } from './locales.ts';

/**
 * 应用主体（需要在 AuthProvider 内部使用 useAuth）
 */
const AppContent: React.FC = () => {
  const { user, profile, loading, emailConfirmed, signIn, signUp, signOut, refreshProfile } = useAuth();

  // App 状态
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Tracker);
  const [trackerState, setTrackerState] = useState<TrackerState>(INITIAL_TRACKER_STATE);

  // 语言状态
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const t = lang === 'zh' ? zh : en;

  // NOTE: 监听全局 navigate-tab 事件（由 AchievementToast 点击触发）
  useEffect(() => {
    const handleNavigateTab = (e: any) => {
      const tabMap: Record<string, Tab> = {
        daily: Tab.Daily,
        tracker: Tab.Tracker,
        profile: Tab.Profile,
        achievements: Tab.Achievements,
        map: Tab.Map,
      };
      const tab = tabMap[e.detail?.tab];
      if (tab) setActiveTab(tab);
    };
    window.addEventListener('navigate-tab', handleNavigateTab);
    return () => window.removeEventListener('navigate-tab', handleNavigateTab);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    await signIn(email, password);
    setActiveTab(Tab.Tracker);
  };

  const handleRegister = async (email: string, password: string, name: string, otpCode: string, inviteCode?: string, location?: string, geo?: { lat: number; lng: number }) => {
    await signUp(email, password, name, otpCode, inviteCode, location, geo);
    setActiveTab(Tab.Tracker);
  };

  const handleLogout = async () => {
    await signOut();
    setActiveTab(Tab.Tracker);
  };

  // 加载中显示空白（避免闪烁）
  if (loading) {
    return (
      <div className="min-h-screen bg-dopa-purple flex items-center justify-center">
        <div className="text-6xl animate-bounce">💩</div>
      </div>
    );
  }

  // 未登录显示认证页面
  if (!user) {
    return (
      <Auth
        onLogin={handleLogin}
        onRegister={handleRegister}
        lang={lang}
        setLang={setLang}
        t={t}
      />
    );
  }

  /**
   * 采用"全部挂载 + CSS 隐藏"的持久化方案，解决切页重新加载问题
   */
  const ALL_TABS = [Tab.Daily, Tab.Tracker, Tab.Profile, Tab.Achievements, Tab.Map];

  const renderScreens = () => {
    return ALL_TABS.map((tab) => {
      const isActive = activeTab === tab;
      return (
        <div
          key={tab}
          className={`absolute inset-0 h-full w-full ${isActive ? 'block' : 'hidden'}`}
        >
          {tab === Tab.Daily && <Dashboard isActive={isActive} onNavigate={setActiveTab} profile={profile} userId={user.id} t={t} />}
          {tab === Tab.Tracker && <Tracker isActive={isActive} state={trackerState} setState={setTrackerState} userId={user.id} onRefreshProfile={refreshProfile} t={t} />}
          {tab === Tab.Profile && <Profile isActive={isActive} onLogout={handleLogout} profile={profile} userId={user.id} onRefreshProfile={refreshProfile} lang={lang} setLang={setLang} t={t} />}
          {tab === Tab.Achievements && <Achievements isActive={isActive} onNavigate={setActiveTab} profile={profile} userId={user.id} t={t} />}
          {tab === Tab.Map && <Map isActive={isActive} onNavigate={setActiveTab} profile={profile} userId={user.id} t={t} />}
        </div>
      );
    });
  };

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-dopa-white flex flex-col relative overflow-hidden shadow-2xl">
      {/* NOTE: Profile 加载失败提示 —— 认证成功但资料未加载时提示用户 */}
      {user && !profile && !loading && (
        <div className="bg-dopa-yellow text-black text-xs font-bold px-4 py-3 flex items-center justify-between z-[65] shadow-md">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-base">😵</span>
            <span>资料加载失败，请尝试刷新</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="bg-black text-dopa-yellow px-3 py-1 rounded-full text-xs font-black uppercase active:scale-95 transition-transform"
            >
              重试
            </button>
            <button
              onClick={handleLogout}
              className="bg-white text-black px-3 py-1 rounded-full text-xs font-black uppercase active:scale-95 transition-transform"
            >
              退出
            </button>
          </div>
        </div>
      )}

      {/* 邮箱验证提示 */}
      {!emailConfirmed && (
        <div className="bg-dopa-pink text-white text-[10px] font-bold px-4 py-2 flex items-center justify-between z-[60] shadow-md animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <span>📧</span>
            <span>请检查邮箱并激活账号，否则无法保存记录。</span>
          </div>
          <button
            onClick={() => refreshProfile()}
            className="bg-white text-dopa-pink px-2 py-0.5 rounded-full text-[8px] uppercase tracking-wider active:scale-95 transition-transform"
          >
            已激活
          </button>
        </div>
      )}

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden relative h-full">
        {renderScreens()}
      </div>

      {/* 统一底部导航 */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} t={t} />

      {/* 全局成就解锁提醒 */}
      <AchievementToast />
    </div>
  );
};

/**
 * App 根组件，包裹 AuthProvider
 */
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
