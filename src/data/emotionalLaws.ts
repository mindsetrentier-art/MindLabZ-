export interface EmotionalPsychologyLaw {
  id: string; // e.g. "emo-01"
  order: number; // 1 - 50
  sectionIndex: number; // 1 - 5
  sectionTitle: string;
  sectionEn: string;
  sectionThemeColor: {
    primary: string; // Accent color hex
    border: string; // Border class
    gradient: string; // Gradient class
    bgBadge: string;
    glow: string;
  };
  titleZh: string;
  titleEn: string;
  keywords: string[];
  corePrinciple: string;
  deepBreakdown: {
    mechanism: string;
    insights: string[];
  };
  lifeCase: {
    title: string;
    scenario: string;
    analysis?: string;
  };
  practicalTakeaways: {
    summary: string;
    actionablePoints: string[];
    keyDistinction?: string;
  };
  boundary?: string;
  isDuplicateOfCore?: boolean;
  duplicateCoreId?: string; // e.g. "LAW053"
  duplicateCoreName?: string;
}

export interface EmotionalSectionMeta {
  index: number;
  title: string;
  subtitle: string;
  en: string;
  lawRange: string;
  theme: {
    primary: string;
    border: string;
    gradient: string;
    bgBadge: string;
    glow: string;
  };
  description: string;
}

export const EMOTIONAL_SECTIONS: EmotionalSectionMeta[] = [
  {
    index: 1,
    title: '第一部分：爱情与吸引力的10条规律',
    subtitle: '为什么我们会喜欢一个人，为什么会对某个人产生特殊感觉',
    en: 'Attraction & Chemistry',
    lawRange: '01 – 10',
    theme: {
      primary: '#F59E0B',
      border: 'border-amber-500/30 hover:border-amber-400/60',
      gradient: 'from-amber-500/20 via-amber-600/10 to-transparent',
      bgBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      glow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
    },
    description: '这一部分主要解释：为什么我们会喜欢一个人，为什么会对某个人产生特殊感觉，以及为什么最初的吸引力不一定能转化为长久的爱情。',
  },
  {
    index: 2,
    title: '第二部分：依恋、安全感与情绪的10条规律',
    subtitle: '为什么有些人越爱越安心，有些人越爱越害怕失去？',
    en: 'Attachment & Psychological Security',
    lawRange: '11 – 20',
    theme: {
      primary: '#EC4899',
      border: 'border-rose-500/30 hover:border-rose-400/60',
      gradient: 'from-rose-500/20 via-pink-600/10 to-transparent',
      bgBadge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      glow: 'shadow-[0_0_25px_rgba(236,72,153,0.25)]',
    },
    description: '这一部分研究一个更深层的问题：为什么有些人越爱越安心，有些人越爱越害怕失去？解析依恋模型、情绪共同调节与安全感基石。',
  },
  {
    index: 3,
    title: '第三部分：亲密关系、沟通与冲突的10条规律',
    subtitle: '化解争吵壁垒、非暴力沟通与有效互动模式',
    en: 'Communication, Conflict & Interaction',
    lawRange: '21 – 30',
    theme: {
      primary: '#8B5CF6',
      border: 'border-purple-500/30 hover:border-purple-400/60',
      gradient: 'from-purple-500/20 via-indigo-600/10 to-transparent',
      bgBadge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      glow: 'shadow-[0_0_25px_rgba(139,92,246,0.25)]',
    },
    description: '很多关系并不是没有感情，而是双方逐渐形成了无法有效解决问题的互动模式。拆解追退循环、倾听技术与修复尝试。',
  },
  {
    index: 4,
    title: '第四部分：失恋、嫉妒、分离与关系困局的10条规律',
    subtitle: '为什么分手后仍然放不下，为什么越想得到答案越痛苦',
    en: 'Heartbreak, Grief & Detachment',
    lawRange: '31 – 40',
    theme: {
      primary: '#06B6D4',
      border: 'border-cyan-500/30 hover:border-cyan-400/60',
      gradient: 'from-cyan-500/20 via-sky-600/10 to-transparent',
      bgBadge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      glow: 'shadow-[0_0_25px_rgba(6,182,212,0.25)]',
    },
    description: '关注爱情中最令人困惑的现象：为什么有些人分手后仍然放不下，为什么越想得到答案越痛苦，以及为什么有些关系结束后，人反而更难忘记对方。',
  },
  {
    index: 5,
    title: '第五部分：长期爱情、信任与成熟关系的10条规律',
    subtitle: '如何维持亲密、理解承诺、建立信任与长期适配',
    en: 'Enduring Love & Mature Relationships',
    lawRange: '41 – 50',
    theme: {
      primary: '#10B981',
      border: 'border-emerald-500/30 hover:border-emerald-400/60',
      gradient: 'from-emerald-500/20 via-teal-600/10 to-transparent',
      bgBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.25)]',
    },
    description: '最后十条关注爱情中更深层的能力：如何维持亲密、理解承诺、建立信任，以及判断一段关系是否值得长期经营。',
  },
];

export const EMOTIONAL_PSYCHOLOGY_LAWS: EmotionalPsychologyLaw[] = [
  // ==========================================
  // 第一部分：爱情与吸引力的10条规律 (01 - 10)
  // ==========================================
  {
    id: 'emo-01',
    order: 1,
    sectionIndex: 1,
    sectionTitle: '第一部分：爱情与吸引力',
    sectionEn: 'Attraction & Chemistry',
    sectionThemeColor: EMOTIONAL_SECTIONS[0].theme,
    titleZh: '吊桥效应',
    titleEn: 'Misattribution of Arousal',
    keywords: ['心跳加速', '情绪唤醒', '吸引力误判'],
    corePrinciple: '人在生理唤醒较强的情境中，有时会把心跳加快、紧张或兴奋部分归因于身边的人，从而影响对这个人的吸引力判断。',
    deepBreakdown: {
      mechanism: '当我们遇到危险、挑战、刺激或不确定的情境时，身体可能出现心跳加快、呼吸急促和注意力集中等反应。如果此时身边有一个让我们产生好感的人，我们有时会把部分生理兴奋理解为心动。',
      insights: [
        '身体先进入兴奋或紧张状态。',
        '大脑再尝试解释这种感觉从何而来。',
        '如果我们把情境引起的兴奋误认为完全由对方引起，就可能高估当时的浪漫吸引力。',
      ],
    },
    lifeCase: {
      title: '刺激游乐项目约会',
      scenario: '两个人第一次约会时，一起体验了刺激的游乐项目。结束后，两人都心跳加快，彼此之间也产生了更强烈的兴奋感。他们可能把这种感觉体验为更强的吸引力。不过，这不代表他们一定会相爱，更不代表这段关系一定适合长期发展。',
    },
    practicalTakeaways: {
      summary: '强烈的心动值得体验，但判断一段关系时，还要观察对方的性格、价值观、责任感以及日常相处是否舒服。',
      actionablePoints: [
        '在初次约会中适当安排微刺激的互动，可增加彼此的兴奋感。',
        '在做出重要承诺前，要在平静日常的生活情境下重新观察。',
      ],
      keyDistinction: '心动是一种体验，适合则需要更长时间的观察。',
    },
  },
  {
    id: 'emo-02',
    order: 2,
    sectionIndex: 1,
    sectionTitle: '第一部分：爱情与吸引力',
    sectionEn: 'Attraction & Chemistry',
    sectionThemeColor: EMOTIONAL_SECTIONS[0].theme,
    titleZh: '曝光效应',
    titleEn: 'Mere Exposure Effect',
    keywords: ['熟悉感', '重复接触', '好感形成'],
    corePrinciple: '在其他条件相近时，人们对某个人或事物的反复接触，有时会增加熟悉感，并提升好感。',
    deepBreakdown: {
      mechanism: '第一次见面时，我们对陌生人的了解有限。随着反复接触，大脑逐渐熟悉对方的声音、表情、行为方式和互动节奏。熟悉感可能降低不确定性，让人更容易产生好感。',
      insights: [
        '重复接触并不总是带来吸引力。',
        '如果相处经历持续令人不舒服，频繁接触反而可能增加反感。',
      ],
    },
    lifeCase: {
      title: '共同参加活动的同窗',
      scenario: '一名学生刚进入新学校时，对班里的一位同学并没有特别感觉。后来，两人经常一起参加活动，逐渐发现彼此有相似的兴趣，也开始欣赏对方的性格。最初的普通同学关系，慢慢发展成好感。',
    },
    practicalTakeaways: {
      summary: '如果希望建立关系，可以增加自然、轻松的共同活动，而不是急于要求对方作出感情承诺。',
      actionablePoints: [
        '熟悉感可以提供机会，但真正维持关系的仍然是相互尊重、吸引力和相处质量。',
        '保持舒适而适度的出现频率，避免刻意施压。',
      ],
    },
    isDuplicateOfCore: true,
    duplicateCoreId: 'LAW053',
    duplicateCoreName: '曝光效应（熟识偏爱）',
  },
  {
    id: 'emo-03',
    order: 3,
    sectionIndex: 1,
    sectionTitle: '第一部分：爱情与吸引力',
    sectionEn: 'Attraction & Chemistry',
    sectionThemeColor: EMOTIONAL_SECTIONS[0].theme,
    titleZh: '相似性吸引',
    titleEn: 'Similarity-Attraction Effect',
    keywords: ['共同兴趣', '价值观', '归属感'],
    corePrinciple: '人们往往更容易与自己在某些重要方面相似的人建立好感和亲密关系。',
    deepBreakdown: {
      mechanism: '相似性可以体现在生活目标、价值观、金钱观、生活节奏以及对沟通和个人空间的期待上。相似性能减少沟通成本，让人更容易感到被理解。适度差异可以丰富关系，关键在于重要价值观是否兼容。',
      insights: [
        '生活目标和价值观相近。',
        '对家庭、金钱和责任的看法相似。',
        '两个人不需要在所有方面都相同，关键在于核心原则兼容。',
      ],
    },
    lifeCase: {
      title: '旅行偏好与金钱观的异同',
      scenario: '两个人都喜欢旅行，但一人喜欢奢华酒店，另一人习惯极简预算。如果能就预算达成共识，差异不会阻碍关系；若一人重视财务安全而另一人持续透支，冲突就会反复出现。',
    },
    practicalTakeaways: {
      summary: '选择长期伴侣时，不要只关注共同爱好，也要讨论金钱观、家庭责任、未来规划和冲突处理方式。',
      actionablePoints: [
        '定期交流对重大生活决策的核心原则。',
        '接纳细微的生活习惯差异，守住基本底线的一致。',
      ],
    },
  },
  {
    id: 'emo-04',
    order: 4,
    sectionIndex: 1,
    sectionTitle: '第一部分：爱情与吸引力',
    sectionEn: 'Attraction & Chemistry',
    sectionThemeColor: EMOTIONAL_SECTIONS[0].theme,
    titleZh: '互惠吸引规律',
    titleEn: 'Reciprocity of Liking',
    keywords: ['被喜欢', '情感回馈', '关系安全'],
    corePrinciple: '当我们感受到他人的真诚好感和接纳时，有时会更容易对对方产生好感。',
    deepBreakdown: {
      mechanism: '被喜欢能够带来积极的自我感受。当一个人认真听我们说话、尊重我们的意见并表现出真诚兴趣时，我们更愿意继续交流。但好感回馈并不是必然的，即使知道对方喜欢自己，我们依然有权不产生浪漫感情。',
      insights: [
        '真诚的接纳能消除人际防卫感。',
        '爱不是一笔必须回报的债务。对方可以感激你的善意，同时依然保留自己的感情选择。',
      ],
    },
    lifeCase: {
      title: '真诚倾听与友善互动',
      scenario: '一名女生发现一位男生总能认真听她表达观点，不会轻易嘲笑她，也不会在她拒绝邀请时表现出敌意。她感到舒服并逐渐愿意相处。友善的互动为关系发展创造了良好条件。',
    },
    practicalTakeaways: {
      summary: '表达好感时，可以主动、真诚，但不必把每次付出都当作投资。',
      actionablePoints: [
        '真诚表达欣赏，不带索取的心态。',
        '尊重对方的独立感受与选择自由。',
      ],
    },
  },
  {
    id: 'emo-05',
    order: 5,
    sectionIndex: 1,
    sectionTitle: '第一部分：爱情与吸引力',
    sectionEn: 'Attraction & Chemistry',
    sectionThemeColor: EMOTIONAL_SECTIONS[0].theme,
    titleZh: '光环效应',
    titleEn: 'Halo Effect',
    keywords: ['外貌', '第一印象', '优点扩散'],
    corePrinciple: '当我们发现一个人某方面特别突出时，可能不自觉地把这种积极印象扩展到其他方面。',
    deepBreakdown: {
      mechanism: '外貌、谈吐、财富、地位、幽默感或专业能力，都可能影响第一印象。问题在于，我们可能把一个领域的优势误认为全面的优秀。例如，外表有魅力不代表一定忠诚，事业成功不代表擅长沟通。',
      insights: [
        '单点优势被无意识放大为全局品质。',
        '评价伴侣时要把不同维度分开观察。',
      ],
    },
    lifeCase: {
      title: '事业才华与亲密责任的分野',
      scenario: '一名女性认识了一位事业成功、谈吐成熟的男性，起初认为他一定很有责任感。但相处后发现他经常失约，不愿为行为负责。她意识到事业能力与亲密关系中的责任感是完全不同的维度。',
    },
    practicalTakeaways: {
      summary: '评价伴侣时，要把不同维度分开观察：吸引力、诚信、情绪稳定性、责任感和沟通能力不能互相替代。',
      actionablePoints: [
        '不过早根据单一优势做出全面定论。',
        '多在压力和日常琐事中观察品格细节。',
      ],
    },
    isDuplicateOfCore: true,
    duplicateCoreId: 'LAW004',
    duplicateCoreName: '光环效应',
  },
  {
    id: 'emo-06',
    order: 6,
    sectionIndex: 1,
    sectionTitle: '第一部分：爱情与吸引力',
    sectionEn: 'Attraction & Chemistry',
    sectionThemeColor: EMOTIONAL_SECTIONS[0].theme,
    titleZh: '自我暴露与亲密感',
    titleEn: 'Self-Disclosure',
    keywords: ['分享内心', '脆弱', '信任建立'],
    corePrinciple: '适度、逐步地分享个人经历和真实感受，可能促进双方理解，并增加亲密感。',
    deepBreakdown: {
      mechanism: '从表面交流走向深层连接，需要逐步了解彼此重视什么、害怕什么、经历过什么以及在关系中需要什么。当分享得到尊重和理解时，关系更加安全。自我暴露必须自愿，过早要求透露隐私不等于真正亲密。',
      insights: [
        '渐进式暴露：随着信任度上升而逐步加深。',
        '双向尊重：不利用对方的脆弱反向攻击。',
      ],
    },
    lifeCase: {
      title: '从工作寒暄到敞开心扉',
      scenario: '两个人开始交往时只谈工作日常。随着信任增加，一方分享了过去受过的伤害，另一方认真倾听、不加嘲笑，双方因此更了解彼此的敏感点和需求。',
    },
    practicalTakeaways: {
      summary: '建立亲密关系不必一次说出所有秘密。可以循序渐进地分享，观察对方是否尊重你的边界，并逐步建立双向信任。',
      actionablePoints: [
        '先分享中度个人感受，观察对方反应。',
        '给予对方安全无评判的倾听空间。',
      ],
    },
  },
  {
    id: 'emo-07',
    order: 7,
    sectionIndex: 1,
    sectionTitle: '第一部分：爱情与吸引力',
    sectionEn: 'Attraction & Chemistry',
    sectionThemeColor: EMOTIONAL_SECTIONS[0].theme,
    titleZh: '共同经历效应',
    titleEn: 'Shared Experiences',
    keywords: ['共同记忆', '情感连接', '关系历史'],
    corePrinciple: '一起经历的事件可能形成共同记忆，增加双方的熟悉感和归属感。',
    deepBreakdown: {
      mechanism: '共同经历的价值不只是活动本身，还包括双方如何合作、如何应对困难以及如何理解那段经历。旅行、共同完成项目甚至成功解决一次冲突，都会成为关系历史的一部分。',
      insights: [
        '经历是关系的基石，但共同经历本身不保证长久。',
        '相处中若持续存在伤害，共同历史不能代替解决实质问题。',
      ],
    },
    lifeCase: {
      title: '旅行中的分歧与磨合',
      scenario: '一对伴侣初次旅行时因路线分歧重新调整计划。几年后回忆起来，不仅记住了美景，更记住了双方学会协调意见的过程。',
    },
    practicalTakeaways: {
      summary: '有意识地创造健康的共同体验（如学习、运动、旅行），增加共同记忆。但出现问题时，必须直接面对而非依赖回忆抵挡。',
      actionablePoints: [
        '定期安排具有合作性质的活动。',
        '在共同经历中体验彼此面对压力的反应。',
      ],
    },
  },
  {
    id: 'emo-08',
    order: 8,
    sectionIndex: 1,
    sectionTitle: '第一部分：爱情与吸引力',
    sectionEn: 'Attraction & Chemistry',
    sectionThemeColor: EMOTIONAL_SECTIONS[0].theme,
    titleZh: '选择性注意',
    titleEn: 'Selective Attention in Relationships',
    keywords: ['只看优点', '只看缺点', '注意力偏向'],
    corePrinciple: '人的注意力有限，因此会优先关注某些信息，而忽略其他信息。这种选择可能影响我们对伴侣的整体判断。',
    deepBreakdown: {
      mechanism: '喜欢某人时容易只看优点并忽略不妥之处；感到失望时则可能反过来只盯缺点。两种偏向都会让人看到不完整的关系图景。',
      insights: [
        '甜蜜期容易忽视客观问题。',
        '冲突期容易抹杀对方的长期支持。',
      ],
    },
    lifeCase: {
      title: '失约借口与争吵后的全面否定',
      scenario: '男生因热恋把女友的长期缺乏沟通解释为“太忙”；另一名女生在争吵后觉得伴侣所有行为都讨厌，忽略了对方平时的实际关怀。',
    },
    practicalTakeaways: {
      summary: '不要只凭一段甜蜜时光判断关系，也不要只凭一次争吵否定关系。观察长期模式才是检验真伪的硬标准。',
      actionablePoints: [
        '建立整体视角的长期评估表。',
        '在情绪剧烈时避免做出一锤定音的定论。',
      ],
    },
  },
  {
    id: 'emo-09',
    order: 9,
    sectionIndex: 1,
    sectionTitle: '第一部分：爱情与吸引力',
    sectionEn: 'Attraction & Chemistry',
    sectionThemeColor: EMOTIONAL_SECTIONS[0].theme,
    titleZh: '预期效应',
    titleEn: 'Expectation Effect in Romance',
    keywords: ['期待', '解释方式', '关系反馈'],
    corePrinciple: '我们对一段关系的期待，会影响自己的注意力、行为和对对方的解释。',
    deepBreakdown: {
      mechanism: '如果相信自己一定会被抛弃，人就会对模糊信号格外敏感；若相信可以通过沟通改善，就会更主动提出需求并倾听。期待不决定结果，但深刻影响参与方式。',
      insights: [
        '推测往往先于事实发生。',
        '区分客观事实与主观脑补至关重要。',
      ],
    },
    lifeCase: {
      title: '未及时回复消息的两种心念',
      scenario: '伴侣未回消息，一人认定“他不爱我了”；另一人则想“我有点担心，但还不知道原因，等他空下来直接问”。后者避免了无谓的敌对升级。',
    },
    practicalTakeaways: {
      summary: '当不安出现时，先区分事实和推测。需要确认时，直接沟通比不断猜测或试探更有效。',
      actionablePoints: [
        '核对事实清单：我知道的 vs 我脑补的。',
        '用温和而明确的语言向对方求证。',
      ],
    },
  },
  {
    id: 'emo-10',
    order: 10,
    sectionIndex: 1,
    sectionTitle: '第一部分：爱情与吸引力',
    sectionEn: 'Attraction & Chemistry',
    sectionThemeColor: EMOTIONAL_SECTIONS[0].theme,
    titleZh: '吸引力与熟悉感的边界',
    titleEn: 'Boundaries of Familiarity & Attraction',
    keywords: ['熟悉不等于合适', '激情与长期关系', '多维考量'],
    corePrinciple: '吸引力、熟悉感和长期关系质量是不同的维度，不能简单地互相推导。',
    deepBreakdown: {
      mechanism: '最初的吸引力受外貌、兴奋感、相似性与新鲜感驱动；而长期关系则涉及生活目标、冲突解决、责任承担与现实条件。一个人可以让你心动，却不一定适合长期生活。',
      insights: [
        '心动不能直接推论出生活适配。',
        '平淡开端的相处也可能孕育出深沉的信任与爱。',
      ],
    },
    lifeCase: {
      title: '火花四射与平淡知己的抉择',
      scenario: '一对初见火花四射的恋人因金钱观天天争吵；另一对从普通朋友做起的伴侣，却在信任与共同经历中建立了美满幸福的长期家庭。',
    },
    practicalTakeaways: {
      summary: '不要只问“我有多喜欢他”，还要问“我们能否共同建立一种双方都能接受的生活”。',
      actionablePoints: [
        '分清审美吸引与协作过日子的本质差别。',
        '理性考量未来现实条件的契合度。',
      ],
    },
  },

  // =======================================================
  // 第二部分：依恋、安全感与情绪的10条规律 (11 - 20)
  // =======================================================
  {
    id: 'emo-11',
    order: 11,
    sectionIndex: 2,
    sectionTitle: '第二部分：依恋与安全感',
    sectionEn: 'Attachment & Security',
    sectionThemeColor: EMOTIONAL_SECTIONS[1].theme,
    titleZh: '依恋理论',
    titleEn: 'Attachment Theory',
    keywords: ['安全感', '亲密需求', '关系模式'],
    corePrinciple: '早期与重要照顾者的关系经验，可能影响一个人成年后如何理解亲密、回应分离和处理情绪，但依恋模式并非固定不变。',
    deepBreakdown: {
      mechanism: '安全型能够亲近他人也能独立；焦虑型对不确定性敏感、害怕被弃；回避型重视独立、在亲密压力下退缩。这是概括性模式，并非固定标签，人也能同时具备不同倾向。',
      insights: [
        '依恋是适应环境的行为程序，而非不可改变的人格判决。',
        '不贴标签，而针对具体需求展开沟通。',
      ],
    },
    lifeCase: {
      title: '未回消息时的内心独白',
      scenario: '数小时未回消息，焦虑方担心被弃，回避方觉得为何非要秒回。若不沟通彼此感受，极易演变为追问与退缩的恶性死结。',
    },
    practicalTakeaways: {
      summary: '与其贴标签，不如具体讨论：多久联系一次双方舒服？需要独处时如何表达？感到不安时如何获得回应？',
      actionablePoints: [
        '明确表达彼此对联系频率的期待。',
        '建立独处报备机制，给予彼此心理预估。',
      ],
    },
  },
  {
    id: 'emo-12',
    order: 12,
    sectionIndex: 2,
    sectionTitle: '第二部分：依恋与安全感',
    sectionEn: 'Attachment & Security',
    sectionThemeColor: EMOTIONAL_SECTIONS[1].theme,
    titleZh: '情绪调节与共同调节',
    titleEn: 'Co-regulation',
    keywords: ['安抚', '情绪稳定', '共同调节'],
    corePrinciple: '人的情绪有时可以通过与他人的互动得到调节。平静、可靠的回应可能帮助我们恢复稳定。',
    deepBreakdown: {
      mechanism: '当人焦虑时身体处于高警觉，讲大道理很难立即生效。一个安全平静的互动环境能帮助降低紧张水平。但共同调节不意味着一个人要承担伴侣全部情绪责任。',
      insights: [
        '先承接情绪，再探讨理性方案。',
        '双方仍需发展独立的自我安抚能力。',
      ],
    },
    lifeCase: {
      title: '受挫哭泣时的陪伴',
      scenario: '女性职场受挫落泪，伴侣没有粗暴说“这有什么大不了的”，而是温和陪伴倾听。待情绪平复后，两人再一起探讨具体对策。',
    },
    practicalTakeaways: {
      summary: '情绪强烈时，先处理情绪再处理问题。双方也应学习独立调节情绪，而非要求伴侣为自己的快乐全权负责。',
      actionablePoints: [
        '面对伴侣的负面情绪时，先给予拥抱与倾听。',
        '避免在对方崩溃时进行逻辑辩论。',
      ],
    },
  },
  {
    id: 'emo-13',
    order: 13,
    sectionIndex: 2,
    sectionTitle: '第二部分：依恋与安全感',
    sectionEn: 'Attachment & Security',
    sectionThemeColor: EMOTIONAL_SECTIONS[1].theme,
    titleZh: '情绪验证',
    titleEn: 'Emotional Validation',
    keywords: ['被理解', '被接纳', '情绪表达'],
    corePrinciple: '当一个人的感受被认真理解时，他通常更容易感到安全，并愿意继续沟通。',
    deepBreakdown: {
      mechanism: '情绪验证不等于赞同对方的全部事实判断，而是承认对方当前确实正在经历这种难受感受。认可感受是恢复理性的前提。',
      insights: [
        '“我理解你为什么生气”不等于“你生气后说的所有话都对”。',
        '防御性反驳只会让对话迅速陷入僵局。',
      ],
    },
    lifeCase: {
      title: '从防御到验证的沟通转变',
      scenario: '伴侣抱怨“你一直忙工作我觉得我不重要”。防御回答是“我这么辛苦你还抱怨”，验证回答则是“你是不是觉得我们相处时间太少了？我想听听你的感受”。',
    },
    practicalTakeaways: {
      summary: '先理解感受，再核实事实，最后讨论行动。这一顺序远比立即辩解更利于解决冲突。',
      actionablePoints: [
        '用“我能感受到你现在的委屈”开场。',
        '在确认对方感受到被听见后再陈述你的情况。',
      ],
    },
  },
  {
    id: 'emo-14',
    order: 14,
    sectionIndex: 2,
    sectionTitle: '第二部分：依恋与安全感',
    sectionEn: 'Attachment & Security',
    sectionThemeColor: EMOTIONAL_SECTIONS[1].theme,
    titleZh: '认知重评',
    titleEn: 'Cognitive Reappraisal',
    keywords: ['换个角度', '解释方式', '情绪管理'],
    corePrinciple: '改变对事件意义的理解，可能改变自己对事件的情绪反应。',
    deepBreakdown: {
      mechanism: '同一件事存在多种解释框架。选择哪种解释会直接左右情绪与应对方式。认知重评不是盲目乐观，而是避免把未经核实的消极猜测直接当成客观事实。',
      insights: [
        '我确实知道的事实是什么？',
        '哪些部分只是我的主观推测？',
        '我可以采取什么行动来确认事实？',
      ],
    },
    lifeCase: {
      title: '未被主动介绍的聚会',
      scenario: '聚会时伴侣未主动介绍自己，一种解释是“他嫌弃我拿不出手”，另一种则是“他可能没意识到我在意，我可以稍后告诉他”。第二种解释创造了良性沟通机会。',
    },
    practicalTakeaways: {
      summary: '情绪上头时，自问三件事：事实是什么？推测是什么？我能怎样核实事实？',
      actionablePoints: [
        '不将未经验证的消极结论视为真理。',
        '以探寻的态度展开双向交流。',
      ],
    },
  },
  {
    id: 'emo-15',
    order: 15,
    sectionIndex: 2,
    sectionTitle: '第二部分：依恋与安全感',
    sectionEn: 'Attachment & Security',
    sectionThemeColor: EMOTIONAL_SECTIONS[1].theme,
    titleZh: '情绪传染',
    titleEn: 'Emotional Contagion',
    keywords: ['语气', '表情', '氛围', '情绪影响'],
    corePrinciple: '人们可能受到他人的情绪表达影响，出现相似或相关的情绪反应。',
    deepBreakdown: {
      mechanism: '人会敏锐观察伴侣的语气、眼神与动作来判断环境安全度。长期处在充满敌意和防卫的语境中会让人神经紧绷；而平静温和的语调则能迅速降温。',
      insights: [
        '语速与音量是情绪的无声扩音器。',
        '持续的语言辱骂需要确立红线边界，不能单纯指望情绪调节。',
      ],
    },
    lifeCase: {
      title: '声音逐级拔高的争吵',
      scenario: '一方提高音量翻旧账，另一方立即以更大音量反击，几次之后哪怕对方稍微皱眉，双方就立刻进入高度敌对状态。',
    },
    practicalTakeaways: {
      summary: '若希望冲突降温，主动放慢语速、降低音量，在必要时申请中场休息。但这不意味着无底线容忍持续侮辱。',
      actionablePoints: [
        '争吵时刻意将语速放慢一半。',
        '在一方出现攻击性失控时，暂停10分钟。',
      ],
    },
    isDuplicateOfCore: true,
    duplicateCoreId: 'LAW090',
    duplicateCoreName: '情绪传染效应',
  },
  {
    id: 'emo-16',
    order: 16,
    sectionIndex: 2,
    sectionTitle: '第二部分：依恋与安全感',
    sectionEn: 'Attachment & Security',
    sectionThemeColor: EMOTIONAL_SECTIONS[1].theme,
    titleZh: '情绪记忆效应',
    titleEn: 'Emotional Memory in Romance',
    keywords: ['深刻记忆', '情感触发', '过去经历'],
    corePrinciple: '情绪强烈的经历可能更容易被记住，并影响我们后来对相似情境的判断。',
    deepBreakdown: {
      mechanism: '曾经被背叛过的人对行程变动极度敏感；曾经被忽视的人对延迟回复感到难受。这些反应不是无理取闹，而是过去强烈创伤在大脑中形成的神经联想反射。',
      insights: [
        '理解自己的情感雷区与触发开关。',
        '把过去经历与当下伴侣的真实意图区分开来。',
      ],
    },
    lifeCase: {
      title: '前任创伤在新恋情中的投影',
      scenario: '经历过被前任突然抛弃的人，在新恋情中只要伴侣因加班减少联系，就会本能恐慌关系即将瓦解，尽管新伴侣非常专一诚恳。',
    },
    practicalTakeaways: {
      summary: '对自己说：“这件事让我想起过去，但我还需要了解当下实际发生了什么”。必要时寻求专业心理协助。',
      actionablePoints: [
        '向伴侣说明自己的敏感点：“我过去在这方面受过伤，需要一点额外确认”。',
        '避免让现在的伴侣为前任的错误买单。',
      ],
    },
    isDuplicateOfCore: true,
    duplicateCoreId: 'LAW027',
    duplicateCoreName: '情绪一致性记忆',
  },
  {
    id: 'emo-17',
    order: 17,
    sectionIndex: 2,
    sectionTitle: '第二部分：依恋与安全感',
    sectionEn: 'Attachment & Security',
    sectionThemeColor: EMOTIONAL_SECTIONS[1].theme,
    titleZh: '损失厌恶与害怕失去爱情',
    titleEn: 'Loss Aversion in Relationships',
    keywords: ['分离恐惧', '舍不得', '关系投入'],
    corePrinciple: '在许多情境中，人们对失去已有关系的痛苦，可能比获得一段同等价值新关系所带来的快乐更敏感。',
    deepBreakdown: {
      mechanism: '一段长期关系包含了现实生活利益、共同记忆、身份认同与生活习惯。结束意味着巨大的全方位失去感。但“害怕失去”并不等于“这段关系依然值得继续”。',
      insights: [
        '痛苦往往来自于剥离既有生活习惯的阵痛。',
        '不能用过去的投入年限去为未来的持续痛苦买单。',
      ],
    },
    lifeCase: {
      title: '“已经八年了，我无法放弃”',
      scenario: '长期处于缺乏尊重的伴侣关系中，当事人反复告诉自己：“我们已经八年了，不能就这样放弃”。八年确实值得尊重，但不能单独保证未来八年会更幸福。',
    },
    practicalTakeaways: {
      summary: '评估关系时，不要只问“离开会失去什么”，更要问“如果继续保持现状，我将付出多大的身心代价”。',
      actionablePoints: [
        '列出留在关系中的实际代价清单。',
        '把对未知的恐惧与对当下的理性评估区分开。',
      ],
    },
    isDuplicateOfCore: true,
    duplicateCoreId: 'LAW014',
    duplicateCoreName: '损失厌恶',
  },
  {
    id: 'emo-18',
    order: 18,
    sectionIndex: 2,
    sectionTitle: '第二部分：依恋与安全感',
    sectionEn: 'Attachment & Security',
    sectionThemeColor: EMOTIONAL_SECTIONS[1].theme,
    titleZh: '不确定性与焦虑',
    titleEn: 'Uncertainty and Anxiety in Dating',
    keywords: ['猜测', '等待', '关系不确定性'],
    corePrinciple: '对某些人而言，不确定的结果可能比明确但不理想的结果更难承受。',
    deepBreakdown: {
      mechanism: '关系没有明确状态时，人容易陷入“他到底喜不喜欢我、我们算什么”的无休止消耗中。模糊状态占据了大量心智带宽，造成持续焦虑。',
      insights: [
        '模糊往往掩盖了双方期待的不一致。',
        '获得明确的真实信息比长期虚耗更健康。',
      ],
    },
    lifeCase: {
      title: '约会数月却从不明确定义',
      scenario: '约会数月未曾探讨排他性，一人认为在稳步推进，另一人觉得只是随意约会，期待的分化最终导致严重痛苦与失望。',
    },
    practicalTakeaways: {
      summary: '对于重要关系，明确沟通远胜于长期盲目猜测。你可以温和地表达：“我很享受相处，也想了解你对未来的期待，我们可以聊聊吗？”',
      actionablePoints: [
        '主动发起关于关系走向的坦诚对话。',
        '接受对方给出的明确回答，据此规划自己的生活。',
      ],
    },
  },
  {
    id: 'emo-19',
    order: 19,
    sectionIndex: 2,
    sectionTitle: '第二部分：依恋与安全感',
    sectionEn: 'Attachment & Security',
    sectionThemeColor: EMOTIONAL_SECTIONS[1].theme,
    titleZh: '反刍思维',
    titleEn: 'Rumination after Heartbreak',
    keywords: ['反复回想', '失恋', '无法放下'],
    corePrinciple: '反复思考痛苦经历，却没有获得新的理解或推动实际行动时，可能形成反刍思维。',
    deepBreakdown: {
      mechanism: '正常反思有助于成长，反刍则往往陷入“为什么是他这样对我、如果当初没说那句话会怎样”的原地打转，无法带来新信息，却不断重激活痛苦神经通路。',
      insights: [
        '反复琢磨过去并不会自动产生答案。',
        '给复盘设定清晰的思考边界。',
      ],
    },
    lifeCase: {
      title: '天天反复逐字翻看聊天记录',
      scenario: '分手后每天逐行排查过去聊天记录，试图找到感情变淡的精确秒数，导致无法专注工作、社交全面停滞。',
    },
    practicalTakeaways: {
      summary: '为复盘设定清晰边界：记录学到了什么、哪些无法确认、接下来做什么。减少无休止翻看记录，逐步恢复日常节奏。',
      actionablePoints: [
        '设定每天只允许思考 15 分钟的复盘时间盒。',
        '通过运动、规律作息与工作拉回注意力。',
      ],
    },
  },
  {
    id: 'emo-20',
    order: 20,
    sectionIndex: 2,
    sectionTitle: '第二部分：依恋与安全感',
    sectionEn: 'Attachment & Security',
    sectionThemeColor: EMOTIONAL_SECTIONS[1].theme,
    titleZh: '自我慈悲',
    titleEn: 'Self-Compassion in Rejection',
    keywords: ['失恋', '自我接纳', '重新建立自信'],
    corePrinciple: '面对失恋、犯错或被拒绝时，以理解而非羞辱的态度对待自己，可能更有利于情绪恢复。',
    deepBreakdown: {
      mechanism: '关系受挫时，人容易泛化为对自我的全盘抹杀：“他不选我，说明我毫无价值”。但关系不成功只能说明彼此不适合双方期待的方式，绝非对个人全部价值的判决。',
      insights: [
        '被拒绝不等于自身能力或人格低下。',
        '自我慈悲是自我负责，而非逃避反省。',
      ],
    },
    lifeCase: {
      title: '从自我全盘否定到自我接纳',
      scenario: '被拒绝后认定自己不够优秀不敢再恋爱；后来学会区分“对方没有产生同等感情”与“自己是否拥有被爱能力”完全是两码事。',
    },
    practicalTakeaways: {
      summary: '允许自己难过，但不要把失去一个人的选择变成对自己一生的判决书。以温柔理解的心态对待受挫的自己。',
      actionablePoints: [
        '用对待好朋友受挫时的语气与自己内心对话。',
        '坚信自身的独特价值依然完好无损。',
      ],
    },
  },

  // ========================================================
  // 第三部分：亲密关系、沟通与冲突的10条规律 (21 - 30)
  // ========================================================
  {
    id: 'emo-21',
    order: 21,
    sectionIndex: 3,
    sectionTitle: '第三部分：亲密关系与冲突沟通',
    sectionEn: 'Communication & Conflict',
    sectionThemeColor: EMOTIONAL_SECTIONS[2].theme,
    titleZh: '依恋激活与追逐—退缩循环',
    titleEn: 'Pursuer–Distancer Pattern',
    keywords: ['一个追问', '一个沉默', '关系循环'],
    corePrinciple: '在一些伴侣关系中，一方越想获得回应，另一方越想退出冲突；而一方的退缩又会增加另一方的焦虑。',
    deepBreakdown: {
      mechanism: '常见循环是一方不安因而急迫追问，另一方承压而减少回应；追问方感觉被忽视而更加激烈，退缩方不堪重负进一步沉默，最终双双精疲力竭受创。',
      insights: [
        '追逐来自焦虑，退缩来自过载。',
        '双方都需要看到彼此行为背后的脆弱动机。',
      ],
    },
    lifeCase: {
      title: '争吵后的关门与拍门',
      scenario: '争吵后妻子希望立即说清楚，情绪激动的丈夫进书房关门独处却未说明何时回来。妻子把沉默视作拒绝，丈夫把追问视作控制。',
    },
    practicalTakeaways: {
      summary: '双方约定暂停机制：“我现在需要30分钟冷静，但我不逃避，今晚八点我们继续谈”。退缩方说明归期，追逐方尊重暂停。',
      actionablePoints: [
        '书面约定争吵冷静暂停规则。',
        '暂停方必须言出必行，准时返回开启对话。',
      ],
    },
  },
  {
    id: 'emo-22',
    order: 22,
    sectionIndex: 3,
    sectionTitle: '第三部分：亲密关系与冲突沟通',
    sectionEn: 'Communication & Conflict',
    sectionThemeColor: EMOTIONAL_SECTIONS[2].theme,
    titleZh: '积极倾听',
    titleEn: 'Active Listening in Intimacy',
    keywords: ['理解', '复述', '避免误会'],
    corePrinciple: '认真倾听并确认自己理解了对方的意思，可以减少误解，并让沟通更加有效。',
    deepBreakdown: {
      mechanism: '倾听不是安静等待自己反驳的机会，而是努力确认对方真正想表达的事实与情绪。包含不打断、抓取核心感受、用自己的话复述并询问确认。',
      insights: [
        '确认理解比立即辩解更能化解怒气。',
        '复述对方感受能让对方感到被重视。',
      ],
    },
    lifeCase: {
      title: '“你总把工作放第一”的化解',
      scenario: '伴侣抱怨你总把工作放第一，反驳“我不是为了家吗”只会引爆战火；反问“你是不是觉得最近我们相处时间太少了”则能直击痛点。',
    },
    practicalTakeaways: {
      summary: '在争吵辩护前，先用一句话复述确认对方的感受，再表达自己的视角。',
      actionablePoints: [
        '练习句式：“我听到你说……你感到有些失落，是这样吗？”',
        '在对方确认你理解前，先不急于为自己辩白。',
      ],
    },
  },
  {
    id: 'emo-23',
    order: 23,
    sectionIndex: 3,
    sectionTitle: '第三部分：亲密关系与冲突沟通',
    sectionEn: 'Communication & Conflict',
    sectionThemeColor: EMOTIONAL_SECTIONS[2].theme,
    titleZh: '非暴力沟通',
    titleEn: 'Nonviolent Communication',
    keywords: ['观察', '感受', '需要', '请求'],
    corePrinciple: '把具体行为、个人感受、背后的需要和可执行请求分开表达，有助于减少指责。',
    deepBreakdown: {
      mechanism: '四大步骤：观察（客观发生了什么，不带评判）、感受（给我带来的内在情绪）、需要（我内心真正在意什么）、请求（希望具体采取的可执行行动）。',
      insights: [
        '用事实描述替代“你总是/从来”的人格攻击。',
        '用清晰具体的请求替代抽象的情感抱怨。',
      ],
    },
    lifeCase: {
      title: '指责与OSNR表达的巨大差异',
      scenario: '“你根本不关心我是个自私鬼”（指责）vs “这周三天没一起晚餐，我感到失落，我很在乎陪伴，我们每周能否安排两天共进晚餐？”（具体请求）。',
    },
    practicalTakeaways: {
      summary: '用具体行为替代人格攻击，用可执行请求替代模糊抱怨。若对方长期漠视，依然要坚守自身底线。',
      actionablePoints: [
        '观察：明确时间地点事实。',
        '请求：提出对方易于执行的小目标。',
      ],
    },
  },
  {
    id: 'emo-24',
    order: 24,
    sectionIndex: 3,
    sectionTitle: '第三部分：亲密关系与冲突沟通',
    sectionEn: 'Communication & Conflict',
    sectionThemeColor: EMOTIONAL_SECTIONS[2].theme,
    titleZh: '负面互动循环',
    titleEn: 'Negative Interaction Cycle',
    keywords: ['翻旧账', '防御', '指责', '恶化'],
    corePrinciple: '如果冲突反复通过指责、防御、轻蔑和冷处理来解决，双方可能形成越来越难以打破的负面互动模式。',
    deepBreakdown: {
      mechanism: '问题不仅是某一句话，而是双方如何不断恶性升级回应。一次小分歧因旧怨迅速上升为“争论谁更有理、谁更可恶”，导致最初的问题彻底被淹没。',
      insights: [
        '绝对化词汇（永远、从来）是点燃旧账的火柴。',
        '就事论事是阻断恶性循环的唯一闸门。',
      ],
    },
    lifeCase: {
      title: '从忘记买菜演变成人品清算',
      scenario: '丈夫忘买菜，妻子骂“你永远不可靠”，丈夫回“你从来只批评我”，随后翻出几个月的陈芝麻烂谷子，最初的菜早已无人关心。',
    },
    practicalTakeaways: {
      summary: '争执时坚决锁定当前一个具体问题，严禁使用“永远”、“从来”等绝对词汇，情绪激动时果断叫停。',
      actionablePoints: [
        '订立家规：一次争吵只谈今天发生的一件事。',
        '一旦有人翻出上周以前的事，必须立刻亮黄牌暂停。',
      ],
    },
  },
  {
    id: 'emo-25',
    order: 25,
    sectionIndex: 3,
    sectionTitle: '第三部分：亲密关系与冲突沟通',
    sectionEn: 'Communication & Conflict',
    sectionThemeColor: EMOTIONAL_SECTIONS[2].theme,
    titleZh: '修复尝试',
    titleEn: 'Repair Attempts in Conflict',
    keywords: ['缓和冲突', '道歉', '重新连接'],
    corePrinciple: '伴侣在冲突中作出的缓和、道歉、幽默或重新靠近的尝试，可能帮助双方阻止争吵升级。',
    deepBreakdown: {
      mechanism: '修复尝试不一定是正式道歉，也可能是一句“我们先别互相攻击好吗”或一句温和的幽默。关键是双方是否能够敏锐识别并接纳这些尝试，而非继续补刀。',
      insights: [
        '冲突不是输赢较量。',
        '接纳对方的台阶是成熟关系的顶级智慧。',
      ],
    },
    lifeCase: {
      title: '争吵高潮时的主动暂停',
      scenario: '财务争吵中，一方意识到音量失控主动说：“我现在很激动，但我不想伤害你，我们先停五分钟”。若另一方愿意接话停火，危机便得以及时化解。',
    },
    practicalTakeaways: {
      summary: '不要把争吵当较量。愿意发出或接纳修复信号，不代表在所有事情上妥协认输，而是宣告爱比胜负更重要。',
      actionablePoints: [
        '准备一句专属停火口令（如“我爱你但我们现在都太累了”）。',
        '对方递出橄榄枝时，坚决顺阶而下。',
      ],
    },
  },
  {
    id: 'emo-26',
    order: 26,
    sectionIndex: 3,
    sectionTitle: '第三部分：亲密关系与冲突沟通',
    sectionEn: 'Communication & Conflict',
    sectionThemeColor: EMOTIONAL_SECTIONS[2].theme,
    titleZh: '公平理论',
    titleEn: 'Equity Theory in Intimacy',
    keywords: ['付出', '责任', '被忽视的感觉'],
    corePrinciple: '人们通常会关注关系中的投入和回报是否合理，而不仅仅是付出了多少。',
    deepBreakdown: {
      mechanism: '付出包含金钱、时间、家务、育儿与情绪支持。公平不是机械的五五开，而是双方是否认可彼此的分工合理，能否在负荷变化时动态协调。一方若感觉被当成理所当然，怨气必将爆发。',
      insights: [
        '无形的家务与情绪劳动需要被清晰看见。',
        '分工需要动态调整，没有一成不变的公式。',
      ],
    },
    lifeCase: {
      title: '全职育儿与职场打拼的分歧',
      scenario: '一方主外收入高，另一方承担繁重家务育儿。若双方认可并互相体谅则稳定；若赚钱方把对方劳动当理所当然，长期不满必将累积崩溃。',
    },
    practicalTakeaways: {
      summary: '定期共同梳理家庭总负荷，真诚看见对方那些看不见的付出，而不只是攀比谁赚的钱多。',
      actionablePoints: [
        '每月举行一次轻松的家务与生活协调会。',
        '对伴侣默默承担的琐事表达真诚感谢。',
      ],
    },
  },
  {
    id: 'emo-27',
    order: 27,
    sectionIndex: 3,
    sectionTitle: '第三部分：亲密关系与冲突沟通',
    sectionEn: 'Communication & Conflict',
    sectionThemeColor: EMOTIONAL_SECTIONS[2].theme,
    titleZh: '积极回应',
    titleEn: 'Perceived Partner Responsiveness',
    keywords: ['被理解', '被重视', '情感支持'],
    corePrinciple: '一个人感到伴侣真正理解、关心和重视自己，通常与更好的亲密关系体验有关。',
    deepBreakdown: {
      mechanism: '关心不单是按自己的习惯给予，而在于搞清楚对方此时真正需要什么。有人需要实际建议，有人只需要陪伴，有人需要先被好好倾听。',
      insights: [
        '用对方需要的方式去爱，而非用自己习惯的方式强加。',
        '直接询问需求是极简高效的智慧。',
      ],
    },
    lifeCase: {
      title: '先给建议还是先听倾诉',
      scenario: '妻子回家吐槽工作不顺只想倾诉，丈夫直接搬出三大改进方案。丈夫虽好意，妻子却倍感压抑委屈，因为她此时需要的是同理心，而非说教。',
    },
    practicalTakeaways: {
      summary: '先问一句：“你现在更希望我静静听你说，还是我们一起想解决对策？”这能避免绝大多数误会。',
      actionablePoints: [
        '在伴侣倾诉时，先克制提出方案的冲动。',
        '确认对方的真实诉求后再行动。',
      ],
    },
  },
  {
    id: 'emo-28',
    order: 28,
    sectionIndex: 3,
    sectionTitle: '第三部分：亲密关系与冲突沟通',
    sectionEn: 'Communication & Conflict',
    sectionThemeColor: EMOTIONAL_SECTIONS[2].theme,
    titleZh: '边界理论',
    titleEn: 'Personal Boundaries in Love',
    keywords: ['个人空间', '尊重', '独立性'],
    corePrinciple: '健康的亲密关系需要情感连接，也需要对个人空间、时间、隐私和选择的尊重。',
    deepBreakdown: {
      mechanism: '亲密绝不等于消灭独立。双方可以共享生活，但必须保有各自的朋友、爱好与合理私人空间。边界是保护自尊与敬畏的护城河，不能把控制行为包装成“太爱你”。',
      insights: [
        '没有边界的黏合必导致窒息与反弹。',
        '边界不是惩罚，而是健康相处的说明书。',
      ],
    },
    lifeCase: {
      title: '实时查岗与隐私边界冲突',
      scenario: '男友要求随时查岗并看所有聊天记录，声称这是因为深爱。女友深感被侵犯，强调忠诚需要共识但绝不能建立在剥夺人格隐私之上。',
    },
    practicalTakeaways: {
      summary: '清楚表达个人边界并观察对方是否尊重。若边界被肆意践踏，问题已上升为人格尊重的根本缺失。',
      actionablePoints: [
        '坦诚沟通各自对社交、隐私与独处的时间边界。',
        '对无理侵犯尊严的控制坚决说不。',
      ],
    },
  },
  {
    id: 'emo-29',
    order: 29,
    sectionIndex: 3,
    sectionTitle: '第三部分：亲密关系与冲突沟通',
    sectionEn: 'Communication & Conflict',
    sectionThemeColor: EMOTIONAL_SECTIONS[2].theme,
    titleZh: '冲突中的基本归因错误',
    titleEn: 'Fundamental Attribution Error in Conflict',
    keywords: ['人格判断', '情境因素', '误解'],
    corePrinciple: '在解释他人行为时，人们有时过度归因于对方的性格，而忽略具体情境。',
    deepBreakdown: {
      mechanism: '伴侣犯错时我们容易断定“他自私、不可靠”；自己犯错时却找借口“今天情况特殊”。理解情境不是逃避责任，而是帮助做出准确客观的判断。',
      insights: [
        '避免双重评判标准。',
        '先就具体行为沟通，再判断是否存在长期模式。',
      ],
    },
    lifeCase: {
      title: '缺席聚餐的真相',
      scenario: '妻子发现丈夫没参加家庭活动认定其不顾家，后来得知丈夫当天遇到突发紧急工作。丈夫虽有沟通不足之责，但绝非不爱家人的恶意品行问题。',
    },
    practicalTakeaways: {
      summary: '先讨论具体行为与事实，不要急于升级为对伴侣人品与动机的诛心评判。',
      actionablePoints: [
        '克制扣帽子的冲动，先核实事实。',
        '就事论事地寻找防范类似事件的协作方案。',
      ],
    },
    isDuplicateOfCore: true,
    duplicateCoreId: 'LAW050',
    duplicateCoreName: '基本归因错误',
  },
  {
    id: 'emo-30',
    order: 30,
    sectionIndex: 3,
    sectionTitle: '第三部分：亲密关系与冲突沟通',
    sectionEn: 'Communication & Conflict',
    sectionThemeColor: EMOTIONAL_SECTIONS[2].theme,
    titleZh: '关系承诺与持续投入',
    titleEn: 'Commitment & Sustained Investment',
    keywords: ['长期选择', '共同目标', '稳定性'],
    corePrinciple: '长期关系不仅依靠感情，也受到承诺、共同目标、替代选择和已经形成的共同生活等因素影响。',
    deepBreakdown: {
      mechanism: '稳定关系源自愿望真诚、目标兼容、愿在困难时共同解决问题。但“在一起很久”不等于“关系一定健康”，人也可能因恐惧或无选择而滞留在痛苦中。',
      insights: [
        '健康的稳定基于每日自愿的选择，而非无奈捆绑。',
        '承诺需要持续用互相尊重的可见行动去维护。',
      ],
    },
    lifeCase: {
      title: '携手十年风雨的磨合',
      scenario: '十年夫妻经历诸多起伏，坦诚讨论分歧、各自承担责任并持续动态调整相处模式，这绝非单纯熬时间，而是持续的主动投入。',
    },
    practicalTakeaways: {
      summary: '判断一段关系，既要看初始感情，更要看双方是否在日常中持续作出相互尊重、实际可见的主动投入。',
      actionablePoints: [
        '把对伴侣的好看作日常的主动选择。',
        '在关键时刻用实际行动兑现承诺。',
      ],
    },
  },

  // ========================================================
  // 第四部分：失恋、嫉妒、分离与关系困局的10条规律 (31 - 40)
  // ========================================================
  {
    id: 'emo-31',
    order: 31,
    sectionIndex: 4,
    sectionTitle: '第四部分：失恋与关系困局',
    sectionEn: 'Heartbreak & Detachment',
    sectionThemeColor: EMOTIONAL_SECTIONS[3].theme,
    titleZh: '间歇性强化',
    titleEn: 'Intermittent Reinforcement in Toxic Love',
    keywords: ['忽冷忽热', '不确定奖励', '反复期待'],
    corePrinciple: '在行为心理学中，间歇性奖励可能使某些行为持续很久。在亲密关系中，不稳定的关心和回应也可能让人持续等待下一次积极互动。',
    deepBreakdown: {
      mechanism: '忽冷忽热的不确定回应让当事人的注意力高度聚焦。偶尔获得的关怀带来短暂释怀，从而强化了持续等待受虐的行为模式，让人深陷泥潭难以抽离。',
      insights: [
        '不确定性是成瘾性依恋的温床。',
        '不要用少数的偶发甜蜜来为长期的缺乏尊重洗白。',
      ],
    },
    lifeCase: {
      title: '要分手时才温柔的恶性循环',
      scenario: '男生平时冷漠疏离，女方一提分手又立刻温柔发誓，女生重燃希望复合后问题依旧。间歇性甜头让女方反复被困其中数年。',
    },
    practicalTakeaways: {
      summary: '观察对方长期的平均行为是否稳定、承诺是否化为持续行动，而非被偶发的甜蜜施舍牵着鼻子走。',
      actionablePoints: [
        '记录一段关系中的常态基准线，而非峰值高光。',
        '对反复无常的模式果断踩刹车。',
      ],
    },
  },
  {
    id: 'emo-32',
    order: 32,
    sectionIndex: 4,
    sectionTitle: '第四部分：失恋与关系困局',
    sectionEn: 'Heartbreak & Detachment',
    sectionThemeColor: EMOTIONAL_SECTIONS[3].theme,
    titleZh: '未完成事件效应',
    titleEn: 'Zeigarnik Effect in Unresolved Closure',
    keywords: ['没有答案', '未完成感', '反复回想'],
    corePrinciple: '未完成的任务或尚未解决的问题，有时会持续占据注意力。在突发断联或缺乏解释的分手中尤为明显。',
    deepBreakdown: {
      mechanism: '一段关系突然结束却没有交代清楚，大脑会拼命搜寻线索试图补齐缺失拼图。但有些问题注定没有完美解释，无限追问只会陷入痛苦打转。',
      insights: [
        '大脑追求认知闭环的本能。',
        '有些问题永远得不到满意的答案。',
      ],
    },
    lifeCase: {
      title: '寻找感情破裂的精确节点',
      scenario: '分手后反复咀嚼过去每句对话，试图弄清究竟哪一步走错、对方到底有没有爱过。即使找到线索，也无法改变结局。',
    },
    practicalTakeaways: {
      summary: '接受“我无法知道全部答案”，本身就是结束心理内耗、让生活重新起步的关键一步。',
      actionablePoints: [
        '自己为关系画上心理句号，无需等待对方宣判。',
        '把注意力转向当下的现实自我重建。',
      ],
    },
    isDuplicateOfCore: true,
    duplicateCoreId: 'LAW011',
    duplicateCoreName: '蔡格尼克效应',
  },
  {
    id: 'emo-33',
    order: 33,
    sectionIndex: 4,
    sectionTitle: '第四部分：失恋与关系困局',
    sectionEn: 'Heartbreak & Detachment',
    sectionThemeColor: EMOTIONAL_SECTIONS[3].theme,
    titleZh: '反事实思维',
    titleEn: 'Counterfactual Thinking',
    keywords: ['如果当初', '后悔', '自责'],
    corePrinciple: '人们会想象现实中没有发生的另一种结果，以理解事件或寻找改进机会。',
    deepBreakdown: {
      mechanism: '向上反事实（想象当初更耐心就不会分）容易诱发严重后悔自责；向下反事实（想象没及时分会伤更重）带来安慰。但关系是双方互动的复合体，绝非单一事件所能左右。',
      insights: [
        '把“如果当初”转化为“下次我可以怎样做”。',
        '一段关系的终结涉及无数变量，不必独自背负所有愧疚。',
      ],
    },
    lifeCase: {
      title: '“如果我当时不那么忙”的自责',
      scenario: '分手后反复想“如果我当时没那么忙就不会分”。然而关系的瓦解往往植根于深层的沟通、价值观与现实差异，单一假设无法扭转乾坤。',
    },
    practicalTakeaways: {
      summary: '把沉溺后悔转化为经验积累，吸取教训，但绝不承担本属于双方或情境的全部责任。',
      actionablePoints: [
        '每当出现“如果当初”，立即写下“吸取的教训是”。',
        '放下对平行世界的无谓执念。',
      ],
    },
  },
  {
    id: 'emo-34',
    order: 34,
    sectionIndex: 4,
    sectionTitle: '第四部分：失恋与关系困局',
    sectionEn: 'Heartbreak & Detachment',
    sectionThemeColor: EMOTIONAL_SECTIONS[3].theme,
    titleZh: '嫉妒与社会比较',
    titleEn: 'Social Comparison & Jealousy',
    keywords: ['比较', '竞争感', '自我价值'],
    corePrinciple: '人们可能通过与他人比较来评价自己。当比较涉及亲密关系时，可能引发嫉妒、不安和竞争感。',
    deepBreakdown: {
      mechanism: '与伴侣的前任、朋友的恩爱伴侣或社交网络上的模范情侣做比较。我们往往只看到他人展示的光鲜切片，却误当成完整真实，从而产生自我怀疑与怨气。',
      insights: [
        '社交网络上的完美都是经过编辑的片段。',
        '每一段关系都有其独特的现实条件与相处节奏。',
      ],
    },
    lifeCase: {
      title: '因朋友圈昂贵礼物引发的嫉妒',
      scenario: '女性看到朋友晒出昂贵纪念日礼物，开始埋怨伴侣不爱自己，却忽略了彼此的经济基础、相处模式与精神关怀完全处于不同语境。',
    },
    practicalTakeaways: {
      summary: '不把别人的生活当成自己的考卷。问自己：“我真正需要的是什么？是礼物、陪伴还是安全感？”',
      actionablePoints: [
        '减少沉迷于社交媒体上的完美情侣展示。',
        '聚焦于自己伴侣在现实中给予的真实温暖。',
      ],
    },
  },
  {
    id: 'emo-35',
    order: 35,
    sectionIndex: 4,
    sectionTitle: '第四部分：失恋与关系困局',
    sectionEn: 'Heartbreak & Detachment',
    sectionThemeColor: EMOTIONAL_SECTIONS[3].theme,
    titleZh: '投射与心理推断',
    titleEn: 'Psychological Projection in Insecurity',
    keywords: ['把自己的想法当成对方的想法', '无意识假设'],
    corePrinciple: '人们有时会把自己的感受、动机或担忧归因于别人，或者误以为别人也会以与自己相同的方式思考。',
    deepBreakdown: {
      mechanism: '因为自己害怕被抛弃，就认定对方在故意冷淡；因为自己习惯隐瞒心事，就认定对方也在欺骗。不假思索地用自己的内心世界替代对方的真实心理。',
      insights: [
        '不要假设伴侣拥有与你完全相同的思维回路。',
        '直接求证比自作聪明的心理试探更有效。',
      ],
    },
    lifeCase: {
      title: '故意试探引发的不尊重',
      scenario: '担心对方不在乎自己，故意与异性暧昧试图让伴侣吃醋，把吃醋误当成爱的唯一证明，结果反而让对方感到尊严被践踏。',
    },
    practicalTakeaways: {
      summary: '不靠猜测试探，重要事项直接平静询问对方的真实动机。',
      actionablePoints: [
        '停止通过激怒对方来测验爱意。',
        '直接表达：“我最近有点缺乏安全感，想和你好好聊聊”。',
      ],
    },
  },
  {
    id: 'emo-36',
    order: 36,
    sectionIndex: 4,
    sectionTitle: '第四部分：失恋与关系困局',
    sectionEn: 'Heartbreak & Detachment',
    sectionThemeColor: EMOTIONAL_SECTIONS[3].theme,
    titleZh: '归因偏差与分手后的理想化',
    titleEn: 'De-idealization & Selective Romantic Memory',
    keywords: ['只记得美好', '选择性记忆', '失去后的滤镜'],
    corePrinciple: '分手后，人们对过去的回忆可能发生变化，某些美好时刻被突出，而不愉快的经历逐渐淡化。',
    deepBreakdown: {
      mechanism: '失去关系后，人不仅失去了现实中的人，更失去了对未来的美好想象。回忆往往夹杂了对方的优点、青春的美好与当初的幻想，使过去显得格外神圣无瑕。',
      insights: [
        '记忆经过了潜意识的美化过滤。',
        '想念一个人不等于应该复合，根本问题若未解决重蹈覆辙是必然。',
      ],
    },
    lifeCase: {
      title: '忘记长期争吵只记起一碗热粥',
      scenario: '结束争吵不断的恶性关系数月后，频繁回想起对方早起煮粥的温馨，忘记了导致分手的信任崩塌，误以为自己错失了今生挚爱。',
    },
    practicalTakeaways: {
      summary: '怀念时同步记录美好与痛苦清单。决定复合与否必须看导致分手的根本问题是否真正解决。',
      actionablePoints: [
        '写下导致分手的硬性事实清单随身携带。',
        '客观评估，不将回忆中的幻影误当成现实良配。',
      ],
    },
  },
  {
    id: 'emo-37',
    order: 37,
    sectionIndex: 4,
    sectionTitle: '第四部分：失恋与关系困局',
    sectionEn: 'Heartbreak & Detachment',
    sectionThemeColor: EMOTIONAL_SECTIONS[3].theme,
    titleZh: '关系中的心理反抗',
    titleEn: 'Psychological Reactance in Control',
    keywords: ['控制', '逆反', '自由受到威胁'],
    corePrinciple: '当人们感觉自己的选择自由受到威胁时，可能产生恢复自由的动机，甚至拒绝原本愿意接受的要求。',
    deepBreakdown: {
      mechanism: '若一方单方面高压强制另一方按其要求行事，被管制方会产生强烈的心理抗拒。控制与强迫不仅达不到目的，反而极易恶化对立情绪。',
      insights: [
        '忠诚需要双方自愿认可的边界，而非单方面强权。',
        '压迫越重，逆反与逃跑的冲动越强烈。',
      ],
    },
    lifeCase: {
      title: '严令切断异性社交的反弹',
      scenario: '男友强令女友拉黑所有异性，女友原本愿保持合理边界，但在感受到被全面控制后产生强烈反抗，关系陷入僵局。',
    },
    practicalTakeaways: {
      summary: '关系准则由双方平等商定，而非单方强加。没有自由的顺从绝非健康的忠诚。',
      actionablePoints: [
        '用“协商共识”替代“命令禁止”。',
        '尊重彼此作为独立成年人的基本尊严。',
      ],
    },
    isDuplicateOfCore: true,
    duplicateCoreId: 'LAW095',
    duplicateCoreName: '心理逆反（罗密欧与朱丽叶效应）',
  },
  {
    id: 'emo-38',
    order: 38,
    sectionIndex: 4,
    sectionTitle: '第四部分：失恋与关系困局',
    sectionEn: 'Heartbreak & Detachment',
    sectionThemeColor: EMOTIONAL_SECTIONS[3].theme,
    titleZh: '关系中的不确定性与承诺回避',
    titleEn: 'Commitment Avoidance & Ambiguity',
    keywords: ['不确定关系', '模糊承诺', '未来焦虑'],
    corePrinciple: '当双方对关系定义和未来期待不同，却长期没有讨论时，模糊状态可能增加不安和冲突。',
    deepBreakdown: {
      mechanism: '一方把“顺其自然”理解为建立长期关系，另一方却理解为暂时无需负责。词语相同但认知迥异。关键在于双方是否清晰勇敢地表达期待。',
      insights: [
        '模糊承诺是滋生背叛感的土壤。',
        '直面分歧比自欺欺人的粉饰太平更仁慈。',
      ],
    },
    lifeCase: {
      title: '各自理解的“顺其自然”',
      scenario: '约会半年，女方视为排他稳定关系，男方仍与其他异性约会。一旦揭开，女方深感被背叛，男方却觉得自己从未做出承诺。',
    },
    practicalTakeaways: {
      summary: '不靠暗示确认关系。明确讨论：是否排他？希望如何发展？当前能承诺什么？哪些仍需时间观察？',
      actionablePoints: [
        '适时开启清晰的关系定义探讨。',
        '不把模糊的回应当作笃定的默许。',
      ],
    },
  },
  {
    id: 'emo-39',
    order: 39,
    sectionIndex: 4,
    sectionTitle: '第四部分：失恋与关系困局',
    sectionEn: 'Heartbreak & Detachment',
    sectionThemeColor: EMOTIONAL_SECTIONS[3].theme,
    titleZh: '失恋后的身份重建',
    titleEn: 'Identity Reconstruction after Breakup',
    keywords: ['重新认识自己', '独立生活', '自我价值'],
    corePrinciple: '结束重要关系后，一个人可能需要重新调整自我认同、生活习惯和未来计划。',
    deepBreakdown: {
      mechanism: '长期伴侣往往深度融入我们的日常习惯与自我定义。分手不仅改变感情状态，还涉及社交网络、居所、生活节奏的解构。康复是重新搭建属于自己的独立多元支柱。',
      insights: [
        '放下不仅是淡忘，更是自我秩序的重构。',
        '让自己重新拥有除爱情外的多个支点。',
      ],
    },
    lifeCase: {
      title: '从围绕前任到拥有独立生活',
      scenario: '分手后发现自己周末全围着对方转。青年重新恢复运动、深造学习、联系老友，生活重新焕发生机，不再以对方是否联系来评定每日价值。',
    },
    practicalTakeaways: {
      summary: '重构自己的社交、运动与事业节奏，建立多个稳固的生活支点，让生命重归饱满独立。',
      actionablePoints: [
        '开启一项从未尝试过的全新技能或志趣。',
        '重新连接温暖真诚的朋友圈网络。',
      ],
    },
  },
  {
    id: 'emo-40',
    order: 40,
    sectionIndex: 4,
    sectionTitle: '第四部分：失恋与关系困局',
    sectionEn: 'Heartbreak & Detachment',
    sectionThemeColor: EMOTIONAL_SECTIONS[3].theme,
    titleZh: '接纳与放下',
    titleEn: 'Acceptance & Letting Go',
    keywords: ['接受现实', '停止挣扎', '重新前进'],
    corePrinciple: '对无法控制的现实保持接纳，可能帮助人减少无效的心理挣扎，并将精力转向可改变的部分。',
    deepBreakdown: {
      mechanism: '接纳不等于赞同对方的行为，而是承认现实已经发生且无法靠无限回想改变。停止与已成事实做无休止对抗，注意力才能收回自身。',
      insights: [
        '无法控制的：对方的心思、过去已发生的事实。',
        '可以控制的：当下的言行、自我边界、生活安排与未来抉择。',
      ],
    },
    lifeCase: {
      title: '停止执念后的心安自足',
      scenario: '被拒绝后执着劝说对方改变，最终学会接纳对方真实感情，把精力投向自身前程。虽有难过，但情绪不再支配整个人生。',
    },
    practicalTakeaways: {
      summary: '真正的放下不等于毫无波澜，而是情绪不再成为生活的主宰。将心力投向你所能掌控的精彩未来。',
      actionablePoints: [
        '列出掌控圈与关注圈清单。',
        '把精力百分之百投入到自身可为的具体行动中。',
      ],
    },
  },

  // ========================================================
  // 第五部分：长期爱情、信任与成熟关系的10条规律 (41 - 50)
  // ========================================================
  {
    id: 'emo-41',
    order: 41,
    sectionIndex: 5,
    sectionTitle: '第五部分：长期爱情与成熟关系',
    sectionEn: 'Enduring Love & Maturity',
    sectionThemeColor: EMOTIONAL_SECTIONS[4].theme,
    titleZh: '亲密关系中的深度积极回应',
    titleEn: 'Deep Partner Responsiveness in Long-Term Love',
    keywords: ['被理解', '被关心', '被重视'],
    corePrinciple: '当一个人感到伴侣理解自己、重视自己的需要，并愿意给予关心时，关系满意度往往更高。',
    deepBreakdown: {
      mechanism: '真正的回应不仅是“听见了”，还包括准确把握对方深层诉求并在合理限度内采取实际行动支持，是长久滋养满意度的生命之源。',
      insights: [
        '倾听、确认与实际行动三位一体。',
        '共同分担现实重负，而非冷眼旁观。',
      ],
    },
    lifeCase: {
      title: '面对高压时的分担协商',
      scenario: '妻子职场压力大，丈夫先询问最棘手之处，再共同商议家庭事务分担，妻子深感被坚实托底，不再孤军奋战。',
    },
    practicalTakeaways: {
      summary: '关心不单是做自己觉得对的事，而是努力探求并提供对方真正渴望的滋养。',
      actionablePoints: [
        '在伴侣困顿期主动探问其核心压力点。',
        '用具体的协作成就彼此的安全感。',
      ],
    },
  },
  {
    id: 'emo-42',
    order: 42,
    sectionIndex: 5,
    sectionTitle: '第五部分：长期爱情与成熟关系',
    sectionEn: 'Enduring Love & Maturity',
    sectionThemeColor: EMOTIONAL_SECTIONS[4].theme,
    titleZh: '信任的累积效应',
    titleEn: 'Trust Building over Time',
    keywords: ['一致性', '诚实', '可靠性'],
    corePrinciple: '信任通常通过长期、可观察的行为逐渐建立，而不是只靠一次承诺。',
    deepBreakdown: {
      mechanism: '说到尽量做到、犯错坦诚承认、尊重隐私与边界、重要事件保持真实透明。信任并非永不失误，而是行为具有可预测性，问题能得到诚恳面对。',
      insights: [
        '信任是一步一个脚印攒下的资产。',
        '空口承诺无法替代日积月累的言行一致。',
      ],
    },
    lifeCase: {
      title: '从屡次失约到日历协同的逆转',
      scenario: '男性曾多次忘记约定，后来借助日历提前协同并诚恳核对，言行日趋稳定一致，伴侣的疑虑逐渐消散建立起深厚信任。',
    },
    practicalTakeaways: {
      summary: '通过持续、稳定、具体的可靠言行铸就信誉，远比反复声嘶力竭喊“你应该相信我”更有力量。',
      actionablePoints: [
        '承诺的事情务必跟进落地。',
        '若无法履约，第一时间主动说明原因与替代方案。',
      ],
    },
  },
  {
    id: 'emo-43',
    order: 43,
    sectionIndex: 5,
    sectionTitle: '第五部分：长期爱情与成熟关系',
    sectionEn: 'Enduring Love & Maturity',
    sectionThemeColor: EMOTIONAL_SECTIONS[4].theme,
    titleZh: '承诺与行动一致性',
    titleEn: 'Commitment–Behavior Consistency',
    keywords: ['承诺', '实际行动', '关系可靠性'],
    corePrinciple: '评价长期关系时，承诺的意义需要结合实际行为，而不能只看口头表达。',
    deepBreakdown: {
      mechanism: '需清晰辨析三者差异：对未来的主观美好愿望、当下的具体实施方案、持续发生的实际改变行为。口头承诺可能只是为了平息冲突的缓兵之计。',
      insights: [
        '看行动胜过听言语。',
        '压力情境下能否维持改进是检验承诺真伪的唯一试金石。',
      ],
    },
    lifeCase: {
      title: '屡次发誓不改的语言攻击',
      scenario: '伴侣争执后多次发誓不再言语辱骂，可一遇激动依旧出口伤人。缺乏行动转化的口头誓言使信任彻底耗尽。',
    },
    practicalTakeaways: {
      summary: '判断改变是否真实，观察行为是否持续、是否在面对压力时依然能坚守改进行动。',
      actionablePoints: [
        '不仅做出承诺，更制定防范复发的具体阻断措施。',
        '用事实证明改变的诚意。',
      ],
    },
  },
  {
    id: 'emo-44',
    order: 44,
    sectionIndex: 5,
    sectionTitle: '第五部分：长期爱情与成熟关系',
    sectionEn: 'Enduring Love & Maturity',
    sectionThemeColor: EMOTIONAL_SECTIONS[4].theme,
    titleZh: '共同目标与关系满意度',
    titleEn: 'Shared Goals & Long-Term Alignment',
    keywords: ['未来规划', '生活方向', '合作'],
    corePrinciple: '长期伴侣如果能够在重要目标上形成共识，通常更容易协调现实生活中的选择。',
    deepBreakdown: {
      mechanism: '结婚生育、安家城市、金钱管理、家庭分工以及工作与生活的平衡。双方不必拥有完全相同的梦想，但优先事项必须能够相互兼容。',
      insights: [
        '现实的重大分歧不会因纯粹相爱而自动消失。',
        '及早透明讨论未来方向能避免深层痛苦。',
      ],
    },
    lifeCase: {
      title: '跨国发展与归国定居的决断',
      scenario: '感情深厚的情侣一人立志定居欧洲，一人坚决回国。若长期逃避不谈，矛盾必随交往深入而演变为沉痛撕裂。及早坦诚面对是唯一出路。',
    },
    practicalTakeaways: {
      summary: '及早坦率讨论重大未来方向，判断彼此是否真能携手构建双方都乐意奔赴的现实生活。',
      actionablePoints: [
        '坦诚核对三年与五年核心规划。',
        '理性评估不可调和的底层价值差异。',
      ],
    },
  },
  {
    id: 'emo-45',
    order: 45,
    sectionIndex: 5,
    sectionTitle: '第五部分：长期爱情与成熟关系',
    sectionEn: 'Enduring Love & Maturity',
    sectionThemeColor: EMOTIONAL_SECTIONS[4].theme,
    titleZh: '关系中的自主性',
    titleEn: 'Autonomy in Intimate Relationships',
    keywords: ['亲密与独立', '个人空间', '自由选择'],
    corePrinciple: '健康的关系既需要连接，也需要让双方保留一定的自主性。',
    deepBreakdown: {
      mechanism: '真正的亲密不是二人步调完全同构。能自由表达不同政见、保留私人空间并自愿选择彼此，关系才具备坚韧弹性。自主绝非逃避责任的借口。',
      insights: [
        '“我需要个人空间”并不等于“不爱你”。',
        '两颗独立自洽的心灵碰撞出更深邃的联结。',
      ],
    },
    lifeCase: {
      title: '足球与瑜伽的各得其所',
      scenario: '夫妻爱好迥异，一人爱足球一人爱瑜伽，各自保留个人爱好空间又共度温馨周末，既享受了自由又强化了连接。',
    },
    practicalTakeaways: {
      summary: '接纳并珍惜彼此合理的个人边界，不要将独立的精神世界敌视化。',
      actionablePoints: [
        '给彼此留出不被打扰的专属独立时间。',
        '支持伴侣探索其独特的人生热忱。',
      ],
    },
  },
  {
    id: 'emo-46',
    order: 46,
    sectionIndex: 5,
    sectionTitle: '第五部分：长期爱情与成熟关系',
    sectionEn: 'Enduring Love & Maturity',
    sectionThemeColor: EMOTIONAL_SECTIONS[4].theme,
    titleZh: '情感劳动与隐性付出',
    titleEn: 'Emotional Labor in Relationships',
    keywords: ['记住细节', '照顾情绪', '看不见的工作'],
    corePrinciple: '在亲密关系中，除了金钱和体力劳动，还有安排、提醒、协调以及关注彼此情绪等不容易被看见的付出。',
    deepBreakdown: {
      mechanism: '记住亲友生日、协调家庭关系、关注孩子需求、敏锐察觉家里问题，这些心智统筹若全压在一人身上，必使其身心俱疲沦为“管理者”而非“伴侣”。',
      insights: [
        '计划与提醒是消耗巨大的认知资源。',
        '看见隐性付出是关系平等的前提。',
      ],
    },
    lifeCase: {
      title: '主外赚钱与家庭总指挥的心力',
      scenario: '丈夫主外赚钱自认承担全部，妻子不仅做家务还独自承担全部家庭预约、活动统筹与心理协调，妻子倍感精神耗竭与不被理解。',
    },
    practicalTakeaways: {
      summary: '分工讨论时，务必将计划、统筹、提醒与情绪协调等隐性劳动纳入视野，共同协商调整。',
      actionablePoints: [
        '分担具体的统筹事项（如一人专门负责医疗账单与预约）。',
        '对伴侣默默的提前筹备表达真诚敬意。',
      ],
    },
  },
  {
    id: 'emo-47',
    order: 47,
    sectionIndex: 5,
    sectionTitle: '第五部分：长期爱情与成熟关系',
    sectionEn: 'Enduring Love & Maturity',
    sectionThemeColor: EMOTIONAL_SECTIONS[4].theme,
    titleZh: '感恩与积极关注',
    titleEn: 'Gratitude & Positive Attunement',
    keywords: ['看见付出', '表达感谢', '关系满足'],
    corePrinciple: '真诚地注意并表达对伴侣付出的感激，可能帮助双方感到被重视，并改善日常互动。',
    deepBreakdown: {
      mechanism: '相处久了容易把伴侣的体贴视为理所当然。准备早餐、照料起居因为司空见惯而被忽视。感恩不是形式主义，而是时刻对真实的善意保持敏锐与敬畏。',
      insights: [
        '习惯化是感恩的最大敌人。',
        '具体的感谢远比敷衍的客套更具打动人心的力量。',
      ],
    },
    lifeCase: {
      title: '一句话点亮十五年的晨光',
      scenario: '妻子每日准备早餐多年，丈夫习惯视之。某天丈夫具体真诚致谢：“你每天提前准备早餐让我轻松很多，我很感谢你”，瞬间融化了多年的疲倦。',
    },
    practicalTakeaways: {
      summary: '感谢必须具体真诚。若分工存在客观不公，表达感谢不可作为替代重新合理分担责任的遮羞布。',
      actionablePoints: [
        '每天说一句具体的感谢：“谢谢你今天特意帮我……”',
        '在肯定中滋养良性循环。',
      ],
    },
  },
  {
    id: 'emo-48',
    order: 48,
    sectionIndex: 5,
    sectionTitle: '第五部分：长期爱情与成熟关系',
    sectionEn: 'Enduring Love & Maturity',
    sectionThemeColor: EMOTIONAL_SECTIONS[4].theme,
    titleZh: '积极互动与深度关系修复',
    titleEn: 'Long-term Relationship Repair & Reconnection',
    keywords: ['道歉', '责任', '重新建立安全感'],
    corePrinciple: '关系出现问题后，双方是否愿意承认伤害、承担责任并作出实际修复，会决定关系未来的发展与韧性。',
    deepBreakdown: {
      mechanism: '有效修复远不止一句轻描淡写的“对不起”，更包括清楚承认行为、深刻理解对伴侣的影响、不找借口推脱、落实减少复发的举措，并给对方重建信任的宽裕时间。',
      insights: [
        '道歉是责任的开端，而非强索谅解的令箭。',
        '受创方有权决定何时何地重新建立信任。',
      ],
    },
    lifeCase: {
      title: '伤人后的深刻反省与持续行动',
      scenario: '争吵说伤人话后，不仅真诚认错承担伤害后果，更提出情绪失控时的强制停火机制，并在后续用数月的克制践行承诺。',
    },
    practicalTakeaways: {
      summary: '把道歉作为反省重塑的契机，用持续的行为证明改变，赋予对方充分的安全感与疗愈节奏。',
      actionablePoints: [
        '真诚认错绝不附加“但是是你先……”的后缀。',
        '用长期的行动给信任储蓄充值。',
      ],
    },
  },
  {
    id: 'emo-49',
    order: 49,
    sectionIndex: 5,
    sectionTitle: '第五部分：长期爱情与成熟关系',
    sectionEn: 'Enduring Love & Maturity',
    sectionThemeColor: EMOTIONAL_SECTIONS[4].theme,
    titleZh: '关系满意度与现实适配',
    titleEn: 'Relationship Compatibility in Daily Reality',
    keywords: ['相爱', '适配', '长期生活'],
    corePrinciple: '感情强烈程度与长期生活适配程度是两个不同的维度。',
    deepBreakdown: {
      mechanism: '深爱彼此但可能在忠诚边界、育儿理念、风险与金钱态度、未来居住地等不可妥协的核心价值上存在根本冲突。若无法协调，单靠深情难以弥合现实裂隙。',
      insights: [
        '相爱是体验，适配是架构。',
        '爱能克服很多困难，但无法自动抹消现实的客观法则。',
      ],
    },
    lifeCase: {
      title: '在生育理念决裂的深爱伴侣',
      scenario: '一对深爱对方的伴侣在是否要孩子上各执一词，这属于双方绝不退让的核心人生愿景，仅靠相爱无法解决这一根本分歧。',
    },
    practicalTakeaways: {
      summary: '评估终身伴侣时，不仅问“我们有多相爱”，更必须诚实问“我们能否建立双方都愿意接受的共同生活”。',
      actionablePoints: [
        '对核心生活架构做深度盘点。',
        '尊重现实的客观规律，不盲从浪漫神话。',
      ],
    },
  },
  {
    id: 'emo-50',
    order: 50,
    sectionIndex: 5,
    sectionTitle: '第五部分：长期爱情与成熟关系',
    sectionEn: 'Enduring Love & Maturity',
    sectionThemeColor: EMOTIONAL_SECTIONS[4].theme,
    titleZh: '心理韧性与关系成长',
    titleEn: 'Psychological Resilience & Relational Growth',
    keywords: ['面对困难', '恢复能力', '共同成长'],
    corePrinciple: '心理韧性是指在压力、挫折或变化中，逐步调整并恢复适应能力的过程。在亲密关系中，表现为面对困难时保持沟通、寻求支持、调整计划和学习新的应对方式。',
    deepBreakdown: {
      mechanism: '健康关系不是毫无风波，而在于能承认问题、面对责任、接受现实限制，必要时寻求外部支持。成熟不是无论发生什么都盲目死撑，而是在投入深情的同时守住自尊与安全底线。',
      insights: [
        '成长包含共同跨越危机，也包含在不健康关系中果断止损。',
        '成熟既能勇敢爱，也能从容面对现实。',
      ],
    },
    lifeCase: {
      title: '逆境风浪中的理性协作',
      scenario: '面对突如其来的经济风暴，夫妻不互相埋怨，而是携手梳理预算、制定周复盘计划，将危机转化为检验并加固信任的绝佳契机。',
    },
    practicalTakeaways: {
      summary: '真正的情感成熟，不是永远不受伤，也不是无论发生什么都坚持到底；它意味着既能够投入感情，也能够面对现实；既愿意修复关系，也懂得保护自己的尊严与安全。',
      actionablePoints: [
        '把每一次危机视为检验与升级彼此心智模式的试金石。',
        '自爱与爱人并重，做自我圆满的独立个体。',
      ],
      keyDistinction: '真正的情感成熟，是既能深情以赴，也能清醒自持。',
    },
  },
];

export interface LawEmotionalMapping {
  order: number;
  sectionIndex: number;
  sectionTitle: string;
  sectionEn: string;
  themeColor: string;
  isDuplicateOfCore: boolean;
  duplicateCoreId?: string;
  duplicateCoreName?: string;
}

const LAW_EMOTIONAL_MAP = new Map<string, LawEmotionalMapping>();

EMOTIONAL_PSYCHOLOGY_LAWS.forEach((item) => {
  const mapping: LawEmotionalMapping = {
    order: item.order,
    sectionIndex: item.sectionIndex,
    sectionTitle: item.sectionTitle,
    sectionEn: item.sectionEn,
    themeColor: item.sectionThemeColor.primary,
    isDuplicateOfCore: !!item.isDuplicateOfCore,
    duplicateCoreId: item.duplicateCoreId,
    duplicateCoreName: item.duplicateCoreName,
  };

  LAW_EMOTIONAL_MAP.set(item.id, mapping);
  LAW_EMOTIONAL_MAP.set(item.titleZh, mapping);
  LAW_EMOTIONAL_MAP.set(item.titleEn.toLowerCase(), mapping);

  if (item.duplicateCoreId) {
    LAW_EMOTIONAL_MAP.set(item.duplicateCoreId, mapping);
  }
  if (item.duplicateCoreName) {
    LAW_EMOTIONAL_MAP.set(item.duplicateCoreName, mapping);
  }
});

export function getLawEmotionalMapping(law: {
  id: string;
  codeId?: string;
  nameZh: string;
  chapter?: string;
}): LawEmotionalMapping | null {
  // 1. check exact duplicateCoreId
  if (law.codeId && LAW_EMOTIONAL_MAP.has(law.codeId)) {
    return LAW_EMOTIONAL_MAP.get(law.codeId)!;
  }
  // 2. check id
  if (LAW_EMOTIONAL_MAP.has(law.id)) {
    return LAW_EMOTIONAL_MAP.get(law.id)!;
  }
  // 3. check nameZh
  if (LAW_EMOTIONAL_MAP.has(law.nameZh)) {
    return LAW_EMOTIONAL_MAP.get(law.nameZh)!;
  }
  return null;
}
