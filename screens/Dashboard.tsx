
import React, { useEffect, useState, useMemo } from 'react';
import { Tab, Log } from '../types';
import { useLogs } from '../hooks/use-logs';
import { Profile } from '../lib/api';
import { EXPERT_TIPS_DATA } from '../data/expert-tips';
import { MARQUEE_TEMPLATES } from '../data/marquee-messages';


interface DashboardProps {
  onNavigate: (tab: Tab) => void;
  profile: Profile | null;
  userId: string;
  t: any;
  isActive?: boolean;
}

/**
 * 根据 profile.total_drops 计算用户等级
 * 每 5 次记录升一级，最少 1 级
 */
const calcUserLevel = (totalDrops: number): number => {
  return Math.max(1, Math.floor(totalDrops / 5) + 1);
};

// 时间范围格式化
const formatTimeRange = (startTimeStr: string, durationSeconds: number) => {
  const start = new Date(startTimeStr);
  const end = new Date(start.getTime() + durationSeconds * 1000);

  const format = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${format(start)} - ${format(end)}`;
};

// 数据洞察卡片 (专家建议)
const InsightCard = ({ advice, t }: { advice: { text: string; emoji: string }, t: any }) => (
  <div className="bg-dopa-purple rounded-[2rem] p-6 flex items-center gap-4 border-4 border-black shadow-neo relative overflow-hidden">
    <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/20 rounded-full blur-xl"></div>
    <div className="flex-shrink-0 relative z-10">
      <div className="w-20 h-20 bg-dopa-pink rounded-full flex items-center justify-center border-4 border-black shadow-lg animate-bounce">
        <span className="text-4xl filter drop-shadow-md transform -rotate-12">{advice.emoji}</span>
      </div>
      <div className="absolute -bottom-2 -right-2 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white rotate-6 uppercase">{t.dashboard.expert}</div>
    </div>
    <div className="flex-1 z-10">
      <div className="bg-white text-black p-4 rounded-2xl rounded-tl-none relative shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] border-2 border-black">
        <p className="font-bold text-base leading-snug italic">"{advice.text}"</p>
      </div>
    </div>
  </div>
);

// 统计卡片
const StatCard = ({ icon, label, value, tag, bg, color }: { icon: string, label: string, value: string, tag: string, bg: string, color?: string }) => (
  <div className={`${bg} p-5 rounded-2xl border-4 border-black shadow-neo`}>
    <div className="flex items-center gap-2 mb-2 text-black">
      <span className="material-icons-round text-2xl bg-white rounded-full p-1 border-2 border-black">{icon}</span>
      <span className="text-xs font-black uppercase tracking-wider">{label}</span>
    </div>
    <div className={`text-3xl font-black ${color || 'text-white'} drop-shadow-[2px_2px_0_#000]`}>{value}</div>
    <div className="text-xs font-bold text-black bg-white/40 inline-block px-2 py-0.5 rounded mt-1">{tag}</div>
  </div>
);

// MVP 门票组件
const COLORS_MAP: Record<string, string> = {
  brown: '#8B4513',
  green: '#4CAF50',
  yellow: '#FFEB3B',
  black: '#212121',
  red: '#F44336',
  pale: '#F5F5DC',
  golden: '#FFD700'
};

const MvpTicket = ({ log, score, t }: { log: Log | null, score: number, t: any }) => {
  if (!log) return (
    <div className="bg-gray-200 rounded-[2rem] p-6 text-center border-4 border-black border-dashed">
      <h3 className="font-black text-gray-500">{t.dashboard.title}</h3>
      <p className="text-sm">{t.dashboard.noData}</p>
    </div>
  );

  const bristolDescKey = `desc${log.bristolType}`;
  const bristolDesc = t.tracker.bristol[bristolDescKey] || log.shape;

  // 时间格式化工具：精确到秒
  const formatFullTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const startTime = formatFullTime(log.date);
  const endTime = formatFullTime(new Date(new Date(log.date).getTime() + log.durationSeconds * 1000).toISOString());

  return (
    <div className="relative group perspective-1000">
      <div className="bg-white rounded-[1.5rem] border-4 border-black shadow-neo-lg overflow-hidden relative transform transition-transform hover:rotate-1">
        {/* Header */}
        <div className="bg-black text-white p-3 flex justify-between items-center border-b-4 border-black">
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <span className="font-black italic uppercase tracking-wider">{t.dashboard.mvp}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(log.date).toLocaleDateString()}</span>
            <div className="bg-dopa-lime text-black px-2 rounded font-black border border-white text-xs whitespace-nowrap">
              {score} PTS
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="p-4 grid grid-cols-12 gap-4">
          <div className="col-span-4 flex flex-col items-center justify-center bg-gray-100 rounded-xl border-2 border-black p-2 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '8px 8px' }}></div>
            <div className="text-6xl drop-shadow-sm mb-1 transform group-hover:scale-110 transition-transform">🏆</div>
            <div className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">{t.dashboard.type} {log.bristolType}</div>
            <div className="text-[10px] font-bold text-gray-500 mt-1 text-center leading-none">{bristolDesc}</div>
          </div>

          <div className="col-span-8 grid grid-cols-2 gap-2">
            <div className="bg-dopa-cyan/20 border-2 border-black rounded-lg p-2 flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase text-gray-600">{t.dashboard.speed}</span>
              <div className="flex items-center gap-1">
                <span className="text-lg">⚡</span>
                <span className="font-bold text-sm leading-none">{t.speeds[log.speed] || log.speed}</span>
              </div>
            </div>
            <div className="bg-dopa-purple/20 border-2 border-black rounded-lg p-2 flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase text-gray-600">{t.dashboard.vibe}</span>
              <div className="flex items-center gap-1">
                <span className="text-lg">😎</span>
                <span className="font-bold text-sm leading-none">{t.tracker.status[log.mood] || log.mood}</span>
              </div>
            </div>
            <div className="bg-dopa-yellow/20 border-2 border-black rounded-lg p-2 flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase text-gray-600">{t.tracker.amountTitle}</span>
              <div className="flex items-center gap-1">
                <span className="text-lg">⚖️</span>
                <span className="font-bold text-sm leading-none">{t.tracker.amounts[log.amount] || log.amount}</span>
              </div>
            </div>
            <div className="bg-gray-50 border-2 border-black rounded-lg p-2 flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase text-gray-600">{t.dashboard.color}</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full border border-black shadow-sm" style={{ backgroundColor: COLORS_MAP[log.color] || '#8B4513' }}></div>
                <span className="font-bold text-sm leading-none">{t.colors[log.color] || log.color}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t-4 border-black p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-sm opacity-60">schedule</span>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold">
              <span className="bg-black text-white px-1.5 py-0.5 rounded leading-none">{startTime}</span>
              <span className="opacity-30">-</span>
              <span className="bg-black text-white px-1.5 py-0.5 rounded leading-none">{endTime}</span>
            </div>
          </div>
          <div className="text-[10px] font-black bg-dopa-pink text-white px-2 py-0.5 rounded border border-black transform rotate-1 uppercase">
            {t.dashboard.legendary}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 计算单条记录的综合评分 (0-100)
 */
const calcLogScore = (log: any): number => {
  if (!log) return 0;
  let score = 0;

  // 1. Bristol 类型 (权重 60%)
  const b = log.bristolType;
  if (b === 4) score += 60;
  else if (b === 3 || b === 5) score += 45;
  else if (b === 2 || b === 6) score += 25;
  else score += 10;

  // 2. 产量 (权重 20%)
  const a = log.amount;
  if (a === 'medium') score += 20;
  else if (a === 'high' || a === 'low') score += 15;
  else score += 5;

  // 3. 速度 (权重 10%)
  const s = log.speed;
  if (s === 'normal') score += 10;
  else if (s === 'fast' || s === 'sonic') score += 7;
  else score += 3;

  // 4. 心情/成色 (权重 10%)
  const m = log.mood;
  if (['classic', 'zen', 'happy'].includes(m)) score += 10;
  else if (['struggle', 'pain', 'nuclear'].includes(m)) score += 0;
  else score += 5;

  return Math.min(100, score);
};

// 周报图表
const WeeklyChart = ({ data, t }: { data: { score: number; label: string }[], t: any }) => {
  const chartColors = [
    'bg-dopa-pink/20',
    'bg-dopa-blue/20',
    'bg-dopa-lime/20',
    'bg-dopa-purple/20',
    'bg-dopa-cyan/20',
    'bg-dopa-orange/20'
  ];

  return (
    <div className="bg-white rounded-[2rem] p-6 border-4 border-black shadow-neo relative overflow-hidden">
      <div className="flex justify-between items-end h-44 gap-3">
        {data.length > 0 ? data.map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-2 w-full h-full group">
            <div className="w-full bg-gray-50 rounded-2xl h-full relative overflow-hidden border-2 border-black flex items-end">
              {item.score > 0 ? (
                <div
                  className={`w-full ${chartColors[i % 6]} transition-all duration-700 ease-out relative`}
                  style={{ height: `${35 + (item.score * 0.65)}%` }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-10">
                  <span className="text-xl">💤</span>
                </div>
              )}
            </div>
            <span className="text-[10px] font-black text-black/40 uppercase italic tracking-tighter">{item.label}</span>
          </div>
        )) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <span className="text-2xl">🕳️</span>
            <span className="font-bold uppercase tracking-widest text-[10px]">{t.dashboard.noData}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, profile, userId, t, isActive }) => {
  // 从 Supabase 获取实时数据
  const { dailyMVP, weeklyStats, averageTime, loading, refreshLogs, logs } = useLogs(userId);
  const userLevel = calcUserLevel(profile?.total_drops || 0);

  const [toast, setToast] = useState<{ msg: string, phase: 'in' | 'out' | null }>({ msg: '', phase: null });

  // 响应激活状态：静默同步数据
  useEffect(() => {
    if (isActive) {
      refreshLogs();
    }
  }, [isActive, refreshLogs]);

  // 2. 监听加载状态显示 Toast
  useEffect(() => {
    // 只有在已经有数据（非首次加载）且正在后台更新时显示 Toast
    if (loading && logs.length > 0) {
      setToast({ msg: t.alerts.updating || '数据更新中...', phase: 'in' });
    } else if (!loading) {
      setToast(prev => (prev.phase === 'in' ? { ...prev, phase: 'out' } : prev));
      const timer = setTimeout(() => {
        setToast(prev => (prev.phase === 'out' ? { ...prev, phase: null } : prev));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, logs.length, t.alerts.updating]);

  // 3. 动态计算 MVP 分数与交互反馈
  const mvpScore = useMemo(() => calcLogScore(dailyMVP), [dailyMVP]);

  // 4. 水分与专家建议增强逻辑 (全天候感应 + 随机幽默化)
  const { hydration, advice } = useMemo(() => {
    const lastBristol = dailyMVP?.bristolType || 4;
    const lang = t.auth.welcome.includes('欢迎') ? 'zh' : 'en';

    // NOTE: 无记录时水分状态显示占位符，但 advice 仍需生成
    const noData = !dailyMVP;

    let hStatus = noData ? '--' : t.dashboard.hydrationStatus.good;
    let hColor = noData ? 'text-white' : 'text-dopa-lime';
    let hTip = noData ? '--' : t.dashboard.drinkMore;

    let category = 'normal';

    // 1. 水分判定原则 (基于最新/最佳记录)
    if (lastBristol <= 2) {
      hStatus = t.dashboard.hydrationStatus.low;
      hColor = 'text-dopa-orange';
      category = 'constipation';
    } else if (lastBristol >= 6) {
      hStatus = t.dashboard.hydrationStatus.loss;
      hColor = 'text-dopa-pink';
      hTip = t.dashboard.rehydrate;
      category = 'diarrhea';
    } else if (lastBristol === 4) {
      category = 'perfect';
    }

    if (!dailyMVP) category = 'lazy';

    // 2. [核心升级] 全天候综合扫描 - 过山车逻辑
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayLogs = logs.filter(l => new Date(l.date) >= startOfToday);
    const hasConstipation = todayLogs.some(l => l.bristolType <= 2);
    const hasDiarrhea = todayLogs.some(l => l.bristolType >= 6);

    // 如果全天状态极端且不一致，则触发过山车彩蛋
    if (hasConstipation && hasDiarrhea) {
      category = 'rollercoaster';
    }

    // 3. 随机化机制：使用记录ID或日期作为种子
    const seed = dailyMVP ? dailyMVP.id : new Date().toDateString();
    const tipsPool = EXPERT_TIPS_DATA[category][lang];

    // 数字哈希函数
    const getHash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
      return Math.abs(hash);
    };

    const tipIndex = getHash(seed) % tipsPool.length;
    return {
      hydration: { status: hStatus, color: hColor, tip: hTip },
      advice: tipsPool[tipIndex]
    };
  }, [dailyMVP, logs, t]);

  // 4.5. 平均时间评价增强 (动态评价语与颜色)
  const timeEvaluation = useMemo(() => {
    let seconds = 0;
    const mMatch = averageTime.match(/(\d+)m/);
    const sMatch = averageTime.match(/(\d+)s/);
    if (mMatch) seconds += parseInt(mMatch[1], 10) * 60;
    if (sMatch) seconds += parseInt(sMatch[1], 10);

    // 默认或无数据状态
    if (seconds === 0 && averageTime === '0m 0s') {
      return { tip: '--', color: 'text-white' };
    }

    if (seconds < 120) return { tip: t.dashboard.timeStatus.sonic, color: 'text-dopa-pink' };
    if (seconds < 300) return { tip: t.dashboard.timeStatus.fast, color: 'text-dopa-orange' };
    if (seconds < 600) return { tip: t.dashboard.timeStatus.normal, color: 'text-white' };
    if (seconds < 1200) return { tip: t.dashboard.timeStatus.slow, color: 'text-dopa-blue' };
    return { tip: t.dashboard.timeStatus.zen, color: 'text-dopa-purple' };
  }, [averageTime, t]);

  // 5. 动态横幅生成逻辑 (多维度随机拼接)
  const marqueeText = useMemo(() => {
    const lang = t.auth.welcome.includes('欢迎') ? 'zh' : 'en';
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayLogs = logs.filter(l => new Date(l.date) >= startOfToday);

    // 格式化时长 (m s)
    const formatDuration = (s: number) => {
      const m = Math.floor(s / 60);
      return m > 0 ? `${m}m ${s % 60}s` : `${s % 60}s`;
    };

    // 数字哈希函数 (用于保持今日内随机稳定性)
    const getHash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
      return Math.abs(hash);
    };

    // 变量替换函数
    const fillTemplate = (tpl: string, vars: any) => {
      return tpl.replace(/\${(\w+)}/g, (_, key) => vars[key] || '');
    };

    const segments: string[] = [];
    const todaySeed = new Date().toDateString();

    // 维度 1: 纯搞笑 (总是包含)
    const humorPool = MARQUEE_TEMPLATES.HUMOR;
    segments.push(humorPool[getHash(todaySeed + 'h') % humorPool.length][lang]);

    // 维度 2: 今日 MVP (如果有)
    if (dailyMVP) {
      const mvpPool = MARQUEE_TEMPLATES.DAILY_MVP;
      const template = mvpPool[getHash(todaySeed + 'm') % mvpPool.length][lang];
      segments.push(fillTemplate(template, {
        score: mvpScore,
        shape: dailyMVP.shape || '--',
        duration: formatDuration(dailyMVP.durationSeconds),
        type: dailyMVP.bristolType
      }));
    }

    // 维度 3: 今日统计 (如果有记录)
    if (todayLogs.length > 0) {
      const totalSeconds = todayLogs.reduce((acc, curr) => acc + curr.durationSeconds, 0);
      const totalPool = MARQUEE_TEMPLATES.DAILY_TOTAL;
      const template = totalPool[getHash(todaySeed + 't') % totalPool.length][lang];
      segments.push(fillTemplate(template, {
        count: todayLogs.length,
        duration: formatDuration(totalSeconds)
      }));
    }

    // 维度 4: 本周战况 (新增)
    const weekLogs = logs.filter(l => {
      const d = new Date(l.date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });

    if (weekLogs.length > 5) { // 只有数据足够多才显示周报，避免尴尬
      const totalWeekSeconds = weekLogs.reduce((acc, curr) => acc + curr.durationSeconds, 0);

      // 找出最高产出日
      const dayCounts: Record<string, number> = {};
      weekLogs.forEach(l => {
        const day = new Date(l.date).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long' });
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
      const bestDay = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b);

      const weeklyPool = MARQUEE_TEMPLATES.WEEKLY_STATS;
      const template = weeklyPool[getHash(todaySeed + 'w') % weeklyPool.length][lang];

      segments.push(fillTemplate(template, {
        count: weekLogs.length,
        duration: formatDuration(totalWeekSeconds),
        bestDay: bestDay,
        percent: (85 + (weekLogs.length % 15)) // 假百分比，增加趣味性
      }));
    }

    // 维度 5: 排名 (占位)
    const rankPool = MARQUEE_TEMPLATES.RANKING;
    const rankTemplate = rankPool[getHash(todaySeed + 'r') % rankPool.length][lang];
    segments.push(fillTemplate(rankTemplate, {
      rank: t.dashboard.timeStatus.fast.split(' ')[0], // 从翻译中提取个头衔
      position: "42" // 假数据
    }));

    return segments.join(' • ') + ' • ';
  }, [dailyMVP, logs, mvpScore, t]);

  // 时间格式化工具：精确到秒
  const formatFullTime = (dateStr?: string) => {
    if (!dateStr) return '--:--:--';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  return (
    <div className="flex-1 h-full flex flex-col gap-6 overflow-y-auto pb-32 hide-scrollbar bg-dopa-yellow relative"
      style={{ backgroundImage: 'radial-gradient(#FF6D00 15%, transparent 16%), radial-gradient(#FF6D00 15%, transparent 16%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}>

      {/* Toast：带滑入滑出动画与状态感知 */}
      {toast.phase && (
        <div
          className="fixed top-20 left-1/2 z-[200] bg-white border-4 border-black px-6 py-3 rounded-2xl shadow-neo flex items-center gap-3 pointer-events-none whitespace-nowrap min-w-max"
          style={{
            transform: toast.phase === 'in' ? 'translate(-50%, 0)' : 'translate(-50%, -120%)',
            opacity: toast.phase === 'in' ? 1 : 0,
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
          }}>
          <span className="material-icons-round text-black animate-spin">sync</span>
          <span className="font-black text-lg text-black flex items-center">
            {toast.msg}
            <span className="flex ml-0.5">
              <span className="dot-pulse">.</span>
              <span className="dot-pulse [animation-delay:0.2s]">.</span>
              <span className="dot-pulse [animation-delay:0.4s]">.</span>
            </span>
          </span>
        </div>
      )}
      {/* Header */}
      <header className="pt-6 px-6 flex justify-between items-center z-40 sticky top-0 bg-dopa-yellow/90 backdrop-blur-sm pb-2 border-b-2 border-transparent transition-all">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-dopa-pink border-4 border-black shadow-neo flex items-center justify-center transform -rotate-6 hover:rotate-6 transition">
            <span className="material-icons-round text-white text-2xl">emoji_nature</span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-black uppercase italic leading-none drop-shadow-[2px_2px_0_#fff]">
              {t.dashboard.title}
            </h1>
            <span className="text-xs font-bold bg-black text-white px-1.5 py-0.5 transform -rotate-2 inline-block">
              {t.dashboard.questMode}
            </span>
          </div>
        </div>

        {/* Profile / Level Badge */}
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

      <main className="flex-1 px-4 flex flex-col gap-6">
        {/* Marquee */}
        <div className="overflow-hidden whitespace-nowrap -mx-4 py-3 bg-black border-y-4 border-black mb-2 rotate-1 shadow-neo flex">
          <div className="animate-marquee px-4 text-base font-bold text-dopa-yellow tracking-widest uppercase shrink-0">
            {marqueeText}
          </div>
          <div className="animate-marquee px-4 text-base font-bold text-dopa-yellow tracking-widest uppercase shrink-0">
            {marqueeText}
          </div>
        </div>

        {/* MVP Ticket */}
        <section className="relative group px-1">
          {loading && logs.length === 0 ? (
            <div className="bg-gray-200 rounded-[2rem] p-6 text-center border-4 border-black border-dashed animate-pulse">
              <span className="text-4xl">⏳</span>
            </div>
          ) : (
            <MvpTicket log={dailyMVP} score={mvpScore} t={t} />
          )}
        </section>

        {/* Weekly Chart */}
        <section>
          <div className="flex justify-between items-end mb-4 px-2">
            <h3 className="text-2xl font-black text-black italic uppercase drop-shadow-[2px_2px_0_#fff]">{t.dashboard.weekly}</h3>
            <span className="text-xs font-bold text-black bg-white border-2 border-black px-2 py-1 rounded-lg shadow-[2px_2px_0_0_#000]">{t.dashboard.last7days}</span>
          </div>
          <WeeklyChart data={weeklyStats} t={t} />
        </section>

        {/* Stats */}
        <section className="mb-4 space-y-4">
          <InsightCard advice={advice} t={t} />
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon="timer"
              label={t.dashboard.avgTime}
              value={logs.length === 0 ? '--' : averageTime}
              tag={timeEvaluation.tip}
              bg="bg-dopa-lime"
              color={timeEvaluation.color}
            />
            <StatCard
              icon="water_drop"
              label={t.dashboard.hydration}
              value={hydration.status}
              tag={hydration.tip}
              bg="bg-dopa-blue"
              color={hydration.color}
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
