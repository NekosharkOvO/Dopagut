
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Tab, Achievement, Category } from '../types';
import { Profile, achievementService, DbUserAchievement } from '../lib/api';

interface AchievementsProps {
  onNavigate: (tab: Tab) => void;
  profile: Profile | null;
  userId: string;
  t: any;
  isActive?: boolean;
}

/**
 * 根据 profile.total_drops 计算用户等级
 */
const calcUserLevel = (totalDrops: number): number => {
  return Math.max(1, Math.floor(totalDrops / 5) + 1);
};

const isDarkBg = (bg?: string) => {
  if (!bg) return false;
  const darks = ['bg-black', 'bg-dopa-purple', 'bg-dopa-blue', 'bg-dopa-black'];
  return darks.some(d => bg.includes(d));
};

// 确定性随机旋转量产生器
const getRotation = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const deg = (hash % 30) / 10 - 1.5; // -1.5 到 1.5 度
  return `${deg}deg`;
};

const Achievements: React.FC<AchievementsProps> = ({ onNavigate, profile, userId, t, isActive }) => {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [toast, setToast] = useState<{ msg: string, phase: 'in' | 'out' | null }>({ msg: '', phase: null });

  /**
   * 显示带滑入/滑出动画的置顶 Toast
   */
  const showToast = useCallback((msg: string) => {
    setToast({ msg, phase: 'in' });
    setTimeout(() => {
      setToast(prev => ({ ...prev, phase: 'out' }));
      setTimeout(() => setToast(prev => ({ ...prev, phase: null })), 300);
    }, 1500);
  }, []);

  const shareRef = useRef<HTMLDivElement>(null);

  // 状态管理
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);

  /**
   * 核心加载逻辑：支持全屏加载与静默后台刷新
   */
  const loadAllData = useCallback(async (isSilent = false) => {
    if (!userId) return;

    if (isSilent) {
      setToast({ msg: t.alerts.updating || '数据更新中...', phase: 'in' });
    } else {
      // 仅在无旧数据时显示全屏 loading
      if (achievements.length === 0) setLoadingAchievements(true);
    }

    try {
      const [defs, userData] = await Promise.all([
        achievementService.getDefinitions(),
        achievementService.getUserAchievements(userId)
      ]);

      const mapped: Achievement[] = defs.map(def => {
        const progressInfo = userData.find(u => u.achievement_type === def.id);
        const lang = t.nav.daily === '日报' ? 'zh' : 'en';

        return {
          id: def.id as any,
          title: lang === 'zh' ? def.title_zh : def.title_en,
          description: lang === 'zh' ? def.description_zh : def.description_en,
          icon: def.icon,
          rarity: def.rarity as any,
          categories: def.categories as any,
          unlockedAt: progressInfo?.unlocked_at || undefined,
          progress: def.target_value > 1 ? {
            current: progressInfo?.current_progress || 0,
            total: def.target_value
          } : undefined,
          bgTheme: def.bg_theme
        };
      });

      mapped.sort((a, b) => {
        if (!!a.unlockedAt && !b.unlockedAt) return -1;
        if (!a.unlockedAt && !!b.unlockedAt) return 1;
        return 0;
      });

      setAchievements(mapped);
    } catch (err) {
      console.error('加载成就系统失败:', err);
    } finally {
      if (isSilent) {
        setToast(prev => ({ ...prev, phase: 'out' }));
        setTimeout(() => setToast(prev => ({ ...prev, phase: null })), 300);
      } else {
        setLoadingAchievements(false);
      }
    }
  }, [userId, t]);

  // 响应激活状态：清除红点并触发静默同步
  useEffect(() => {
    if (isActive) {
      localStorage.removeItem('has_new_achievements');
      window.dispatchEvent(new CustomEvent('achievement-dot-refresh'));

      if (achievements.length > 0) {
        loadAllData(true);
      }
    }
  }, [isActive, loadAllData]); // 移除 achievements.length 依赖以防循环触发

  // 初始加载及事件监听
  useEffect(() => {
    const loadDataEvent = () => loadAllData();
    window.addEventListener('force-refresh-achievements', loadDataEvent);
    loadAllData();
    return () => window.removeEventListener('force-refresh-achievements', loadDataEvent);
  }, [loadAllData]);

  // 分类过滤
  const TABS_MAPPING: Category[] = [
    'all', 'rare', 'hidden', 'daily', 'time', 'stat', 'vibe', 'collection', 'special'
  ];

  const filteredAchievements = useMemo(() => {
    const currentCategory = TABS_MAPPING[activeTabIdx];
    if (currentCategory === 'all') return achievements;
    return achievements.filter(a => a.categories.includes(currentCategory));
  }, [activeTabIdx, achievements]);

  const handleDownload = async () => {
    if (!shareRef.current) return;
    const htmlToImage = (window as any).htmlToImage;
    if (!htmlToImage) { alert('截图库未加载，请刷新重试'); return; }

    setToast({ msg: t.alerts.saving || '正在生成高清海报...', phase: 'in' });

    try {
      const dataUrl = await htmlToImage.toPng(shareRef.current, {
        pixelRatio: 3.0,
        cacheBust: true,
        useCORS: true,
        fontEmbedCSS: '',
        style: { transform: 'none', borderRadius: '2.5rem' }
      });

      const link = document.createElement('a');
      link.download = `dopagut_achievement_${selectedAchievement?.id}.png`;
      link.href = dataUrl;
      link.click();
      showToast(t.alerts.saveSuccess || '保存成功！✨');
    } catch (e) {
      console.error('Download failed', e);
      showToast(t.alerts.saveImageError || '保存图片失败，请重试');
    }
  };

  const handleCopy = () => {
    if (selectedAchievement) {
      const text = `${t.achievements.shareTitle}: ${selectedAchievement.title}! https://dopagut.app`;
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showToast(t.alerts.copied || '已复制到剪贴板');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleSelectAchievement = (achievement: Achievement) => {
    if (!achievement.unlockedAt) return;
    setTimeout(() => setSelectedAchievement(achievement), 80);
  }

  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const totalCount = achievements.length;
  const userLevel = calcUserLevel(profile?.total_drops || 0);

  const LoadingState = () => (
    <div className="flex-1 flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-full bg-white border-4 border-black flex items-center justify-center shadow-neo-sm mb-4 animate-spin">
        <span className="material-symbols-outlined text-4xl text-black font-black">sync</span>
      </div>
      <p className="font-black text-black uppercase tracking-widest text-xs animate-pulse">Loading Throne...</p>
    </div>
  );

  return (
    <div className="flex-1 h-full bg-white hide-scrollbar overflow-y-auto pb-32 relative"
      style={{
        backgroundColor: '#FFF9E6',
        backgroundImage: 'radial-gradient(#FF66C4 1px, transparent 1px), radial-gradient(#38BDF8 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px'
      }}>

      {/* Toast */}
      {toast.phase && (
        <div
          className="fixed top-20 left-1/2 z-[200] bg-white border-4 border-black px-6 py-3 rounded-2xl shadow-neo flex items-center gap-3 pointer-events-none whitespace-nowrap min-w-max"
          style={{
            transform: toast.phase === 'in' ? 'translate(-50%, 0)' : 'translate(-50%, -120%)',
            opacity: toast.phase === 'in' ? 1 : 0,
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
          }}
        >
          <span className={`material-icons-round ${(toast.msg === t.alerts.saving || toast.msg === t.alerts.updating) ? 'text-black animate-spin' : 'text-dopa-lime'}`}>
            {(toast.msg === t.alerts.saving || toast.msg === t.alerts.updating) ? 'sync' : 'check_circle'}
          </span>
          <span className="font-black text-lg text-black flex items-center">
            {toast.msg}
            {(toast.msg === t.alerts.saving || toast.msg === t.alerts.updating) && (
              <span className="flex ml-0.5">
                <span className="dot-pulse">.</span>
                <span className="dot-pulse [animation-delay:0.2s]">.</span>
                <span className="dot-pulse [animation-delay:0.4s]">.</span>
              </span>
            )}
          </span>
        </div>
      )}

      {/* Header */}
      <header className="pt-6 px-6 flex justify-between items-center z-40 sticky top-0 bg-[#FFF9E6]/90 backdrop-blur-sm pb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tighter text-black uppercase italic leading-none drop-shadow-[2px_2px_0_#fff]">
              {t.achievements.title}
            </h1>
            <button
              onClick={() => loadAllData()}
              className="w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center hover:bg-gray-100 active:scale-90 transition-all shadow-sm"
              title="Sync Now"
            >
              <span className="material-symbols-outlined text-sm font-bold">sync</span>
            </button>
          </div>
          <span className="text-xs font-bold bg-black text-dopa-lime px-1.5 py-0.5 transform -rotate-2 inline-block mt-1">
            {unlockedCount}/{totalCount} {t.achievements.unlocked}
          </span>
        </div>
        <div className="relative group cursor-pointer" onClick={() => onNavigate(Tab.Profile)}>
          <div className="absolute inset-0 bg-black rounded-full translate-x-1 translate-y-1"></div>
          {profile?.avatar_url ? (
            <img alt="User Avatar" className="w-12 h-12 rounded-full border-4 border-black relative z-10 object-cover bg-white" src={profile.avatar_url} />
          ) : (
            <div className="w-12 h-12 rounded-full border-4 border-black relative z-10 bg-dopa-cyan flex items-center justify-center text-2xl">💩</div>
          )}
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-dopa-lime rounded-full border-2 border-black z-20 flex flex-col items-center justify-center shadow-sm">
            <span className="text-[6px] leading-none font-bold uppercase">LV</span>
            <span className="text-[10px] font-black leading-none">{userLevel}</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 px-6 pb-4 pt-2 overflow-x-auto hide-scrollbar whitespace-nowrap">
        {t.achievements.tabs.map((label: string, i: number) => (
          <button
            key={i}
            onClick={() => setActiveTabIdx(i)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-black text-sm border-2 border-black transition-all ${activeTabIdx === i ? 'bg-black text-dopa-lime shadow-none translate-y-0.5' : 'bg-white text-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Achievement Grid */}
      <main className="px-4 grid grid-cols-2 gap-4 pb-4 grid-flow-row-dense">
        {loadingAchievements ? (
          <div className="col-span-2 py-10">
            <LoadingState />
          </div>
        ) : filteredAchievements.map((achievement) => {
          const isUnlocked = !!achievement.unlockedAt;
          const dark = isUnlocked && isDarkBg(achievement.bgTheme);
          const isWide = achievement.rarity === 'legendary';
          const rotation = isUnlocked ? getRotation(achievement.id) : '0deg';

          const cardClass = `relative rounded-2xl border-4 transition-all transform ${isWide ? 'col-span-2' : 'col-span-1'} ${isUnlocked
            ? `${achievement.bgTheme || 'bg-white'} border-black shadow-neo hover:scale-105 hover:rotate-[calc(var(--tw-rotate)+2deg)] ${isWide ? '' : 'active:scale-90 active:rotate-[calc(var(--tw-rotate)-2deg)]'} cursor-default group`
            : 'bg-gray-100/30 border-gray-400/40 border-dashed cursor-default opacity-60'
            } ${isWide && isUnlocked ? 'flex flex-row p-0 min-h-[150px] overflow-hidden' : 'flex flex-col items-center text-center p-4'}`;

          const content = (
            <>
              {isWide && isUnlocked ? (
                <>
                  <div className="w-[100px] border-r-4 border-black/10 flex items-center justify-center shrink-0 relative overflow-hidden bg-black/5">
                    <div className="absolute inset-0 opacity-5 pointer-events-none select-none text-[8px] leading-none uppercase -rotate-12">
                      DOPAGUT DOPAGUT
                    </div>
                    <div className="w-20 h-20 rounded-full border-4 border-black bg-white flex items-center justify-center shadow-neo-sm overflow-hidden relative z-10">
                      {achievement.icon.startsWith('http') ? (
                        <img src={achievement.icon} alt={achievement.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">{achievement.icon}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col p-5 text-left relative min-h-[150px]">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className={`font-black text-xl leading-tight ${dark ? 'text-white' : 'text-black'}`}>
                        {achievement.title}
                      </span>
                      <div className={`bg-dopa-yellow text-black text-[9px] font-black px-2 py-0.5 rounded border-2 border-black uppercase shadow-sm shrink-0`}>
                        {t.achievements.labels.legendary}
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold leading-tight line-clamp-2 mb-3 ${dark ? 'text-white/80' : 'text-gray-600'}`}>
                      {achievement.description}
                    </span>
                    <div className="mt-auto">
                      <button
                        onClick={() => handleSelectAchievement(achievement)}
                        className="w-full bg-white text-black border-4 border-black py-3 rounded-2xl text-sm font-black uppercase tracking-wide shadow-neo-sm hover:translate-y-0.5 hover:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="material-icons-round text-lg">share</span>
                        <span>去炫耀下</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {isUnlocked && !isWide && achievement.rarity === 'rare' && (
                    <div className="absolute -top-2 -right-2 bg-dopa-pink text-white text-[10px] font-black px-2 py-0.5 rounded border-2 border-black rotate-6 z-20 uppercase shadow-sm">
                      {t.achievements.labels.rare}
                    </div>
                  )}
                  <div className={`w-20 h-20 rounded-full border-4 border-black flex items-center justify-center mb-2 overflow-hidden ${isUnlocked ? 'bg-white' : 'bg-gray-300'}`}>
                    {isUnlocked ? (
                      achievement.icon.startsWith('http') ? (
                        <img src={achievement.icon} alt={achievement.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">{achievement.icon}</span>
                      )
                    ) : (
                      <span className="text-3xl">🔒</span>
                    )}
                  </div>
                  <span className={`font-black text-sm leading-tight ${dark ? 'text-white' : 'text-black'}`}>
                    {achievement.title}
                  </span>
                  <span className={`text-[10px] font-bold mt-1 leading-tight ${dark ? 'text-white/80' : 'text-gray-600'}`}>
                    {isUnlocked ? achievement.description : (achievement.lockedDescription || '???')}
                  </span>
                  {!isUnlocked && achievement.progress && (
                    <div className="w-full mt-2">
                      <div className="w-full h-2 bg-black/10 rounded-full border border-black/20 overflow-hidden relative">
                        <div className="h-full bg-dopa-yellow border-r border-black/20" style={{ width: `${(achievement.progress.current / achievement.progress.total) * 100}%` }}></div>
                      </div>
                      <span className="text-[8px] font-bold text-gray-400">{achievement.progress.current}/{achievement.progress.total}</span>
                    </div>
                  )}
                </>
              )}
            </>
          );

          if (isWide && isUnlocked) {
            return (
              <div key={achievement.id} style={{ '--tw-rotate': rotation } as any} className={cardClass}>
                {content}
              </div>
            );
          }

          return (
            <button key={achievement.id} onClick={() => handleSelectAchievement(achievement)} style={{ '--tw-rotate': rotation } as any} className={cardClass}>
              {content}
            </button>
          );
        })}
      </main>

      {/* Detail Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedAchievement(null)}>
          <div className="w-full max-w-sm flex flex-col items-center animate-in zoom-in-90 duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative" onClick={(e) => e.stopPropagation()}>
            <div ref={shareRef} className={`${selectedAchievement.bgTheme || 'bg-dopa-yellow'} w-full rounded-[2.5rem] border-4 border-black shadow-neo-white relative overflow-hidden p-6 mb-8`}>
              <div className="flex flex-col items-center relative z-10">
                <div className="w-28 h-28 rounded-full border-4 border-black bg-white flex items-center justify-center shadow-neo mb-4 overflow-hidden">
                  {selectedAchievement.icon.startsWith('http') ? (
                    <img src={selectedAchievement.icon} alt={selectedAchievement.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">{selectedAchievement.icon}</span>
                  )}
                </div>
                <h2 className={`text-3xl font-black mb-2 drop-shadow-sm ${isDarkBg(selectedAchievement.bgTheme) ? 'text-white' : 'text-black'}`}>
                  {selectedAchievement.title}
                </h2>
                <p className={`text-base font-bold text-center max-w-[90%] mb-4 ${isDarkBg(selectedAchievement.bgTheme) ? 'text-white/90' : 'text-black/80'}`}>
                  {selectedAchievement.description}
                </p>
              </div>
              <div className={`text-center border-t-2 pt-4 mt-6 ${isDarkBg(selectedAchievement.bgTheme) ? 'border-white/20' : 'border-black/10'}`}>
                <p className={`font-black text-xs uppercase tracking-widest ${isDarkBg(selectedAchievement.bgTheme) ? 'text-white/40' : 'text-black/40'}`}>dopagut.app</p>
              </div>
            </div>
            <div className="flex flex-row gap-3 w-full">
              <button onClick={handleDownload} className="flex-1 bg-white border-4 border-black rounded-2xl py-4 font-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-3">
                <span className="material-icons-round text-2xl">file_download</span>
                <span className="text-lg uppercase">{t.achievements.saveCard}</span>
              </button>
              <button onClick={handleCopy} className="flex-1 bg-white border-4 border-black rounded-2xl py-4 font-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-3">
                <span className="material-icons-round text-2xl">link</span>
                <span className="text-lg uppercase">{t.achievements.shareLink}</span>
              </button>
            </div>
            <button onClick={() => setSelectedAchievement(null)} className="mt-4 w-12 h-12 bg-black rounded-full border-2 border-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <span className="material-icons-round text-white">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Achievements;
//test