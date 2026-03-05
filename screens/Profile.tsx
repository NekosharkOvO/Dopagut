import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Tab, Log } from '../types';
import { Profile as ProfileType, achievementService, profileService, testService } from '../lib/api';
import { useLogs } from '../hooks/use-logs';
import AvatarCropper from '../components/AvatarCropper';
import LocationPicker from '../components/LocationPicker';
import { EXPERT_TIPS_DATA } from '../data/expert-tips';
import { getLocalizedLocation } from '../data';
import { TITLE_MILESTONES, TitleMilestone } from '../data/titles';

// NOTE: 成就定义列表，仅在开发者控制台中用于单独解锁/锁定
import { achievementDefinitions } from '../lib/achievements/definitions';

interface ProfileProps {
    onLogout: () => void;
    profile: ProfileType | null;
    userId: string;
    onRefreshProfile: () => Promise<void>;
    lang: string;
    setLang: (l: string) => void;
    t: any;
    isActive?: boolean;
}

/**
 * 根据 profile.total_drops 计算用户等级
 */
const calcUserLevel = (totalDrops: number): number => {
    return Math.max(1, Math.floor(totalDrops / 5) + 1);
};



const Profile: React.FC<ProfileProps> = ({ onLogout, profile, userId, onRefreshProfile, lang, setLang, t, isActive }) => {
    const [showSettings, setShowSettings] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showSupport, setShowSupport] = useState(false);
    const [selectedLog, setSelectedLog] = useState<Log | null>(null);

    // 弹窗状态
    const [showEditName, setShowEditName] = useState(false);
    const [showCropModal, setShowCropModal] = useState(false);
    const [showLocation, setShowLocation] = useState(false);
    const [showGodMode, setShowGodMode] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    // NOTE: 版本号连按计数器，用于隐蔽入口
    const tapCountRef = useRef(0);
    const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // 开发者控制台中的成就选择器
    const [devAchievementId, setDevAchievementId] = useState(achievementDefinitions[0]?.id || '');
    // 开发者控制台中的记录选择器
    const [devLogId, setDevLogId] = useState('');

    /**
     * 隐蔽入口：版本号区域连按 5 次触发
     * 需 is_admin 为 true 才能进入
     */
    const handleSecretTap = useCallback(() => {
        tapCountRef.current += 1;
        if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
        // 2 秒内未继续点击则重置
        tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 2000);
        if (tapCountRef.current >= 5) {
            tapCountRef.current = 0;
            if (profile?.is_admin) {
                setShowGodMode(true);
            }
        }
    }, [profile?.is_admin]);
    const [showTitleModal, setShowTitleModal] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [toastPhase, setToastPhase] = useState<'in' | 'out' | null>(null);

    /**
     * 显示一个带滑入/滑出动画的置顶 Toast
     * 通过 phase 状态机控制动画时序：'in' -> 展示 -> 'out' -> null
     */
    const showToast = (msg: string) => {
        setToastMsg(msg);
        setToastPhase('in');
        setTimeout(() => {
            setToastPhase('out');
            setTimeout(() => setToastPhase(null), 300);
        }, 1500);
    };

    // 定向注入状态
    const [customSeed, setCustomSeed] = useState({
        daysOffset: 0,
        bristol: 4,
        mood: 'classic',
        speed: 'normal',
        amount: 'medium',
        color: 'brown'
    });

    // 编辑状态
    const [tempName, setTempName] = useState(profile?.name || '');
    const [saving, setSaving] = useState(false);

    // 裁剪状态
    const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 地理位置状态
    const [editLocation, setEditLocation] = useState<string>('');
    const [editGeo, setEditGeo] = useState<{ lat: number; lng: number } | null>(null);

    const shareRef = useRef<HTMLDivElement>(null);

    // 同步 tempName
    useEffect(() => {
        if (profile?.name) setTempName(profile.name);
    }, [profile?.name]);

    // 1. 响应激活状态：静默拉取历史记录与成就数据
    const { logs: historyLogs, loading: logsLoading, refreshLogs } = useLogs(userId);
    const [userAchievements, setUserAchievements] = useState<any[]>([]);

    useEffect(() => {
        if (isActive) {
            refreshLogs();
            achievementService.getUserAchievements(userId).then(setUserAchievements).catch(console.error);
        }
    }, [isActive, refreshLogs, userId]);

    // 2. 监听加载状态显示 Toast
    useEffect(() => {
        // 只有在已经有数据（非首次加载）且正在后台更新时显示 Toast
        if (logsLoading && historyLogs.length > 0) {
            setToastMsg(t.alerts.updating || '数据更新中...');
            setToastPhase('in');
        } else if (!logsLoading) {
            setToastPhase(prev => (prev === 'in' ? 'out' : prev));
            const timer = setTimeout(() => {
                setToastPhase(prev => (prev === 'out' ? null : prev));
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [logsLoading, historyLogs.length, t.alerts.updating]);

    // 动态等级计算
    const userLevel = calcUserLevel(profile?.total_drops || 0);

    // 筛选已解锁成就，并按时间线升序排列
    const unlockedAchievements = useMemo(() => {
        return userAchievements
            .filter(a => a.unlocked_at)
            .sort((a, b) => new Date(a.unlocked_at).getTime() - new Date(b.unlocked_at).getTime());
    }, [userAchievements]);

    // 计算当前称号与下一级差值
    const titleProgress = useMemo(() => {
        const _count = unlockedAchievements.length;
        let currentLevel = 0;
        for (let i = 0; i < TITLE_MILESTONES.length; i++) {
            if (_count >= TITLE_MILESTONES[i].required) {
                currentLevel = i;
            } else {
                break;
            }
        }

        const currentTitle = TITLE_MILESTONES[currentLevel];
        const nextTitle = currentLevel < TITLE_MILESTONES.length - 1 ? TITLE_MILESTONES[currentLevel + 1] : null;

        const progressInLevel = nextTitle ? _count - currentTitle.required : 0;
        const totalInLevel = nextTitle ? nextTitle.required - currentTitle.required : 1;
        const percentage = nextTitle ? Math.floor((progressInLevel / totalInLevel) * 100) : 100;
        const remaining = nextTitle ? nextTitle.required - _count : 0;

        return { currentTitle, nextTitle, percentage, remaining, count: _count };
    }, [unlockedAchievements]);

    // 称号历史记录计算
    const titleHistory = useMemo(() => {
        const history: { title: TitleMilestone, date: Date }[] = [];
        for (let i = 1; i <= titleProgress.currentTitle.level; i++) {
            const req = TITLE_MILESTONES[i].required;
            if (unlockedAchievements.length >= req) {
                const achievementThatUnlockedIt = unlockedAchievements[req - 1];
                history.push({
                    title: TITLE_MILESTONES[i],
                    date: new Date(achievementThatUnlockedIt.unlocked_at)
                });
            }
        }
        return history.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [unlockedAchievements, titleProgress.currentTitle.level]);

    // 本地化地理位置显示
    const displayLocation = profile?.location ? getLocalizedLocation(profile.location, lang) : null;

    const toggleLanguage = () => {
        setLang(lang === 'zh' ? 'en' : 'zh');
    };

    // 打开地理位置弹窗时预填
    const handleOpenLocation = () => {
        setEditLocation(profile?.location || '');
        setShowLocation(true);
    };

    /**
     * 使用 html-to-image 库导出分享卡片
     * 相比 html2canvas，html-to-image 基于 SVG foreignObject 渲染，
     * 直接对目标元素本身截图，不依赖坐标计算，天然无偏移问题
     */
    const handleDownload = async () => {
        if (!shareRef.current) return;
        const htmlToImage = (window as any).htmlToImage;
        if (!htmlToImage) { alert('截图库未加载，请刷新重试'); return; }

        // 1. 显示加载中提示
        setToastMsg(t.alerts.saving || '正在生成高清海报...');
        setToastPhase('in');

        try {
            // 2. 生成图片 (极致清晰：3.0 倍采样)
            const dataUrl = await htmlToImage.toPng(shareRef.current, {
                pixelRatio: 3.0,
                cacheBust: true,
                useCORS: true,
                fontEmbedCSS: '', // 性能关键点：禁用库自动扫描并嵌入全局 Web Fonts（极其耗时）
                style: {
                    transform: 'none',
                    borderRadius: '2.5rem'
                }
            });

            // 3. 触发下载
            const link = document.createElement('a');
            link.download = `dopagut_profile.png`;
            link.href = dataUrl;
            link.click();

            // 4. 显示成功提示
            showToast(t.alerts.saveSuccess || '保存成功！✨');
        } catch (e) {
            console.error('Download failed', e);
            showToast(t.alerts.saveImageError || '保存图片失败，请重试');
        }
    };

    const handleCopy = () => {
        const text = `https://dopagut.top`;

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
    };

    /**
     * 保存用户名到 Supabase
     */
    const handleSaveName = async () => {
        if (tempName.trim().length < 2 || tempName.trim().length > 12) {
            alert(t.alerts.nameLength);
            return;
        }
        setSaving(true);
        try {
            await profileService.updateProfile(userId, { name: tempName.trim() });
            await onRefreshProfile();
            setShowEditName(false);
            showToast(t.settings?.nameSaved || '昵称已更新');
        } catch (err) {
            console.error('保存用户名失败:', err);
            alert(t.alerts.saveFailed);
        } finally {
            setSaving(false);
        }
    };

    // 头像上传 (附带初始压缩机制以应对超大图片)
    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const MAX_SIZE = 1024;
                    let { width, height } = img;
                    if (width > MAX_SIZE || height > MAX_SIZE) {
                        const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
                        width *= ratio;
                        height *= ratio;
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // 压缩为适中质量的 jpeg
                    setTempImageSrc(canvas.toDataURL('image/jpeg', 0.8));
                    setShowCropModal(true);
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    /**
     * 裁剪确认后上传头像到 Supabase Storage
     */
    const handleCropConfirm = async (base64: string) => {
        setSaving(true);
        try {
            await profileService.updateAvatarBase64(userId, base64);
            await onRefreshProfile();
            setShowCropModal(false);
            setTempImageSrc(null);
            showToast(t.settings?.avatarSaved || '头像已更新');
        } catch (err) {
            console.error('上传头像失败:', err);
            alert(t.alerts.saveFailed);
        } finally {
            setSaving(false);
        }
    };

    /**
     * 保存地理位置到 Supabase
     */
    const handleSaveLocation = async () => {
        if (!editLocation) {
            alert(t.alerts.locationMissing);
            return;
        }
        setSaving(true);
        try {
            // 同时存入位置文本与大致经纬度，供地图极坐标算法使用
            const updates: Record<string, any> = { location: editLocation };
            if (editGeo) {
                updates.geo_lat = editGeo.lat;
                updates.geo_lng = editGeo.lng;
            }
            await profileService.updateProfile(userId, updates);
            await onRefreshProfile();
            showToast(t.settings.locationSaved);
            setShowLocation(false);
        } catch (err) {
            console.error('保存位置失败:', err);
            alert(t.alerts.saveFailed);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-dopa-purple hide-scrollbar overflow-y-auto pb-32 relative h-full">
            {/* 置顶 Toast：带滑入滑出动画与状态感知 */}
            {toastPhase && (
                <div
                    className="fixed top-20 left-1/2 z-[200] bg-white border-4 border-black px-6 py-3 rounded-2xl shadow-neo flex items-center gap-3 pointer-events-none whitespace-nowrap min-w-max"
                    style={{
                        transform: toastPhase === 'in' ? 'translate(-50%, 0)' : 'translate(-50%, -120%)',
                        opacity: toastPhase === 'in' ? 1 : 0,
                        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                    }}
                >
                    <span className={`material-icons-round ${(toastMsg === t.alerts.saving || toastMsg === t.alerts.updating) ? 'text-black animate-spin' : 'text-dopa-lime'}`}>
                        {(toastMsg === t.alerts.saving || toastMsg === t.alerts.updating) ? 'sync' : 'check_circle'}
                    </span>
                    <span className="font-black text-lg text-black flex items-center">
                        {toastMsg}
                        {(toastMsg === t.alerts.saving || toastMsg === t.alerts.updating) && (
                            <span className="flex ml-0.5">
                                <span className="dot-pulse">.</span>
                                <span className="dot-pulse [animation-delay:0.2s]">.</span>
                                <span className="dot-pulse [animation-delay:0.4s]">.</span>
                            </span>
                        )}
                    </span>
                </div>
            )}

            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#FAFF00 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

            <main className="w-full flex-1 flex flex-col overflow-hidden relative z-10 pt-4 px-2">
                <div className="flex-1 hide-scrollbar overflow-y-auto pb-10 bg-dopa-pink m-2 mt-0 rounded-[2rem] border-4 border-black relative shadow-neo-lg"
                    style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

                    {/* Header */}
                    <header className="px-5 pt-6 pb-4 flex justify-between items-center relative z-40 sticky top-0 bg-dopa-pink/95 backdrop-blur-sm border-b-2 border-black/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-dopa-yellow border-4 border-black shadow-neo-sm flex items-center justify-center transform -rotate-3">
                                <span className="material-icons-round text-black text-xl">face</span>
                            </div>
                            <h1 className="text-2xl font-black tracking-tighter text-black uppercase italic leading-none drop-shadow-[1px_1px_0_#fff]">
                                {t.profile.title}
                            </h1>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowShare(true)}
                                className="w-10 h-10 rounded-full bg-white border-2 border-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center active:scale-95"
                            >
                                <span className="material-symbols-outlined text-black font-bold">ios_share</span>
                            </button>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="w-10 h-10 rounded-full bg-white border-2 border-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center active:scale-95"
                            >
                                <span className="material-symbols-outlined text-black font-bold">settings</span>
                            </button>
                        </div>
                    </header>

                    <section className="flex flex-col items-center pt-6 pb-8 px-4">
                        <div className="relative mb-4">
                            <div className="w-32 h-32 rounded-full border-4 border-black bg-white overflow-hidden shadow-neo relative z-10">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-6xl bg-dopa-cyan">💩</div>
                                )}
                            </div>
                            <div
                                className="absolute -bottom-2 -right-4 bg-dopa-purple text-white font-display text-xs font-black px-3 py-1 border-2 border-black shadow-neo-sm transform rotate-6 z-20"
                            >
                                {t.profile.level}{userLevel}
                            </div>
                            <div className="absolute -top-2 -left-2 text-4xl animate-bounce z-20">👑</div>
                        </div>
                        <h2 className="text-2xl font-black text-black stroke-black drop-shadow-[2px_2px_0_rgba(255,255,255,1)] mb-1">
                            {profile?.name || '???'}
                        </h2>

                        <div className="bg-black text-dopa-lime px-3 py-1 font-display text-sm font-black border-2 border-white rotate-1 shadow-sm">
                            {displayLocation || t.profile.unknownLocation}
                        </div>
                    </section>

                    {/* Stats Grid */}
                    <section className="px-4 mb-8">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-dopa-cyan p-3 rounded-xl border-4 border-black shadow-neo flex flex-col items-center text-center justify-between group neo-press h-32">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-black px-1 rounded-sm">{t.profile.totalDrops}</span>
                                <div className="flex-1 flex items-center justify-center">
                                    <span className="font-display text-3xl font-black">{profile?.total_drops || 0}</span>
                                </div>
                                <span className="text-xs font-bold">{t.profile.count}</span>
                            </div>
                            <div className="bg-dopa-yellow p-3 rounded-xl border-4 border-black shadow-neo flex flex-col items-center text-center justify-between group neo-press h-32 relative overflow-hidden">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-black px-1 rounded-sm z-10">{t.profile.maxZen}</span>
                                <div className="flex-1 flex items-center justify-center z-10">
                                    <span className="font-display text-2xl font-black leading-none">{(profile?.max_zen || 0) > 0 ? `${profile?.max_zen}` : (profile?.total_drops ? '<1' : '0')}<small className="text-sm">min</small></span>
                                </div>
                                <span className="text-xs font-bold z-10">{t.profile.time}</span>
                                <div className="absolute -bottom-4 -right-4 text-6xl opacity-20 rotate-12">🧘</div>
                            </div>
                            <div className="bg-dopa-lime p-3 rounded-xl border-4 border-black shadow-neo flex flex-col items-center text-center justify-between group neo-press h-32">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-black px-1 rounded-sm">{t.profile.beat}</span>
                                <div className="flex-1 flex items-center justify-center">
                                    <span className="font-display text-3xl font-black">{profile?.beat_percentage || 0}%</span>
                                </div>
                                <span className="text-xs font-bold">{t.profile.users}</span>
                            </div>
                        </div>
                    </section>

                    {/* Menu */}
                    <section className="px-4 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="font-black text-xl bg-dopa-black text-white px-2 -rotate-1">{t.profile.assets}</h3>
                            <span className="text-sm font-bold animate-pulse">{t.profile.new}</span>
                        </div>
                        <div className="space-y-4">
                            {/* Title Progress */}
                            <button
                                onClick={() => setShowTitleModal(true)}
                                className={`w-full ${titleProgress.currentTitle.bgTheme} p-4 rounded-xl border-4 border-black shadow-neo neo-press flex items-center gap-4 relative overflow-hidden group cursor-pointer`}
                            >
                                <div className="w-14 h-14 bg-white rounded-lg border-2 border-black flex items-center justify-center text-3xl shrink-0 z-10 shadow-sm">
                                    {titleProgress.currentTitle.emoji}
                                </div>
                                <div className={`flex-1 text-left z-10 ${titleProgress.currentTitle.textColor}`}>
                                    <div className="font-black text-lg">
                                        {titleProgress.count === 0 ? t.profile.titlePath : titleProgress.currentTitle[lang]}
                                    </div>
                                    <div className="text-xs font-bold opacity-80 mt-1">
                                        {titleProgress.nextTitle
                                            ? `${t.profile.nextStation || '下一阶'}: ${titleProgress.nextTitle[lang]}`
                                            : t.profile.maxLevelReached || '已达最高境界'}
                                    </div>
                                    <div className="w-full h-3 bg-black/20 border-2 border-black rounded-full mt-2 overflow-hidden relative">
                                        <div className="absolute inset-0 z-0 h-full bg-white border-r-2 border-black transition-all duration-1000" style={{ width: `${titleProgress.percentage}%` }}></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black z-10 mix-blend-difference text-white">
                                            {titleProgress.nextTitle
                                                ? `${t.profile.needMore || '还需'} ${titleProgress.remaining} ${t.profile.items || '个成就'}`
                                                : 'MAX'}
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2"><span className={`material-symbols-outlined ${titleProgress.currentTitle.textColor}`}>chevron_right</span></div>
                                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white rounded-full border-4 border-black opacity-20 group-hover:scale-125 transition-transform"></div>
                            </button>

                            {/* History */}
                            <button onClick={() => setShowHistory(true)} className="w-full bg-white p-4 rounded-xl border-4 border-black shadow-neo neo-press flex items-center gap-4 relative overflow-hidden group">
                                <div className="w-14 h-14 bg-dopa-lime rounded-lg border-2 border-black flex items-center justify-center text-3xl shrink-0 z-10">📜</div>
                                <div className="flex-1 text-left z-10">
                                    <div className="font-black text-lg">{t.profile.history}</div>
                                    <div className="text-xs font-bold text-gray-500">{t.profile.historyDesc}</div>
                                </div>
                                <div className="absolute top-2 right-2"><span className="material-symbols-outlined text-black">chevron_right</span></div>
                                <div className="absolute -left-4 -top-4 w-16 h-16 bg-dopa-pink rounded-full border-4 border-black opacity-20 group-hover:scale-125 transition-transform"></div>
                            </button>

                            {/* VIP */}
                            <button onClick={() => setShowSupport(true)} className="w-full bg-dopa-black p-4 rounded-xl border-4 border-white shadow-neo neo-press flex items-center gap-4 relative overflow-hidden group">
                                <div className="w-14 h-14 bg-dopa-yellow rounded-lg border-2 border-black flex items-center justify-center text-3xl shrink-0 z-10">💎</div>
                                <div className="flex-1 text-left z-10 text-white">
                                    <div className="font-black text-lg text-dopa-lime">{t.profile.vip}</div>
                                    <div className="text-xs font-bold text-gray-400">{t.profile.vipDesc}</div>
                                </div>
                                <div className="absolute top-2 right-2"><span className="material-symbols-outlined text-white">chevron_right</span></div>
                            </button>
                        </div>
                    </section>

                    {/* 隐蔽入口：底部版本号文字，连按 5 次触发 */}
                    <div
                        className="text-center py-6 select-none"
                        onClick={handleSecretTap}
                    >
                        <span className="text-[10px] text-gray-300 font-mono">DopaGut v2.1</span>
                    </div>
                </div>
            </main>

            {/* --- MODALS --- */}

            {/* 1. Share Modal */}
            {showShare && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowShare(false)}>
                    <div className="w-full max-w-sm flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <div ref={shareRef} data-share-card="true" className="bg-dopa-pink w-full rounded-[2.5rem] border-4 border-black shadow-neo-white relative overflow-hidden p-6 mb-8">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                            <div className="flex justify-center mb-6">
                                <div className="bg-black/10 px-6 py-2 rounded-full">
                                    <span className="text-sm font-black uppercase tracking-wider text-black">{t.profile.shareTitle}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center mb-6 relative z-10">
                                <div className="w-32 h-32 rounded-full border-4 border-black bg-white overflow-hidden shadow-neo mb-4">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-6xl bg-dopa-cyan">💩</div>
                                    )}
                                </div>
                                <h2 className="text-4xl font-black text-white stroke-black drop-shadow-[2px_2px_0_#000] mb-2">{profile?.name || '???'}</h2>
                                <div className="bg-black text-dopa-lime px-4 py-1 text-sm font-bold border-2 border-white rounded-lg">{displayLocation || t.profile.unknownLocation}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <div className="bg-dopa-cyan rounded-xl border-2 border-black p-2 flex flex-col items-center">
                                    <span className="text-[10px] font-bold uppercase">{t.profile.dropsLabel}</span>
                                    <span className="text-xl font-black">{profile?.total_drops || 0}</span>
                                </div>
                                <div className="bg-dopa-yellow rounded-xl border-2 border-black p-2 flex flex-col items-center">
                                    <span className="text-[10px] font-bold uppercase">{t.profile.zenLabel}</span>
                                    <span className="text-xl font-black">{(profile?.max_zen || 0) > 0 ? `${profile?.max_zen}` : (profile?.total_drops ? '<1' : '0')}<small>m</small></span>
                                </div>
                                <div className="bg-dopa-lime rounded-xl border-2 border-black p-2 flex flex-col items-center">
                                    <span className="text-[10px] font-bold uppercase">{t.profile.rankLabel}</span>
                                    <span className="text-xl font-black">{profile?.beat_percentage || 0}%</span>
                                </div>
                            </div>
                            <div className="text-center border-t-2 border-black/10 pt-4">
                                <p className="font-black text-sm text-black/60 uppercase">dopagut.top</p>
                            </div>
                        </div>
                        <div className="flex flex-row gap-3 w-full">
                            <button
                                onClick={handleDownload}
                                className="flex-1 bg-white border-4 border-black rounded-2xl py-4 font-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-3 group active:scale-95"
                            >
                                <span className="material-icons-round text-black text-2xl group-hover:scale-110 transition-transform">file_download</span>
                                <span className="text-lg uppercase tracking-wider">{t.profile.saveCard}</span>
                            </button>

                            <button
                                onClick={handleCopy}
                                className="flex-1 bg-white border-4 border-black rounded-2xl py-4 font-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-3 group active:scale-95 relative"
                            >
                                <span className="material-icons-round text-black text-2xl group-hover:scale-110 transition-transform">link</span>
                                <span className="text-lg uppercase tracking-wider">{t.profile.shareLink}</span>
                            </button>
                        </div>
                        <button onClick={() => setShowShare(false)} className="mt-6 w-12 h-12 bg-black rounded-full border-2 border-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><span className="material-icons-round text-white">close</span></button>
                    </div>
                </div>
            )}

            {/* 2. History Modal */}
            {showHistory && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowHistory(false)}>
                    <div className="bg-white w-full max-w-sm h-[80%] rounded-[2rem] border-4 border-black shadow-neo-lg flex flex-col overflow-hidden animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
                        <header className="bg-dopa-lime border-b-4 border-black p-4 flex justify-between items-center">
                            <h2 className="font-black text-xl italic uppercase">{t.profile.history}</h2>
                            <button onClick={() => setShowHistory(false)}><span className="material-icons-round font-bold">close</span></button>
                        </header>
                        <div className="flex-1 hide-scrollbar overflow-y-auto p-4 space-y-3">
                            {logsLoading ? (
                                <div className="text-center py-8"><span className="text-4xl animate-bounce inline-block">⏳</span></div>
                            ) : historyLogs.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 font-bold">{t.dashboard.noData}</div>
                            ) : historyLogs.map(log => (
                                <div key={log.id} className="bg-white border-4 border-black rounded-xl p-3 shadow-neo hover:translate-x-1 transition-transform cursor-pointer" onClick={() => setSelectedLog(log)}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-gray-500 text-xs">{new Date(log.date).toLocaleDateString()}</span>
                                        <span className="font-black bg-black text-white px-2 rounded text-xs">{t.speeds[log.speed] || log.speed}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">💩</span>
                                        <div>
                                            <div className="font-black text-lg">Type {log.bristolType}</div>
                                            <div className="text-xs font-bold text-dopa-purple">{t.tracker.status[log.mood] || log.mood}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {selectedLog && (
                                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6" onClick={() => setSelectedLog(null)}>
                                    <div className="bg-dopa-yellow border-4 border-black p-6 rounded-2xl shadow-neo-lg w-full max-w-xs text-center relative">
                                        <button className="absolute top-2 right-2 font-bold" onClick={() => setSelectedLog(null)}>X</button>
                                        <h3 className="text-2xl font-black mb-4">{t.profile.details}</h3>
                                        <div className="text-left space-y-2 font-bold">
                                            <p>{t.dashboard.startTime}: {new Date(selectedLog.date).toLocaleString()}</p>
                                            <p>{t.dashboard.duration}: {selectedLog.durationSeconds}s</p>
                                            <p>{t.tracker.bristolTitle}: {selectedLog.shape}</p>
                                            <p>{t.dashboard.color}: <span className="uppercase">{selectedLog.color ? t.colors[selectedLog.color] || selectedLog.color : '-'}</span></p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Support Modal */}
            {showSupport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in zoom-in-95 duration-200" onClick={() => setShowSupport(false)}>
                    <div className="bg-dopa-white w-full max-w-xs border-4 border-black rounded-[2rem] p-6 text-center shadow-neo-white relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-4 bg-dopa-pink border-b-4 border-black"></div>
                        <div className="mt-4 mb-4">
                            <span className="text-6xl animate-bounce inline-block">🙀</span>
                        </div>
                        <h2 className="text-2xl font-black uppercase mb-2">{t.profile.support.title}</h2>
                        <p className="font-bold text-sm mb-6 whitespace-pre-wrap leading-tight">
                            {t.profile.support.desc}
                        </p>
                        <div className="w-36 h-36 mx-auto border-4 border-black mb-6 bg-white p-1">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('哈？居然真有人扫码！开玩笑的ww本项目暂时没有收费打算，但还是谢谢你的支持喵～ 🎉')}`}
                                alt="QR Code"
                                className="w-full h-full"
                            />
                        </div>
                        <button onClick={() => setShowSupport(false)} className="w-full bg-black text-white font-black py-3 rounded-xl border-4 border-transparent hover:border-dopa-lime transition-all">
                            {t.profile.support.btn}
                        </button>
                    </div>
                </div>
            )}

            {/* 4. Settings Menu */}
            {showSettings && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSettings(false)}>
                    <div
                        className="bg-white w-full max-w-xs rounded-2xl border-4 border-black shadow-neo-lg p-0 overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="bg-dopa-yellow border-b-4 border-black p-3 flex justify-between items-center">
                            <span className="font-black text-lg flex items-center gap-2">
                                <span className="material-symbols-outlined">settings</span> {t.settings.title}
                            </span>
                            <button onClick={() => setShowSettings(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border-2 border-black hover:bg-gray-100">
                                <span className="material-icons-round font-bold text-sm">close</span>
                            </button>
                        </header>
                        <div className="p-4 space-y-3">
                            <button onClick={() => setShowEditName(true)} className="w-full bg-white border-4 border-black rounded-xl p-3 font-bold shadow-neo active:shadow-none active:translate-y-1 transition-all flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded bg-dopa-cyan border-2 border-black flex items-center justify-center">
                                    <span className="material-icons-round text-sm">edit</span>
                                </div>
                                {t.settings.editName}
                            </button>

                            <div className="relative">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={onFileSelect}
                                />
                                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white border-4 border-black rounded-xl p-3 font-bold shadow-neo active:shadow-none active:translate-y-1 transition-all flex items-center gap-3 group">
                                    <div className="w-8 h-8 rounded bg-dopa-pink border-2 border-black flex items-center justify-center">
                                        <span className="material-icons-round text-sm">add_a_photo</span>
                                    </div>
                                    {t.settings.uploadAvatar}
                                </button>
                            </div>

                            <button onClick={handleOpenLocation} className="w-full bg-white border-4 border-black rounded-xl p-3 font-bold shadow-neo active:shadow-none active:translate-y-1 transition-all flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded bg-dopa-purple border-2 border-black flex items-center justify-center">
                                    <span className="material-icons-round text-sm text-white">my_location</span>
                                </div>
                                {t.settings.setLocation}
                            </button>

                            <button
                                onClick={toggleLanguage}
                                className="w-full bg-dopa-lime border-4 border-black rounded-xl p-3 font-bold shadow-neo active:shadow-none active:translate-y-1 transition-all flex items-center gap-3 group"
                            >
                                <div className="w-8 h-8 rounded bg-white border-2 border-black flex items-center justify-center">
                                    <span className="material-icons-round text-sm">translate</span>
                                </div>
                                {t.settings.switchLang}
                            </button>

                            <button
                                onClick={() => { setShowSettings(false); setShowAbout(true); }}
                                className="w-full bg-white border-4 border-black rounded-xl p-3 font-bold shadow-neo active:shadow-none active:translate-y-1 transition-all flex items-center gap-3 group"
                            >
                                <div className="w-8 h-8 rounded bg-dopa-orange border-2 border-black flex items-center justify-center">
                                    <span className="material-icons-round text-sm text-white">info</span>
                                </div>
                                {t.settings.about}
                            </button>
                            <div className="h-2 border-b-2 border-dashed border-gray-300"></div>
                            <button
                                onClick={onLogout}
                                className="w-full bg-black text-dopa-pink border-4 border-black rounded-xl p-3 font-black shadow-neo active:shadow-none active:translate-y-1 transition-all flex items-center gap-3 group hover:bg-gray-900"
                            >
                                <div className="w-8 h-8 rounded bg-dopa-pink border-2 border-dopa-pink flex items-center justify-center">
                                    <span className="material-icons-round text-sm text-black">logout</span>
                                </div>
                                {t.settings.logout}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. About Modal */}
            {showAbout && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in zoom-in-95 duration-200" onClick={() => setShowAbout(false)}>
                    <div className="bg-dopa-white w-full max-w-xs border-4 border-black rounded-[2rem] p-6 text-center shadow-neo-white relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-4 bg-dopa-orange border-b-4 border-black"></div>
                        <div className="mt-4 mb-3">
                            <span className="text-5xl">🚽</span>
                        </div>
                        <h2 className="text-2xl font-black uppercase mb-1">DopaGut</h2>
                        <p className="text-[10px] font-bold text-gray-400 mb-4">v2.1 · AGPL-3.0</p>
                        <p className="font-bold text-sm mb-5 whitespace-pre-wrap leading-snug text-gray-700">
                            {t.settings.aboutDesc}
                        </p>
                        <a
                            href="https://github.com/NekosharkOvO/Dopagut"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-black text-dopa-lime font-black py-3 rounded-xl border-4 border-black hover:bg-gray-900 transition-all mb-3 text-sm"
                        >
                            {t.settings.viewSource}
                        </a>
                        <button onClick={() => setShowAbout(false)} className="w-full bg-white text-black font-black py-3 rounded-xl border-4 border-black hover:bg-gray-50 transition-all text-sm">
                            OK!
                        </button>
                        <p className="text-[10px] font-bold text-gray-300 mt-4">{t.settings.madeWith}</p>
                    </div>
                </div>
            )}

            {/* 6. Edit Name Modal */}
            {showEditName && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-xs rounded-2xl border-4 border-black p-4">
                        <h3 className="font-black text-lg mb-4">{t.settings.editName}</h3>
                        <input
                            type="text"
                            value={tempName}
                            onChange={e => setTempName(e.target.value)}
                            placeholder={t.auth.namePlaceholder}
                            className="w-full border-2 border-black rounded-lg p-2 font-bold mb-4"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setShowEditName(false)} className="flex-1 py-2 border-2 border-black rounded-lg font-bold">{t.settings.cancel}</button>
                            <button onClick={handleSaveName} disabled={saving} className="flex-1 py-2 bg-dopa-cyan border-2 border-black rounded-lg font-black shadow-neo-sm active:translate-y-0.5 active:shadow-none disabled:opacity-50">
                                {saving ? '...' : t.settings.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Crop Modal */}
            {showCropModal && tempImageSrc && (
                <AvatarCropper
                    imageSrc={tempImageSrc}
                    onCancel={() => { setShowCropModal(false); setTempImageSrc(null); }}
                    onConfirm={handleCropConfirm}
                    t={t}
                />
            )}

            {/* 7. Location Modal */}
            {showLocation && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-xs rounded-2xl border-4 border-black p-4">
                        <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                            <span className="material-icons-round text-dopa-purple">public</span>
                            {t.settings.setLocation}
                        </h3>

                        <div className="mb-6">
                            <LocationPicker
                                value={editLocation}
                                onChange={setEditLocation}
                                onGeoChange={setEditGeo}
                                t={t}
                            />
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setShowLocation(false)} className="flex-1 py-2 border-2 border-black rounded-lg font-bold">{t.settings.cancel}</button>
                            <button onClick={handleSaveLocation} disabled={saving || !editLocation} className="flex-1 py-2 bg-dopa-purple text-white border-2 border-black rounded-lg font-black shadow-neo-sm active:translate-y-0.5 active:shadow-none disabled:opacity-50">
                                {saving ? '...' : t.settings.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 7.5. Title History Modal */}
            {showTitleModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowTitleModal(false)}>
                    <div className="bg-white w-full max-w-sm max-h-[80%] rounded-[2rem] border-4 border-black shadow-neo-lg flex flex-col overflow-hidden animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
                        <header className={`${titleProgress.currentTitle.bgTheme} border-b-4 border-black p-4 flex justify-between items-center relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                            <h2 className={`font-black text-xl italic uppercase ${titleProgress.currentTitle.textColor} drop-shadow-sm flex items-center gap-2 relative z-10`}>
                                <span className="text-2xl">{titleProgress.currentTitle.emoji}</span>
                                {t.profile.titlePath || '称号之路'}
                            </h2>
                            <button onClick={() => setShowTitleModal(false)} className={`w-8 h-8 flex items-center justify-center rounded-full bg-white border-2 border-black hover:bg-gray-100 shadow-sm relative z-10 hover:scale-105 active:scale-95 transition-transform`}>
                                <span className="material-icons-round font-bold">close</span>
                            </button>
                        </header>
                        <div className="flex-1 hide-scrollbar overflow-y-auto p-6 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.02)_100%)]">
                            {titleHistory.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 font-bold flex flex-col items-center justify-center h-full">
                                    <div className="w-24 h-24 mb-4 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center opacity-50 grayscale">
                                        <span className="text-5xl">🚽</span>
                                    </div>
                                    <p className="opacity-80 leading-relaxed text-sm whitespace-pre-wrap">{t.profile.noTitlesYet || '暂未获得称号\n多去探索记录吧！'}</p>
                                </div>
                            ) : (
                                <div className="relative border-l-4 border-black/10 ml-5 py-2 space-y-8">
                                    {titleHistory.map((item, index) => (
                                        <div key={item.title.level} className="relative pl-8 group">
                                            {/* Timeline Node */}
                                            <div className="absolute -left-[2px] top-6 bottom-[-2rem] w-1 bg-black group-last:hidden origin-top scale-y-0 animate-[grow_0.5s_ease-out_forwards]"></div>

                                            <div
                                                className={`absolute -left-[2px] top-2 w-12 h-12 rounded-full border-4 border-black ${item.title.bgTheme} flex items-center justify-center text-2xl shadow-neo-sm z-10 transform -translate-x-1/2 hover:scale-110 hover:-rotate-12 transition-transform cursor-help`}
                                                title={item.title[lang]}
                                            >
                                                {item.title.emoji}
                                            </div>

                                            {/* Content */}
                                            <div className="bg-white p-4 rounded-xl border-4 border-black shadow-neo -mt-2 group-hover:-translate-y-1 transition-transform cursor-default relative overflow-hidden">
                                                <div className="font-black text-xl mb-1 flex items-center gap-2">
                                                    {item.title[lang]}
                                                    <span className={`text-[10px] ${item.title.bgTheme} ${item.title.textColor} border-2 border-black px-1.5 py-0.5 rounded-full font-black`}>LV.{item.title.level}</span>
                                                </div>
                                                <div className="text-sm font-bold text-gray-500 flex items-center gap-1.5">
                                                    <span className="material-icons-round text-[16px] text-dopa-pink">event_available</span>
                                                    {item.date.toLocaleDateString()} {t.achievements?.unlocked || (lang === 'zh' ? '解锁' : 'Unlocked')}
                                                </div>
                                                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gray-100 rounded-full opacity-20 group-hover:bg-dopa-yellow/20 transition-colors pointer-events-none"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 8. God Mode (Developer Console) — 仅管理员可见 */}
            {showGodMode && profile?.is_admin && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-gray-50 border-[6px] border-black w-full max-w-xs rounded-[2.5rem] overflow-hidden shadow-[16px_16px_0_rgba(0,0,0,1)]">
                        <header className="bg-black text-white p-5 text-center border-b-[6px] border-black">
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase font-mono">Dev_Console</h2>
                            <div className="flex justify-center gap-2 mt-1">
                                <span className="text-[9px] bg-dopa-pink text-black px-1.5 py-0.5 rounded font-black uppercase tracking-widest">God Mode</span>
                                <span className="text-[9px] border border-white/30 text-white/50 px-1.5 py-0.5 rounded font-bold uppercase">v2.1 Stable</span>
                            </div>
                        </header>

                        <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
                            {/* ═══ 数据核弹 ═══ */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-red-400 uppercase tracking-widest pl-1">{t.devConsole.nukeZone}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={async (e) => {
                                            if (!confirm(t.devConsole.wipeAllConfirm)) return;
                                            const btn = e.currentTarget;
                                            btn.disabled = true;
                                            try {
                                                await testService.resetUserData(userId);
                                                await onRefreshProfile();
                                                showToast(t.devConsole.wipeAllDone);
                                            } catch (err: any) { alert(`ERROR: ${err}`); }
                                            finally { btn.disabled = false; }
                                        }}
                                        className="bg-white text-red-500 border-4 border-black py-3 rounded-2xl font-black text-[10px] uppercase shadow-neo-sm active:translate-y-1 active:shadow-none transition-all"
                                    >
                                        {t.devConsole.wipeAll}
                                    </button>
                                    <button
                                        onClick={async (e) => {
                                            if (!confirm(t.devConsole.clearLogsConfirm)) return;
                                            const btn = e.currentTarget;
                                            btn.disabled = true;
                                            try {
                                                await testService.clearAllLogs(userId);
                                                await onRefreshProfile();
                                                showToast(t.devConsole.clearLogsDone);
                                            } catch (err: any) { alert(`ERROR: ${err}`); }
                                            finally { btn.disabled = false; }
                                        }}
                                        className="bg-white text-orange-500 border-4 border-black py-3 rounded-2xl font-black text-[10px] uppercase shadow-neo-sm active:translate-y-1 active:shadow-none transition-all"
                                    >
                                        {t.devConsole.clearLogs}
                                    </button>
                                </div>
                            </div>

                            {/* ═══ 成就操作 ═══ */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest pl-1">{t.devConsole.achievementMgr}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={async (e) => {
                                            const btn = e.currentTarget;
                                            btn.disabled = true;
                                            try {
                                                const count = await testService.unlockAllAchievements(userId);
                                                window.dispatchEvent(new CustomEvent('force-refresh-achievements'));
                                                showToast(t.devConsole.unlockAllDone.replace('{count}', count));
                                            } catch (err: any) { alert(`ERR: ${err}`); }
                                            finally { btn.disabled = false; }
                                        }}
                                        className="bg-yellow-400/20 text-black border-4 border-black py-3 rounded-2xl font-black text-[10px] uppercase shadow-neo-sm active:translate-y-1 active:shadow-none transition-all"
                                    >
                                        {t.devConsole.unlockAll}
                                    </button>
                                    <button
                                        onClick={async (e) => {
                                            if (!confirm(t.devConsole.lockAllConfirm)) return;
                                            const btn = e.currentTarget;
                                            btn.disabled = true;
                                            try {
                                                await testService.lockAllAchievements(userId);
                                                window.dispatchEvent(new CustomEvent('force-refresh-achievements'));
                                                showToast(t.devConsole.lockAllDone);
                                            } catch (err: any) { alert(`ERR: ${err}`); }
                                            finally { btn.disabled = false; }
                                        }}
                                        className="bg-gray-200 text-black border-4 border-black py-3 rounded-2xl font-black text-[10px] uppercase shadow-neo-sm active:translate-y-1 active:shadow-none transition-all"
                                    >
                                        {t.devConsole.lockAll}
                                    </button>
                                </div>
                                {/* 单独操作某个成就 */}
                                <div className="bg-white border-4 border-black p-3 rounded-2xl space-y-2">
                                    <select
                                        value={devAchievementId}
                                        onChange={e => setDevAchievementId(e.target.value)}
                                        className="w-full border-2 border-black rounded-lg px-2 py-1.5 text-[10px] font-black bg-gray-50 outline-none"
                                    >
                                        {achievementDefinitions.map(d => (
                                            <option key={d.id} value={d.id}>{d.title_zh} ({d.id})</option>
                                        ))}
                                    </select>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={async (e) => {
                                                const btn = e.currentTarget;
                                                btn.disabled = true;
                                                try {
                                                    await testService.unlockOneAchievement(userId, devAchievementId);
                                                    window.dispatchEvent(new CustomEvent('force-refresh-achievements'));
                                                    showToast(`${t.devConsole.unlockOneDone}: ${devAchievementId}`);
                                                } catch (err: any) { alert(`ERR: ${err}`); }
                                                finally { btn.disabled = false; }
                                            }}
                                            className="bg-dopa-lime/30 text-black border-2 border-black py-2 rounded-xl font-black text-[9px] uppercase active:translate-y-0.5 transition-all"
                                        >
                                            {t.devConsole.unlockOne}
                                        </button>
                                        <button
                                            onClick={async (e) => {
                                                const btn = e.currentTarget;
                                                btn.disabled = true;
                                                try {
                                                    await testService.lockOneAchievement(userId, devAchievementId);
                                                    window.dispatchEvent(new CustomEvent('force-refresh-achievements'));
                                                    showToast(`${t.devConsole.lockOneDone}: ${devAchievementId}`);
                                                } catch (err: any) { alert(`ERR: ${err}`); }
                                                finally { btn.disabled = false; }
                                            }}
                                            className="bg-gray-100 text-black border-2 border-black py-2 rounded-xl font-black text-[9px] uppercase active:translate-y-0.5 transition-all"
                                        >
                                            {t.devConsole.lockOne}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ═══ 记录操作 ═══ */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest pl-1">{t.devConsole.logMgr}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={async (e) => {
                                            const btn = e.currentTarget;
                                            btn.disabled = true;
                                            try {
                                                await testService.seedLogs(userId, 10);
                                                await onRefreshProfile();
                                                showToast(t.devConsole.seedDone);
                                            } catch (err: any) { alert(`ERR: ${err}`); }
                                            finally { btn.disabled = false; }
                                        }}
                                        className="bg-dopa-blue/20 text-black border-4 border-black py-3 rounded-2xl font-black text-[10px] uppercase shadow-neo-sm active:translate-y-1 active:shadow-none transition-all"
                                    >
                                        {t.devConsole.seedRandom}
                                    </button>
                                    <button
                                        onClick={async (e) => {
                                            const btn = e.currentTarget;
                                            btn.disabled = true;
                                            try {
                                                await testService.syncDefinitions();
                                                window.dispatchEvent(new CustomEvent('force-refresh-achievements'));
                                                showToast(t.devConsole.syncDone);
                                            } catch (err: any) { alert(`ERR: ${err}`); }
                                            finally { btn.disabled = false; }
                                        }}
                                        className="bg-dopa-cyan/20 text-black border-4 border-black py-3 rounded-2xl font-black text-[10px] uppercase shadow-neo-sm active:translate-y-1 active:shadow-none transition-all"
                                    >
                                        {t.devConsole.syncDef}
                                    </button>
                                </div>
                                {/* 删除特定记录 */}
                                <div className="bg-white border-4 border-black p-3 rounded-2xl space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase ml-1">{t.devConsole.deleteLog}</label>
                                    <select
                                        value={devLogId}
                                        onChange={e => setDevLogId(e.target.value)}
                                        className="w-full border-2 border-black rounded-lg px-2 py-1.5 text-[10px] font-black bg-gray-50 outline-none"
                                    >
                                        <option value="">{t.devConsole.selectLog}</option>
                                        {historyLogs.slice(0, 50).map(log => (
                                            <option key={log.id} value={log.id}>
                                                {new Date(log.date).toLocaleString()} | B{log.bristolType} | {log.mood}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={async (e) => {
                                            if (!devLogId) return;
                                            if (!confirm(t.devConsole.deleteLogConfirm)) return;
                                            const btn = e.currentTarget;
                                            btn.disabled = true;
                                            try {
                                                await testService.deleteLog(devLogId);
                                                await onRefreshProfile();
                                                refreshLogs();
                                                setDevLogId('');
                                                showToast(t.devConsole.deleteLogDone);
                                            } catch (err: any) { alert(`ERR: ${err}`); }
                                            finally { btn.disabled = false; }
                                        }}
                                        disabled={!devLogId}
                                        className={`w-full border-4 border-black py-2 rounded-xl font-black text-[10px] uppercase active:translate-y-0.5 transition-all ${devLogId ? 'bg-red-100 text-red-600 shadow-neo-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        {t.devConsole.deleteLogBtn}
                                    </button>
                                </div>
                            </div>

                            {/* ═══ 定向注入 ═══ */}
                            <section className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 pl-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-dopa-pink animate-pulse"></div>
                                    {t.devConsole.injection}
                                </label>

                                <div className="bg-white border-4 border-black p-4 rounded-3xl shadow-neo-sm space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Days Shift</label>
                                            <input
                                                type="number"
                                                value={customSeed.daysOffset}
                                                onChange={e => setCustomSeed({ ...customSeed, daysOffset: parseInt(e.target.value) || 0 })}
                                                className="w-full border-2 border-black rounded-xl px-3 py-2 font-black text-sm bg-gray-50 outline-none focus:bg-white transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Type</label>
                                            <select
                                                value={customSeed.bristol}
                                                onChange={e => setCustomSeed({ ...customSeed, bristol: parseInt(e.target.value) })}
                                                className="w-full border-2 border-black rounded-xl px-2 py-2 font-black text-sm bg-gray-50 outline-none"
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7].map(v => <option key={v} value={v}>TYPE {v}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase">
                                        <select value={customSeed.mood} onChange={e => setCustomSeed({ ...customSeed, mood: e.target.value })} className="border-2 border-black rounded-lg px-2 py-1.5 bg-gray-50 outline-none">
                                            {['classic', 'zen', 'struggle', 'pain', 'nuclear', 'happy', 'party', 'spray', 'spicy', 'ghost'].map(v => <option key={v} value={v}>VIBE: {v.toUpperCase()}</option>)}
                                        </select>
                                        <select value={customSeed.speed} onChange={e => setCustomSeed({ ...customSeed, speed: e.target.value })} className="border-2 border-black rounded-lg px-2 py-1.5 bg-gray-50 outline-none">
                                            {['sonic', 'normal', 'fast', 'slow'].map(v => <option key={v} value={v}>SPD: {v.toUpperCase()}</option>)}
                                        </select>
                                        <select value={customSeed.amount} onChange={e => setCustomSeed({ ...customSeed, amount: e.target.value })} className="border-2 border-black rounded-lg px-2 py-1.5 bg-gray-50 outline-none">
                                            {['low', 'medium', 'high'].map(v => <option key={v} value={v}>QTY: {v.toUpperCase()}</option>)}
                                        </select>
                                        <select value={customSeed.color} onChange={e => setCustomSeed({ ...customSeed, color: e.target.value })} className="border-2 border-black rounded-lg px-2 py-1.5 bg-gray-50 outline-none">
                                            {['brown', 'green', 'yellow', 'black', 'red', 'pale', 'golden'].map(v => <option key={v} value={v}>CLR: {v.toUpperCase()}</option>)}
                                        </select>
                                    </div>

                                    <button
                                        onClick={async (e) => {
                                            const btn = e.currentTarget;
                                            btn.disabled = true;
                                            try {
                                                await testService.createCustomLog(userId, customSeed);
                                                await onRefreshProfile();
                                                window.dispatchEvent(new CustomEvent('force-refresh-achievements'));
                                                showToast(t.devConsole.commitDone);
                                            } catch (err: any) { alert(`ERROR: ${err.message}`); }
                                            finally { btn.disabled = false; }
                                        }}
                                        className="w-full bg-dopa-lime/20 border-4 border-black py-3 rounded-2xl font-black shadow-neo-sm active:shadow-none active:translate-y-1 transition-all uppercase tracking-widest text-sm"
                                    >
                                        {t.devConsole.commitRecord}
                                    </button>
                                </div>
                            </section>
                        </div>

                        <button
                            onClick={() => setShowGodMode(false)}
                            className="w-full bg-black text-white py-5 font-black text-lg uppercase active:bg-gray-900 transition-colors"
                        >
                            {t.devConsole.exit}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;