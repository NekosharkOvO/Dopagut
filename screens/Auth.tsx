
import React, { useState, useCallback } from 'react';
import LocationPicker from '../components/LocationPicker';
import { authService } from '../lib/api';
import { Country, State } from 'country-state-city';

interface AuthProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onRegister: (email: string, password: string, name: string, inviteCode?: string, location?: string, geo?: { lat: number; lng: number }) => Promise<void>;
    lang: 'zh' | 'en';
    setLang: (lang: 'zh' | 'en') => void;
    t: any;
}

export default function Auth({ onLogin, onRegister, lang, setLang, t }: AuthProps) {
    const [view, setView] = useState<'landing' | 'login' | 'register'>('landing');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 表单状态
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    // 邀请码状态
    const [inviteCode, setInviteCode] = useState('');
    const [inviteStatus, setInviteStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

    // 地理位置状态
    const [regLocation, setRegLocation] = useState('');
    const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);

    /**
     * 处理登录
     */
    const handleLogin = async () => {
        if (!email || !password) return;
        setLoading(true);
        setError(null);
        try {
            await onLogin(email, password);
        } catch (err: any) {
            setError(err?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 处理注册
     */
    const handleRegister = async () => {
        if (!email || !password || !name) return;
        // 如果填了邀请码但验证失败，阻止注册
        if (inviteCode && inviteStatus !== 'valid') {
            setError(t.auth.invalidInviteCode || '邀请码无效，请检查后重试');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await onRegister(
                email,
                password,
                name,
                inviteCode || undefined,
                regLocation || undefined,
                geoCoords || undefined
            );
        } catch (err: any) {
            setError(err?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 异步验证邀请码（防抖处理）
     * 用户输入后自动触发查询，实时给出视觉反馈
     */
    const handleInviteCodeChange = useCallback(async (code: string) => {
        setInviteCode(code);
        if (!code.trim()) {
            setInviteStatus('idle');
            return;
        }
        setInviteStatus('checking');
        try {
            const tag = await authService.validateInviteCode(code.trim());
            setInviteStatus(tag ? 'valid' : 'invalid');
        } catch {
            setInviteStatus('invalid');
        }
    }, []);

    /**
     * GPS 一键定位
     * 通过浏览器 Geolocation API 获取经纬度，再反向解析到城市级别
     */
    const handleGeoLocate = async () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });
            const { latitude, longitude } = position.coords;
            setGeoCoords({ lat: latitude, lng: longitude });

            // NOTE: 始终用英文请求反向解析，方便与 country-state-city 库匹配
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`);
                const data = await res.json();
                const countryCode = data.address?.country_code?.toUpperCase() || '';
                const stateName = data.address?.state || data.address?.province || '';

                if (countryCode) {
                    const country = Country.getCountryByCode(countryCode);
                    if (country) {
                        // 尝试在 country-state-city 库中精确匹配省/州
                        const countryStates = State.getStatesOfCountry(countryCode);
                        const matchedState = countryStates.find(s =>
                            s.name.toLowerCase() === stateName.toLowerCase() ||
                            stateName.toLowerCase().includes(s.name.toLowerCase())
                        );
                        setRegLocation(matchedState ? `${country.name}-${matchedState.name}` : country.name);
                    }
                }
            } catch {
                // 反向解析失败不影响 GPS 坐标的保存
            }
        } catch (err: any) {
            console.warn('GPS 定位失败:', err);
        } finally {
            setLocating(false);
        }
    };

    const toggleLang = () => {
        setLang(lang === 'zh' ? 'en' : 'zh');
    };

    const bgPattern = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20 L40 0 L40 40 Z' fill='%23000' fill-opacity='0.05'/%3E%3C/svg%3E")`;

    // 邀请码输入框右侧的状态图标
    const inviteStatusIcon = {
        idle: null,
        checking: <span className="animate-spin text-gray-400">⏳</span>,
        valid: <span className="text-green-500 text-xl">✅</span>,
        invalid: <span className="text-red-500 text-xl">❌</span>,
    }[inviteStatus];

    return (
        <div className="min-h-screen bg-dopa-purple flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Pattern */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: bgPattern }}></div>
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-dopa-yellow rounded-full border-4 border-black mix-blend-hard-light opacity-50 blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-dopa-cyan rounded-full border-4 border-black mix-blend-hard-light opacity-50 blur-3xl"></div>

            {/* Language Toggle */}
            <button
                onClick={toggleLang}
                className="absolute top-6 right-6 z-50 bg-white border-2 border-black rounded-lg px-3 py-1 font-black shadow-neo-sm active:translate-y-0.5 active:shadow-none transition-all uppercase text-sm hover:scale-105"
            >
                {lang === 'zh' ? 'EN' : '中文'}
            </button>

            {/* Main Card：恢复 rounded 圆角必须的 overflow-hidden，但内部 LocationPicker 改用 Portal/fixed 解决截断 */}
            <div className="w-full max-w-sm bg-white border-4 border-black rounded-[2.5rem] shadow-neo-lg overflow-hidden relative z-10 transition-all duration-300">

                {/* Header */}
                <div className="bg-dopa-yellow border-b-4 border-black p-8 text-center relative overflow-hidden">
                    <div className="absolute top-2 left-2 animate-[spin_10s_linear_infinite]">
                        <span className="material-icons-round text-4xl opacity-20">settings</span>
                    </div>
                    <div className="relative z-10">
                        <div className="w-24 h-24 mx-auto bg-dopa-white rounded-full border-4 border-black shadow-neo flex items-center justify-center mb-4 transform -rotate-3 hover:rotate-3 transition-transform">
                            <span className="text-5xl">👑</span>
                        </div>
                        <h1 className="font-display text-4xl font-black text-black tracking-tighter uppercase drop-shadow-sm">DopaGut</h1>
                        <p className="font-bold text-xs uppercase tracking-widest mt-2 bg-black text-white inline-block px-2 py-1 transform rotate-2">{t.auth.subSlogan}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-white min-h-[300px] flex flex-col justify-center">

                    {error && (
                        <div className="bg-dopa-pink/20 border-2 border-dopa-pink text-dopa-pink rounded-xl p-3 mb-4 text-sm font-bold text-center">
                            {error}
                        </div>
                    )}

                    {/* LANDING */}
                    {view === 'landing' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <p className="text-center font-bold text-gray-500 mb-4">{t.auth.slogan}</p>

                            <button
                                onClick={() => { setView('login'); setError(null); }}
                                className="w-full bg-dopa-cyan border-4 border-black text-black font-black text-lg py-4 rounded-xl shadow-neo hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2 group"
                            >
                                <span>{t.auth.loginBtn}</span>
                                <span className="material-icons-round group-hover:translate-x-1 transition-transform">login</span>
                            </button>

                            <button
                                onClick={() => { setView('register'); setError(null); }}
                                className="w-full bg-dopa-pink border-4 border-black text-white font-black text-lg py-4 rounded-xl shadow-neo hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2 group"
                            >
                                <span>{t.auth.createBtn}</span>
                                <span className="material-icons-round group-hover:rotate-12 transition-transform">add_reaction</span>
                            </button>
                        </div>
                    )}

                    {/* LOGIN */}
                    {view === 'login' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-8 duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <button onClick={() => { setView('landing'); setError(null); }} className="w-8 h-8 flex items-center justify-center border-2 border-black rounded bg-gray-100 hover:bg-gray-200"><span className="material-icons-round text-sm font-bold">arrow_back</span></button>
                                <h2 className="text-2xl font-black italic">{t.auth.welcome}</h2>
                            </div>

                            <div className="space-y-3">
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl group-focus-within:scale-110 transition-transform">📧</span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder={t.auth.emailPlaceholder}
                                        className="w-full bg-gray-50 border-4 border-black rounded-xl py-3 pl-12 pr-4 font-bold outline-none focus:bg-dopa-yellow/20 transition-colors"
                                    />
                                </div>
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl group-focus-within:scale-110 transition-transform">🔑</span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder={t.auth.passwordPlaceholder}
                                        className="w-full bg-gray-50 border-4 border-black rounded-xl py-3 pl-12 pr-4 font-bold outline-none focus:bg-dopa-yellow/20 transition-colors"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleLogin}
                                disabled={loading}
                                className="mt-4 w-full bg-dopa-lime border-4 border-black text-black font-black text-lg py-3 rounded-xl shadow-neo hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t.auth.processing : t.auth.enterBtn} 🚀
                            </button>
                        </div>
                    )}

                    {/* REGISTER */}
                    {view === 'register' && (
                        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-right-8 duration-300">
                            <div className="flex items-center gap-2 mb-1">
                                <button onClick={() => { setView('landing'); setError(null); }} className="w-8 h-8 flex items-center justify-center border-2 border-black rounded bg-gray-100 hover:bg-gray-200"><span className="material-icons-round text-sm font-bold">arrow_back</span></button>
                                <h2 className="text-2xl font-black italic">{t.auth.newComer}</h2>
                            </div>

                            <div className="space-y-3">
                                {/* 昵称 */}
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl">😎</span>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder={t.auth.namePlaceholder}
                                        className="w-full bg-gray-50 border-4 border-black rounded-xl py-3 pl-12 pr-4 font-bold outline-none focus:bg-dopa-pink/20 transition-colors"
                                    />
                                </div>
                                {/* 邮箱 */}
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl">📧</span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder={t.auth.emailPlaceholder}
                                        className="w-full bg-gray-50 border-4 border-black rounded-xl py-3 pl-12 pr-4 font-bold outline-none focus:bg-dopa-pink/20 transition-colors"
                                    />
                                </div>
                                {/* 密码 */}
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl">🔒</span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder={t.auth.passwordPlaceholder}
                                        className="w-full bg-gray-50 border-4 border-black rounded-xl py-3 pl-12 pr-4 font-bold outline-none focus:bg-dopa-pink/20 transition-colors"
                                    />
                                </div>

                                {/* 邀请码（选填） */}
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl">🎟️</span>
                                    <input
                                        type="text"
                                        value={inviteCode}
                                        onChange={e => handleInviteCodeChange(e.target.value)}
                                        placeholder={t.auth.inviteCodePlaceholder || '邀请码（选填）'}
                                        className={`w-full bg-gray-50 border-4 rounded-xl py-3 pl-12 pr-12 font-bold outline-none transition-colors ${inviteStatus === 'valid' ? 'border-green-500 bg-green-50' :
                                            inviteStatus === 'invalid' ? 'border-red-400 bg-red-50' :
                                                'border-black focus:bg-dopa-cyan/10'
                                            }`}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {inviteStatusIcon}
                                    </div>
                                </div>

                                {/* 地理位置（选填） */}
                                <div className="bg-gray-50 border-4 border-black rounded-xl p-3 space-y-2">
                                    <span className="text-sm font-black flex items-center gap-1">
                                        🌍 {t.auth.locationLabel || '所在地（选填）'}
                                    </span>
                                    <LocationPicker
                                        value={regLocation}
                                        onChange={setRegLocation}
                                        onGeoChange={(geo) => { if (geo) setGeoCoords(geo); }}
                                        t={t}
                                        compact
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleRegister}
                                disabled={loading}
                                className="mt-2 w-full bg-black border-4 border-black text-dopa-yellow font-black text-lg py-3 rounded-xl shadow-neo hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t.auth.creating : t.auth.registerBtn} ✨
                            </button>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="bg-gray-100 border-t-4 border-black p-3 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">© 2025 DOPAGUT INC.</p>
                </div>

            </div>
        </div>
    );
}
