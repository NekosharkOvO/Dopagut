import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Tab } from '../types';
import { MOCK_FRIENDS } from '../data';
import { Profile, profileService, achievementService } from '../lib/api';
import { useAuth } from '../contexts/auth-context';
import { TITLE_MILESTONES } from '../data/titles';

interface MapProps {
    onNavigate: (tab: Tab) => void;
    profile: Profile | null;
    userId: string;
    t: any;
    isActive?: boolean;
}

/**
 * 计算用户等级
 */
const calcUserLevel = (totalDrops: number): number => {
    return Math.max(1, Math.floor(totalDrops / 5) + 1);
};

/**
 * 根据成就数量获取称号
 */
const getTitleByAchievementCount = (count: number, lang: 'zh' | 'en' = 'zh') => {
    let currentToken = TITLE_MILESTONES[0];
    for (let i = 0; i < TITLE_MILESTONES.length; i++) {
        if (count >= TITLE_MILESTONES[i].required) {
            currentToken = TITLE_MILESTONES[i];
        } else {
            break;
        }
    }
    return lang === 'en' ? currentToken.en : currentToken.zh;
};

/**
 * 心情键 -> emoji + 本地化文字
 * NOTE: mood 存储的是 Tracker 里 getStatusTypes 定义的 status.id
 * 包括 classic/spicy/ghost/pebble/spray/struggle/zen/nuclear
 */
const MOOD_MAP: Record<string, { emoji: string; zh: string; en: string }> = {
    classic: { emoji: '💩', zh: '日常模式', en: 'Classic' },
    spicy: { emoji: '🔥', zh: '火辣出击', en: 'Spicy' },
    ghost: { emoji: '👻', zh: '幽灵现身', en: 'Ghost' },
    pebble: { emoji: '🪨', zh: '顽石时刻', en: 'Pebble' },
    spray: { emoji: '🌊', zh: '浪潮来袭', en: 'Spray' },
    struggle: { emoji: '😫', zh: '艰难奋战', en: 'Struggle' },
    zen: { emoji: '🧘', zh: '禅意心流', en: 'Zen' },
    nuclear: { emoji: '☢️', zh: '核弹级别', en: 'Nuclear' },
};
const moodDisplay = (mood: string | undefined, lang: 'zh' | 'en' = 'zh'): string => {
    if (!mood) return '';
    const m = MOOD_MAP[mood.toLowerCase()];
    if (!m) return mood;
    return `${m.emoji} ${lang === 'en' ? m.en : m.zh}`;
};


/**
 * 平面投影辅佐函数（基于简化 Mercator）
 * 用户更希望看到与平面地图一致的方位（北上南下东右西左）
 */
const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// 内部渲染所用的通用用户接口
interface MapUser {
    id: string;
    name: string;
    avatar: string | null;
    title: string;
    level: number;
    score: number;
    isCurrentUser: boolean;
    x: number;
    y: number;
    location: string;
    statusIcon: string;
    statusLabel: string;
    quote?: string;
    lastPoopTime?: string;
    durationStr?: string;
    lastMood?: string;
}

const Map: React.FC<MapProps> = ({ onNavigate, profile, userId, t, isActive }) => {
    const { refreshProfile } = useAuth();

    // NOTE: Map 组件没有单独的 lang prop，通过 t 内容反推当前语言
    const lang: 'zh' | 'en' = t?.map?.times === '次' ? 'zh' : 'en';

    // 状态
    const [sheetHeight, setSheetHeight] = useState(35);
    const [isSheetDragging, setIsSheetDragging] = useState(false);
    const sheetDragStartY = useRef(0);
    const sheetDragStartHeight = useRef(0);

    // NOTE: 视觉居中偏移（导航栏+排行榜占底部空间，所以地图中心需要上移）
    const SELECTED_OFFSET_Y = -150;
    const DEFAULT_OFFSET_Y = SELECTED_OFFSET_Y; // 对齐用户习惯：复位即是居中选中态位移


    const [view, setView] = useState({ x: 0, y: DEFAULT_OFFSET_Y });
    const [zoom, setZoom] = useState(1);
    const [isMapDragging, setIsMapDragging] = useState(false);
    const mapDragStart = useRef({ x: 0, y: 0 });
    const mapStartView = useRef({ x: 0, y: 0 });
    const hasDragged = useRef(false);
    const initialPinchDist = useRef<number | null>(null);
    const initialZoom = useRef<number>(1);

    const [selectedUser, setSelectedUser] = useState<number | string | null>(null);
    const [activeBubbleId, setActiveBubbleId] = useState<string | null>(null);

    // 真实数据
    const [mates, setMates] = useState<Profile[]>([]);
    const [myAchievements, setMyAchievements] = useState<any[]>([]);
    const [loadingMates, setLoadingMates] = useState(false);
    const [refreshingMates, setRefreshingMates] = useState(false); // 后台刷新指示器

    const hasGroup = !!(profile?.group_tags && profile.group_tags.length > 0);

    // 邀请码输入
    const [showInviteBanner, setShowInviteBanner] = useState(!hasGroup);
    const [activeInviteForm, setActiveInviteForm] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'error'>('idle');

    // NOTE: 用 ref 追踪上一次 isActive 值，确保每次 false→true 都强制刷新
    // 不依赖 React deps 比较——避免 React 18 批量渲染合并导致 isActive 变化被吞掉
    const prevIsActiveRef = useRef<boolean>(false);

    useEffect(() => {
        const justActivated = isActive && !prevIsActiveRef.current;
        prevIsActiveRef.current = isActive;

        if (!isActive) return;
        // 有旧数据且非首次激活时跳过（避免每次 hasGroup/userId 变化重复请求）
        // 但只要 justActivated===true（tab 切回来）就一定重新请求
        if (!justActivated && mates.length > 0) return;

        if (hasGroup) {
            setShowInviteBanner(false);
            if (mates.length === 0) setLoadingMates(true);
            else setRefreshingMates(true);

            profileService.getGroupMates()
                .then(data => { setMates(data); })
                .catch(e => { console.error('getGroupMates failed:', e); })
                .finally(() => { setLoadingMates(false); setRefreshingMates(false); });

            achievementService.getUserAchievements(userId)
                .then(setMyAchievements)
                .catch(e => console.error('getUserAchievements failed:', e));
        } else {
            setLoadingMates(false);
            setShowInviteBanner(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, hasGroup, userId]);

    // 用户地图坐标计算
    const mapUsers = useMemo(() => {
        const users: MapUser[] = [];
        const myLat = profile?.geo_lat || null;
        const myLng = profile?.geo_lng || null;

        // 1. 本人 (永远在坐标 0,0)
        const myUnlockedCount = myAchievements.filter(a => a.unlocked_at).length;
        users.push({
            id: userId,
            name: profile?.name || '???',
            avatar: profile?.avatar_url || null,
            title: getTitleByAchievementCount(myUnlockedCount, lang),
            level: calcUserLevel(profile?.total_drops || 0),
            score: profile?.total_drops || 0,
            isCurrentUser: true,
            x: 0,
            y: 0,
            location: profile?.location || t.profile?.unknownLocation || '未知',
            statusIcon: '👑',
            statusLabel: t.map?.me || '你',
            lastPoopTime: t.map?.justNow || '刚刚',
            durationStr: t.map?.currentRecord || '当前记录',
        });

        // 2. 根据状态附加好友或 MOCK 数据
        if (hasGroup) {
            // 第一次遍历：计算所有有坐标用户的平面投影向量和距离
            interface MateGeo {
                idx: number;
                dx: number; // 经度差 * cos(纬度) → 屏幕 X（东为正）
                dy: number; // 纬度差 → 屏幕 Y（北为负，屏幕向上）
                dist: number;
            }
            const geoMates: MateGeo[] = [];

            mates.forEach((m, i) => {
                if (myLat != null && myLng != null && m.geo_lat != null && m.geo_lng != null) {
                    // NOTE: 简化 Mercator 投影：经度差平移经 cos(平均纬度) 校正，纬度直接映射
                    const avgLatRad = ((myLat + m.geo_lat) / 2) * Math.PI / 180;
                    const dx = (m.geo_lng - myLng) * Math.cos(avgLatRad); // 东为正
                    const dy = -(m.geo_lat - myLat); // 北为负（屏幕向上）
                    const dist = haversine(myLat, myLng, m.geo_lat, m.geo_lng);
                    geoMates.push({ idx: i, dx, dy, dist });
                }
            });

            // 动态距离压缩：根据同组最远/最近区间自适应
            // NOTE: 缩小最大距离以让用户在缩到最小时不至于太空旷
            const MIN_SCREEN_DIST = 100;
            const MAX_SCREEN_DIST = 280;
            let maxDist = 0;
            let minDist = Infinity;
            geoMates.forEach(g => {
                if (g.dist > maxDist) maxDist = g.dist;
                if (g.dist < minDist) minDist = g.dist;
            });
            if (maxDist === 0) maxDist = 1;
            const distRange = maxDist - (geoMates.length > 1 ? minDist : 0);

            mates.forEach((m, i) => {
                let x = 0, y = 0;
                const geoInfo = geoMates.find(g => g.idx === i);

                if (geoInfo) {
                    // 平面投影：经纬度差的方向保持，距离动态压缩
                    const angle = Math.atan2(geoInfo.dx, -geoInfo.dy); // 屏幕角度
                    let screenDist: number;
                    if (geoMates.length <= 1 || distRange < 1) {
                        screenDist = (MIN_SCREEN_DIST + MAX_SCREEN_DIST) / 2;
                    } else {
                        const normalized = (geoInfo.dist - minDist) / distRange;
                        screenDist = MIN_SCREEN_DIST + normalized * (MAX_SCREEN_DIST - MIN_SCREEN_DIST);
                    }
                    x = Math.sin(angle) * screenDist;
                    y = -Math.cos(angle) * screenDist;
                } else {
                    // 随机环形分布（处理无定位权限的用户）
                    const angle = (i * 137.5) * (Math.PI / 180);
                    const dist = 250 + (i % 3) * 60;
                    x = Math.sin(angle) * dist;
                    y = -Math.cos(angle) * dist;
                }

                const lastTimeStr = m.last_poop_at ? new Date(m.last_poop_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
                const durStr = m.last_duration_seconds ? `${Math.floor(m.last_duration_seconds / 60)}m ${m.last_duration_seconds % 60}s` : undefined;
                const achievementCount = Number(m.achievement_count || 0);

                users.push({
                    id: m.id,
                    name: m.name,
                    avatar: m.avatar_url,
                    title: getTitleByAchievementCount(achievementCount, lang),
                    level: calcUserLevel(m.total_drops || 0),
                    score: m.total_drops || 0,
                    isCurrentUser: false,
                    x,
                    y,
                    location: m.location || '未知',
                    statusIcon: '🌟',
                    statusLabel: getTitleByAchievementCount(achievementCount, lang),
                    lastPoopTime: lastTimeStr,
                    durationStr: durStr,
                    lastMood: m.last_mood || undefined
                });
            });
        } else {
            // MOCK
            MOCK_FRIENDS.forEach(m => {
                users.push({
                    id: m.id.toString(),
                    name: m.name,
                    avatar: m.avatar,
                    title: '新手',
                    level: 5,
                    score: m.score,
                    isCurrentUser: false,
                    x: m.x || 0,
                    y: m.y || 0,
                    location: m.location,
                    statusIcon: m.status.icon,
                    statusLabel: m.status.label,
                    quote: m.quote,
                    lastPoopTime: m.lastPoopTime,
                    durationStr: m.durationStr
                });
            });
        }

        return users.sort((a, b) => b.score - a.score);
    }, [profile, mates, hasGroup, userId, t]);

    // 随机气泡特效
    // NOTE: 增加 visibility 感知，tab 隐藏时跳过，避免回调堆积
    useEffect(() => {
        if (mapUsers.length <= 1) return;
        const triggerRandomBubble = () => {
            if (document.visibilityState !== 'visible') return;
            const others = mapUsers.filter(u => u.id !== selectedUser && !u.isCurrentUser);
            if (others.length > 0) {
                const randomUser = others[Math.floor(Math.random() * others.length)];
                setActiveBubbleId(randomUser.id);
                setTimeout(() => {
                    setActiveBubbleId(current => current === randomUser.id ? null : current);
                }, 4000);
            }
        };
        const interval = setInterval(triggerRandomBubble, 6000);
        return () => clearInterval(interval);
    }, [selectedUser, mapUsers]);

    // 拖拽 Bottom Sheet
    const handleSheetDragStart = (clientY: number) => {
        setIsSheetDragging(true);
        sheetDragStartY.current = clientY;
        sheetDragStartHeight.current = sheetHeight;
    };

    useEffect(() => {
        const handleMove = (clientY: number) => {
            if (!isSheetDragging) return;
            const screenHeight = window.innerHeight;
            const deltaY = sheetDragStartY.current - clientY;
            const deltaPercent = (deltaY / screenHeight) * 100;
            let newHeight = sheetDragStartHeight.current + deltaPercent;
            newHeight = Math.max(25, Math.min(newHeight, 85));
            setSheetHeight(newHeight);
        };
        const handleEnd = () => {
            if (!isSheetDragging) return;
            setIsSheetDragging(false);
            if (sheetHeight > 50) setSheetHeight(85);
            else setSheetHeight(35);
        };
        const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientY);
        const onMouseMove = (e: MouseEvent) => handleMove(e.clientY);

        if (isSheetDragging) {
            window.addEventListener('touchmove', onTouchMove);
            window.addEventListener('touchend', handleEnd);
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', handleEnd);
        }
        return () => {
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', handleEnd);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', handleEnd);
        };
    }, [isSheetDragging, sheetHeight]);

    // 地图拖拽与缩放
    const handleMapDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.interactive')) return;

        if ('touches' in e && e.touches.length === 2) {
            initialPinchDist.current = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialZoom.current = zoom;
            return;
        }

        setIsMapDragging(true);
        hasDragged.current = false;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        mapDragStart.current = { x: clientX, y: clientY };
        mapStartView.current = { ...view };
    };

    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if ('touches' in e && e.touches.length === 2) {
                if (initialPinchDist.current !== null) {
                    const dist = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                    );
                    const ratio = dist / initialPinchDist.current;
                    setZoom(Math.max(0.5, Math.min(1, initialZoom.current * ratio)));
                }
                return;
            }

            if (!isMapDragging) return;
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
            const dx = (clientX - mapDragStart.current.x) / zoom;
            const dy = (clientY - mapDragStart.current.y) / zoom;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasDragged.current = true;
            const LIMIT = 520;
            setView({
                x: Math.max(-LIMIT, Math.min(LIMIT, mapStartView.current.x + dx)),
                y: Math.max(-LIMIT, Math.min(LIMIT, mapStartView.current.y + dy))
            });
        };
        const handleEnd = () => setIsMapDragging(false);
        if (isMapDragging) {
            window.addEventListener('touchmove', handleMove, { passive: false });
            window.addEventListener('touchend', handleEnd);
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
        }
        return () => {
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
        };
    }, [isMapDragging, zoom]);

    // 屏外方位指示器逻辑
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [indicators, setIndicators] = useState<{ id: string, x: number, y: number, angle: number, avatar: string | null, isMe: boolean }[]>([]);

    useEffect(() => {
        const updateIndicators = () => {
            if (!mapContainerRef.current) return;
            const rect = mapContainerRef.current.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // 安全区，避开顶部 Header 和底部排行榜以及导航栏 (约 80px 高度)
            const safeTop = 80;
            const safeBottom = rect.height - (rect.height * (sheetHeight / 100)) - 60;
            const safeLeft = 25;
            const safeRight = rect.width - 25;

            const safeWidth = safeRight - safeLeft;
            const safeHeight = safeBottom - safeTop;
            const safeCenterX = safeLeft + safeWidth / 2;
            const safeCenterY = safeTop + safeHeight / 2;

            const newIndicators: any[] = [];
            mapUsers.forEach(u => {
                const screenX = centerX + (view.x + u.x) * zoom;
                const screenY = centerY + (view.y + u.y) * zoom;

                // 判断是否超出安全视口
                if (screenX < safeLeft || screenX > safeRight || screenY < safeTop || screenY > safeBottom) {
                    const dx = screenX - safeCenterX;
                    const dy = screenY - safeCenterY;
                    const angle = Math.atan2(dy, dx);

                    // AABB 射线相交，求出投影在视口边缘的位置
                    const halfW = safeWidth / 2;
                    const halfH = safeHeight / 2;

                    // NOTE: 保护 dx===0 时的除零错误，避免 CSS top: Infinity
                    let absX = halfW;
                    let absY = dx !== 0 ? Math.abs(dy / dx) * halfW : halfH;
                    if (absY > halfH) {
                        absY = halfH;
                        absX = dy !== 0 ? Math.abs(dx / dy) * halfH : halfW;
                    }

                    const indX = safeCenterX + Math.sign(dx) * absX;
                    const indY = safeCenterY + Math.sign(dy) * absY;

                    newIndicators.push({
                        id: u.id, x: indX, y: indY,
                        angle: angle * 180 / Math.PI,
                        avatar: u.avatar, isMe: u.isCurrentUser
                    });
                }
            });
            setIndicators(newIndicators);
        };
        updateIndicators();
    }, [view, mapUsers, zoom, sheetHeight]);

    // 操作绑定
    const handleResetView = () => {
        // 复位到与点击自己头像相同的位置（视觉居中）
        setView({ x: 0, y: DEFAULT_OFFSET_Y });
        setZoom(1);
        setSelectedUser(null);
    };

    const handleUserClick = (u: MapUser) => {
        setSelectedUser(u.id);
        // NOTE: 点击头像时同时需要悄晏还原到最大缩放比 (1.0)，并能看到完整弹窗
        setZoom(1);
        setView({ x: -u.x, y: -u.y + SELECTED_OFFSET_Y });
    };

    const handleSubmitInvite = async () => {
        if (!inviteCode.trim()) return;
        setInviteStatus('loading');
        try {
            await profileService.joinGroup(inviteCode.trim());
            await refreshProfile();
            setActiveInviteForm(false);
            setShowInviteBanner(false);
            setInviteStatus('idle');
        } catch (e) {
            console.error(e);
            setInviteStatus('error');
        }
    };

    return (
        <div ref={mapContainerRef} className="flex-1 w-full h-full relative overflow-hidden flex flex-col select-none" style={{ backgroundColor: '#1a2744' }}>
            {/* 深蓝背景大号马桶装饰（固定，不随地图移动） */}
            {[
                { x: '8%', y: '6%', size: 72, rot: -15, op: 0.12 },
                { x: '80%', y: '4%', size: 64, rot: 10, op: 0.10 },
                { x: '3%', y: '42%', size: 80, rot: -8, op: 0.11 },
                { x: '85%', y: '38%', size: 68, rot: 18, op: 0.10 },
                { x: '15%', y: '78%', size: 76, rot: -20, op: 0.12 },
                { x: '75%', y: '80%', size: 60, rot: 12, op: 0.09 },
                { x: '45%', y: '2%', size: 56, rot: 5, op: 0.09 },
                { x: '50%', y: '88%', size: 70, rot: -10, op: 0.11 },
                { x: '92%', y: '62%', size: 58, rot: 22, op: 0.09 },
                { x: '2%', y: '18%', size: 52, rot: -5, op: 0.08 },
            ].map((d, i) => (
                <div key={i} className="absolute pointer-events-none select-none z-0"
                    style={{ left: d.x, top: d.y, fontSize: d.size, opacity: d.op, transform: `rotate(${d.rot}deg)`, lineHeight: 1 }}>
                    🚽
                </div>
            ))}
            {/* Map Container */}
            <div
                className={`absolute inset-0 w-full h-full cursor-grab ${isMapDragging ? 'cursor-grabbing' : ''}`}
                onMouseDown={handleMapDragStart}
                onTouchStart={handleMapDragStart}
                onClick={() => { if (!hasDragged.current) setSelectedUser(null); }}
                onWheel={(e) => {
                    if ((e.target as HTMLElement).closest('.hide-scrollbar')) return;
                    // NOTE: 缩小范围 0.5~1.0，避免缩到极小时所有人堆叠在一起
                    setZoom(z => Math.max(0.5, Math.min(1, z - e.deltaY * 0.001)));
                }}
            >
                <div
                    className={`absolute inset-0 will-change-transform ${isMapDragging ? 'duration-0' : 'transition-transform duration-500 cubic-bezier(0.25, 1, 0.5, 1)'}`}
                    style={{
                        transform: `translate(50%, 50%) scale(${zoom}) translate(${view.x}px, ${view.y}px)`,
                        transformOrigin: '0 0'
                    }}
                >
                    {/* 底色 + 网格：以地图坐标原点 (0,0) 为中心对称展开 ±600px */}
                    <div className="absolute pointer-events-none"
                        style={{
                            left: '-600px', top: '-600px',
                            width: '1200px', height: '1200px',
                            backgroundColor: '#BDE0FE',
                            borderRadius: '48px',
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.22) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(255,255,255,0.22) 1.5px, transparent 1.5px)',
                            backgroundSize: '60px 60px'
                        }}></div>

                    {/* SVG 准星 + 方位箭头 + 虚线路径 */}
                    <svg className="absolute pointer-events-none opacity-30 z-0"
                        style={{ inset: '-550px', width: '1100px', height: '1100px' }}
                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 1100">

                        {/* 十字主线 */}
                        <line x1="0" y1="550" x2="1100" y2="550" stroke="white" strokeWidth="28" strokeLinecap="round" />
                        <line x1="550" y1="0" x2="550" y2="1100" stroke="white" strokeWidth="28" strokeLinecap="round" />

                        {/* 外大圆 */}
                        <circle cx="550" cy="550" r="320" stroke="white" strokeWidth="20" fill="none" />
                        {/* 内虚线中圆 */}
                        <circle cx="550" cy="550" r="160" stroke="white" strokeWidth="11" fill="none" strokeDasharray="22 14" />
                        {/* 最内小圆点 */}
                        <circle cx="550" cy="550" r="20" fill="white" opacity="0.95" />

                        {/* 方位小点 */}
                        <circle cx="550" cy="230" r="9" fill="white" opacity="0.6" />
                        <circle cx="550" cy="870" r="9" fill="white" opacity="0.6" />
                        <circle cx="230" cy="550" r="9" fill="white" opacity="0.6" />
                        <circle cx="870" cy="550" r="9" fill="white" opacity="0.6" />

                        {/* 四方向箭头（三角形）——位于圆弧外侧 */}
                        {/* 上箭头 */}
                        <polygon points="550,155 535,185 565,185" fill="white" opacity="0.55" />
                        {/* 下箭头 */}
                        <polygon points="550,945 535,915 565,915" fill="white" opacity="0.55" />
                        {/* 左箭头 */}
                        <polygon points="155,550 185,535 185,565" fill="white" opacity="0.55" />
                        {/* 右箭头 */}
                        <polygon points="945,550 915,535 915,565" fill="white" opacity="0.55" />

                        {/* 对角辐射虚线 */}
                        <line x1="320" y1="320" x2="780" y2="780" stroke="white" strokeWidth="5" strokeDasharray="14 10" opacity="0.35" />
                        <line x1="780" y1="320" x2="320" y2="780" stroke="white" strokeWidth="5" strokeDasharray="14 10" opacity="0.35" />

                        {/* 外圈刻度线（12 个方向） */}
                        {Array.from({ length: 12 }).map((_, i) => {
                            const angle = (i * 30) * Math.PI / 180;
                            const r1 = 340, r2 = 365;
                            const x1 = 550 + Math.cos(angle) * r1;
                            const y1 = 550 + Math.sin(angle) * r1;
                            const x2 = 550 + Math.cos(angle) * r2;
                            const y2 = 550 + Math.sin(angle) * r2;
                            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="4" opacity="0.45" />;
                        })}

                        {/* 外侧弧形虚线路径（仅左上和右下象限，增加层次感） */}
                        <path d="M 230 230 Q 550 100 870 230" stroke="white" strokeWidth="5" fill="none" strokeDasharray="18 12" opacity="0.25" />
                        <path d="M 230 870 Q 550 1000 870 870" stroke="white" strokeWidth="5" fill="none" strokeDasharray="18 12" opacity="0.25" />
                    </svg>

                    {/* 大号 emoji 装饰（远离中心，随地图移动） */}
                    {[
                        { e: '💩', x: -520, y: -480, size: 96, opacity: 0.18, rot: -12 },
                        { e: '💩', x: 430, y: 390, size: 80, opacity: 0.15, rot: 15 },
                        { e: '🏆', x: 460, y: -450, size: 90, opacity: 0.20, rot: 8 },
                        { e: '🏆', x: -450, y: 380, size: 76, opacity: 0.16, rot: -6 },
                        { e: '⭐', x: 20, y: -500, size: 84, opacity: 0.22, rot: 20 },
                        { e: '⭐', x: -490, y: 20, size: 70, opacity: 0.18, rot: -18 },
                        { e: '🔥', x: 480, y: 40, size: 88, opacity: 0.20, rot: 10 },
                        { e: '🔥', x: -40, y: 470, size: 74, opacity: 0.17, rot: -8 },
                        { e: '💎', x: -510, y: -200, size: 80, opacity: 0.18, rot: 14 },
                        { e: '💎', x: 490, y: 170, size: 68, opacity: 0.15, rot: -12 },
                        { e: '🌀', x: 190, y: -500, size: 82, opacity: 0.16, rot: 0 },
                        { e: '🌀', x: -200, y: 480, size: 72, opacity: 0.14, rot: 5 },
                    ].map((d, i) => (
                        <div key={i}
                            className="absolute pointer-events-none select-none z-0"
                            style={{
                                left: d.x, top: d.y,
                                fontSize: d.size,
                                opacity: d.opacity,
                                transform: `rotate(${d.rot}deg)`,
                                lineHeight: 1,
                                filter: 'blur(0.3px)'
                            }}>
                            {d.e}
                        </div>
                    ))}


                    {/* Nodes Render */}
                    {mapUsers.map(u => {
                        const isSelected = selectedUser === u.id;
                        const showQuote = activeBubbleId === u.id && !isSelected;

                        return (
                            <div
                                key={u.id}
                                className={`absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isSelected ? 'z-50 scale-110' : (u.isCurrentUser ? 'z-30' : 'z-10')}`}
                                style={{ left: u.x, top: u.y }}
                            >
                                <div className="relative interactive cursor-pointer group" onClick={(e) => { e.stopPropagation(); handleUserClick(u); }}>

                                    {/* Quote Bubble */}
                                    {u.quote && (
                                        <div className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white border-4 border-black px-4 py-2 rounded-2xl shadow-neo z-50 transition-all duration-500 origin-bottom ${showQuote ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-4 pointer-events-none'}`}>
                                            <span className="font-black text-sm">{u.quote}</span>
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-4 border-r-4 border-black transform rotate-45"></div>
                                        </div>
                                    )}

                                    {/* Detail Card Overlay */}
                                    <div className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 w-52 bg-white border-4 border-black rounded-xl shadow-neo p-3 z-50 transition-all duration-300 origin-top cursor-auto ${isSelected ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 -translate-y-4 pointer-events-none'}`} onClick={e => e.stopPropagation()}>
                                        <button onClick={() => setSelectedUser(null)} className="absolute -top-3 -right-3 w-6 h-6 bg-black rounded-full text-white flex items-center justify-center border-2 border-white shadow-sm hover:scale-110 transition-transform">
                                            <span className="material-icons-round text-xs">close</span>
                                        </button>
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-4 border-l-4 border-black transform rotate-45"></div>
                                        {/* 称号 + 等级 */}
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-gray-100">
                                            <span className="text-xl">{u.statusIcon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-black text-dopa-purple leading-none mb-0.5 truncate">{u.title}</div>
                                                <div className="text-[10px] font-bold text-gray-400 leading-none">Lv.{u.level}</div>
                                            </div>
                                        </div>
                                        {/* 详细信息 */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                                <span className="material-icons-round text-sm text-dopa-blue">place</span>
                                                <span className="truncate">{u.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                                <span className="text-sm">💩</span>
                                                <div className="flex items-center gap-1">
                                                    <span>{lang === 'zh' ? `累计 ${u.score} 次` : `${u.score} ${t.map?.times || 'times'}`}</span>
                                                    {u.lastMood && (
                                                        <span className="bg-dopa-yellow/40 border border-dopa-yellow rounded text-[10px] px-1.5 py-0.5 ml-1 font-black">
                                                            {moodDisplay(u.lastMood, lang)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {u.lastPoopTime && (
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                                    <span className="material-icons-round text-sm text-dopa-pink">history</span>
                                                    <span>{u.lastPoopTime} {u.durationStr && `(${u.durationStr})`}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Avatar */}
                                    {isSelected && <div className={`absolute -inset-4 border-4 border-dashed rounded-full animate-[spin_4s_linear_infinite] opacity-80 pointer-events-none ${u.isCurrentUser ? 'border-dopa-orange' : 'border-dopa-lime'}`}></div>}

                                    <div className={`w-16 h-16 rounded-full border-4 relative shadow-neo transition-transform overflow-hidden ${u.isCurrentUser ? 'border-dopa-orange' : 'border-black group-hover:scale-110'} ${isSelected ? 'ring-4 ring-white' : ''}`}>
                                        {u.avatar ? (
                                            <img src={u.avatar} className="w-full h-full object-cover bg-white" alt={u.name} />
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center text-3xl ${u.isCurrentUser ? 'bg-dopa-cyan' : 'bg-white'}`}>{u.isCurrentUser ? '💩' : u.statusIcon}</div>
                                        )}
                                    </div>

                                    {u.isCurrentUser && (
                                        <div className="absolute -top-3 -right-3 bg-dopa-yellow text-black px-2 py-0.5 rounded-full text-[10px] font-black border-2 border-black shadow-sm rotate-12 whitespace-nowrap">
                                            我
                                        </div>
                                    )}
                                </div>

                                {/* Name Tag */}
                                <div className={`mt-2 text-[10px] font-black px-2 py-1 rounded-md border-2 border-black shadow-neo-sm whitespace-nowrap transition-colors ${isSelected ? 'bg-dopa-lime text-black' : 'bg-white/80 backdrop-blur-sm text-black'}`}>
                                    {u.name}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Off-screen Indicators */}
            {indicators.map(ind => (
                <div key={ind.id} style={{ left: ind.x, top: ind.y, position: 'absolute', transform: 'translate(-50%, -50%)', zIndex: 60 }} className="pointer-events-auto group cursor-pointer" onClick={(e) => { e.stopPropagation(); handleUserClick(mapUsers.find(u => u.id === ind.id)!); }}>
                    <div className={`w-10 h-10 rounded-full border-4 overflow-hidden relative shadow-md hover:scale-110 transition-transform ${ind.isMe ? 'border-dopa-orange bg-dopa-yellow' : 'border-dopa-blue bg-white'}`}>
                        {ind.avatar ? <img src={ind.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm">👤</div>}
                    </div>
                    {/* Arrow Pointer */}
                    <div className="absolute top-1/2 left-1/2 w-full h-full -z-10 pointer-events-none" style={{ transform: `translate(-50%, -50%) rotate(${ind.angle}deg)` }}>
                        <div className={`absolute top-1/2 -right-3 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent transform -translate-y-1/2 ${ind.isMe ? 'border-l-[10px] border-l-dopa-orange' : 'border-l-[10px] border-l-dopa-blue'}`}></div>
                    </div>
                </div>
            ))}

            {/* Banner: Invite Code Prompt */}
            {showInviteBanner && (
                <div className="absolute top-[80px] left-4 right-4 z-[70] animate-in slide-in-from-top duration-500">
                    {activeInviteForm ? (
                        <div className="bg-white rounded-2xl border-4 border-black shadow-neo p-4">
                            <h3 className="font-black text-lg mb-2 text-dopa-purple flex items-center gap-2">🎟️ 启用朋友圈</h3>
                            <p className="text-xs font-bold text-gray-600 mb-3">填写你所在专属圈子的邀请码，即可随时可见你们的战斗记录！</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inviteCode}
                                    onChange={e => setInviteCode(e.target.value)}
                                    placeholder="输入邀请码..."
                                    className="flex-1 border-2 border-black rounded-lg px-3 py-2 font-bold focus:bg-dopa-yellow/20 outline-none uppercase"
                                />
                                <button onClick={handleSubmitInvite} disabled={inviteStatus === 'loading'} className="bg-dopa-lime border-2 border-black font-black px-4 py-2 text-sm rounded-lg shadow-neo-sm active:translate-y-0.5 active:shadow-none disabled:opacity-50">
                                    确定
                                </button>
                            </div>
                            {inviteStatus === 'error' && <p className="text-xs text-red-500 font-bold mt-2">邀请码无效或已停用，请重试</p>}
                        </div>
                    ) : (
                        <div className="bg-dopa-yellow border-4 border-black rounded-xl p-3 shadow-neo cursor-pointer hover:-translate-y-1 transition-transform active:translate-y-0" onClick={() => setActiveInviteForm(true)}>
                            <div className="flex items-center justify-between text-black">
                                <span className="font-black text-sm drop-shadow-sm flex items-center gap-2">🔒 开启真实社交体验</span>
                                <span className="text-xs font-bold bg-white border-2 border-black px-2 py-0.5 rounded-md">输入邀请码 🚀</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-[60] pt-6 px-6 pointer-events-none">
                <div className="pointer-events-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-dopa-cyan border-4 border-black shadow-neo flex items-center justify-center transform -rotate-3">
                            <span className="material-icons-round text-black text-2xl">explore</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-black uppercase italic leading-none drop-shadow-[2px_2px_0_#fff]">
                                {t.map?.title || '疆场'}
                            </h1>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 transform rotate-2 inline-block border border-white">
                                    领主地盘
                                </span>
                            </div>
                        </div>
                    </div>
                    <div
                        className="h-12 w-12 rounded-full border-4 border-black bg-dopa-yellow overflow-hidden shadow-neo cursor-pointer active:scale-95 transition-transform"
                        onClick={() => onNavigate(Tab.Profile)}
                    >
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover bg-white" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-2xl bg-dopa-cyan">💩</div>
                        )}
                    </div>
                </div>
            </header>

            {/* 后台刷新 Toast: 有老数据时展示动态小点，提示正在后台更新 */}
            <div className={`absolute top-[90px] left-1/2 -translate-x-1/2 z-[65] transition-all duration-300 ${refreshingMates ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                <div className="bg-black/70 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                    <span className="animate-pulse">●</span>
                    <span>散步中……</span>
                </div>
            </div>

            {/* Reset Location */}
            <div className="absolute right-4 z-25" style={{ bottom: '40%' }}>
                <button onClick={handleResetView} className="w-12 h-12 bg-white rounded-full border-4 border-black shadow-neo flex items-center justify-center active:scale-95 transition-transform">
                    <span className="material-icons-round text-black text-xl">my_location</span>
                </button>
            </div>

            {/* Leaderboard Sheet */}
            <div
                className="absolute bottom-0 left-0 right-0 z-30 bg-white border-t-4 border-black rounded-t-[2rem] shadow-[0_-8px_0px_rgba(0,0,0,1)] flex flex-col"
                style={{
                    height: `${sheetHeight}%`,
                    transition: isSheetDragging ? 'none' : 'height 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    paddingBottom: '80px'
                }}
            >
                <div
                    className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none z-40 flex-shrink-0"
                    onMouseDown={(e) => handleSheetDragStart(e.clientY)}
                    onTouchStart={(e) => handleSheetDragStart(e.touches[0].clientY)}
                >
                    <div className="w-16 h-2 bg-black rounded-full pointer-events-none"></div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden relative">
                    <div className="px-6 flex justify-between items-end mb-2">
                        <h2 className="text-xl font-black text-black italic uppercase">{t.map?.leaderboard || (lang === 'zh' ? '排行榜' : 'Leaderboard')}</h2>
                        {loadingMates && <span className="text-xs font-bold text-gray-400 animate-pulse">{t.map?.detecting || (lang === 'zh' ? '正在侦测...' : 'Detecting...')}</span>}
                    </div>

                    <div className="hide-scrollbar overflow-y-auto p-4 space-y-4 flex-1 pb-4">
                        {mapUsers.map((user, index) => (
                            <div
                                key={user.id}
                                onClick={() => handleUserClick(user)}
                                className={`flex items-center gap-4 p-3 rounded-2xl border-4 border-black shadow-neo relative overflow-hidden transition-transform cursor-pointer ${user.isCurrentUser ? 'bg-dopa-purple/10 border-dopa-purple' : 'bg-white hover:-translate-y-1'} ${index === 0 ? 'border-dopa-yellow shadow-[4px_4px_0_0_#FDE047]' : ''}`}
                            >
                                <div className="flex-shrink-0 font-black text-2xl w-8 text-center italic drop-shadow-sm stroke-white" style={{ WebkitTextStroke: '1px white', color: index < 3 ? 'black' : '#9ca3af' }}>
                                    #{index + 1}
                                </div>
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center relative z-10 overflow-hidden bg-white">
                                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <span className="text-xl">👤</span>}
                                    </div>
                                </div>
                                <div className="flex-grow">
                                    <h3 className="font-black text-black text-base flex items-center gap-1">
                                        {user.name} {user.isCurrentUser && <span className="text-[8px] bg-dopa-yellow px-1 border border-black rounded uppercase">Me</span>}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-500">Lv.{user.level} • {user.title}</p>
                                </div>
                                <div className="text-right bg-white border-2 border-black px-2 py-1 rounded-lg shadow-[2px_2px_0px_0px_#000]">
                                    <span className="block text-xl font-black text-black">{user.score}</span>
                                    <span className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">次</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Map;