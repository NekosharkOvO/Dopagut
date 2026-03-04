import React, { useState, useRef, useEffect } from 'react';
import { TrackerState, INITIAL_TRACKER_STATE } from '../types';
import { logService } from '../lib/api';

interface TrackerProps {
   state: TrackerState;
   setState: (state: TrackerState) => void;
   userId: string;
   onRefreshProfile: () => Promise<void>;
   t: any;
   isActive?: boolean;
}

// 用户状态类型生成器
const getStatusTypes = (t: any) => [
   { id: 'classic', label: t.tracker.status.classic, icon: '💩', bg: 'bg-dopa-purple', border: 'border-black', rotate: '-rotate-2' },
   { id: 'spicy', label: t.tracker.status.spicy, icon: '🔥', bg: 'bg-dopa-yellow', border: 'border-black', rotate: 'rotate-2' },
   { id: 'ghost', label: t.tracker.status.ghost, icon: '👻', bg: 'bg-black', border: 'border-white', text: 'text-white', rotate: '-rotate-1' },
   { id: 'pebble', label: t.tracker.status.pebble, icon: '🪨', bg: 'bg-dopa-cyan', border: 'border-black', rotate: 'rotate-1' },
   { id: 'spray', label: t.tracker.status.spray, icon: '🌊', bg: 'bg-dopa-blue', border: 'border-black', text: 'text-white', rotate: 'rotate-2' },
   { id: 'struggle', label: t.tracker.status.struggle, icon: '😫', bg: 'bg-gray-400', border: 'border-black', rotate: '-rotate-2' },
   { id: 'zen', label: t.tracker.status.zen, icon: '🧘', bg: 'bg-dopa-lime', border: 'border-black', rotate: 'rotate-1' },
   { id: 'nuclear', label: t.tracker.status.nuclear, icon: '☢️', bg: 'bg-dopa-orange', border: 'border-black', rotate: '-rotate-1' },
   { id: 'happy', label: t.tracker.status.happy, icon: '😊', bg: 'bg-dopa-yellow', border: 'border-black', rotate: 'rotate-2' },
   { id: 'pain', label: t.tracker.status.pain, icon: '😖', bg: 'bg-dopa-pink', border: 'border-black', text: 'text-white', rotate: '-rotate-1' },
];

const COLORS = [
   { id: 'brown', hex: '#8B4513' },
   { id: 'green', hex: '#4CAF50' },
   { id: 'yellow', hex: '#FFEB3B' },
   { id: 'black', hex: '#212121' },
   { id: 'red', hex: '#F44336' },
   { id: 'pale', hex: '#F5F5DC' },
   { id: 'golden', hex: '#FFD700' },
];

// Bristol 量表数据生成器
const getBristolScale = (t: any) => [
   { id: 1, label: t.tracker.bristol.type1, desc: t.tracker.bristol.desc1, icon: '🪨' },
   { id: 2, label: t.tracker.bristol.type2, desc: t.tracker.bristol.desc2, icon: '🌭' },
   { id: 3, label: t.tracker.bristol.type3, desc: t.tracker.bristol.desc3, icon: '🌽' },
   { id: 4, label: t.tracker.bristol.type4, desc: t.tracker.bristol.desc4, icon: '🐍' },
   { id: 5, label: t.tracker.bristol.type5, desc: t.tracker.bristol.desc5, icon: '☁️' },
   { id: 6, label: t.tracker.bristol.type6, desc: t.tracker.bristol.desc6, icon: '🥣' },
   { id: 7, label: t.tracker.bristol.type7, desc: t.tracker.bristol.desc7, icon: '🌊' },
];

/**
 * 根据 Bristol 类型推断速度
 * Bristol 1-2 慢，3-5 正常，6-7 快
 */
const inferSpeed = (bristolType: number, durationSeconds: number): string => {
   if (durationSeconds < 60) return 'sonic';
   if (durationSeconds < 300) return 'fast';
   if (durationSeconds < 600) return 'normal';
   return 'slow';
};

/**
 * 根据 Bristol 类型推断形状
 */
const inferShape = (bristolType: number): string => {
   const shapes = ['', 'lumpy', 'lumpy', 'sausage', 'perfect', 'soft', 'mushy', 'liquid'];
   return shapes[bristolType] || 'unknown';
};

export default function Tracker({ state, setState, userId, onRefreshProfile, t, isActive }: TrackerProps) {
   const [elapsedSeconds, setElapsedSeconds] = useState(0);
   const [saving, setSaving] = useState(false);
   const [toast, setToast] = useState<{ msg: string, phase: 'in' | 'out' | null }>({ msg: '', phase: null });
   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

   // NOTE: modal 抽屉动画状态
   // modalMounted: DOM 是否挂载
   // modalOpen: 控制 CSS transition 的目标状态
   const [modalMounted, setModalMounted] = useState(false);
   const [modalOpen, setModalOpen] = useState(false);

   const showToast = (msg: string) => {
      setToast({ msg, phase: 'in' });
      setTimeout(() => {
         setToast(prev => ({ ...prev, phase: 'out' }));
         setTimeout(() => setToast(prev => ({ ...prev, phase: null })), 300);
      }, 1500);
   };

   const STATUS_TYPES = getStatusTypes(t);
   const BRISTOL_SCALE = getBristolScale(t);

   // 初始化 / 恢复计时器
   // NOTE: 增加 visibility 感知，tab 隐藏时跳过更新避免回调堆积
   useEffect(() => {
      const calcSeconds = () => {
         if (document.visibilityState !== 'visible') return;
         if (state.startTime) {
            const now = new Date();
            const diff = Math.floor((now.getTime() - state.startTime.getTime()) / 1000);
            setElapsedSeconds(diff);
         } else {
            setElapsedSeconds(0);
         }
      };

      if (state.isRunning) {
         calcSeconds();
         timerRef.current = setInterval(calcSeconds, 1000);
      } else if (state.endTime && state.startTime) {
         const diff = Math.floor((state.endTime.getTime() - state.startTime.getTime()) / 1000);
         setElapsedSeconds(diff);
      } else {
         setElapsedSeconds(0);
      }

      return () => {
         if (timerRef.current) clearInterval(timerRef.current);
      };
   }, [state.isRunning, state.startTime, state.endTime]);

   const toggleTimer = () => {
      if (state.isRunning) {
         const end = new Date();
         setState({
            ...state,
            isRunning: false,
            endTime: end,
            showModal: true,
         });
         // NOTE: 先挂载 DOM，下一帧触发滑入动画
         setModalMounted(true);
         requestAnimationFrame(() => {
            requestAnimationFrame(() => setModalOpen(true));
         });
      } else {
         setState({
            ...state,
            isRunning: true,
            startTime: new Date(),
            endTime: null,
            showModal: false,
         });
         setModalOpen(false);
         setModalMounted(false);
      }
   };

   const handleUpdateField = (field: keyof TrackerState, value: any) => {
      setState({ ...state, [field]: value });
   };

   const handleReset = () => {
      setState(INITIAL_TRACKER_STATE);
   };

   /**
    * 保存记录到 Supabase
    * 替代原来的 mock handleReset
    */
   const handleSave = async () => {
      if (!state.startTime || !state.endTime) return;

      setSaving(true);
      try {
         const durationSeconds = Math.floor((state.endTime.getTime() - state.startTime.getTime()) / 1000);

         await logService.createLog(userId, {
            date: state.startTime.toISOString(),
            durationSeconds,
            bristolType: state.bristolType,
            shape: inferShape(state.bristolType),
            color: state.poopColor,
            mood: state.activeType,
            speed: inferSpeed(state.bristolType, durationSeconds),
            amount: state.poopAmount,
         });

         // NOTE: 保存成功后刷新 profile 数据（更新 total_drops 等）
         await onRefreshProfile();

         showToast(t.alerts.saveSuccess || '记录成功！✨');
         // NOTE: 先播放滑出动画，再重置状态
         setModalOpen(false);
         setTimeout(() => {
            setModalMounted(false);
            setState(INITIAL_TRACKER_STATE);
         }, 300);
      } catch (err) {
         console.error('保存记录失败:', err);
         alert('保存失败，请重试');
      } finally {
         setSaving(false);
      }
   };

   const formatDuration = (seconds: number) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
   };

   const formatTimeStr = (date: Date | null) => {
      if (!date) return '--:--:--';
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
   };

   const bgPattern = `url("data:image/svg+xml,%3Csvg width='60' height='120' viewBox='0 0 60 120' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='30' y='40' font-family='Noto Sans SC, sans-serif' font-size='24' text-anchor='middle' opacity='0.15'%3E💩%3C/text%3E%3C/svg%3E")`;

   return (
      <div className="flex-1 flex flex-col bg-dopa-purple hide-scrollbar overflow-y-auto h-full relative">
         <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#FAFF00 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

         {/* Toast：带滑入滑出动画 */}
         {toast.phase && (
            <div
               className="fixed top-20 left-1/2 z-[200] bg-white border-4 border-black px-6 py-3 rounded-2xl shadow-neo flex items-center gap-3 pointer-events-none whitespace-nowrap min-w-max"
               style={{
                  transform: toast.phase === 'in' ? 'translate(-50%, 0)' : 'translate(-50%, -120%)',
                  opacity: toast.phase === 'in' ? 1 : 0,
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
               }}
            >
               <span className="material-icons-round text-dopa-lime">check_circle</span>
               <span className="font-black text-lg text-black">{toast.msg}</span>
            </div>
         )}

         {/* Clean Header */}
         <div className="flex-1 bg-white mx-5 my-6 mb-24 rounded-[2rem] border-4 border-black relative z-10 shadow-neo-lg flex flex-col overflow-hidden">

            {/* Rotated Background Layer 1 */}
            <div
               className={`absolute inset-[-50%] z-0 pointer-events-none ${state.isRunning ? 'animate-bg-scroll-odd' : ''}`}
               style={{
                  backgroundImage: bgPattern,
                  transform: 'rotate(30deg)',
                  backgroundSize: '60px 120px',
                  backgroundPosition: '0px 0px'
               }}
            ></div>

            {/* Rotated Background Layer 2 */}
            <div
               className={`absolute inset-[-50%] z-0 pointer-events-none ${state.isRunning ? 'animate-bg-scroll-even' : ''}`}
               style={{
                  backgroundImage: bgPattern,
                  transform: 'rotate(30deg)',
                  backgroundSize: '60px 120px',
                  backgroundPosition: '0px 60px'
               }}
            ></div>

            <header className="px-5 pt-8 pb-4 flex justify-center items-center relative flex-shrink-0 z-10">
               <div className="bg-dopa-yellow px-4 py-1 border-2 border-black shadow-neo-sm transform -rotate-2 z-20">
                  <h1 className="text-2xl font-black tracking-tight text-black uppercase">{t.tracker.title}</h1>
               </div>
               {!state.isRunning && state.endTime && !state.showModal && (
                  <button onClick={handleReset} className="absolute right-5 top-8 text-xs font-bold bg-dopa-pink text-white px-2 py-1 rounded border-2 border-black z-30">
                     {t.tracker.discard}
                  </button>
               )}
            </header>

            {/* Timer Section */}
            <section className="px-6 mb-4 flex flex-col items-center flex-shrink-0 flex-grow justify-center relative z-10">
               <div className="relative group mt-2">
                  <button
                     onClick={toggleTimer}
                     className={`relative w-64 h-64 rounded-full border-4 border-black shadow-neo active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex flex-col items-center justify-center z-10 neo-press
                    ${state.isRunning ? 'bg-dopa-pink animate-pulse' : 'bg-dopa-yellow'}
                  `}
                  >
                     {state.isRunning && <div className="absolute inset-3 rounded-full border-4 border-black border-dashed animate-[spin_4s_linear_infinite] opacity-20 pointer-events-none"></div>}

                     <span
                        className="text-black font-display text-7xl tracking-widest font-black z-30 relative"
                        style={{
                           WebkitTextStroke: '4px white',
                           paintOrder: 'stroke fill'
                        }}
                     >
                        {formatDuration(elapsedSeconds)}
                     </span>

                     <span className={`text-xl font-black px-6 py-2 mt-2 -rotate-2 rounded-md z-20 border-2 border-black shadow-sm uppercase ${state.isRunning ? 'bg-white text-black' : 'bg-black text-white'}`}>
                        {state.isRunning ? t.tracker.end : t.tracker.start}
                     </span>

                     {state.isRunning && (
                        <div className="absolute -top-4 -right-8 bg-white text-black font-black text-xs px-3 py-1 border-2 border-black transform rotate-12 shadow-sm whitespace-nowrap z-40">
                           {t.tracker.pushIt}
                        </div>
                     )}
                  </button>

                  <div className={`absolute -right-6 -top-2 bg-dopa-lime text-black font-display text-xs font-black px-3 py-2 border-2 border-black shadow-neo-sm transform rotate-12 z-0 transition-transform uppercase ${state.isRunning ? 'scale-110 rotate-45' : ''}`}>
                     {state.isRunning ? t.tracker.ongoing : t.tracker.goTime}
                  </div>
               </div>

               {!state.isRunning && state.endTime && !state.showModal && (
                  <button onClick={() => {
                     setState({ ...state, showModal: true });
                     setModalMounted(true);
                     requestAnimationFrame(() => {
                        requestAnimationFrame(() => setModalOpen(true));
                     });
                  }} className="mt-8 bg-black text-white px-6 py-3 rounded-xl font-black border-4 border-transparent hover:border-dopa-lime transition-all flex items-center gap-2 animate-bounce z-20">
                     <span className="material-icons-round">edit</span>
                     {t.tracker.resume}
                  </button>
               )}

            </section>

            {/* Quick Status Selection */}
            <section className="flex flex-col min-h-0 pb-6 shrink-0 relative z-10">
               <div className="px-6 mb-4">
                  <div className="bg-black text-dopa-lime px-3 py-1.5 rounded-lg border-2 border-white shadow-neo-sm flex justify-between items-center transform rotate-1">
                     <div className="flex items-center gap-2">
                        <span className="material-icons-round text-sm">science</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{t.tracker.stinkLevel}</span>
                     </div>
                     <span className="text-xs font-black bg-dopa-lime text-black px-2 rounded uppercase">{t.tracker.toxic}</span>
                  </div>
               </div>

               <div className="px-6 mb-2 flex justify-between items-baseline">
                  <h2 className="text-xl font-black stroke-black uppercase italic">{t.tracker.statusTitle}</h2>
                  <span className="text-xs font-black bg-black text-white px-2 py-1 rounded-md uppercase">{t.tracker.pickOne}</span>
               </div>

               <div className="flex overflow-x-auto hide-scrollbar px-6 gap-3 py-2 snap-x">
                  {STATUS_TYPES.map((t) => (
                     <button
                        key={t.id}
                        onClick={() => handleUpdateField('activeType', t.id)}
                        className={`snap-center shrink-0 w-24 h-32 ${t.bg} rounded-xl border-4 border-black flex flex-col items-center justify-center gap-2 relative overflow-hidden group neo-press transition-all ${state.activeType === t.id ? 'shadow-none translate-x-[2px] translate-y-[2px] scale-95 ring-2 ring-black ring-offset-2' : 'shadow-neo'}`}
                     >
                        <div className={`w-14 h-14 bg-white rounded-full border-2 border-black flex items-center justify-center text-2xl relative`}>
                           {t.icon}
                        </div>
                        <span className={`font-display ${t.text || 'text-black'} text-xs font-bold tracking-wide ${t.bg === 'bg-black' ? 'bg-dopa-purple' : 'bg-black text-white'} px-2 py-0.5 ${t.rotate} border border-black uppercase`}>{t.label}</span>
                        {state.activeType === t.id && (
                           <div className="absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-black bg-dopa-lime"></div>
                        )}
                     </button>
                  ))}
               </div>
            </section>
         </div>

         {/* Save Modal */}
         {/* Save Modal — 抽屉式滑入/滑出动画 */}
         {modalMounted && (
            <div
               className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
               style={{
                  backgroundColor: modalOpen ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0)',
                  backdropFilter: modalOpen ? 'blur(4px)' : 'blur(0px)',
                  transition: 'background-color 0.35s ease, backdrop-filter 0.35s ease',
                  pointerEvents: modalOpen ? 'auto' : 'none',
               }}
               onClick={() => {
                  // NOTE: 点击遮罩关闭
                  setModalOpen(false);
                  setTimeout(() => {
                     setModalMounted(false);
                     setState({ ...state, showModal: false });
                  }, 350);
               }}
            >
               <div
                  className="bg-white w-full sm:w-[95%] max-w-md h-[90%] sm:h-auto sm:max-h-[90%] rounded-t-[2rem] sm:rounded-[2rem] border-t-4 sm:border-4 border-black shadow-neo-white flex flex-col overflow-hidden"
                  style={{
                     transform: modalOpen ? 'translateY(0)' : 'translateY(100%)',
                     opacity: modalOpen ? 1 : 0,
                     transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.2s ease',
                  }}
                  onClick={(e) => e.stopPropagation()}
               >

                  {/* Modal Header */}
                  <header className="bg-dopa-yellow border-b-4 border-black p-4 flex justify-between items-center shrink-0">
                     <h2 className="text-2xl font-black uppercase italic transform -rotate-1">{t.tracker.modalTitle}</h2>
                     <button onClick={() => {
                        setModalOpen(false);
                        setTimeout(() => {
                           setModalMounted(false);
                           setState({ ...state, showModal: false });
                        }, 350);
                     }} className="w-10 h-10 bg-dopa-pink rounded-full border-2 border-black flex items-center justify-center shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all">
                        <span className="material-icons-round text-white font-bold">close</span>
                     </button>
                  </header>

                  <div className="flex-1 hide-scrollbar overflow-y-auto p-4 space-y-6">
                     {/* Time Stats */}
                     <div className="bg-black text-white p-4 rounded-xl border-4 border-dopa-purple shadow-neo">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-bold text-gray-400 uppercase">{t.tracker.totalTime}</span>
                           <span className="text-4xl font-display font-black text-dopa-lime">{formatDuration(elapsedSeconds)}</span>
                        </div>
                        <div className="flex gap-4 border-t border-gray-700 pt-2">
                           <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 uppercase">{t.tracker.startTime}</span>
                              <span className="font-bold font-mono">{formatTimeStr(state.startTime)}</span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 uppercase">{t.tracker.endTime}</span>
                              <span className="font-bold font-mono">{formatTimeStr(state.endTime)}</span>
                           </div>
                        </div>
                     </div>

                     {/* Status Edit */}
                     <div>
                        <h3 className="font-black text-lg mb-2 flex items-center gap-2 uppercase"><span className="text-xl">🤔</span> {t.tracker.statusCheck}</h3>
                        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
                           {STATUS_TYPES.map((t) => (
                              <button
                                 key={t.id}
                                 onClick={() => handleUpdateField('activeType', t.id)}
                                 className={`shrink-0 px-3 py-2 rounded-lg border-2 border-black flex items-center gap-2 transition-all ${state.activeType === t.id ? 'bg-black text-white shadow-none translate-y-0.5' : 'bg-white text-black shadow-neo-sm'}`}
                              >
                                 <span className="text-xl">{t.icon}</span>
                                 <span className="font-bold text-sm uppercase">{t.label}</span>
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Poop Color */}
                     <div>
                        <h3 className="font-black text-lg mb-2 flex items-center gap-2 uppercase"><span className="text-xl">🎨</span> {t.tracker.colorTitle}</h3>
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pt-2 pb-2 px-1 justify-center">
                           {COLORS.map((color) => (
                              <button
                                 key={color.id}
                                 onClick={() => handleUpdateField('poopColor', color.id)}
                                 className={`shrink-0 flex flex-col items-center gap-1 group`}
                              >
                                 <div
                                    className={`w-12 h-12 rounded-full border-4 border-black transition-all ${state.poopColor === color.id ? 'scale-110 ring-2 ring-black ring-offset-2' : 'hover:scale-105 opacity-80'}`}
                                    style={{ backgroundColor: color.hex }}
                                 >
                                    {state.poopColor === color.id && (
                                       <div className="w-full h-full flex items-center justify-center">
                                          <span className="material-icons-round text-white drop-shadow-md">check</span>
                                       </div>
                                    )}
                                 </div>
                                 <span className={`text-[10px] font-bold uppercase ${state.poopColor === color.id ? 'text-black' : 'text-gray-400'}`}>
                                    {t.colors[color.id] || color.id}
                                 </span>
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Poop Amount */}
                     <div>
                        <h3 className="font-black text-lg mb-2 flex items-center gap-2 uppercase"><span className="text-xl">⚖️</span> {t.tracker.amountTitle}</h3>
                        <div className="grid grid-cols-3 gap-3">
                           {[
                              { id: 'high', label: t.tracker.amounts.high, icon: '⛰️' },
                              { id: 'medium', label: t.tracker.amounts.medium, icon: '⚖️' },
                              { id: 'low', label: t.tracker.amounts.low, icon: '🤏' }
                           ].map((opt) => (
                              <button
                                 key={opt.id}
                                 onClick={() => handleUpdateField('poopAmount', opt.id)}
                                 className={`p-3 rounded-xl border-2 border-black flex flex-col items-center gap-1 transition-all ${state.poopAmount === opt.id ? 'bg-dopa-cyan shadow-inner' : 'bg-white shadow-neo-sm'}`}
                              >
                                 <span className="text-2xl">{opt.icon}</span>
                                 <span className="font-bold text-sm uppercase">{opt.label}</span>
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Bristol Scale */}
                     <div>
                        <div className="flex justify-between items-center mb-2">
                           <h3 className="font-black text-lg flex items-center gap-2 uppercase"><span className="text-xl">🔬</span> {t.tracker.bristolTitle}</h3>
                           <span className="text-xs font-bold bg-dopa-lime border border-black px-2 py-0.5 rounded">Type {state.bristolType}</span>
                        </div>
                        <div className="space-y-2">
                           <input
                              type="range" min="1" max="7" step="1"
                              value={state.bristolType}
                              onChange={(e) => handleUpdateField('bristolType', parseInt(e.target.value))}
                              className="w-full h-8 cursor-pointer"
                           />
                           <div className="grid grid-cols-7 gap-1 text-center">
                              {BRISTOL_SCALE.map((b) => (
                                 <button
                                    key={b.id}
                                    onClick={() => handleUpdateField('bristolType', b.id)}
                                    className={`flex flex-col items-center gap-1 p-1 rounded border-2 ${state.bristolType === b.id ? 'bg-dopa-yellow border-black scale-110 z-10' : 'border-transparent opacity-50'}`}
                                 >
                                    <span className="text-lg leading-none">{b.icon}</span>
                                    <span className="text-[8px] font-bold leading-none">{b.id}</span>
                                 </button>
                              ))}
                           </div>
                           <div className="bg-gray-100 border-2 border-black p-2 rounded-lg text-center mt-2">
                              <span className="font-black text-lg mr-2">{BRISTOL_SCALE[state.bristolType - 1].label}</span>
                              <span className="text-sm text-gray-600">{BRISTOL_SCALE[state.bristolType - 1].desc}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t-4 border-black bg-gray-50 flex gap-3 shrink-0 pb-8 sm:pb-4">
                     <button onClick={() => {
                        // NOTE: 丢弃按钮也走滑出动画
                        setModalOpen(false);
                        setTimeout(() => {
                           setModalMounted(false);
                           handleReset();
                        }, 300);
                     }} className="flex-1 py-3 rounded-xl font-black border-4 border-black bg-white text-black shadow-neo hover:shadow-none hover:translate-y-0.5 transition-all uppercase">
                        {t.tracker.discardAction}
                     </button>
                     <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-[2] py-3 rounded-xl font-black border-4 border-black bg-dopa-lime text-black shadow-neo hover:shadow-none hover:translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-50"
                     >
                        <span className="material-icons-round">save</span>
                        {saving ? (
                           <div className="flex gap-1 items-center h-5 px-4">
                              <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                           </div>
                        ) : t.tracker.saveAction}
                     </button>
                  </div>

               </div>
            </div>
         )}

      </div>
   );
}