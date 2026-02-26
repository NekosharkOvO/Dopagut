import React, { useState, useEffect, useRef } from 'react';
import { achievementService } from '../lib/api';

const AchievementToast: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [contentVisible, setContentVisible] = useState(false);
    const [queue, setQueue] = useState<string[]>([]);
    const [achievement, setAchievement] = useState<{ id: string; title: string; icon: string; bgTheme?: string } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const queueRef = useRef<string[]>([]);
    const definitionsCache = useRef<any[]>([]);

    const isDarkBg = (bg?: string) => {
        if (!bg) return false;
        const darks = ['bg-black', 'bg-dopa-purple', 'bg-dopa-blue', 'bg-dopa-black'];
        const lights = ['bg-dopa-yellow', 'bg-dopa-lime', 'bg-white', 'bg-yellow'];
        if (lights.some(l => bg.includes(l))) return false;
        return darks.some(d => bg.includes(d));
    };

    useEffect(() => {
        const handleUnlock = (event: any) => {
            const { id } = event.detail;
            queueRef.current.push(id);
            setQueue([...queueRef.current]);
        };

        window.addEventListener('achievement-unlocked', handleUnlock);
        return () => window.removeEventListener('achievement-unlocked', handleUnlock);
    }, []);

    useEffect(() => {
        const processNext = async () => {
            if (isProcessing || queue.length === 0) return;

            setIsProcessing(true);
            const nextId = queue[0];

            try {
                // 1. 优先使用缓存的定义
                if (definitionsCache.current.length === 0) {
                    definitionsCache.current = await achievementService.getDefinitions();
                }
                const def = definitionsCache.current.find(d => d.id === nextId);

                if (def) {
                    const data = {
                        id: def.id,
                        title: def.title_zh,
                        icon: def.icon,
                        bgTheme: def.bg_theme
                    };

                    if (!visible) {
                        // 2. 首个成就：滑入外框 + 内容
                        setAchievement(data);
                        setVisible(true);
                        setContentVisible(true);
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } else {
                        // 3. 中间成就：原地 Cross-fade
                        setContentVisible(false);
                        await new Promise(resolve => setTimeout(resolve, 250));
                        setAchievement(data);
                        setContentVisible(true);
                        await new Promise(resolve => setTimeout(resolve, 250));
                    }

                    // 4. 智能时长控制：通过轮询实时检测“后继者”
                    const displayStartTime = Date.now();
                    const MAX_DURATION = 3000; // 单成就显示缩短至 3s
                    const MIN_DURATION = 2000; // 有连播时最短显示 2s

                    while (Date.now() - displayStartTime < MAX_DURATION) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        // 实时感应：如果展示期间有新成就加入队列，且已达最短时长，立即进入下一轮
                        if (queueRef.current.length > 1 && (Date.now() - displayStartTime >= MIN_DURATION)) {
                            break;
                        }
                    }

                    // 5. 根据实时的 Ref 状态决定是滑出还是原地等待下一轮循环
                    if (queueRef.current.length <= 1) {
                        setContentVisible(false);
                        setVisible(false);
                        await new Promise(resolve => setTimeout(resolve, 600));
                    }
                }
            } catch (err) {
                console.error('Achievement toast sequence failed:', err);
            } finally {
                // 出队
                queueRef.current.shift();
                setQueue([...queueRef.current]);
                setIsProcessing(false);
            }
        };

        processNext();
    }, [queue.length, isProcessing, visible]);

    const dark = isDarkBg(achievement?.bgTheme);

    return (
        <div
            className={`fixed left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform 
            ${visible && achievement ? 'top-16 opacity-100 scale-100' : 'top-0 opacity-0 scale-90 pointer-events-none'}`}
        >
            {achievement && (
                <div
                    onClick={() => {
                        setVisible(false);
                        setContentVisible(false);
                        window.dispatchEvent(new CustomEvent('navigate-tab', { detail: { tab: 'achievements' } }));
                    }}
                    className={`${achievement.bgTheme || 'bg-black'} border-4 border-black shadow-neo relative overflow-hidden transition-all duration-500 cursor-pointer hover:-translate-y-1`}
                    style={{
                        opacity: contentVisible ? 1 : 0,
                        transform: contentVisible ? 'scale(1)' : 'scale(0.98)',
                    }}
                >
                    <div className="p-4 flex items-center gap-4">
                        {/* Background Pattern */}
                        <div className={`absolute inset-0 opacity-10 pointer-events-none text-6xl leading-none select-none ${dark ? 'text-white' : 'text-black'}`}>
                            🏆🏆🏆🏆🏆🏆
                        </div>

                        <div className="w-16 h-16 bg-white border-2 border-black flex items-center justify-center text-3xl shrink-0 z-10">
                            {achievement.icon.startsWith('http') ? (
                                <img src={achievement.icon} className="w-full h-full object-cover" alt="" />
                            ) : (
                                achievement.icon
                            )}
                        </div>

                        <div className="flex-1 z-10 px-1">
                            <div className={`${dark ? 'text-dopa-lime' : 'text-dopa-purple'} font-black text-[10px] uppercase tracking-widest mb-1`}>
                                Achievement Unlocked!
                            </div>
                            <div className={`${dark ? 'text-white' : 'text-black'} text-xl font-black italic uppercase leading-tight truncate`}>
                                {achievement.title}
                            </div>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // 阻止冒泡，避免触发外层的跳转
                                setVisible(false);
                                setContentVisible(false);
                            }}
                            className={`${dark ? 'text-white' : 'text-black'} opacity-50 hover:opacity-100 transition-opacity p-2 z-20`}
                        >
                            <span className="material-icons-round">close</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AchievementToast;
