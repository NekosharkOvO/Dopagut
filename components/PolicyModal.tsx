import React from 'react';

interface PolicyModalProps {
    type: 'privacy' | 'terms';
    lang: string;
    onClose: () => void;
}

/**
 * 隐私政策 / 用户协议弹窗
 * 内嵌中英双语内容，根据 lang 切换显示
 */
export default function PolicyModal({ type, lang, onClose }: PolicyModalProps) {
    const isZh = lang === 'zh';

    const privacyZh = `# 隐私政策

**最后更新：2026 年 3 月**

DopaGut（以下简称"本应用"）尊重并保护用户的隐私。本政策说明我们如何收集、使用和保护您的信息。

## 1. 收集的数据

- **账户信息**：电子邮箱、用户名
- **健康相关数据**：排便记录（时间、时长、类型、心情等）
- **位置信息**（可选）：用户主动设置的国家/地区
- **使用数据**：成就解锁记录、功能使用情况

## 2. 数据存储

所有数据存储在 Supabase 云平台（AWS 基础设施），采用行级安全策略（RLS），确保用户只能访问自己的数据。

## 3. 数据共享

- 同一圈子的成员可看到您的**用户名、头像、地区和排便次数统计**
- **不会**向圈子外的任何第三方分享您的数据
- **不会**出售您的个人信息

## 4. 用户权利

- 您可以随时通过个人页查看和管理您的记录
- 您可以联系管理员请求删除全部数据
- 您可以随时退出登录并停止使用

## 5. 安全措施

- 所有通信采用 HTTPS 加密传输
- 数据库采用行级安全策略
- 密码经过加密存储，管理员无法查看原始密码

## 6. 联系方式

如有隐私相关问题，请联系应用管理员。`;

    const privacyEn = `# Privacy Policy

**Last Updated: March 2026**

DopaGut ("the App") respects and protects user privacy. This policy explains how we collect, use, and protect your information.

## 1. Data Collected

- **Account info**: Email address, username
- **Health-related data**: Bowel movement records (time, duration, type, mood, etc.)
- **Location** (optional): Country/region set by user
- **Usage data**: Achievement unlocks, feature usage

## 2. Data Storage

All data is stored on the Supabase platform (AWS infrastructure) with Row Level Security (RLS), ensuring users can only access their own data.

## 3. Data Sharing

- Circle members can see your **username, avatar, region, and drop count**
- We do **NOT** share your data with any third parties outside your circle
- We do **NOT** sell your personal information

## 4. User Rights

- You can view and manage your records through the Profile page
- You can contact the admin to request full data deletion
- You can log out and stop using the app at any time

## 5. Security

- All communication uses HTTPS encryption
- Database uses Row Level Security
- Passwords are encrypted; admins cannot view raw passwords

## 6. Contact

For privacy-related questions, please contact the app administrator.`;

    const termsZh = `# 用户协议

**最后更新：2026 年 3 月**

欢迎使用 DopaGut！使用本应用前，请仔细阅读以下条款。

## 1. 服务说明

DopaGut 是一款排便记录与健康追踪工具。本应用由个人开发者维护，仅供娱乐和生活记录用途。

## 2. 免责声明

- 本应用**不提供**任何医疗建议、诊断或治疗方案
- 应用中的"专家建议"等内容仅供参考，不构成医疗意见
- 如有健康问题，请咨询专业医生

## 3. 用户行为

- 用户须对自己的账号安全负责
- 禁止恶意攻击、数据篡改或干扰其他用户
- 禁止上传违法或不当内容

## 4. 数据处理

用户数据的处理遵循本应用《隐私政策》中的说明。

## 5. 服务变更

- 我们保留随时修改或终止服务的权利
- 重大变更会通过应用内通知用户

## 6. 其他

- 本协议的解释权归应用管理员所有
- 使用本应用即视为同意本协议`;

    const termsEn = `# Terms of Service

**Last Updated: March 2026**

Welcome to DopaGut! Please read the following terms carefully before using the App.

## 1. Service Description

DopaGut is a bowel movement tracking and health logging tool. It is maintained by an individual developer and is intended for entertainment and personal logging only.

## 2. Disclaimer

- This app does **NOT** provide any medical advice, diagnosis, or treatment
- Content such as "Expert Tips" is for reference only and does not constitute medical opinion
- Consult a professional doctor for any health concerns

## 3. User Conduct

- Users are responsible for their account security
- Malicious attacks, data tampering, or interference with other users is prohibited
- Uploading illegal or inappropriate content is prohibited

## 4. Data Handling

User data processing follows the App's Privacy Policy.

## 5. Service Changes

- We reserve the right to modify or terminate the service at any time
- Major changes will be communicated through in-app notifications

## 6. Miscellaneous

- The interpretation of this agreement belongs to the app administrator
- Using this app constitutes agreement to these terms`;

    const content = type === 'privacy'
        ? (isZh ? privacyZh : privacyEn)
        : (isZh ? termsZh : termsEn);

    const title = type === 'privacy'
        ? (isZh ? '隐私政策' : 'Privacy Policy')
        : (isZh ? '用户协议' : 'Terms of Service');

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border-[6px] border-black rounded-3xl w-full max-w-sm max-h-[80vh] overflow-hidden shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col">
                {/* 标题栏 */}
                <header className="bg-black text-white p-4 flex items-center justify-between shrink-0">
                    <h2 className="text-lg font-black">{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 bg-dopa-pink rounded-full flex items-center justify-center text-white font-black text-sm active:scale-90 transition-transform"
                    >
                        ✕
                    </button>
                </header>

                {/* 内容区域 — 简单 markdown 渲染 */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                        {content.split('\n').map((line, i) => {
                            // NOTE: 简易 markdown 渲染，仅支持 h1/h2/bold/段落
                            if (line.startsWith('# ')) {
                                return <h1 key={i} className="text-xl font-black mt-4 mb-2 text-black">{line.slice(2)}</h1>;
                            }
                            if (line.startsWith('## ')) {
                                return <h2 key={i} className="text-base font-black mt-4 mb-1 text-black">{line.slice(3)}</h2>;
                            }
                            if (line.startsWith('- ')) {
                                const text = line.slice(2)
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                return <li key={i} className="ml-4 text-xs mb-1" dangerouslySetInnerHTML={{ __html: text }} />;
                            }
                            if (line.startsWith('**') && line.endsWith('**')) {
                                return <p key={i} className="text-xs font-bold text-gray-500 mb-2">{line.replace(/\*\*/g, '')}</p>;
                            }
                            if (line.trim() === '') return <div key={i} className="h-2" />;
                            return <p key={i} className="text-xs mb-1">{line}</p>;
                        })}
                    </div>
                </div>

                {/* 底部确认按钮 */}
                <button
                    onClick={onClose}
                    className="w-full bg-black text-white py-4 font-black text-sm uppercase active:bg-gray-900 transition-colors shrink-0"
                >
                    {isZh ? '我已了解' : 'I Understand'}
                </button>
            </div>
        </div>
    );
}
