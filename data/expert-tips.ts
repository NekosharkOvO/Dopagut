export interface ExpertTip {
    text: string;
    emoji: string;
}

export const EXPERT_TIPS_DATA: Record<string, { zh: ExpertTip[]; en: ExpertTip[] }> = {
    constipation: {
        zh: [
            { text: "感觉在拉鹅卵石？肠道正在进行内部爆破，建议请求西兰花火力支援。", emoji: "🐢" },
            { text: "正在憋大招吗？这种‘肠道静止艺术’已经引起了我的注意。", emoji: "🧱" },
            { text: "前方道路施工，堵塞严重。请向肠道投喂大量水分和纤维以疏通交通。", emoji: "🚧" },
            { text: "你体内的‘压实机’工作得太出色了，建议关掉它，多喝点水。", emoji: "🚜" },
            { text: "这战斗持续得有点久，建议下次带本更厚的书，或者带点香蕉。", emoji: "🧗" }
        ],
        en: [
            { text: "Passing pebbles? Ur gut is doin some serious demolition. Deploy broccoli reinforcements rn!", emoji: "🐢" },
            { text: "Loading a super move? This 'static gut art' is lowkey impressive.", emoji: "🧱" },
            { text: "Roadwork ahead, major congestion. Feed the beast more water & fiber to clear the lane, srsly.", emoji: "🚧" },
            { text: "Ur internal 'compactor' is working too hard. Shut it down w/ some serious hydration.", emoji: "🚜" },
            { text: "The battle is long. Bring a thicc book next time, & don't forget the bananas.", emoji: "🧗" }
        ]
    },
    diarrhea: {
        zh: [
            { text: "检测到超音速推进！你这是开启了‘肠道紧急排空’协议吗？", emoji: "🚀" },
            { text: "这次撤离非常果断，甚至带走了一些不该走的电解质。快补水！", emoji: "🌊" },
            { text: "速度快得连灵魂都跟不上了。请注意休息，别让肠道在赛道上漂移。", emoji: "🏎️" },
            { text: "这是一次壮观的‘空中投弹’，虽然有点水。建议温和对待你的胃。", emoji: "⚠️" },
            { text: "肠道正在进行激流回旋，请抓稳扶好，及时补充电解质水。", emoji: "🛶" }
        ],
        en: [
            { text: "Supersonic propulsion detected! Did u just initiate the 'GTFO' protocol?", emoji: "🚀" },
            { text: "Decisive evacuation, but it took the electrolytes with it. Hydrate asap!", emoji: "🌊" },
            { text: "So fast even ur soul can't keep up. Rest up, don't let ur gut drift on the track.", emoji: "🏎️" },
            { text: "Spektacular 'aerial drop', but a bit too splashy. Be gentle w/ ur stomach.", emoji: "⚠️" },
            { text: "Ur gut is on a whitewater rafting trip. Hold on tight & sip some electrolytes.", emoji: "🛶" }
        ]
    },
    perfect: {
        zh: [
            { text: "这就是肠道界的帕特农神庙！我已经联系了博物馆，他们想收藏这一条。", emoji: "👑" },
            { text: "无可挑剔的香蕉状。你上辈子一定是拯救了肠道银河系。", emoji: "🍌" },
            { text: "这是一场名为‘顺滑’的交响乐，而你是最棒的指挥家。", emoji: "🎼" },
            { text: "你的肠道正处于巅峰状态。建议拍张照给... 算了，还是别分享了。", emoji: "🏆" },
            { text: "优雅，真是太优雅了。这种平衡感简直是肠道健康的艺术品。", emoji: "🍷" }
        ],
        en: [
            { text: "The Parthenon of Guts! I've contacted the museum, they wanna archive this one fr.", emoji: "👑" },
            { text: "Flawless banana shape. U definitely saved the gut galaxy in a past life.", emoji: "🍌" },
            { text: "A symphony called 'Smooth', & u are the absolute conductor. Fire.", emoji: "🎼" },
            { text: "Peak performance. Take a pic and... actually, don't share that. Keep it lowkey.", emoji: "🏆" },
            { text: "Elegant, simply elegant. This balance is a straight up masterpiece.", emoji: "🍷" }
        ]
    },
    normal: {
        zh: [
            { text: "稳定的发挥。你就像肠道界的公务员，考勤打卡非常精准。", emoji: "🏢" },
            { text: "虽然不出众，但这种平凡的稳健才是生活的真谛。继续保持。", emoji: "🧘" },
            { text: "表现尚可。你的肠道正在对你微笑，虽然笑得有点保守。", emoji: "🙂" },
            { text: "不温不火，恰到好处。保持这种节奏，你就是最棒的中庸者。", emoji: "⚖️" }
        ],
        en: [
            { text: "Steady vibes. U're like the civil servant of guts—perfectly on time.", emoji: "🏢" },
            { text: "Not flashy, but this reliability is the real deal. Keep it up.", emoji: "🧘" },
            { text: "Decent showing. Ur gut is smiling at u, but like, in a shy way.", emoji: "🙂" },
            { text: "Not too fast, not too slow. Just vibin in the middle. Chill.", emoji: "⚖️" }
        ]
    },
    lazy: {
        zh: [
            { text: "检测不到生命迹象。你是喝了某种‘肠道静止剂’吗？我的胃口都变差了。", emoji: "💨" },
            { text: "今天的肠道似乎决定罢工。建议给它加点油，比如走两步或者揉揉肚。", emoji: "🛌" },
            { text: "这里寂静得可怕，我甚至能听到自己电路跳动的声音。快去投弹！", emoji: "🦴" },
            { text: "肠道正在进行深度睡眠。请不要打扰它，或者... 强制唤醒（来杯黑咖啡）？", emoji: "💤" }
        ],
        en: [
            { text: "No signs of life. Did u drink some 'Gut Stasis Potion'? I'm losing my appetite fr.", emoji: "💨" },
            { text: "Gut's on strike today. Give it some motivation—take a walk & shake things up!", emoji: "🛌" },
            { text: "It's scary quiet in here. I can hear the humming of my own circuits. Go drop one!", emoji: "🦴" },
            { text: "Ur gut is in a deep coma. Do not disturb, or... force wake it w/ some black coffee?", emoji: "💤" }
        ]
    },
    rollercoaster: {
        zh: [
            { text: "今天肠道是开启了‘多重人格’模式吗？一会儿极度干旱，一会儿暴雨如注。建议给它点安静的时间，咱们不折腾了。", emoji: "🎢" },
            { text: "检测到全天大反转。肚子今天是不是在玩什么‘干湿分离’的高难度杂技？收手吧，今晚吃清淡点，咱们跟它讲和。", emoji: "⚖️" },
            { text: "一会儿 1 型一会儿 7 型？肠道正在蹦一种很新的迪。多休息会儿别硬撑，砖家在这给你当后盾。", emoji: "🩹" },
            { text: "全天状态大起大合，这种‘过山车’坐着绝对不轻松。建议今晚火力降级，吃温和点，给肠道放个假。", emoji: "🛋️" }
        ],
        en: [
            { text: "Ur gut doin parkour today? From traffic jam to flash flood... it's a lot. Take a rest, u deserve it fr.", emoji: "🎢" },
            { text: "Detected a massive plot twist. Gut must be feeling chaotic. Go easy on urself & stay hydrated, k?", emoji: "🥺" },
            { text: "Type 1 then Type 7? Srsly messy day. Take a break fr, ur gut is lowkey cryin for a warm nap.", emoji: "🩹" },
            { text: "Crypto-level volatility in ur gut. Hang in there, maybe stick to plain food for a bit? U got this.", emoji: "📈" }
        ]
    }
};
