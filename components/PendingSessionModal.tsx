import React, { useState, useEffect, useMemo } from 'react';

interface PendingSessionInfo {
    id: string;
    startedAt: string;
    mood: string | null;
}

interface PendingSessionModalProps {
    session: PendingSessionInfo;
    /** 用户选择继续：恢复到计时状态 */
    onResume: () => void;
    /** 用户选择放弃：删除 pending session */
    onDiscard: () => void;
    /** 用户选择补录：提交补录信息 */
    onBackfill: (durationMinutes: number, mood: string, bristolType: number, color: string, amount: string) => void;
    t: any;
}

// NOTE: status/mood 选项与 Tracker 中一致
const STATUS_IDS = ['classic', 'spicy', 'ghost', 'pebble', 'spray', 'struggle', 'zen', 'nuclear', 'happy', 'pain'];
const STATUS_ICONS: Record<string, string> = {
    classic: '💩', spicy: '🔥', ghost: '👻', pebble: '🪨',
    spray: '🌊', struggle: '😫', zen: '🧘', nuclear: '☢️',
    happy: '😊', pain: '😖',
};

const COLORS = [
    { id: 'brown', hex: '#8B4513' },
    { id: 'green', hex: '#4CAF50' },
    { id: 'yellow', hex: '#FFEB3B' },
    { id: 'black', hex: '#212121' },
    { id: 'red', hex: '#F44336' },
    { id: 'pale', hex: '#F5F5DC' },
    { id: 'golden', hex: '#FFD700' },
];

/**
 * 未完成记录恢复弹窗
 *
 * NOTE: 当检测到用户有未闭环的 pending session 时弹出。
 * 提供三个选项：放弃、继续、补录。
 * 根据距离开始时间的差值自动高亮推荐选项。
 */
export default function PendingSessionModal({
    session,
    onResume,
    onDiscard,
    onBackfill,
    t,
}: PendingSessionModalProps) {
    // 弹窗动画控制
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);

    // 补录表单状态
    const [showBackfillForm, setShowBackfillForm] = useState(false);
    // NOTE: 放弃操作的二级确认状态，防止用户误触
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [durationMinutes, setDurationMinutes] = useState(5);
    const [backfillMood, setBackfillMood] = useState(session.mood || 'classic');
    const [backfillBristol, setBackfillBristol] = useState(4);
    const [backfillColor, setBackfillColor] = useState('brown');
    const [backfillAmount, setBackfillAmount] = useState('medium');

    const pendingTexts = t.pendingSession;

    // 计算距离开始时间的分钟数
    const minutesElapsed = useMemo(() => {
        const diff = Date.now() - new Date(session.startedAt).getTime();
        return Math.floor(diff / 60000);
    }, [session.startedAt]);

    // NOTE: ≤30 分钟推荐「继续」，>30 分钟推荐「补录」
    const recommendResume = minutesElapsed <= 30;

    // 入场动画
    useEffect(() => {
        setMounted(true);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setOpen(true));
        });
    }, []);

    /** 格式化开始时间为可读格式 */
    const formatStartTime = (iso: string): string => {
        const d = new Date(iso);
        const now = new Date();
        const isToday =
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate();

        const timeStr = d.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
        });

        if (isToday) {
            return `${pendingTexts.today} ${timeStr}`;
        }
        return `${d.getMonth() + 1}/${d.getDate()} ${timeStr}`;
    };

    /** 格式化经过的时间 */
    const formatElapsed = (mins: number): string => {
        if (mins < 1) return pendingTexts.justNow;
        if (mins < 60) return `${mins} ${pendingTexts.minutesAgo}`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} ${pendingTexts.hoursAgo}`;
        const days = Math.floor(hours / 24);
        return `${days} ${pendingTexts.daysAgo}`;
    };

    const handleClose = (action: () => void) => {
        setOpen(false);
        setTimeout(() => {
            setMounted(false);
            action();
        }, 300);
    };

    if (!mounted) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{
                backgroundColor: open ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0)',
                backdropFilter: open ? 'blur(6px)' : 'blur(0px)',
                transition: 'background-color 0.35s ease, backdrop-filter 0.35s ease',
                pointerEvents: open ? 'auto' : 'none',
            }}
        >
            <div
                className="bg-white w-full max-w-sm rounded-[2rem] border-4 border-black shadow-neo-lg flex flex-col overflow-hidden"
                style={{
                    transform: open ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
                    opacity: open ? 1 : 0,
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 头部 */}
                <div className="bg-dopa-yellow border-b-4 border-black p-4 text-center">
                    <div className="text-4xl mb-2">🚨</div>
                    <h2 className="text-xl font-black uppercase">
                        {pendingTexts.title}
                    </h2>
                    <p className="text-sm font-bold mt-1 text-gray-700">
                        {pendingTexts.description}
                    </p>
                </div>

                {/* 会话信息 */}
                <div className="p-4">
                    <div className="bg-black text-white p-3 rounded-xl border-2 border-dopa-purple">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase">
                                {pendingTexts.startedAt}
                            </span>
                            <span className="font-black text-dopa-lime">
                                {formatStartTime(session.startedAt)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-xs font-bold text-gray-400 uppercase">
                                {pendingTexts.elapsed}
                            </span>
                            <span className="font-bold text-dopa-yellow text-sm">
                                {formatElapsed(minutesElapsed)}
                            </span>
                        </div>
                    </div>
                </div>

                {!showBackfillForm ? (
                    /* 三个选项按钮 */
                    <div className="px-4 pb-5 space-y-3">
                        {/* 继续按钮 */}
                        <button
                            onClick={() => handleClose(onResume)}
                            className={`w-full py-3 rounded-xl font-black border-4 border-black flex items-center justify-center gap-2 transition-all uppercase ${
                                recommendResume
                                    ? 'bg-dopa-lime text-black shadow-neo ring-2 ring-dopa-lime ring-offset-2 animate-pulse'
                                    : 'bg-white text-black shadow-neo-sm'
                            }`}
                        >
                            <span className="material-icons-round text-xl">play_arrow</span>
                            {pendingTexts.resume}
                            {recommendResume && (
                                <span className="text-[10px] bg-black text-dopa-lime px-2 py-0.5 rounded-full ml-1">
                                    {pendingTexts.recommended}
                                </span>
                            )}
                        </button>

                        {/* 补录按钮 */}
                        <button
                            onClick={() => setShowBackfillForm(true)}
                            className={`w-full py-3 rounded-xl font-black border-4 border-black flex items-center justify-center gap-2 transition-all uppercase ${
                                !recommendResume
                                    ? 'bg-dopa-cyan text-black shadow-neo ring-2 ring-dopa-cyan ring-offset-2 animate-pulse'
                                    : 'bg-white text-black shadow-neo-sm'
                            }`}
                        >
                            <span className="material-icons-round text-xl">edit_note</span>
                            {pendingTexts.backfill}
                            {!recommendResume && (
                                <span className="text-[10px] bg-black text-dopa-cyan px-2 py-0.5 rounded-full ml-1">
                                    {pendingTexts.recommended}
                                </span>
                            )}
                        </button>

                        {/* 放弃按钮 */}
                        {!showDiscardConfirm ? (
                            <button
                                onClick={() => setShowDiscardConfirm(true)}
                                className="w-full py-3 rounded-xl font-black border-4 border-black bg-gray-100 text-red-500 shadow-neo-sm flex items-center justify-center gap-2 transition-all uppercase"
                            >
                                <span className="material-icons-round text-xl">delete_outline</span>
                                {pendingTexts.discard}
                            </button>
                        ) : (
                            /* 二级确认 */
                            <div className="bg-red-50 border-4 border-red-400 rounded-xl p-3 space-y-2 animate-in fade-in duration-200">
                                <p className="text-sm font-black text-red-600 text-center">
                                    ⚠️ {pendingTexts.discardConfirmMsg}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowDiscardConfirm(false)}
                                        className="flex-1 py-2 rounded-lg font-black border-2 border-black bg-white text-black text-sm uppercase transition-all"
                                    >
                                        {pendingTexts.discardCancel}
                                    </button>
                                    <button
                                        onClick={() => handleClose(onDiscard)}
                                        className="flex-1 py-2 rounded-lg font-black border-2 border-red-500 bg-red-500 text-white text-sm uppercase transition-all"
                                    >
                                        {pendingTexts.discardConfirm}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* 补录表单 */
                    <div className="px-4 pb-5 space-y-4 max-h-[50vh] overflow-y-auto hide-scrollbar">
                        {/* 持续时间 */}
                        <div>
                            <h3 className="font-black text-sm mb-2 flex items-center gap-1 uppercase">
                                ⏱️ {pendingTexts.durationLabel}
                            </h3>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="1"
                                    max="30"
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                                    className="flex-1 h-6 cursor-pointer"
                                />
                                <span className="font-black text-lg bg-dopa-yellow px-3 py-1 rounded-lg border-2 border-black min-w-[60px] text-center">
                                    {durationMinutes} {pendingTexts.minutes}
                                </span>
                            </div>
                        </div>

                        {/* 心情 */}
                        <div>
                            <h3 className="font-black text-sm mb-2 flex items-center gap-1 uppercase">
                                🤔 {pendingTexts.moodLabel}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {STATUS_IDS.map((id) => (
                                    <button
                                        key={id}
                                        onClick={() => setBackfillMood(id)}
                                        className={`px-2 py-1 rounded-lg border-2 border-black text-sm flex items-center gap-1 transition-all ${
                                            backfillMood === id
                                                ? 'bg-black text-white shadow-none'
                                                : 'bg-white shadow-neo-sm'
                                        }`}
                                    >
                                        <span>{STATUS_ICONS[id]}</span>
                                        <span className="font-bold text-xs uppercase">
                                            {t.tracker.status[id]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bristol */}
                        <div>
                            <h3 className="font-black text-sm mb-2 flex items-center gap-1 uppercase">
                                🔬 {pendingTexts.bristolLabel}
                            </h3>
                            <div className="flex gap-1 justify-center">
                                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => setBackfillBristol(n)}
                                        className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-black text-sm transition-all ${
                                            backfillBristol === n
                                                ? 'bg-dopa-yellow border-black scale-110'
                                                : 'border-gray-300 opacity-50'
                                        }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 颜色 */}
                        <div>
                            <h3 className="font-black text-sm mb-2 flex items-center gap-1 uppercase">
                                🎨 {pendingTexts.colorLabel}
                            </h3>
                            <div className="flex gap-2 justify-center">
                                {COLORS.map((color) => (
                                    <button
                                        key={color.id}
                                        onClick={() => setBackfillColor(color.id)}
                                        className={`w-8 h-8 rounded-full border-3 transition-all ${
                                            backfillColor === color.id
                                                ? 'border-black scale-110 ring-2 ring-black ring-offset-1'
                                                : 'border-gray-300 opacity-60'
                                        }`}
                                        style={{ backgroundColor: color.hex }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* 产量 */}
                        <div>
                            <h3 className="font-black text-sm mb-2 flex items-center gap-1 uppercase">
                                ⚖️ {pendingTexts.amountLabel}
                            </h3>
                            <div className="grid grid-cols-3 gap-2">
                                {(['high', 'medium', 'low'] as const).map((id) => (
                                    <button
                                        key={id}
                                        onClick={() => setBackfillAmount(id)}
                                        className={`py-2 rounded-lg border-2 border-black font-bold text-xs uppercase transition-all ${
                                            backfillAmount === id
                                                ? 'bg-dopa-cyan shadow-none'
                                                : 'bg-white shadow-neo-sm'
                                        }`}
                                    >
                                        {t.tracker.amounts[id]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowBackfillForm(false)}
                                className="flex-1 py-3 rounded-xl font-black border-4 border-black bg-white text-black shadow-neo-sm transition-all uppercase"
                            >
                                {pendingTexts.back}
                            </button>
                            <button
                                onClick={() =>
                                    handleClose(() =>
                                        onBackfill(
                                            durationMinutes,
                                            backfillMood,
                                            backfillBristol,
                                            backfillColor,
                                            backfillAmount
                                        )
                                    )
                                }
                                className="flex-[2] py-3 rounded-xl font-black border-4 border-black bg-dopa-lime text-black shadow-neo transition-all flex items-center justify-center gap-2 uppercase"
                            >
                                <span className="material-icons-round">save</span>
                                {pendingTexts.submit}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
