import { User, Achievement, Log } from './types';

// --- TYPES ---
export interface Friend {
  id: number;
  name: string;
  level: number;
  avatar: string | null;
  icon?: string; // Fallback emoji
  location: string; // "上海", "北京", etc.
  lastPoopTime: string; // Relative string like "10分钟前"
  durationStr: string; // "15m 30s"
  status: { icon: string; label: string };
  quote: string;
  score: number;
  title: string;
  // Calculated coordinates
  x?: number;
  y?: number;
}

// --- MOCK DATABASE ---

// 1. Logs Data (Historical Records)
// NOTE: Now stored in Supabase
export const LOGS_DB: Log[] = [];

// 2. Achievements Data
// NOTE: Now stored in Supabase
export const ACHIEVEMENTS_DB: Achievement[] = [];

// 3. Current User Data
// NOTE: Now managed by AuthContext & Supabase
export const CURRENT_USER: User = {
  id: 0,
  name: "新用户",
  avatar: "💩",
  title: "新手",
  location: "Earth-Unknown",
  stats: {
    totalDrops: 0,
    maxZen: 0,
    beatPercentage: 0
  }
};

// 4. Friends Data (Soft-Coded for Map)
const RAW_FRIENDS_DATA: Omit<Friend, 'x' | 'y'>[] = [
  {
    id: 1,
    name: "偷屎贼",
    level: 12,
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3UwU4E7eBImgBa-D4MlobUnKUEjD5Qm2dk2XkbzbTqQenBr-fsGEECCkweDCHXJN1AZB708pj4mhreA3DxLDxdBegXac8yA6nJr9Xqn5k9_W4tC-Chx50nx6eNy_hBmOA6w_Chb6E8Zwf97y28M64Lp5ZeTbwPZwflnAC7ljpZTWjxm_FXZDE2T78OdN-XTKr-9yPk4E5wN3Nubx6vzcJm_2CVD_hQEa236SKa_gD3mxGtImY6SAqasLuGAUIVqd2gxIKTuxu5n0",
    location: "上海",
    lastPoopTime: "10分钟前",
    durationStr: "15m 30s",
    status: { icon: "🔥", label: "火辣" },
    quote: "今天也是顺畅的一天！",
    score: 14,
    title: "战神"
  },
  {
    id: 2,
    name: "冲水戈登",
    level: 8,
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMEUn_CuW4Hd4cQgbWTqTN5G0It9UH568_x_CJprcGQ1MktvsPJAuUoWJip4wMBhIqxRcrgdsQbQBQx-vwmxNf91aYJNOUUZLywBc_omxcM7oEhoixVkZHYG93UzCjwsB8Eoc4CP5eo4j1wHIRxUvcwx-upc6OrUZ8tx2kOrcgAB1Z2p-xuClF_Wz1AVA2fPS1LN_PpJi7Kp8GHKdBTGUtVcDA7vY3jeIW3f0bWTU1m6TMbouAoJ_8-KCDxaDa8VTO2amx7DAtwEA",
    location: "北京",
    lastPoopTime: "1小时前",
    durationStr: "08m 12s",
    status: { icon: "🌊", label: "喷射" },
    quote: "为了部落！",
    score: 11,
    title: "骑士"
  },
  {
    id: 3,
    name: "无名英雄",
    level: 5,
    avatar: null,
    icon: '💩',
    location: "广东",
    lastPoopTime: "3小时前",
    durationStr: "45m 00s",
    status: { icon: "🧘", label: "禅意" },
    quote: "记得多喝水。",
    score: 9,
    title: "新手"
  },
  {
    id: 4,
    name: "神秘人",
    level: 1,
    avatar: null,
    icon: '👻',
    location: "成都",
    lastPoopTime: "昨天",
    durationStr: "02m 00s",
    status: { icon: "☢️", label: "核爆" },
    quote: "火锅吃多了...",
    score: 2,
    title: "路人"
  },
  {
    id: 5,
    name: "老司机",
    level: 20,
    avatar: null,
    icon: '🚗',
    location: "黑龙江",
    lastPoopTime: "刚刚",
    durationStr: "05m 10s",
    status: { icon: "❄️", label: "冰封" },
    quote: "速战速决",
    score: 42,
    title: "车神"
  },
];

// Helper: Calculate mock relative X/Y based on geographical logic
// 0,0 is "You" (Center)
const getMapCoordinates = (location: string, index: number): { x: number, y: number } => {
  // Basic directional vectors based on rough geography relative to Central China (or arbitrary center)
  let vecX = 0;
  let vecY = 0;

  if (location.includes("北京") || location.includes("黑龙江") || location.includes("东北")) {
    // North / North East
    vecY = -1;
    vecX = location.includes("黑龙江") ? 0.5 : 0.2;
  } else if (location.includes("上海") || location.includes("江苏") || location.includes("浙江")) {
    // East
    vecX = 1;
    vecY = 0.2;
  } else if (location.includes("广东") || location.includes("深圳") || location.includes("香港")) {
    // South
    vecY = 1;
    vecX = 0.3;
  } else if (location.includes("成都") || location.includes("四川") || location.includes("重庆")) {
    // West
    vecX = -1;
    vecY = 0.2;
  } else {
    // Random distribution for others
    const angle = (index * 72) * (Math.PI / 180);
    vecX = Math.cos(angle);
    vecY = Math.sin(angle);
  }

  // Add some random noise so they aren't in a perfect line
  vecX += (Math.random() - 0.5) * 0.4;
  vecY += (Math.random() - 0.5) * 0.4;

  // Normalize
  const mag = Math.sqrt(vecX * vecX + vecY * vecY) || 1;
  vecX /= mag;
  vecY /= mag;

  // Clamping Distance: Min 120px (close but not overlapping), Max 450px (reachable)
  const MIN_DIST = 120;
  const MAX_DIST = 450;
  // Deterministic random distance based on ID or index to keep it stable
  const distance = MIN_DIST + ((index * 9301 + 49297) % (MAX_DIST - MIN_DIST));

  return {
    x: Math.round(vecX * distance),
    y: Math.round(vecY * distance)
  };
};

// Process Data to add Coordinates
export const MOCK_FRIENDS: Friend[] = RAW_FRIENDS_DATA.map((f, i) => ({
  ...f,
  ...getMapCoordinates(f.location, i)
}));

// --- DATA ACCESS HELPERS ---

export const getUserLevel = (): number => {
  return ACHIEVEMENTS_DB.filter(a => a.unlockedAt).length;
};

export const getNextTitle = (): { nextTitle: string, remaining: number } => {
  const level = getUserLevel();
  if (level < 5) return { nextTitle: "青铜马桶", remaining: 5 - level };
  if (level < 10) return { nextTitle: "白银卫士", remaining: 10 - level };
  if (level < 20) return { nextTitle: "黄金王座", remaining: 20 - level };
  return { nextTitle: "传说", remaining: 0 };
};

export const getDailyMVP = (): Log | null => {
  return LOGS_DB.find(l => l.bristolType === 4) || LOGS_DB[0] || null;
};

export const getWeeklyStats = () => {
  return [40, 85, 20, 60, 0, 95, 50];
};

export const getAverageTime = (): string => {
  const total = LOGS_DB.reduce((acc, log) => acc + log.durationSeconds, 0);
  const avg = Math.floor(total / LOGS_DB.length);
  const m = Math.floor(avg / 60);
  const s = avg % 60;
  return `${m}m ${s}s`;
};

// --- LOCATION DATA & TRANSLATION ---

// Master Data Structure ensuring synchronization between languages
interface GeoEntry {
  zh: string;
  en: string;
}
interface CountryEntry {
  name: GeoEntry;
  regions: GeoEntry[];
}

const MASTER_GEO_DATA: CountryEntry[] = [
  {
    name: { zh: "中国", en: "China" },
    regions: [
      { zh: "北京", en: "Beijing" }, { zh: "上海", en: "Shanghai" }, { zh: "天津", en: "Tianjin" }, { zh: "重庆", en: "Chongqing" },
      { zh: "黑龙江", en: "Heilongjiang" }, { zh: "吉林", en: "Jilin" }, { zh: "辽宁", en: "Liaoning" }, { zh: "河北", en: "Hebei" },
      { zh: "河南", en: "Henan" }, { zh: "山东", en: "Shandong" }, { zh: "山西", en: "Shanxi" }, { zh: "陕西", en: "Shaanxi" },
      { zh: "内蒙古", en: "Inner Mongolia" }, { zh: "宁夏", en: "Ningxia" }, { zh: "甘肃", en: "Gansu" }, { zh: "新疆", en: "Xinjiang" },
      { zh: "青海", en: "Qinghai" }, { zh: "西藏", en: "Tibet" }, { zh: "四川", en: "Sichuan" }, { zh: "贵州", en: "Guizhou" },
      { zh: "云南", en: "Yunnan" }, { zh: "湖南", en: "Hunan" }, { zh: "湖北", en: "Hubei" }, { zh: "广东", en: "Guangdong" },
      { zh: "广西", en: "Guangxi" }, { zh: "海南", en: "Hainan" }, { zh: "江西", en: "Jiangxi" }, { zh: "福建", en: "Fujian" },
      { zh: "浙江", en: "Zhejiang" }, { zh: "江苏", en: "Jiangsu" }, { zh: "安徽", en: "Anhui" }, { zh: "香港", en: "Hong Kong" },
      { zh: "澳门", en: "Macau" }, { zh: "台湾", en: "Taiwan" }
    ]
  },
  {
    name: { zh: "美国", en: "USA" },
    regions: [
      { zh: "加利福尼亚", en: "California" }, { zh: "纽约", en: "New York" }, { zh: "德克萨斯", en: "Texas" }, { zh: "佛罗里达", en: "Florida" },
      { zh: "华盛顿", en: "Washington" }, { zh: "伊利诺伊", en: "Illinois" }, { zh: "宾夕法尼亚", en: "Pennsylvania" }, { zh: "俄亥俄", en: "Ohio" },
      { zh: "乔治亚", en: "Georgia" }, { zh: "北卡罗来纳", en: "North Carolina" }, { zh: "密歇根", en: "Michigan" }, { zh: "新泽西", en: "New Jersey" },
      { zh: "弗吉尼亚", en: "Virginia" }, { zh: "马萨诸塞", en: "Massachusetts" }, { zh: "亚利桑那", en: "Arizona" }, { zh: "田纳西", en: "Tennessee" },
      { zh: "印第安纳", en: "Indiana" }, { zh: "马里兰", en: "Maryland" }, { zh: "密苏里", en: "Missouri" }, { zh: "威斯康星", en: "Wisconsin" },
      { zh: "科罗拉多", en: "Colorado" }, { zh: "明尼苏达", en: "Minnesota" }, { zh: "南卡罗来纳", en: "South Carolina" }, { zh: "阿拉巴马", en: "Alabama" },
      { zh: "路易斯安那", en: "Louisiana" }, { zh: "肯塔基", en: "Kentucky" }, { zh: "俄勒冈", en: "Oregon" }, { zh: "俄克拉荷马", en: "Oklahoma" },
      { zh: "康涅狄格", en: "Connecticut" }, { zh: "犹他", en: "Utah" }, { zh: "爱荷华", en: "Iowa" }, { zh: "内华达", en: "Nevada" },
      { zh: "阿肯色", en: "Arkansas" }, { zh: "密西西比", en: "Mississippi" }, { zh: "堪萨斯", en: "Kansas" }, { zh: "新墨西哥", en: "New Mexico" },
      { zh: "内布拉斯加", en: "Nebraska" }, { zh: "西弗吉尼亚", en: "West Virginia" }, { zh: "爱达荷", en: "Idaho" }, { zh: "夏威夷", en: "Hawaii" },
      { zh: "新罕布什尔", en: "New Hampshire" }, { zh: "缅因", en: "Maine" }, { zh: "罗德岛", en: "Rhode Island" }, { zh: "蒙大拿", en: "Montana" },
      { zh: "特拉华", en: "Delaware" }, { zh: "南达科他", en: "South Dakota" }, { zh: "北达科他", en: "North Dakota" }, { zh: "阿拉斯加", en: "Alaska" },
      { zh: "佛蒙特", en: "Vermont" }, { zh: "怀俄明", en: "Wyoming" }
    ]
  },
  {
    name: { zh: "加拿大", en: "Canada" },
    regions: [
      { zh: "安大略", en: "Ontario" }, { zh: "魁北克", en: "Quebec" }, { zh: "不列颠哥伦比亚", en: "British Columbia" }, { zh: "阿尔伯塔", en: "Alberta" },
      { zh: "曼尼托巴", en: "Manitoba" }, { zh: "萨斯喀彻温", en: "Saskatchewan" }, { zh: "新斯科舍", en: "Nova Scotia" }, { zh: "新不伦瑞克", en: "New Brunswick" },
      { zh: "纽芬兰与拉布拉多", en: "Newfoundland and Labrador" }, { zh: "爱德华王子岛", en: "Prince Edward Island" }, { zh: "西北地区", en: "Northwest Territories" },
      { zh: "育空", en: "Yukon" }, { zh: "努纳武特", en: "Nunavut" }
    ]
  },
  {
    name: { zh: "英国", en: "UK" },
    regions: [{ zh: "英格兰", en: "England" }, { zh: "苏格兰", en: "Scotland" }, { zh: "威尔士", en: "Wales" }, { zh: "北爱尔兰", en: "Northern Ireland" }]
  },
  {
    name: { zh: "法国", en: "France" },
    regions: [
      { zh: "法兰西岛 (巴黎)", en: "Île-de-France (Paris)" }, { zh: "普罗旺斯-阿尔卑斯-蔚蓝海岸", en: "Provence-Alpes-Côte d'Azur" }, { zh: "奥弗涅-罗讷-阿尔卑斯", en: "Auvergne-Rhône-Alpes" },
      { zh: "新阿基坦", en: "Nouvelle-Aquitaine" }, { zh: "奥克西塔尼", en: "Occitanie" }, { zh: "上法兰西", en: "Hauts-de-France" }, { zh: "大东部", en: "Grand Est" },
      { zh: "诺曼底", en: "Normandie" }, { zh: "布列塔尼", en: "Bretagne" }, { zh: "卢瓦尔河地区", en: "Pays de la Loire" }, { zh: "勃艮第-弗朗什-孔泰", en: "Bourgogne-Franche-Comté" },
      { zh: "中央-卢瓦尔河谷", en: "Centre-Val de Loire" }, { zh: "科西嘉", en: "Corsica" }
    ]
  },
  {
    name: { zh: "新加坡", en: "Singapore" },
    regions: [{ zh: "中区", en: "Central" }, { zh: "东北区", en: "North East" }, { zh: "西北区", en: "North West" }, { zh: "东南区", en: "South East" }, { zh: "西南区", en: "South West" }]
  },
  {
    name: { zh: "澳大利亚", en: "Australia" },
    regions: [
      { zh: "新南威尔士", en: "New South Wales" }, { zh: "维多利亚", en: "Victoria" }, { zh: "昆士兰", en: "Queensland" }, { zh: "西澳大利亚", en: "Western Australia" },
      { zh: "南澳大利亚", en: "South Australia" }, { zh: "塔斯马尼亚", en: "Tasmania" }, { zh: "首都领地", en: "ACT" }, { zh: "北领地", en: "Northern Territory" }
    ]
  },
  {
    name: { zh: "日本", en: "Japan" },
    regions: [
      { zh: "东京都", en: "Tokyo" }, { zh: "大阪府", en: "Osaka" }, { zh: "京都府", en: "Kyoto" }, { zh: "北海道", en: "Hokkaido" },
      { zh: "爱知县", en: "Aichi" }, { zh: "福冈县", en: "Fukuoka" }, { zh: "神奈川县", en: "Kanagawa" }, { zh: "兵库县", en: "Hyogo" },
      { zh: "埼玉县", en: "Saitama" }, { zh: "千叶县", en: "Chiba" }, { zh: "冲绳县", en: "Okinawa" }, { zh: "广岛县", en: "Hiroshima" }, { zh: "宫城县", en: "Miyagi" }
    ]
  }
];

// Helper to get formatted location data for Dropdowns based on Language
export const getLocations = (lang: 'zh' | 'en') => {
  const data: Record<string, { regions: string[] }> = {};
  MASTER_GEO_DATA.forEach(country => {
    data[country.name[lang]] = {
      regions: country.regions.map(r => r[lang])
    };
  });
  return data;
};

// NOTE: 完整国家中文名字典（覆盖 country-state-city 库的 isoCode）
// 比 LocationPicker.COUNTRY_ZH 范围更广，用于全球本地化显示
const COUNTRY_ZH_FULL: Record<string, string> = {
  CN: '中国', US: '美国', CA: '加拿大', GB: '英国', FR: '法国',
  JP: '日本', KR: '韩国', DE: '德国', AU: '澳大利亚', SG: '新加坡',
  IN: '印度', RU: '俄罗斯', BR: '巴西', MX: '墨西哥', IT: '意大利',
  ES: '西班牙', NL: '荷兰', SE: '瑞典', NO: '挪威', DK: '丹麦',
  FI: '芬兰', CH: '瑞士', AT: '奥地利', BE: '比利时', PT: '葡萄牙',
  PL: '波兰', CZ: '捷克', HU: '匈牙利', RO: '罗马尼亚', GR: '希腊',
  TR: '土耳其', SA: '沙特阿拉伯', AE: '阿联酋', IL: '以色列', EG: '埃及',
  ZA: '南非', NG: '尼日利亚', KE: '肯尼亚', TH: '泰国', VN: '越南',
  ID: '印度尼西亚', MY: '马来西亚', PH: '菲律宾', TW: '台湾', HK: '香港',
  MO: '澳门', NZ: '新西兰', AR: '阿根廷', CL: '智利', CO: '哥伦比亚',
  PE: '秘鲁', UA: '乌克兰', IR: '伊朗', IQ: '伊拉克', PK: '巴基斯坦',
  BD: '孟加拉国', LK: '斯里兰卡', NP: '尼泊尔', MM: '缅甸', KH: '柬埔寨',
  LA: '老挝', MN: '蒙古', KZ: '哈萨克斯坦', UZ: '乌兹别克斯坦', AF: '阿富汗',
  QA: '卡塔尔', KW: '科威特', BH: '巴林', OM: '阿曼', JO: '约旦',
  LB: '黎巴嫩', SY: '叙利亚', MA: '摩洛哥', TN: '突尼斯', DZ: '阿尔及利亚',
  LY: '利比亚', SD: '苏丹', ET: '埃塞俄比亚', GH: '加纳', TZ: '坦桑尼亚',
  MZ: '莫桑比克', ZW: '津巴布韦', UG: '乌干达', CM: '喀麦隆', SN: '塞内加尔',
  CI: '科特迪瓦', HR: '克罗地亚', SK: '斯洛伐克', BG: '保加利亚', RS: '塞尔维亚',
  SI: '斯洛文尼亚', EE: '爱沙尼亚', LV: '拉脱维亚', LT: '立陶宛', BY: '白俄罗斯',
  MD: '摩尔多瓦', GE: '格鲁吉亚', AM: '亚美尼亚', AZ: '阿塞拜疆', IS: '冰岛',
  IE: '爱尔兰', CY: '塞浦路斯', MT: '马耳他', LU: '卢森堡', LI: '列支敦士登',
  MC: '摩纳哥', AD: '安道尔', SM: '圣马力诺', VA: '梵蒂冈', AL: '阿尔巴尼亚',
  BA: '波黑', MK: '北马其顿', ME: '黑山', XK: '科索沃',
};

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

const STATE_ZH_JP: Record<string, string> = {
  'Hokkaido': '北海道', 'Tokyo': '东京都', 'Osaka': '大阪府', 'Kyoto': '京都府',
  'Aichi': '爱知县', 'Fukuoka': '福冈县', 'Kanagawa': '神奈川县',
  'Saitama': '埼玉县', 'Chiba': '千叶县', 'Hyogo': '兵库县', 'Okinawa': '冲绳县',
};

/**
 * 将存储的位置字符串本地化显示
 * 存储格式：「国家名-省州名」（来自 country-state-city 库的 name 字段）
 * 支持中英双语，中文时尽量返回中文名
 */
export const getLocalizedLocation = (locationStr: string | undefined, targetLang: 'zh' | 'en'): string => {
  if (!locationStr) return targetLang === 'zh' ? '地球-未知' : 'Earth-Unknown';

  const parts = locationStr.split('-');
  const cName = parts[0];
  const rName = parts.slice(1).join('-');

  let localizedCountry = cName;
  let localizedRegion = rName;
  let isoCode = '';

  // 1. 获取全局库的国家/州信息
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Country } = require('country-state-city');
    const matchedCountry = Country.getAllCountries().find((c: any) => c.name === cName);
    if (matchedCountry) {
      isoCode = matchedCountry.isoCode;
      const countryZh = COUNTRY_ZH_FULL[isoCode] || cName;
      localizedCountry = targetLang === 'zh' ? countryZh : cName;
    }
  } catch (_e) { }

  // 2. 局部覆盖旧的 MASTER_GEO_DATA（向后兼容其特殊的区域划分）
  const countryObj = MASTER_GEO_DATA.find(c => c.name.zh === cName || c.name.en === cName);
  if (countryObj) {
    localizedCountry = countryObj.name[targetLang];
  }

  if (!rName) return localizedCountry;

  // 3. 翻译省/州名称
  if (countryObj) {
    const regionObj = countryObj.regions.find(r => r.zh === rName || r.en === rName);
    if (regionObj) {
      localizedRegion = regionObj[targetLang];
      return `${localizedCountry}-${localizedRegion}`;
    }
  }

  if (targetLang === 'zh') {
    if (isoCode === 'CN' && STATE_ZH_CN[rName]) localizedRegion = STATE_ZH_CN[rName];
    if (isoCode === 'JP' && STATE_ZH_JP[rName]) localizedRegion = STATE_ZH_JP[rName];
  }

  return `${localizedCountry}-${localizedRegion}`;
};
