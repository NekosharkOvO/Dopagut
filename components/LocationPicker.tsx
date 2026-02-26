import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Country, State, ICountry, IState } from 'country-state-city';

interface LocationPickerProps {
    /** 当前地理位置值（格式 "Country-Region"） */
    value: string;
    /** 选择改变回调 */
    onChange: (location: string) => void;
    /** 坐标改变回调（可选，用于自动填充 geo_lat/geo_lng） */
    onGeoChange?: (geo: { lat: number; lng: number } | null) => void;
    /** 翻译对象 */
    t: any;
    /** 是否紧凑模式（较少间距） */
    compact?: boolean;
}

/**
 * 常用国家 ISO Code 列表（置顶显示）
 * NOTE: 顺序即为置顶优先级
 */
const TOP_COUNTRY_CODES = ['CN', 'US', 'CA', 'GB', 'FR', 'JP', 'KR', 'DE', 'AU', 'SG'];

/**
 * 国家名中文翻译映射（覆盖常见国家和全球主要地区）
 * 未列入的国家将显示英文原名
 */
const COUNTRY_ZH: Record<string, string> = {
    CN: '中国', US: '美国', CA: '加拿大', GB: '英国', FR: '法国', JP: '日本',
    KR: '韩国', DE: '德国', AU: '澳大利亚', SG: '新加坡', IN: '印度', RU: '俄罗斯',
    BR: '巴西', MX: '墨西哥', IT: '意大利', ES: '西班牙', NL: '荷兰', SE: '瑞典',
    CH: '瑞士', NZ: '新西兰', TH: '泰国', VN: '越南', MY: '马来西亚', PH: '菲律宾',
    ID: '印度尼西亚', TW: '台湾', HK: '香港', MO: '澳门', AE: '阿联酋', SA: '沙特阿拉伯',
    ZA: '南非', EG: '埃及', NG: '尼日利亚', AR: '阿根廷', CL: '智利', CO: '哥伦比亚',
    PE: '秘鲁', PL: '波兰', NO: '挪威', DK: '丹麦', FI: '芬兰', PT: '葡萄牙',
    AT: '奥地利', BE: '比利时', IE: '爱尔兰', CZ: '捷克', GR: '希腊', TR: '土耳其',
    IL: '以色列', PK: '巴基斯坦', BD: '孟加拉国', LK: '斯里兰卡', MM: '缅甸',
    KH: '柬埔寨', LA: '老挝', NP: '尼泊尔', MN: '蒙古', UA: '乌克兰', RO: '罗马尼亚',
    HU: '匈牙利', HR: '克罗地亚', RS: '塞尔维亚', KZ: '哈萨克斯坦', QA: '卡塔尔',
    KW: '科威特', BH: '巴林', OM: '阿曼', JO: '约旦', LB: '黎巴嫩', IQ: '伊拉克',
    IR: '伊朗', AF: '阿富汗', KE: '肯尼亚', GH: '加纳', TZ: '坦桑尼亚',
};

/**
 * 中国省份名中文映射
 */
const STATE_ZH_CN: Record<string, string> = {
    'Beijing': '北京', 'Tianjin': '天津', 'Hebei': '河北', 'Shanxi': '山西',
    'Inner Mongolia': '内蒙古', 'Nei Mongol': '内蒙古',
    'Liaoning': '辽宁', 'Jilin': '吉林', 'Heilongjiang': '黑龙江',
    'Shanghai': '上海', 'Jiangsu': '江苏', 'Zhejiang': '浙江', 'Anhui': '安徽',
    'Fujian': '福建', 'Jiangxi': '江西', 'Shandong': '山东',
    'Henan': '河南', 'Hubei': '湖北', 'Hunan': '湖南',
    'Guangdong': '广东', 'Guangxi': '广西', 'Hainan': '海南',
    'Chongqing': '重庆', 'Sichuan': '四川', 'Guizhou': '贵州', 'Yunnan': '云南',
    'Tibet': '西藏', 'Xizang': '西藏',
    'Shaanxi': '陕西', 'Gansu': '甘肃', 'Qinghai': '青海',
    'Ningxia': '宁夏', 'Ningxia Hui': '宁夏', 'Xinjiang': '新疆',
    'Hong Kong': '香港', 'Macau': '澳门', 'Taiwan': '台湾',
};

/**
 * 日本都道府县中文映射
 */
const STATE_ZH_JP: Record<string, string> = {
    'Hokkaido': '北海道', 'Tokyo': '东京都', 'Osaka': '大阪府', 'Kyoto': '京都府',
    'Aichi': '爱知县', 'Fukuoka': '福冈县', 'Kanagawa': '神奈川县',
    'Saitama': '埼玉县', 'Chiba': '千叶县', 'Hyogo': '�的库县', 'Okinawa': '冲绳县',
};

/**
 * 获取国家的本地化显示名
 */
const getCountryLabel = (c: ICountry, isZh: boolean): string => {
    if (isZh && COUNTRY_ZH[c.isoCode]) {
        return `${c.flag} ${COUNTRY_ZH[c.isoCode]}`;
    }
    return `${c.flag} ${c.name}`;
};

/**
 * 获取省/州的本地化显示名
 */
const getStateLabel = (s: IState, countryCode: string, isZh: boolean): string => {
    if (!isZh) return s.name;
    if (countryCode === 'CN' && STATE_ZH_CN[s.name]) return STATE_ZH_CN[s.name];
    if (countryCode === 'JP' && STATE_ZH_JP[s.name]) return STATE_ZH_JP[s.name];
    return s.name;
};

/**
 * 可复用的地理位置选择组件
 * 包含模糊搜索、中文本地化、常用国家置顶
 */
export default function LocationPicker({ value, onChange, onGeoChange, t, compact }: LocationPickerProps) {
    const allCountries = useMemo(() => Country.getAllCountries(), []);
    const isZh = (t?._lang || 'zh') !== 'en';

    // 排序后的国家列表：置顶 -> 分隔线 -> 其余按名称排序
    const sortedCountries = useMemo(() => {
        const topSet = new Set(TOP_COUNTRY_CODES);
        const top = TOP_COUNTRY_CODES
            .map(code => allCountries.find(c => c.isoCode === code))
            .filter(Boolean) as ICountry[];
        const rest = allCountries
            .filter(c => !topSet.has(c.isoCode))
            .sort((a, b) => {
                const aName = isZh ? (COUNTRY_ZH[a.isoCode] || a.name) : a.name;
                const bName = isZh ? (COUNTRY_ZH[b.isoCode] || b.name) : b.name;
                return aName.localeCompare(bName);
            });
        return { top, rest };
    }, [allCountries, isZh]);

    const [selectedCountryCode, setSelectedCountryCode] = useState('');
    const [selectedStateCode, setSelectedStateCode] = useState('');
    const [states, setStates] = useState<IState[]>([]);

    // 搜索状态
    const [countrySearch, setCountrySearch] = useState('');
    const [stateSearch, setStateSearch] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showStateDropdown, setShowStateDropdown] = useState(false);
    const countryRef = useRef<HTMLDivElement>(null);
    const stateRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭下拉
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
                setShowCountryDropdown(false);
            }
            if (stateRef.current && !stateRef.current.contains(e.target as Node)) {
                setShowStateDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 初始化时从 value 反查 code
    useEffect(() => {
        if (!value) return;
        const parts = value.split('-');
        const countryName = parts[0];
        const stateName = parts.slice(1).join('-');

        const country = allCountries.find(c => c.name === countryName);
        if (country) {
            setSelectedCountryCode(country.isoCode);
            setCountrySearch(getCountryLabel(country, isZh));
            const countryStates = State.getStatesOfCountry(country.isoCode);
            setStates(countryStates);
            if (stateName) {
                const state = countryStates.find(s => s.name === stateName);
                if (state) {
                    setSelectedStateCode(state.isoCode);
                    setStateSearch(getStateLabel(state, country.isoCode, isZh));
                }
            }
        }
    }, []);

    // 模糊过滤后的国家列表
    const filteredCountries = useMemo(() => {
        const query = countrySearch.toLowerCase().trim();
        if (!query) return sortedCountries;

        const filterFn = (c: ICountry) => {
            const label = getCountryLabel(c, isZh).toLowerCase();
            const enName = c.name.toLowerCase();
            const zhName = (COUNTRY_ZH[c.isoCode] || '').toLowerCase();
            return label.includes(query) || enName.includes(query) || zhName.includes(query) || c.isoCode.toLowerCase().includes(query);
        };

        return {
            top: sortedCountries.top.filter(filterFn),
            rest: sortedCountries.rest.filter(filterFn)
        };
    }, [countrySearch, sortedCountries, isZh]);

    // 模糊过滤后的省/州列表
    const filteredStates = useMemo(() => {
        const query = stateSearch.toLowerCase().trim();
        if (!query) return states;
        return states.filter(s => {
            const label = getStateLabel(s, selectedCountryCode, isZh).toLowerCase();
            return label.includes(query) || s.name.toLowerCase().includes(query);
        });
    }, [stateSearch, states, selectedCountryCode, isZh]);

    const handleSelectCountry = (c: ICountry) => {
        setSelectedCountryCode(c.isoCode);
        setCountrySearch(getCountryLabel(c, isZh));
        setSelectedStateCode('');
        setStateSearch('');
        setShowCountryDropdown(false);
        const newStates = State.getStatesOfCountry(c.isoCode);
        setStates(newStates);
        onChange(c.name);
        // 回传基于国家的大致经纬度
        if (onGeoChange && c.latitude && c.longitude) {
            onGeoChange({ lat: parseFloat(c.latitude), lng: parseFloat(c.longitude) });
        }
    };

    const handleSelectState = (s: IState) => {
        setSelectedStateCode(s.isoCode);
        setStateSearch(getStateLabel(s, selectedCountryCode, isZh));
        setShowStateDropdown(false);
        const country = Country.getCountryByCode(selectedCountryCode);
        if (country) {
            onChange(`${country.name}-${s.name}`);
            // 回传基于省/州的更精确经纬度
            if (onGeoChange && s.latitude && s.longitude) {
                onGeoChange({ lat: parseFloat(s.latitude), lng: parseFloat(s.longitude) });
            }
        }
    };

    const gap = compact ? 'gap-2' : 'gap-3';

    return (
        <div className={`flex flex-col ${gap}`}>
            {/* 国家选择 */}
            <div ref={countryRef} className="relative">
                {!compact && <label className="text-xs font-bold text-gray-500 mb-1 block">{t?.settings?.selectCountry || '国家/地区'}</label>}
                <input
                    type="text"
                    value={countrySearch}
                    onChange={e => { setCountrySearch(e.target.value); setShowCountryDropdown(true); }}
                    onFocus={(e) => { e.target.select(); setShowCountryDropdown(true); }}
                    placeholder={`🔍 ${t?.settings?.selectCountry || '搜索国家...'}`}
                    className="w-full border-2 border-black rounded-lg p-2 font-bold bg-gray-50 outline-none focus:bg-white focus:border-dopa-purple transition-colors"
                />
                {showCountryDropdown && (
                    <div className="absolute z-[9999] w-full mt-1 bg-white border-2 border-black rounded-lg shadow-neo max-h-[160px] overflow-y-auto hide-scrollbar">
                        {filteredCountries.top.length > 0 && (
                            <>
                                <div className="px-3 py-1 text-[10px] font-black text-gray-400 uppercase bg-gray-50 sticky top-0">{isZh ? '常用' : 'Popular'}</div>
                                {filteredCountries.top.map(c => (
                                    <div key={c.isoCode} onClick={() => handleSelectCountry(c)} className="px-3 py-2 font-bold cursor-pointer hover:bg-dopa-yellow/30 active:bg-dopa-yellow/50 transition-colors">
                                        {getCountryLabel(c, isZh)}
                                    </div>
                                ))}
                                {filteredCountries.rest.length > 0 && <div className="border-t border-gray-200 mx-2"></div>}
                            </>
                        )}
                        {filteredCountries.rest.map(c => (
                            <div key={c.isoCode} onClick={() => handleSelectCountry(c)} className="px-3 py-2 font-bold cursor-pointer hover:bg-dopa-cyan/20 active:bg-dopa-cyan/40 transition-colors">
                                {getCountryLabel(c, isZh)}
                            </div>
                        ))}
                        {filteredCountries.top.length === 0 && filteredCountries.rest.length === 0 && (
                            <div className="px-3 py-4 text-center text-gray-400 font-bold text-sm">{isZh ? '没有匹配结果' : 'No results'}</div>
                        )}
                    </div>
                )}
            </div>

            {/* 省/州选择 */}
            <div ref={stateRef} className="relative">
                {!compact && <label className="text-xs font-bold text-gray-500 mb-1 block">{t?.settings?.selectRegion || '省/州'}</label>}
                <input
                    type="text"
                    value={stateSearch}
                    onChange={e => { setStateSearch(e.target.value); setShowStateDropdown(true); }}
                    onFocus={(e) => { e.target.select(); setShowStateDropdown(true); }}
                    placeholder={`🔍 ${t?.settings?.selectRegion || '搜索省/州...'}`}
                    disabled={!selectedCountryCode || states.length === 0}
                    className="w-full border-2 border-black rounded-lg p-2 font-bold bg-gray-50 disabled:opacity-50 outline-none focus:bg-white focus:border-dopa-purple transition-colors"
                />
                {showStateDropdown && selectedCountryCode && states.length > 0 && (
                    <div className="absolute z-[9999] w-full mt-1 bg-white border-2 border-black rounded-lg shadow-neo max-h-[120px] overflow-y-auto hide-scrollbar">
                        {filteredStates.map(s => (
                            <div key={s.isoCode} onClick={() => handleSelectState(s)} className="px-3 py-2 font-bold cursor-pointer hover:bg-dopa-cyan/20 active:bg-dopa-cyan/40 transition-colors">
                                {getStateLabel(s, selectedCountryCode, isZh)}
                            </div>
                        ))}
                        {filteredStates.length === 0 && (
                            <div className="px-3 py-4 text-center text-gray-400 font-bold text-sm">{isZh ? '没有匹配结果' : 'No results'}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
