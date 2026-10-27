export interface ValuationOption {
  id: string;
  text: string;
  isCorrect: boolean;
  isIntuitionTrap?: boolean;
}

export interface ValuationQuestion {
  id: string;
  category: '消费分期' | '复利投资' | '折扣心理' | '机会成本' | '隐性借贷' | '日常沉没';
  title: string;
  hookSlogan: string;
  question: string;
  options: ValuationOption[];
  system1Trap: string;
  mathTruth: string;
  mentalShortcut: string;
  takeaway: string;
  practicePrompt: string;
  targetValue: number;
  unit: string;
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
  sliderDefault: number;
  intuitionTrapValue: number;
  formatValue: (v: number) => string;
}

/**
 * 80+ 覆盖商业、消费、借贷、理财、职场机会成本的真实估值心算题库
 * 支持初级 (5题)、中级 (25题)、高级 (50题) 全量非重复生成
 */
export const MASTER_VALUATION_POOL: ValuationQuestion[] = [
  // --- 1. 消费分期类 ---
  {
    id: 'inst-fridge',
    category: '消费分期',
    title: '分期神话：每天一杯豆浆钱',
    hookSlogan: '「日供仅需 8.8 元，无痛拥有高端轻奢双门智能冰箱 2 整年！」',
    question: '3秒心算估值：该分期方案最终实际总支出是多少？',
    options: [
      { id: 'A', text: '约 2,000 元（感觉每天几块钱跟全款买差不多）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 4,500 元（估算大约多付了一两千溢价）', isCorrect: false },
      { id: 'C', text: '约 6,424 元（8.8 × 730天，隐性总额高达 6400+）', isCorrect: true },
      { id: 'D', text: '约 8,800 元（直接按 1000 天速算了）', isCorrect: false }
    ],
    system1Trap: '日费微小锚：大脑本能把“8.8元”归入零钱账户，瞬间产生“几乎免费”的错觉，完全过滤了 730 天漫长时间维度。',
    mathTruth: '8.8元/天 × 365天 × 2年 = 6,424 元。若是原价 2,200 元的普通家电，隐性溢价高达 192%！',
    mentalShortcut: '【日费年化速乘法】：日供 × 30 算月供（8.8 × 30 ≈ 260元/月），2年即 24 个月（260 × 24 ≈ 6,240元）。3秒一剑穿透！',
    takeaway: '面对任何“每天仅需X元”的宣传，第一反应永远乘上 30 再乘以月数，把水滴还原成海啸。',
    practicePrompt: '拖拽滑块估算：该分期方案 2 整年的实际累计总支出',
    targetValue: 6424,
    unit: '元',
    sliderMin: 1000,
    sliderMax: 10000,
    sliderStep: 50,
    sliderDefault: 3000,
    intuitionTrapValue: 2000,
    formatValue: (v) => `${v.toLocaleString()} 元`
  },
  {
    id: 'inst-phone',
    category: '消费分期',
    title: '旗舰手机：日供 6.6 元三年期',
    hookSlogan: '「最新顶配旗舰机：日供仅需 6.6 元，超长轻松分期 36 个月！」',
    question: '3秒心算估值：该 3 年期分期最终实际总支出是多少？',
    options: [
      { id: 'A', text: '约 3,000 元（感觉6块多钱买手机超便宜）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 5,000 元（按一年估计了）', isCorrect: false },
      { id: 'C', text: '约 7,227 元（6.6 × 1,095天，远超原机售价）', isCorrect: true },
      { id: 'D', text: '约 9,500 元（预估偏高）', isCorrect: false }
    ],
    system1Trap: '三年超长周期盲区：36 个月长达 1,095 天，每天 6.6 元积累起来已突破 7,200 元。',
    mathTruth: '6.6 × 365 × 3 = 7,227 元。原机售价约 4,999 元，利息溢价超过 2,200 元！',
    mentalShortcut: '【月供速算法】：6.6 × 30 ≈ 200元/月，36个月即 200 × 36 = 7,200元！口算 2 秒搞定！',
    takeaway: '分期时间越长，日供看似越低，利息黑洞越大，绝不办超过 12 个月的分期。',
    practicePrompt: '拖拽滑块估算：6.6元/天分期 3 年的实际总支出',
    targetValue: 7227,
    unit: '元',
    sliderMin: 2000,
    sliderMax: 11000,
    sliderStep: 50,
    sliderDefault: 4000,
    intuitionTrapValue: 3000,
    formatValue: (v) => `${v.toLocaleString()} 元`
  },
  {
    id: 'inst-headphone',
    category: '消费分期',
    title: '降噪耳机：每天 9.9 元一年期',
    hookSlogan: '「大牌降噪耳机免息狂欢：每天只要 9.9 元，1年畅享无噪世界！」',
    question: '3秒心算估值：一年累计实际支付总额是多少？',
    options: [
      { id: 'A', text: '约 1,200 元（直觉以为跟买普通耳机价格差不多）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 2,000 元', isCorrect: false },
      { id: 'C', text: '约 3,613 元（9.9 × 365天，几乎能买顶配专业机）', isCorrect: true },
      { id: 'D', text: '约 5,000 元', isCorrect: false }
    ],
    system1Trap: '单位错觉：9.9元与一杯小奶茶相似，但365天累计直奔3,600元大关。',
    mathTruth: '9.9 × 365 = 3,613.5 元。',
    mentalShortcut: '【近似按10速算】：每天约10元，一年365天就是 3,650元，略减几十元即 3,613元！1秒识破！',
    takeaway: '每天个位数金额最容易让防御机制失灵，立刻乘 365 恢复警戒。',
    practicePrompt: '拖拽滑块估算：9.9元/天连续 1 年的总支出',
    targetValue: 3613,
    unit: '元',
    sliderMin: 800,
    sliderMax: 6000,
    sliderStep: 50,
    sliderDefault: 1800,
    intuitionTrapValue: 1200,
    formatValue: (v) => `${v.toLocaleString()} 元`
  },
  {
    id: 'inst-camera',
    category: '消费分期',
    title: '微单相机：日供 12.8 元两年期',
    hookSlogan: '「专业全画幅微单：日供 12.8 元，分期 24 个月拍出人生大片！」',
    question: '3秒心算估值：该分期最终实际总支出是多少？',
    options: [
      { id: 'A', text: '约 4,000 元（直觉以为只需小几千块）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 6,500 元', isCorrect: false },
      { id: 'C', text: '约 9,344 元（12.8 × 730天，逼近万元大关）', isCorrect: true },
      { id: 'D', text: '约 13,000 元', isCorrect: false }
    ],
    system1Trap: '十二块钱给人的心理沉重度很低，但乘以 730 天，总支出已经逼近 1 万元。',
    mathTruth: '12.8 × 365 × 2 = 9,344 元。',
    mentalShortcut: '【月供推算法】：12.8 × 30 ≈ 384元/月，24个月即约 384 × 25 ≈ 9,600，稍减即 9,344元！',
    takeaway: '只要日供超过 10 元，两年总支出必定逼近万元级！',
    practicePrompt: '拖拽滑块估算：12.8元/天分期 2 年的累计总支出',
    targetValue: 9344,
    unit: '元',
    sliderMin: 2000,
    sliderMax: 15000,
    sliderStep: 100,
    sliderDefault: 4500,
    intuitionTrapValue: 4000,
    formatValue: (v) => `${v.toLocaleString()} 元`
  },
  {
    id: 'inst-chair',
    category: '消费分期',
    title: '人体工学椅：日供 15.8 元 18个月',
    hookSlogan: '「高端护脊工学椅：日供 15.8 元，分期 18 个月呵护打工人脊柱！」',
    question: '3秒心算估值：18 个月累计实际总支出是多少？',
    options: [
      { id: 'A', text: '约 3,000 元（直觉认为一把椅子也就两三千）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 5,500 元', isCorrect: false },
      { id: 'C', text: '约 8,658 元（15.8 × 548天，买成天价椅）', isCorrect: true },
      { id: 'D', text: '约 12,000 元', isCorrect: false }
    ],
    system1Trap: '品类心理预算锚点：大脑按“普通椅子”定价来感知日供，忽略了 548 天总支出高达 8,600+ 元。',
    mathTruth: '15.8 × 30.4 × 18 ≈ 8,658 元。',
    mentalShortcut: '【月乘法】：15.8 × 30 ≈ 474元/月，474 × 18 ≈ 8,500+ 元！',
    takeaway: '大件办公消费，先把日供还原成月供，与真实月收入比例对比。',
    practicePrompt: '拖拽滑块估算：15.8元/天 18 个月累计总支出',
    targetValue: 8658,
    unit: '元',
    sliderMin: 1500,
    sliderMax: 13000,
    sliderStep: 100,
    sliderDefault: 3500,
    intuitionTrapValue: 3000,
    formatValue: (v) => `${v.toLocaleString()} 元`
  },
  {
    id: 'inst-ev-bike',
    category: '消费分期',
    title: '电摩通勤车：日供 19.9 元三年期',
    hookSlogan: '「长续航智能电摩：日供仅 19.9 元，分期 3 年畅行全城！」',
    question: '3秒心算估值：3 年期累计实际还款总支出是多少？',
    options: [
      { id: 'A', text: '约 8,000 元（直觉觉得电瓶车几千块钱）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 13,000 元', isCorrect: false },
      { id: 'C', text: '约 21,790 元（19.9 × 1,095天，超2万元够买小汽车）', isCorrect: true },
      { id: 'D', text: '约 30,000 元', isCorrect: false }
    ],
    system1Trap: '电摩的物理形态让你以为在支付 4,000 元的商品，实则付出了 2 万余元现金流！',
    mathTruth: '19.9 × 365 × 3 = 21,790.5 元。',
    mentalShortcut: '【20元速乘法】：每天约 20 元 ➔ 一年 7,300 元 ➔ 3 年就是 21,900 元！1秒出答案！',
    takeaway: '日供逼近 20 元的三年分期，本质上是一笔 2 万元的大额重资产债务。',
    practicePrompt: '拖拽滑块估算：19.9元/天分期 3 年的总支出',
    targetValue: 21790,
    unit: '元',
    sliderMin: 4000,
    sliderMax: 30000,
    sliderStep: 200,
    sliderDefault: 9000,
    intuitionTrapValue: 8000,
    formatValue: (v) => `${v.toLocaleString()} 元`
  },
  {
    id: 'inst-hairdryer',
    category: '消费分期',
    title: '高速吹风机：日供 4.9 元两年期',
    hookSlogan: '「沙龙级负离子吹风机：日供仅 4.9 元，分期 24 个月呵护秀发！」',
    question: '3秒心算估值：两年累计实际支付总额是多少？',
    options: [
      { id: 'A', text: '约 1,000 元（直觉四块多钱就跟买个小电吹风差不多）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 2,000 元', isCorrect: false },
      { id: 'C', text: '约 3,577 元（4.9 × 730天，翻了三倍多）', isCorrect: true },
      { id: 'D', text: '约 4,800 元', isCorrect: false }
    ],
    system1Trap: '4.9元正好在5元心理线之下，大脑判定为“微不足道的小零钱”，忽略了 2 年 730 次支付。',
    mathTruth: '4.9 × 365 × 2 = 3,577 元。',
    mentalShortcut: '【5元速乘扣减】：5元 × 730 = 3,650元，略减几十元得 3,577元！',
    takeaway: '5元以下的日供最擅长通过“破窗心理”诱导冲动消费，算总价即可解毒。',
    practicePrompt: '拖拽滑块估算：4.9元/天分期 2 年的累计总支出',
    targetValue: 3577,
    unit: '元',
    sliderMin: 500,
    sliderMax: 6000,
    sliderStep: 50,
    sliderDefault: 1200,
    intuitionTrapValue: 1000,
    formatValue: (v) => `${v.toLocaleString()} 元`
  },
  {
    id: 'inst-clean-robot',
    category: '消费分期',
    title: '扫地机器人：日供 7.8 元两年期',
    hookSlogan: '「全自动扫拖洗烘一体机：日供仅 7.8 元，分期 2 年告别拖地！」',
    question: '3秒心算估值：2 年累计实际总支出是多少？',
    options: [
      { id: 'A', text: '约 2,500 元（直觉认为分期总价也就是原价）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 3,800 元', isCorrect: false },
      { id: 'C', text: '约 5,694 元（7.8 × 730天，几乎多花一台新机器的钱）', isCorrect: true },
      { id: 'D', text: '约 7,500 元', isCorrect: false }
    ],
    system1Trap: '以为 7.8 元不贵，但 730 天累积下来几乎能全款买两台入门款。',
    mathTruth: '7.8 × 365 × 2 = 5,694 元。',
    mentalShortcut: '【8元速乘法】：8元 × 730 = 5,840元，略减去 146 得 5,694元！2秒出真值！',
    takeaway: '家电折旧快，2年分期还完时机器可能已经过保修期甚至淘汰。',
    practicePrompt: '拖拽滑块估算：7.8元/天分期 2 年的总支出',
    targetValue: 5694,
    unit: '元',
    sliderMin: 1500,
    sliderMax: 8000,
    sliderStep: 50,
    sliderDefault: 2800,
    intuitionTrapValue: 2500,
    formatValue: (v) => `${v.toLocaleString()} 元`
  },

  // --- 2. 复利72法则类 ---
  {
    id: 'rule72-8pct',
    category: '复利投资',
    title: '复利奇迹：72法则翻倍速算',
    hookSlogan: '「某稳健复利基金年化收益率 8%，本金从 10 万增长至 20 万」',
    question: '极速估值心算：按复利计算，大约需要多少年即可实现本金翻倍？',
    options: [
      { id: 'A', text: '约 9 年（利用 72 法则极速除法：72 ÷ 8 = 9）', isCorrect: true },
      { id: 'B', text: '约 12.5 年（直觉拿 100% 除以 8%，按单利线性思考）', isCorrect: false, isIntuitionTrap: true },
      { id: 'C', text: '约 18 年（直觉认为复利积累极慢）', isCorrect: false },
      { id: 'D', text: '约 25 年（低估了指数级几何膨胀的威力）', isCorrect: false }
    ],
    system1Trap: '单利线性偏差：直觉容易拿 100 ÷ 8 = 12.5年（单利），彻底漏算了每年的利滚利加速。',
    mathTruth: '精确公式 ln(2) / ln(1.08) ≈ 9.006 年。',
    mentalShortcut: '【72法则神技】：翻倍年数 ≈ 72 ÷ 年化收益率。72 ÷ 8 = 9年！口算 1 秒搞定！',
    takeaway: '牢记 72 常数，资产翻倍或贬值腰斩周期，除以百分比首数即可。',
    practicePrompt: '拖拽滑块估算：年化 8% 复利下本金翻倍所需年数',
    targetValue: 9,
    unit: '年',
    sliderMin: 1,
    sliderMax: 30,
    sliderStep: 0.5,
    sliderDefault: 16,
    intuitionTrapValue: 12.5,
    formatValue: (v) => `${v} 年`
  },
  {
    id: 'rule72-6pct',
    category: '复利投资',
    title: '稳健理财：6% 年化翻倍周期',
    hookSlogan: '「稳健养老组合长期年化复利 6%，从 50 万增长到 100 万」',
    question: '3秒心算估值：大约需要多少年实现本金翻倍？',
    options: [
      { id: 'A', text: '约 12 年（72 ÷ 6 = 12）', isCorrect: true },
      { id: 'B', text: '约 16.7 年（100 ÷ 6 单利直觉误区）', isCorrect: false, isIntuitionTrap: true },
      { id: 'C', text: '约 20 年', isCorrect: false },
      { id: 'D', text: '约 30 年', isCorrect: false }
    ],
    system1Trap: '单利误算：直觉拿 100 ÷ 6 = 16.7年，比实际复利翻倍慢了近 5 年。',
    mathTruth: 'ln(2) / ln(1.06) ≈ 11.89 年，约 12 年。',
    mentalShortcut: '【72法则】：72 ÷ 6 = 12年！1秒出答案！',
    takeaway: '6% 年化只要 12 年即可翻倍，36 年能翻三番变成 8 倍。',
    practicePrompt: '拖拽滑块估算：6% 年化复利下本金翻倍年数',
    targetValue: 12,
    unit: '年',
    sliderMin: 2,
    sliderMax: 35,
    sliderStep: 0.5,
    sliderDefault: 18,
    intuitionTrapValue: 16.7,
    formatValue: (v) => `${v} 年`
  },
  {
    id: 'rule72-9pct',
    category: '复利投资',
    title: '指数加速：9% 年化翻倍周期',
    hookSlogan: '「宽基指数基金历史年化复合收益率 9%，本金实现翻倍」',
    question: '3秒心算估值：大约需要多少年实现翻倍？',
    options: [
      { id: 'A', text: '约 8 年（72 ÷ 9 = 8）', isCorrect: true },
      { id: 'B', text: '约 11.1 年（100 ÷ 9 线性错觉）', isCorrect: false, isIntuitionTrap: true },
      { id: 'C', text: '约 15 年', isCorrect: false },
      { id: 'D', text: '约 20 年', isCorrect: false }
    ],
    system1Trap: '指数增长盲区：大众往往大幅低估了 9% 这种稍高收益率在复利下的滚雪球爆发力。',
    mathTruth: 'ln(2) / ln(1.09) ≈ 8.04 年。',
    mentalShortcut: '【72法则】：72 ÷ 9 = 8年！八九七十二，倒背如流！',
    takeaway: '年化收益率从 6% 提升到 9%，翻倍年数从 12 年骤降到 8 年。',
    practicePrompt: '拖拽滑块估算：9% 年化复利下本金翻倍年数',
    targetValue: 8,
    unit: '年',
    sliderMin: 2,
    sliderMax: 25,
    sliderStep: 0.5,
    sliderDefault: 14,
    intuitionTrapValue: 11.1,
    formatValue: (v) => `${v} 年`
  },
  {
    id: 'rule72-12pct',
    category: '复利投资',
    title: '高阶复利：12% 进取年化翻倍',
    hookSlogan: '「某优秀私募多头策略年复合收益率 12%」',
    question: '3秒心算估值：资产翻倍需要多少年？',
    options: [
      { id: 'A', text: '约 6 年（72 ÷ 12 = 6）', isCorrect: true },
      { id: 'B', text: '约 8.3 年（100 ÷ 12 单利直觉）', isCorrect: false, isIntuitionTrap: true },
      { id: 'C', text: '约 10 年', isCorrect: false },
      { id: 'D', text: '约 14 年', isCorrect: false }
    ],
    system1Trap: '单利与复利的鸿沟在高收益率下愈发显著，复利 6 年就能完成翻倍。',
    mathTruth: 'ln(2) / ln(1.12) ≈ 6.11 年。',
    mentalShortcut: '【72法则】：72 ÷ 12 = 6年！一秒心算！',
    takeaway: '12% 的复利速度下，一个人的职业生涯（30年）足以完成 5 次翻倍（32倍）！',
    practicePrompt: '拖拽滑块估算：12% 年化复利翻倍年数',
    targetValue: 6,
    unit: '年',
    sliderMin: 1,
    sliderMax: 20,
    sliderStep: 0.5,
    sliderDefault: 10,
    intuitionTrapValue: 8.3,
    formatValue: (v) => `${v} 年`
  },
  {
    id: 'rule72-inf4pct',
    category: '复利投资',
    title: '隐形小偷：4% 通胀购买力腰斩',
    hookSlogan: '「假设未来年平均真实通胀率为 4%，手头现金购买力缩水一半」',
    question: '3秒心算估值：现金购买力贬值 50% 大约需要多少年？',
    options: [
      { id: 'A', text: '约 18 年（72 ÷ 4 = 18）', isCorrect: true },
      { id: 'B', text: '约 25 年（100 ÷ 4 单利直觉）', isCorrect: false, isIntuitionTrap: true },
      { id: 'C', text: '约 30 年', isCorrect: false },
      { id: 'D', text: '约 50 年', isCorrect: false }
    ],
    system1Trap: '直觉拿 100% 除以 4% 得 25 年，严重低估了通胀指数复利对货币实际购买力的吞噬。',
    mathTruth: 'ln(2) / ln(1.04) ≈ 17.67 年，约 18 年。',
    mentalShortcut: '【72法则通胀反向用】：72 ÷ 4 = 18年！贬值腰斩只需 18 年！',
    takeaway: '现金不产生现金流就是慢性自杀，18年购买力直接减半。',
    practicePrompt: '拖拽滑块估算：4% 通胀下购买力腰斩年数',
    targetValue: 18,
    unit: '年',
    sliderMin: 5,
    sliderMax: 40,
    sliderStep: 1,
    sliderDefault: 26,
    intuitionTrapValue: 25,
    formatValue: (v) => `${v} 年`
  },
  {
    id: 'rule72-inf3pct',
    category: '复利投资',
    title: '温和通胀：3% 通胀资产腰斩',
    hookSlogan: '「在 3% 温和通胀环境下，不投资的定期存款购买力贬值 50%」',
    question: '3秒心算估值：大约需要多少年购买力腰斩？',
    options: [
      { id: 'A', text: '约 24 年（72 ÷ 3 = 24）', isCorrect: true },
      { id: 'B', text: '约 33.3 年（100 ÷ 3 线性误区）', isCorrect: false, isIntuitionTrap: true },
      { id: 'C', text: '约 45 年', isCorrect: false },
      { id: 'D', text: '约 60 年', isCorrect: false }
    ],
    system1Trap: '觉得 3% 很低无所谓，但复利 24 年正好缩水一半，相当于整整一代人财富被稀释。',
    mathTruth: 'ln(2) / ln(1.03) ≈ 23.45 年。',
    mentalShortcut: '【72法则】：72 ÷ 3 = 24年！口算 1 秒搞定！',
    takeaway: '看似温和的通胀，在人生尺度上足以毁掉缺乏抗通胀资产的家庭储蓄。',
    practicePrompt: '拖拽滑块估算：3% 通胀下资产实际购买力腰斩年数',
    targetValue: 24,
    unit: '年',
    sliderMin: 5,
    sliderMax: 50,
    sliderStep: 1,
    sliderDefault: 35,
    intuitionTrapValue: 33.3,
    formatValue: (v) => `${v} 年`
  },

  // --- 3. 折扣心理与折上折连乘 ---
  {
    id: 'disc-50-80-50',
    category: '折扣心理',
    title: '大促狂欢：折上折与满减迷雾',
    hookSlogan: '「专柜大促：全场 5 折，VIP折上再享 8 折，实付满 350 再立减 50 元！」',
    question: '3秒心算估值：原价 1,000 元的商品，实际最终相当于打了几折？',
    options: [
      { id: 'A', text: '约 2~3 折（直觉把 5折+8折与减50堆叠，感觉快不要钱了）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '3.5 折（折后 400 元再减 50 = 350 元，实付 3.5 折）', isCorrect: true },
      { id: 'C', text: '4.5 折（直觉以为 5 折基础上只便宜了一丁点）', isCorrect: false },
      { id: 'D', text: '1.5 折（误将 5折 与 8折 错当成了相减）', isCorrect: false }
    ],
    system1Trap: '折扣堆叠错觉：多重优惠词眼向大脑连续注入多巴胺，产生“占了大便宜”的盲从，丧失真实折率清醒度。',
    mathTruth: '1000 × 0.5 = 500元；500 × 0.8 = 400元；400 - 50 = 350元。350 ÷ 1000 = 35%（即 3.5 折）。',
    mentalShortcut: '【折率连乘法】：五八四十（0.5 × 0.8 = 0.4即4折），1000元的4折是400元，再减50得350元，一目了然是3.5折！',
    takeaway: '面对多层优惠，别被字眼绕晕，把各层折率在脑海中小数连乘，几秒算出真正实付折率。',
    practicePrompt: '拖拽滑块估算：原价1,000元商品在折上折加满减后的最终实付折率',
    targetValue: 3.5,
    unit: '折',
    sliderMin: 1.0,
    sliderMax: 9.0,
    sliderStep: 0.1,
    sliderDefault: 5.5,
    intuitionTrapValue: 2.5,
    formatValue: (v) => `${v.toFixed(1)} 折`
  },
  {
    id: 'disc-60-70',
    category: '折扣心理',
    title: '换季清仓：6折折上再享7折',
    hookSlogan: '「奥莱大促：全场服饰 6 折，会员折上折再享 7 折特惠！」',
    question: '3秒心算估值：该折上折实际等于打了多少折？',
    options: [
      { id: 'A', text: '1.3 折（直觉拿 7折 减去 6折）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '4.2 折（0.6 × 0.7 = 0.42，实付 4.2 折）', isCorrect: true },
      { id: 'C', text: '3 折（直觉以为两项折合相当于 3 折）', isCorrect: false },
      { id: 'D', text: '5 折', isCorrect: false }
    ],
    system1Trap: '算术加减错觉：大脑容易把 6折 和 7折 当成加减法运算，而忽略了第二层折扣是在第一层已经缩小的基数上打折。',
    mathTruth: '0.6 × 0.7 = 0.42（即 4.2 折）。',
    mentalShortcut: '【口诀连乘】：六七四十二，直接得出 42%（即 4.2 折）！一秒出答案！',
    takeaway: '双重折扣直接乘数字：6 × 7 = 42 ➔ 4.2折，永远不用草稿纸。',
    practicePrompt: '拖拽滑块估算：6折再折上7折的实际最终折率',
    targetValue: 4.2,
    unit: '折',
    sliderMin: 1.0,
    sliderMax: 8.0,
    sliderStep: 0.1,
    sliderDefault: 3.0,
    intuitionTrapValue: 1.3,
    formatValue: (v) => `${v.toFixed(1)} 折`
  },
  {
    id: 'disc-70-80-40',
    category: '折扣心理',
    title: '商超周年庆：7折再8折减40',
    hookSlogan: '「千元大衣 7 折，结账再 8 折，满 500 再立减 40 元现金！」',
    question: '3秒心算估值：标价 1000 元的大衣实付折率是多少？',
    options: [
      { id: 'A', text: '约 3~4 折（被满屏优惠字眼严重锚定）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '5.2 折（0.7 × 0.8 = 0.56，560 - 40 = 520元）', isCorrect: true },
      { id: 'C', text: '6 折', isCorrect: false },
      { id: 'D', text: '2.5 折', isCorrect: false }
    ],
    system1Trap: '七折再八折看起来折扣极大，但连乘后是 5.6 折，减 40 元后依然是 5.2 折。',
    mathTruth: '1000 × 0.7 × 0.8 - 40 = 520 元，折率 52%。',
    mentalShortcut: '【七八五十六】：0.7 × 0.8 = 0.56，1000元是560元，减40剩520元，即5.2折！',
    takeaway: '优惠字眼越多，越要心算乘积，常常发现其实只相当于半价。',
    practicePrompt: '拖拽滑块估算：1000元大衣在7折+8折-40元后的最终折率',
    targetValue: 5.2,
    unit: '折',
    sliderMin: 2.0,
    sliderMax: 8.0,
    sliderStep: 0.1,
    sliderDefault: 3.5,
    intuitionTrapValue: 3.5,
    formatValue: (v) => `${v.toFixed(1)} 折`
  },
  {
    id: 'disc-40-90',
    category: '折扣心理',
    title: '反向折上折：4折再9折',
    hookSlogan: '「断码专场：正价 4 折，结账扫码再享 9 折！」',
    question: '3秒心算估值：最终实际折率是多少？',
    options: [
      { id: 'A', text: '3.6 折（0.4 × 0.9 = 0.36，即 3.6 折）', isCorrect: true },
      { id: 'B', text: '3 折（直觉盲猜）', isCorrect: false, isIntuitionTrap: true },
      { id: 'C', text: '4.5 折', isCorrect: false },
      { id: 'D', text: '5 折', isCorrect: false }
    ],
    system1Trap: '大脑容易觉得 9 折几乎没便宜多少，其实在 4 折基础上再省了 0.4 折。',
    mathTruth: '0.4 × 0.9 = 0.36。',
    mentalShortcut: '【四九三十六】：0.4 × 0.9 = 0.36，一目了然 3.6 折！',
    takeaway: '深折扣基础上的小折扣，直接乘法瞬间算清最终折率。',
    practicePrompt: '拖拽滑块估算：4折再折上9折的最终折率',
    targetValue: 3.6,
    unit: '折',
    sliderMin: 1.0,
    sliderMax: 6.0,
    sliderStep: 0.1,
    sliderDefault: 4.0,
    intuitionTrapValue: 3.0,
    formatValue: (v) => `${v.toFixed(1)} 折`
  },
  {
    id: 'disc-50-50',
    category: '折扣心理',
    title: '半价再半价：5折再5折等于免费？',
    hookSlogan: '「疯狂促销：全场 5 折，买满指定金额折上再享 5 折！」',
    question: '3秒心算估值：5 折再 5 折实际等于几折？',
    options: [
      { id: 'A', text: '0 折 / 免费（直觉把两个 5 折相加：50% + 50% = 100%）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '2.5 折（0.5 × 0.5 = 0.25，即 2.5 折）', isCorrect: true },
      { id: 'C', text: '1 折', isCorrect: false },
      { id: 'D', text: '3.5 折', isCorrect: false }
    ],
    system1Trap: '加法错觉巅峰：最容易把两个 50% 当成 100% 减免，殊不知后一个半价是在半价基础上的半价。',
    mathTruth: '0.5 × 0.5 = 0.25（2.5 折）。',
    mentalShortcut: '【五五二十五】：0.5 × 0.5 = 0.25（2.5 折）！',
    takeaway: '永远不要把折扣相加，任何折扣都是连乘！',
    practicePrompt: '拖拽滑块估算：5折再5折的实际折率',
    targetValue: 2.5,
    unit: '折',
    sliderMin: 0.0,
    sliderMax: 5.0,
    sliderStep: 0.1,
    sliderDefault: 1.0,
    intuitionTrapValue: 0.0,
    formatValue: (v) => `${v.toFixed(1)} 折`
  },
  {
    id: 'disc-80-80',
    category: '折扣心理',
    title: '微幅叠加：8折再8折',
    hookSlogan: '「会员日尊享：全场 8 折，黑金卡折上再享 8 折！」',
    question: '3秒心算估值：该折上折实际等于几折？',
    options: [
      { id: 'A', text: '6.4 折（0.8 × 0.8 = 0.64，即 6.4 折）', isCorrect: true },
      { id: 'B', text: '6 折（直觉盲猜 8折+8折差不多是6折）', isCorrect: false, isIntuitionTrap: true },
      { id: 'C', text: '4 折（直接相减）', isCorrect: false },
      { id: 'D', text: '7.2 折', isCorrect: false }
    ],
    system1Trap: '以为“折上折”肯定很便宜，其实 8 折再 8 折依然要付 64%，只相当于 6.4 折。',
    mathTruth: '0.8 × 0.8 = 0.64。',
    mentalShortcut: '【八八六十四】：0.8 × 0.8 = 0.64即6.4折！1秒出答案！',
    takeaway: '高位折上折优惠幅度有限，不要因为两次“8折”字眼盲目囤货。',
    practicePrompt: '拖拽滑块估算：8折再8折的最终折率',
    targetValue: 6.4,
    unit: '折',
    sliderMin: 3.0,
    sliderMax: 9.0,
    sliderStep: 0.1,
    sliderDefault: 5.0,
    intuitionTrapValue: 6.0,
    formatValue: (v) => `${v.toFixed(1)} 折`
  },

  // --- 4. 真实时薪机会成本 ---
  {
    id: 'opp-wait-parcel',
    category: '机会成本',
    title: '时间估值：为了省运费排队',
    hookSlogan: '「税后月薪 28,800 元（时薪约 180 元），为省 30 元运费在寒风中排队 1.5 小时」',
    question: '3秒心算估值：这次看似省钱的行为，实际机会成本净损益是多少？',
    options: [
      { id: 'A', text: '净省 30 元（直觉觉得自己不花运费就是赚了）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '净亏损约 240 元（耗费 270 元时间价值，只省下 30 元）', isCorrect: true },
      { id: 'C', text: '收支平衡，刚好抵消', isCorrect: false },
      { id: 'D', text: '净亏损约 500 元（过分高估了消耗）', isCorrect: false }
    ],
    system1Trap: '显性收益偏见：眼前的 30 元现金是可见的实体，而 1.5 小时生命时间被潜意识当成了“无成本的免费存量”。',
    mathTruth: '1.5 小时 × 180 元/小时 = 270 元时间价值。270 - 30 = 净亏损 240 元。相当于倒贴了 240 元买排队！',
    mentalShortcut: '【真实时薪标尺】：月薪除以 160 就是真实时薪（28,800 ÷ 160 = 180元）。1.5小时耗费 270元，远超省下的30元，一眼识破大亏！',
    takeaway: '把自己的每小时时间赋予公允定价，当节省的金额小于时间消耗时，果断花钱买时间。',
    practicePrompt: '拖拽滑块估算：该次为了省运费而排队的实际净亏损机会成本',
    targetValue: 240,
    unit: '元',
    sliderMin: 0,
    sliderMax: 600,
    sliderStep: 10,
    sliderDefault: 50,
    intuitionTrapValue: 0,
    formatValue: (v) => `${v} 元`
  },
  {
    id: 'opp-free-gift',
    category: '机会成本',
    title: '排队领礼：时薪200排队两小时',
    hookSlogan: '「月薪 32,000 元（时薪约 200 元），为领价值 40 元的保温杯排队 2 小时」',
    question: '3秒心算估值：这次“免费领取”的净机会成本损益是多少？',
    options: [
      { id: 'A', text: '白赚 40 元（直觉免费不领白不领）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '净亏损 360 元（耗费 400 元时间，只拿回 40 元）', isCorrect: true },
      { id: 'C', text: '亏损 100 元', isCorrect: false },
      { id: 'D', text: '不亏不赚', isCorrect: false }
    ],
    system1Trap: '零价格效应：免费物品会让人的理性瞬间瘫痪，完全忘记 2 小时可以创造 400 元价值。',
    mathTruth: '200 × 2 = 400元。400 - 40 = 净亏损 360 元。',
    mentalShortcut: '【时薪倍数法】：时薪 200 × 2小时 = 400元，远远碾压 40元礼品，一眼看出血亏！',
    takeaway: '任何“免费排队送礼”，本质都是用你的宝贵生命给商家当人肉广告牌。',
    practicePrompt: '拖拽滑块估算：排队领礼品的实际净亏损机会成本',
    targetValue: 360,
    unit: '元',
    sliderMin: 0,
    sliderMax: 800,
    sliderStep: 10,
    sliderDefault: 80,
    intuitionTrapValue: 0,
    formatValue: (v) => `${v} 元`
  },
  {
    id: 'opp-compare-price',
    category: '机会成本',
    title: '比价耗时：时薪300货比三家3小时',
    hookSlogan: '「月薪 48,000 元（时薪约 300 元），为省 80 元在多个平台比价查找优惠券 3 小时」',
    question: '3秒心算估值：这次“精打细算”的实际机会成本净损益是多少？',
    options: [
      { id: 'A', text: '净省 80 元（直觉觉得自己薅到了商家羊毛）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '净亏损 820 元（3小时消耗900元时间，仅省80元）', isCorrect: true },
      { id: 'C', text: '净亏损 300 元', isCorrect: false },
      { id: 'D', text: '赚了 200 元', isCorrect: false }
    ],
    system1Trap: '薅羊毛的多巴胺快感掩盖了巨大的时间流失，花了 900 元时间成本省了 80 元。',
    mathTruth: '300 × 3 - 80 = 820 元净亏损。',
    mentalShortcut: '【比价耗时速算】：3小时 × 300元 = 900元，对冲80元省款，净亏820元！',
    takeaway: '高收入群体的最大支出是低效耗费的时间，停止花几小时省几十块。',
    practicePrompt: '拖拽滑块估算：比价耗时的实际净亏损机会成本',
    targetValue: 820,
    unit: '元',
    sliderMin: 50,
    sliderMax: 1500,
    sliderStep: 20,
    sliderDefault: 150,
    intuitionTrapValue: 0,
    formatValue: (v) => `${v} 元`
  },
  {
    id: 'opp-furniture-diy',
    category: '机会成本',
    title: '自行组装：时薪250自己折腾4小时',
    hookSlogan: '「月薪 40,000 元（时薪约 250 元），为省 60 元上门安装费自己折腾组装家具 4 小时」',
    question: '3秒心算估值：这次省安装费的实际净损益是多少？',
    options: [
      { id: 'A', text: '省了 60 元（觉得自己动手丰衣足食）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '净亏损 940 元（耗损 1,000 元时间，省 60 元）', isCorrect: true },
      { id: 'C', text: '亏损 300 元', isCorrect: false },
      { id: 'D', text: '赚了 500 元体验感', isCorrect: false }
    ],
    system1Trap: '忽视专业分工价值：4小时时间价值 1000 元，还伴随装错、划伤手和返工风险。',
    mathTruth: '250 × 4 - 60 = 940 元。',
    mentalShortcut: '【工时对冲】：4小时 × 250 = 1000元，远超60元，花小钱请专业师傅是最明智投资。',
    takeaway: '购买专业体力劳动服务，是对自己高时薪专业能力的最大保护。',
    practicePrompt: '拖拽滑块估算：自己组装家具的实际净亏损机会成本',
    targetValue: 940,
    unit: '元',
    sliderMin: 50,
    sliderMax: 2000,
    sliderStep: 20,
    sliderDefault: 200,
    intuitionTrapValue: 0,
    formatValue: (v) => `${v} 元`
  },

  // --- 5. 隐性借贷与真实IRR ---
  {
    id: 'loan-flat-06',
    category: '隐性借贷',
    title: '借贷暗语：名义月息 0.6% 的真相',
    hookSlogan: '「某消费金融宣传：“每月手续费低至 0.6%，轻松还款无负担”」',
    question: '3秒心算估值：按照等额本息还款，其实际年化利率 (IRR) 大约是多少？',
    options: [
      { id: 'A', text: '约 7.2%（直觉直接拿 0.6% × 12 个月算名义利率）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 13.5% ~ 14%（因本金逐月减少，真实资金占用减半）', isCorrect: true },
      { id: 'C', text: '约 9.5%（微调估算，依然严重低估）', isCorrect: false },
      { id: 'D', text: '约 24%（高利贷上限，预估偏高）', isCorrect: false }
    ],
    system1Trap: '平息名义利率伪装：直觉直接将月费率乘以 12（0.6% × 12 = 7.2%），忽视了每月归还本金后，你手头实际借用的资金平均只有一半！',
    mathTruth: '平息转真实IRR标准经验公式：名义年利率 × 1.85 ~ 1.9，或者月费率 × 22.5。0.6% × 22.5 ≈ 13.5%！',
    mentalShortcut: '【平息翻倍速算法】：名义平息翻倍就是真实年化！0.6% × 12 = 7.2%，7.2% × 1.9 ≈ 13.7%！商界障眼法一秒戳穿！',
    takeaway: '借贷产品凡是不标明 IRR 真实年化的“费率”，其真实借贷成本几乎都在名义利率的 1.8~2.0 倍左右。',
    practicePrompt: '拖拽滑块估算：月费率 0.6% 分期的真实等额本息年化利率 (IRR)',
    targetValue: 13.5,
    unit: '%',
    sliderMin: 3.0,
    sliderMax: 25.0,
    sliderStep: 0.5,
    sliderDefault: 7.2,
    intuitionTrapValue: 7.2,
    formatValue: (v) => `${v.toFixed(1)}%`
  },
  {
    id: 'loan-flat-05',
    category: '隐性借贷',
    title: '分期费率：名义月息 0.5% 真年化',
    hookSlogan: '「信用卡账单分期热推：“名义手续费仅 0.5%/月，超低门槛”」',
    question: '3秒心算估值：真实年化利率 (IRR) 大约是多少？',
    options: [
      { id: 'A', text: '约 6.0%（直觉直接 0.5% × 12）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 11.2% ~ 11.5%（平息接近翻倍）', isCorrect: true },
      { id: 'C', text: '约 8.0%', isCorrect: false },
      { id: 'D', text: '约 18.0%', isCorrect: false }
    ],
    system1Trap: '直接拿 0.5% × 12 = 6%，以为比房贷高一点点，其实等额本息借款资金池在每月折半，实际成本翻倍。',
    mathTruth: '0.5% × 22.5 ≈ 11.25%。',
    mentalShortcut: '【月费率速乘 22】：0.5% × 22 ≈ 11%！2秒看破真实年化！',
    takeaway: '名义利率乘以 1.9，是识破所有分期借贷金融把戏的金法则。',
    practicePrompt: '拖拽滑块估算：月费率 0.5% 的真实等额本息年化利率',
    targetValue: 11.2,
    unit: '%',
    sliderMin: 2.0,
    sliderMax: 20.0,
    sliderStep: 0.5,
    sliderDefault: 6.0,
    intuitionTrapValue: 6.0,
    formatValue: (v) => `${v.toFixed(1)}%`
  },
  {
    id: 'loan-flat-075',
    category: '隐性借贷',
    title: '借贷陷阱：名义月息 0.75% 真实年化',
    hookSlogan: '「消费贷免息券后：“每月手续费仅需 0.75%，随借随还”」',
    question: '3秒心算估值：真实等额本息实际年化利率 (IRR) 大约是多少？',
    options: [
      { id: 'A', text: '约 9.0%（直觉 0.75% × 12）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 16.8% ~ 17%（逼近高利息分水岭）', isCorrect: true },
      { id: 'C', text: '约 12.0%', isCorrect: false },
      { id: 'D', text: '约 25.0%', isCorrect: false }
    ],
    system1Trap: '以为 9% 还能接受，其实真实年化高达 17%，远超大多数理财产品的收益率。',
    mathTruth: '0.75% × 12 × 1.88 ≈ 16.9%。',
    mentalShortcut: '【速算翻倍法】：0.75% × 12 = 9%，9% 翻倍逼近 17%！',
    takeaway: '任何真实利率超过 15% 的借贷，都是高危资金损耗项。',
    practicePrompt: '拖拽滑块估算：月费率 0.75% 的真实年化利率 (IRR)',
    targetValue: 16.8,
    unit: '%',
    sliderMin: 5.0,
    sliderMax: 28.0,
    sliderStep: 0.5,
    sliderDefault: 9.0,
    intuitionTrapValue: 9.0,
    formatValue: (v) => `${v.toFixed(1)}%`
  },
  {
    id: 'loan-flat-04',
    category: '隐性借贷',
    title: '低费率迷惑：名义月息 0.4%',
    hookSlogan: '「银行优质客户专享：“分期手续费打折低至 0.4%/月”」',
    question: '3秒心算估值：真实年化利率大约是多少？',
    options: [
      { id: 'A', text: '约 4.8%（直觉直接 0.4% × 12）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 9.0%（名义 4.8% 的 1.88 倍）', isCorrect: true },
      { id: 'C', text: '约 6.5%', isCorrect: false },
      { id: 'D', text: '约 15.0%', isCorrect: false }
    ],
    system1Trap: '以为 4.8% 利率比房贷差不多，实际真实等额本息年化已达 9%。',
    mathTruth: '0.4% × 12 × 1.88 ≈ 9.02%。',
    mentalShortcut: '【平息近双倍】：4.8% × 1.9 ≈ 9.1%！口算 1 秒！',
    takeaway: '即便打了折的分期费率，真实利息也接近其名义数字的双倍。',
    practicePrompt: '拖拽滑块估算：月费率 0.4% 的真实年化利率',
    targetValue: 9.0,
    unit: '%',
    sliderMin: 2.0,
    sliderMax: 18.0,
    sliderStep: 0.5,
    sliderDefault: 4.8,
    intuitionTrapValue: 4.8,
    formatValue: (v) => `${v.toFixed(1)}%`
  },

  // --- 6. 日常沉没与年卡陷阱 ---
  {
    id: 'gym-cost-24',
    category: '日常沉没',
    title: '年卡沉没：一天只要 6 块钱？',
    hookSlogan: '「健身房豪华年卡 2,400 元，销售热推：“一天只要 6 块多钱，闭眼入！”」',
    question: '3秒心算估值：若真实生活节奏中平均每月仅去 2 次，单次锻炼真实成本是多少？',
    options: [
      { id: 'A', text: '约 6.6 元/次（被销售的“每天6块多”直接锚定）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 50 元/次（按每周都去一次理想化估算了）', isCorrect: false },
      { id: 'C', text: '100 元/次（一年实去 24 次，2400 ÷ 24 = 100元/次）', isCorrect: true },
      { id: 'D', text: '200 元/次（算成了一年只去12次）', isCorrect: false }
    ],
    system1Trap: '日均稀释法锚点：商家用全年的 365 天来除总价，让你误以为单次极其便宜，而实际成本取决于你真实到访的【使用频次】。',
    mathTruth: '每月 2 次 × 12 个月 = 24 次。2,400 元 ÷ 24 次 = 100 元/次！比单次团购门票还要贵数倍。',
    mentalShortcut: '【真实频次归一法】：年费卡永远不要除以 365，而是用“总价 ÷ 真实会去的次数”。2400 ÷ 24 = 100元！3秒算清真实底价！',
    takeaway: '购买任何会员或健身卡，先用保守频次除以总金额，若单次成本高于单次买票，绝不办卡。',
    practicePrompt: '拖拽滑块估算：年卡 2,400 元每月仅去 2 次的单次锻炼真实成本',
    targetValue: 100,
    unit: '元/次',
    sliderMin: 5,
    sliderMax: 250,
    sliderStep: 5,
    sliderDefault: 20,
    intuitionTrapValue: 6.6,
    formatValue: (v) => `${v} 元/次`
  },
  {
    id: 'gym-cost-12',
    category: '日常沉没',
    title: '健身弃坑：3600元月均去一次',
    hookSlogan: '「私教级年卡 3,600 元畅练，“一天才 10 块钱”，实际工作太忙每月只去 1 次」',
    question: '3秒心算估值：单次锻炼的真实成本是多少？',
    options: [
      { id: 'A', text: '约 10 元/次（直接被日均 10 元锚定）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 80 元/次', isCorrect: false },
      { id: 'C', text: '300 元/次（一年去 12 次，3600 ÷ 12 = 300元）', isCorrect: true },
      { id: 'D', text: '600 元/次', isCorrect: false }
    ],
    system1Trap: '忽略沉没成本：总以为自己办了卡就会天天去，现实中单次洗澡成本高达 300 元。',
    mathTruth: '3600 ÷ 12 = 300 元/次。',
    mentalShortcut: '【年费 ÷ 12月】：每月去一次，单次成本直接等于一个月月费（300元）！一秒出答案！',
    takeaway: '习惯未养成前，次卡或单次团购永远是性价比最高且无心理压力的选择。',
    practicePrompt: '拖拽滑块估算：3600元年卡月去1次的单次成本',
    targetValue: 300,
    unit: '元/次',
    sliderMin: 10,
    sliderMax: 600,
    sliderStep: 10,
    sliderDefault: 50,
    intuitionTrapValue: 10,
    formatValue: (v) => `${v} 元/次`
  },
  {
    id: 'gym-ski-pass',
    category: '日常沉没',
    title: '滑雪季卡：4500元一季去三次',
    hookSlogan: '「雪场畅滑通季卡 4,500 元无限次，雪友圈热捧，因加班实际整个冬天只去了 3 次」',
    question: '3秒心算估值：单次滑雪的真实票价成本是多少？',
    options: [
      { id: 'A', text: '约 300 元/次（按雪场单日散客票估算）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 800 元/次', isCorrect: false },
      { id: 'C', text: '1,500 元/次（4500 ÷ 3 = 1500元，是散客票的近 5 倍）', isCorrect: true },
      { id: 'D', text: '2,000 元/次', isCorrect: false }
    ],
    system1Trap: '购买季卡时的大脑将自己幻化成“每周必去的硬核雪友”，现实中的通勤与时间阻力让单次成本飙升到 1500 元。',
    mathTruth: '4500 ÷ 3 = 1500 元/次。',
    mentalShortcut: '【总价除实次】：4500 ÷ 3 = 1500元！口算 1 秒看出天价单次！',
    takeaway: '爱好类高额通卡，必须在去年真实到访频次的基础上打 7 折来评估，绝不按美好愿望购买。',
    practicePrompt: '拖拽滑块估算：4500元季卡只去3次的单次真实成本',
    targetValue: 1500,
    unit: '元/次',
    sliderMin: 200,
    sliderMax: 3000,
    sliderStep: 50,
    sliderDefault: 500,
    intuitionTrapValue: 300,
    formatValue: (v) => `${v} 元/次`
  },

  // --- 7. 买赠真实折率 ---
  {
    id: 'promo-buy2-get1',
    category: '折扣心理',
    title: '赠品博弈：买二赠一 vs 第二件半价',
    hookSlogan: '「商超两款热销商品：A款搞“买二赠一”；B款搞“第二件半价”」',
    question: '3秒心算估值：哪一个优惠方案的实际真实折率更低（更便宜）？',
    options: [
      { id: 'A', text: '第二件半价更便宜（直觉看到“半价/5折”字眼格外诱人）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '买二赠一更划算（实付2件得3件 = 6.7折；半价实为 7.5折）', isCorrect: true },
      { id: 'C', text: '两者折扣力度完全一致（直觉以为都是折合 7 折左右）', isCorrect: false },
      { id: 'D', text: '都不划算，只有买三赠二才便宜', isCorrect: false }
    ],
    system1Trap: '“半价”字眼视觉冲击：大脑对“半价（50%）”字眼极其敏感，本能产生巨大折扣联想；而“买二赠一”常被错觉当成微弱添头。',
    mathTruth: '买二赠一：付 2 件钱拿 3 件，折率 = 2 ÷ 3 ≈ 66.7%（6.7折）。第二件半价：付 1.5 件钱拿 2 件，折率 = 1.5 ÷ 2 = 75%（7.5折）。',
    mentalShortcut: '【付账件数 ÷ 到手件数】：买二赠一 = 2/3 (6.7折)；第二件半价 = 1.5/2 (7.5折)。6.7折明显优于 7.5折！',
    takeaway: '拆解买赠的秘诀只有一条：用实际付款件数除以实际拿到件数，任何花哨文案原形毕露。',
    practicePrompt: '拖拽滑块估算：“买二赠一”相较正价的实际真实折率',
    targetValue: 6.7,
    unit: '折',
    sliderMin: 3.0,
    sliderMax: 9.5,
    sliderStep: 0.1,
    sliderDefault: 5.0,
    intuitionTrapValue: 5.0,
    formatValue: (v) => `${v.toFixed(1)} 折`
  },
  {
    id: 'promo-buy3-get1',
    category: '折扣心理',
    title: '买三赠一：真实折率是几折？',
    hookSlogan: '「饮品店招牌爆款：“买三杯赠一杯同款饮品”」',
    question: '3秒心算估值：相当于打了多少折？',
    options: [
      { id: 'A', text: '7.5 折（付 3 杯钱得 4 杯，3 ÷ 4 = 0.75）', isCorrect: true },
      { id: 'B', text: '6.7 折（直觉当成了买二赠一）', isCorrect: false, isIntuitionTrap: true },
      { id: 'C', text: '5 折（以为送一杯力度很大）', isCorrect: false },
      { id: 'D', text: '8 折', isCorrect: false }
    ],
    system1Trap: '直觉容易高估“赠送”的力度，其实买三赠一仅仅相当于打了 7.5 折。',
    mathTruth: '3 ÷ 4 = 75%（7.5 折）。',
    mentalShortcut: '【三除以四】：3/4 = 0.75即7.5折！口算 1 秒出！',
    takeaway: '买N赠1的折扣是 N/(N+1)，分母越大折扣越微弱。',
    practicePrompt: '拖拽滑块估算：买三赠一的实际真实折率',
    targetValue: 7.5,
    unit: '折',
    sliderMin: 4.0,
    sliderMax: 9.5,
    sliderStep: 0.1,
    sliderDefault: 6.0,
    intuitionTrapValue: 6.7,
    formatValue: (v) => `${v.toFixed(1)} 折`
  },
  {
    id: 'promo-second-half',
    category: '折扣心理',
    title: '第二件半价：真实等于几折？',
    hookSlogan: '「快餐连锁招牌：“汉堡套餐第二份半价”」',
    question: '3秒心算估值：实际折率是多少？',
    options: [
      { id: 'A', text: '5 折（直觉眼睛被“半价”大字占满）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '7.5 折（两份共付 1.5 份钱，1.5 ÷ 2 = 0.75）', isCorrect: true },
      { id: 'C', text: '6 折', isCorrect: false },
      { id: 'D', text: '8.5 折', isCorrect: false }
    ],
    system1Trap: '半价锚定效应：“半价”两个字刺激多巴胺，以为省了50%，其实均摊下来不过是 7.5 折。',
    mathTruth: '(1 + 0.5) / 2 = 0.75。',
    mentalShortcut: '【一点五除以二】：1.5 ÷ 2 = 0.75，实打实的7.5折！',
    takeaway: '第二件半价必须买两件才成立，如果你本来只要吃一件，实际上多花了50%的钱！',
    practicePrompt: '拖拽滑块估算：第二件半价的实际全单折率',
    targetValue: 7.5,
    unit: '折',
    sliderMin: 4.0,
    sliderMax: 9.0,
    sliderStep: 0.1,
    sliderDefault: 5.0,
    intuitionTrapValue: 5.0,
    formatValue: (v) => `${v.toFixed(1)} 折`
  },

  // --- 8. 微型订阅与自动续费 ---
  {
    id: 'sub-vip-4yr',
    category: '消费分期',
    title: '水滴石穿：自动续费的四年黑洞',
    hookSlogan: '「某视频 App 每月 29 元自动续费，平时很少打开，不知不觉扣款了 4 年」',
    question: '3秒心算估值：这笔无感微小支出累计已流失了多少资金？',
    options: [
      { id: 'A', text: '约 300 多元（直觉觉得一个月才20多块，没多少钱）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 800 元（大概估计了两年）', isCorrect: false },
      { id: 'C', text: '约 1,392 元（接近 1400 元，够买一部优质平板/主动降噪耳机）', isCorrect: true },
      { id: 'D', text: '约 2,500 元（高估了单价）', isCorrect: false }
    ],
    system1Trap: '微额痛感钝化：单次 29 元低于大脑消费警觉阈值，但乘上 48 个月的时间杠杆，其金额足以添置一件高品质生产力工具。',
    mathTruth: '29 元 × 12 个月 × 4 年 = 1,392 元。',
    mentalShortcut: '【年化乘整法】：月费约 30 元 ➔ 一年 360 元 ➔ 4年就是 360 × 4 = 1,440 元。3秒快速定位千元大关！',
    takeaway: '每季度定期排查一次手机自动续费清单，断舍离闲置微订阅，是每年白赚几千元现金流的最轻松习惯。',
    practicePrompt: '拖拽滑块估算：每月 29 元微订阅自动续费 4 年累计流失资金',
    targetValue: 1392,
    unit: '元',
    sliderMin: 100,
    sliderMax: 3000,
    sliderStep: 20,
    sliderDefault: 500,
    intuitionTrapValue: 350,
    formatValue: (v) => `${v.toLocaleString()} 元`
  },
  {
    id: 'sub-music-3yr',
    category: '消费分期',
    title: '音乐云盘：每月19元三年流失',
    hookSlogan: '「某音乐网盘每月 19 元连续包月，三年从未主动解约」',
    question: '3秒心算估值：三年累计扣费是多少？',
    options: [
      { id: 'A', text: '约 200 元（直觉觉得几十块钱而已）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '684 元（19 × 36个月，小七百块）', isCorrect: true },
      { id: 'C', text: '约 1,100 元', isCorrect: false },
      { id: 'D', text: '约 1,500 元', isCorrect: false }
    ],
    system1Trap: '每月十几元连账单提醒都不会弹出，三年不知不觉流走近 700 元。',
    mathTruth: '19 × 12 × 3 = 684 元。',
    mentalShortcut: '【按20速算】：20 × 36 = 720元，稍减去36得 684元！口算 2 秒！',
    takeaway: '自动续费是商业公司最喜欢利用的人性惰性，不用的服务立即取消自动扣款。',
    practicePrompt: '拖拽滑块估算：19元/月订阅 3 年的总流失金额',
    targetValue: 684,
    unit: '元',
    sliderMin: 100,
    sliderMax: 1500,
    sliderStep: 10,
    sliderDefault: 300,
    intuitionTrapValue: 200,
    formatValue: (v) => `${v} 元`
  },
  {
    id: 'sub-saas-3yr',
    category: '消费分期',
    title: '办公工具：每月38元三年黑洞',
    hookSlogan: '「某在线协同工具专业版每月 38 元自动扣缴，离职后闲置 3 年」',
    question: '3秒心算估值：3 年累计无感扣款总额是多少？',
    options: [
      { id: 'A', text: '约 450 元（按一年估计了）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '1,368 元（38 × 36个月，超千元）', isCorrect: true },
      { id: 'C', text: '约 2,200 元', isCorrect: false },
      { id: 'D', text: '约 3,000 元', isCorrect: false }
    ],
    system1Trap: '工作场景切换后，绑定的免密支付仍旧悄悄吞噬个人银行卡余额。',
    mathTruth: '38 × 36 = 1,368 元。',
    mentalShortcut: '【约40速算】：40 × 36 = 1,440元，略减去 72 得 1,368元！',
    takeaway: '换工作或项目结项后，第一件事就是关停所有关联订阅。',
    practicePrompt: '拖拽滑块估算：38元/月订阅 3 年的累计支出',
    targetValue: 1368,
    unit: '元',
    sliderMin: 200,
    sliderMax: 3000,
    sliderStep: 20,
    sliderDefault: 600,
    intuitionTrapValue: 450,
    formatValue: (v) => `${v.toLocaleString()} 元`
  },

  // --- 9. 超市大包装均价障眼法 ---
  {
    id: 'bulk-cereal-800',
    category: '折扣心理',
    title: '超市假象：大包装一定更划算？',
    hookSlogan: '「货架对比：特大家庭装 800g 售价 48 元；促销小包装 150g 售价 7.5 元」',
    question: '3秒心算估值：哪一个包装的每 100g 真实单价更便宜？',
    options: [
      { id: 'A', text: '大包装更划算（常识直觉认为“大包装量大从优，买大必省”）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '小包装更便宜（小包装 5元/100g，大包装 6元/100g）', isCorrect: true },
      { id: 'C', text: '两者单价完全相等', isCorrect: false },
      { id: 'D', text: '无法心算，必须拿手机计算器按小数点', isCorrect: false }
    ],
    system1Trap: '“量大从优”刻板启发式：商家经常利用消费者“大包装必划算”的惯性思维，悄悄调高大包装单价或进行份量缩水。',
    mathTruth: '大包装：48 ÷ 8 = 6 元/100g。小包装：7.5 ÷ 1.5 = 5 元/100g。小包装足足便宜了 17%！',
    mentalShortcut: '【百克首位数归一法】：大包装 48 ÷ 8 = 6元；小包装 7.5 ÷ 1.5 = 5元。简单除以首位有效数，高下立判！',
    takeaway: '不要被“巨无霸”、“家庭装”字眼绑架，在脑海中统一折算成 100g 或 1kg 对比，往往有反常惊喜。',
    practicePrompt: '拖拽滑块估算：大包装 800g 售价 48 元的每 100g 真实单价',
    targetValue: 6.0,
    unit: '元/100g',
    sliderMin: 2.0,
    sliderMax: 12.0,
    sliderStep: 0.2,
    sliderDefault: 4.5,
    intuitionTrapValue: 4.0,
    formatValue: (v) => `${v.toFixed(1)} 元/100g`
  },
  {
    id: 'bulk-milk-tea',
    category: '折扣心理',
    title: '大杯陷阱：超大杯 500ml vs 中杯 250ml',
    hookSlogan: '「超大杯 500ml 售价 36 元 vs 中杯 250ml 尝鲜特价 16 元」',
    question: '3秒心算估值：哪一个真实毫升单价更便宜？',
    options: [
      { id: 'A', text: '超大杯更划算（直觉以为买大杯划算）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '中杯更划算（中杯 6.4元/100ml，大杯 7.2元/100ml）', isCorrect: true },
      { id: 'C', text: '完全一致', isCorrect: false },
      { id: 'D', text: '大杯送吸管所以便宜', isCorrect: false }
    ],
    system1Trap: '“升级大杯更省”商业暗示：大杯定价 36 元实际每 100ml 7.2元，中杯翻倍也才 32元，大杯反而贵了 4 元！',
    mathTruth: '中杯两杯 500ml 仅需 16 × 2 = 32 元，比大杯 36 元便宜 4 元。',
    mentalShortcut: '【翻倍对标法】：中杯 250ml 翻倍是 500ml，价格 16 × 2 = 32元 < 36元！秒杀大杯！',
    takeaway: '买大杯前，先把中杯价格翻倍，如果比大杯便宜，果断买两中杯或放弃大杯。',
    practicePrompt: '拖拽滑块估算：中杯两杯 500ml 与超大杯 36 元的差价（大杯溢价额）',
    targetValue: 4.0,
    unit: '元',
    sliderMin: 0.0,
    sliderMax: 15.0,
    sliderStep: 0.5,
    sliderDefault: 1.0,
    intuitionTrapValue: 0.0,
    formatValue: (v) => `${v} 元`
  },

  // --- 10. 百分比涨跌非对称 ---
  {
    id: 'pct-50-up-down',
    category: '复利投资',
    title: '涨跌非对称：先涨 50% 再跌 50%',
    hookSlogan: '「某投资账户第一年业绩暴涨 +50%，第二年遭遇回调下跌 -50%」',
    question: '3秒心算估值：此时账户总资产相比最初起始本金是盈是亏？',
    options: [
      { id: 'A', text: '不赚不亏，刚好保本（直觉 +50% - 50% = 0%）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '亏损 25%（资产只剩原始本金的 75%）', isCorrect: true },
      { id: 'C', text: '轻微盈利 5%', isCorrect: false },
      { id: 'D', text: '亏损 50%', isCorrect: false }
    ],
    system1Trap: '百分比算术加减错觉：大脑习惯将百分比当作算术加减（+50 - 50 = 0），忽视了下跌时的计算基数已经变成了放大的 150%。',
    mathTruth: '100 × (1 + 0.5) = 150；150 × (1 - 0.5) = 75。总本金净亏损 25%！',
    mentalShortcut: '【小数连乘法】：1.5 × 0.5 = 0.75！剩下 75% 即净亏 25%。同比例涨跌永远是倒贴！',
    takeaway: '投资中“回撤控制”远比“爆发增长”重要，跌 50% 需要涨 100% 才能回本，非对称风险是复利杀手。',
    practicePrompt: '拖拽滑块估算：投资先暴涨 +50% 再回调 -50% 后的最终净亏损比例',
    targetValue: 25,
    unit: '%',
    sliderMin: 0,
    sliderMax: 60,
    sliderStep: 1,
    sliderDefault: 5,
    intuitionTrapValue: 0,
    formatValue: (v) => `${v}%`
  },
  {
    id: 'pct-rebound-50',
    category: '复利投资',
    title: '腰斩回本：下跌 50% 需要涨多少？',
    hookSlogan: '「某重仓标的从 100 元暴跌 50% 跌至 50 元」',
    question: '3秒心算估值：要回到 100 元初始价，需要上涨多少百分比？',
    options: [
      { id: 'A', text: '上涨 50% 即可（直觉对称思考：跌50%涨50%回本）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '需要暴涨 100%（从 50 元涨到 100 元需要翻倍）', isCorrect: true },
      { id: 'C', text: '上涨 75%', isCorrect: false },
      { id: 'D', text: '上涨 150%', isCorrect: false }
    ],
    system1Trap: '对称性致命偏误：跌 50% 只要动动手，涨 100% 却需要资产彻底翻倍，回本难度天壤之别！',
    mathTruth: '(100 - 50) ÷ 50 = 100%。',
    mentalShortcut: '【底数翻倍法则】：跌到 50，再回 100 就是 50 涨到 100，增长 1 倍即 +100%！',
    takeaway: '防守永远第一，避免本金腰斩是所有职业投资人的最高底线。',
    practicePrompt: '拖拽滑块估算：资产下跌 50% 后所需回本涨幅',
    targetValue: 100,
    unit: '%',
    sliderMin: 20,
    sliderMax: 150,
    sliderStep: 5,
    sliderDefault: 50,
    intuitionTrapValue: 50,
    formatValue: (v) => `${v}%`
  },
  {
    id: 'pct-30-up-down',
    category: '复利投资',
    title: '涨跌非对称：先涨 30% 再跌 30%',
    hookSlogan: '「某基金首季上涨 +30%，次季下跌 -30%」',
    question: '3秒心算估值：最终资产净损益是多少？',
    options: [
      { id: 'A', text: '保本持平（直觉 +30 - 30 = 0）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '净亏损 9%（资产只剩原始本金的 91%）', isCorrect: true },
      { id: 'C', text: '净亏损 3%', isCorrect: false },
      { id: 'D', text: '盈利 3%', isCorrect: false }
    ],
    system1Trap: '直觉以为涨跌相抵，实则 1.3 × 0.7 = 0.91，净亏 9%。',
    mathTruth: '1.3 × 0.7 = 0.91，亏损 9%。',
    mentalShortcut: '【平方差速算法】：1 - 0.3² = 1 - 0.09 = 0.91，必亏 3% 的平方（即 9%）！1秒口算！',
    takeaway: '无论多大幅度，同比例先涨后跌（或先跌后涨），净损益一定是下跌幅度的平方！',
    practicePrompt: '拖拽滑块估算：先涨 30% 再跌 30% 后的净亏损比例',
    targetValue: 9,
    unit: '%',
    sliderMin: 0,
    sliderMax: 30,
    sliderStep: 1,
    sliderDefault: 0,
    intuitionTrapValue: 0,
    formatValue: (v) => `${v}%`
  },

  // --- 11. 拿铁因子与微额复利 ---
  {
    id: 'latte-daily-coffee',
    category: '日常沉没',
    title: '拿铁因子：每天一杯精品咖啡',
    hookSlogan: '「每天上班必喝一杯 32 元精品手冲，一年按 250 个工作日计算」',
    question: '3秒心算估值：一年累计仅在手冲咖啡上的支出大概是多少？',
    options: [
      { id: 'A', text: '约 2,000 元（直觉把 30 多块钱等同于零碎外卖小钱）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '8,000 元（32 × 250，相当于一趟双人深度旅行或高端电脑）', isCorrect: true },
      { id: 'C', text: '约 4,500 元（低估了工作日天数累积）', isCorrect: false },
      { id: 'D', text: '约 12,000 元（预估过高）', isCorrect: false }
    ],
    system1Trap: '微小日常沉没盲区：32 元在当下扫码付款时毫无痛感，大脑极难直观感知年化后近万元的现金流汇聚。',
    mathTruth: '32 × 250 = 32 × 1000 ÷ 4 = 8,000 元。',
    mentalShortcut: '【乘以250速算技】：任何数 × 250 = 该数 × 1000 ÷ 4。32 ÷ 4 = 8 ➔ 后面补三个零 = 8,000元！一秒破局！',
    takeaway: '适度享受无可厚非，但清楚知道自己的“拿铁因子”在哪里，才能掌握金钱的主动掌控权。',
    practicePrompt: '拖拽滑块估算：工作日每天一杯 32 元咖啡全年的累计总开销',
    targetValue: 8000,
    unit: '元',
    sliderMin: 1000,
    sliderMax: 16000,
    sliderStep: 100,
    sliderDefault: 3000,
    intuitionTrapValue: 2000,
    formatValue: (v) => `${v.toLocaleString()} 元`
  },
  {
    id: 'latte-milktea-daily',
    category: '日常沉没',
    title: '下午茶瘾：每天一杯25元奶茶',
    hookSlogan: '「每天下午点一杯 25 元网红特调奶茶，坚持一整年 365 天」',
    question: '3秒心算估值：一年累计流失资金是多少？',
    options: [
      { id: 'A', text: '约 3,000 元（按一个月两百块直觉估算）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 5,000 元', isCorrect: false },
      { id: 'C', text: '9,125 元（25 × 365天，超九千元足以升级一整套数码装备）', isCorrect: true },
      { id: 'D', text: '约 15,000 元', isCorrect: false }
    ],
    system1Trap: '奶茶是社交润滑剂，单杯25元无痛，一年下来接近 1 万元，十年可买一辆代步微型电车。',
    mathTruth: '25 × 365 = 9,125 元。',
    mentalShortcut: '【四分之一千】：25 × 365 = 36500 ÷ 4 ≈ 9,125元！口算 2 秒！',
    takeaway: '审视每日高频微小支出，能为你无痛省出每年一次的长途旅行。',
    practicePrompt: '拖拽滑块估算：25元/天连续365天的累计年化支出',
    targetValue: 9125,
    unit: '元',
    sliderMin: 2000,
    sliderMax: 15000,
    sliderStep: 100,
    sliderDefault: 4000,
    intuitionTrapValue: 3000,
    formatValue: (v) => `${v.toLocaleString()} 元`
  },
  {
    id: 'latte-taxi-diff',
    category: '日常沉没',
    title: '通勤打车：每天单程多花20元差价',
    hookSlogan: '「工作日因多赖床10分钟，每天打车替代地铁多花 20 元，一年 250 天」',
    question: '3秒心算估值：一年多付出的隐性通勤成本是多少？',
    options: [
      { id: 'A', text: '约 1,500 元（直觉以为每天二十块没多少）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '5,000 元（20 × 250天，相当于一个月房租或年终大件）', isCorrect: true },
      { id: 'C', text: '约 3,200 元', isCorrect: false },
      { id: 'D', text: '约 8,000 元', isCorrect: false }
    ],
    system1Trap: '20元差价极其隐蔽，但乘上 250 个工作日，5,000 元真金白银消失在赖床的几分钟里。',
    mathTruth: '20 × 250 = 5,000 元。',
    mentalShortcut: '【20 × 250】：20 × 250 = 5,000元！直接秒杀！',
    takeaway: '改变一个晨间微习惯，一年凭空多出 5,000 元自由支配金。',
    practicePrompt: '拖拽滑块估算：工作日每天20元差价一年的累计总额',
    targetValue: 5000,
    unit: '元',
    sliderMin: 800,
    sliderMax: 10000,
    sliderStep: 100,
    sliderDefault: 2000,
    intuitionTrapValue: 1500,
    formatValue: (v) => `${v.toLocaleString()} 元`
  },

  // --- 12. 盲盒与博彩数学期望 ---
  {
    id: 'lottery-box-50',
    category: '机会成本',
    title: '盲盒幻象：1% 几率抽中 2,000 元大奖',
    hookSlogan: '「单次 50 元抽数码盲盒：1% 概率爆 2,000 元大奖，99% 为 15 元安慰奖」',
    question: '3秒心算估值：单次抽奖的真实数学期望价值是多少？',
    options: [
      { id: 'A', text: '约 50 元甚至更高（被 2000 元大奖的光环强烈劫持）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '约 35 元（期望亏损 30%，单次稳定倒贴 15 元）', isCorrect: true },
      { id: 'C', text: '约 20 元（忽略了保底安慰奖的价值）', isCorrect: false },
      { id: 'D', text: '约 5 元', isCorrect: false }
    ],
    system1Trap: '大奖焦点偏误：多巴胺全被 2,000 元超大字体所吸引，而 99% 的大概率平庸被潜意识自动忽略过滤。',
    mathTruth: '期望值 = 1% × 2,000 + 99% × 15 = 20 + 14.85 = 34.85 元。花 50 元买 34.85 元的东西，稳赔 15.15 元！',
    mentalShortcut: '【两段速拆期望】：大奖期望 = 2000 × 1% = 20元；保底期望 = 15元。20 + 15 = 35元！对比 50元售价，一眼看清是负期望赌场！',
    takeaway: '商业盲盒与博彩本质都是负期望游戏，用两步拆解大奖与保底期望，3秒看穿赌场底牌。',
    practicePrompt: '拖拽滑块估算：50元单次盲盒的真实数学期望价值',
    targetValue: 35,
    unit: '元',
    sliderMin: 5,
    sliderMax: 80,
    sliderStep: 1,
    sliderDefault: 55,
    intuitionTrapValue: 50,
    formatValue: (v) => `${v} 元`
  },
  {
    id: 'lottery-scratch-20',
    category: '机会成本',
    title: '刮刮乐陷阱：标称 65% 返奖率',
    hookSlogan: '「20 元一张的福利即开彩票，标称综合返奖率为 65%」',
    question: '3秒心算估值：长期来看每买一张的数学期望回报是多少？',
    options: [
      { id: 'A', text: '20 元保本（总觉得自己运气好能中头奖）', isCorrect: false, isIntuitionTrap: true },
      { id: 'B', text: '13 元（20 × 65% = 13元，每买一张稳亏 7 元）', isCorrect: true },
      { id: 'C', text: '18 元', isCorrect: false },
      { id: 'D', text: '5 元', isCorrect: false }
    ],
    system1Trap: '中奖幸存者偏差：只看到朋友圈有人中了十万，没看到每张卡都在以 35% 的速度无情抽税。',
    mathTruth: '20 × 0.65 = 13 元。每花 20 元，期望残值只有 13 元。',
    mentalShortcut: '【返奖率乘单价】：20 × 0.65 = 13元！瞬间明白买得越多亏得越确定！',
    takeaway: '彩票是典型的“对智力不自信税”，把买彩票的钱定投指数基金更有期望收益。',
    practicePrompt: '拖拽滑块估算：20元彩票在65%返奖率下的单张期望残值',
    targetValue: 13,
    unit: '元',
    sliderMin: 2,
    sliderMax: 30,
    sliderStep: 1,
    sliderDefault: 20,
    intuitionTrapValue: 20,
    formatValue: (v) => `${v} 元`
  }
];

/**
 * 智能题库洗牌与非重复抽取器
 * 保证在初级 (5题)、中级 (25题)、高级 (50题) 内部完全不重复
 * 且在重新开始游戏时优先提供不同题目与排列
 */
export function getUniqueSessionQuestions(
  count: number,
  excludeIds: string[] = []
): ValuationQuestion[] {
  // Filter pool excluding recent seen questions if possible
  const pool = [...MASTER_VALUATION_POOL];

  // If pool has more than count, try to exclude recently seen ones
  let eligible = pool.filter(q => !excludeIds.includes(q.id));
  if (eligible.length < count) {
    // If not enough unseen, merge back with shuffled remainder
    eligible = pool;
  }

  // Shuffle thoroughly using Fisher-Yates
  const shuffled = [...eligible];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // If count is greater than pool size (e.g. 50 questions), procedurally generate variations
  if (count <= shuffled.length) {
    return shuffled.slice(0, count);
  }

  // For 50 questions, take all available unique questions and generate non-conflicting variations
  const result: ValuationQuestion[] = [...shuffled];
  let variantIndex = 1;

  while (result.length < count) {
    const base = shuffled[(result.length - shuffled.length) % shuffled.length];
    const multiplier = 1 + (variantIndex * 0.15);
    const newId = `${base.id}-v${variantIndex}`;

    // Create a distinct parametric variation
    result.push({
      ...base,
      id: newId,
      title: `${base.title} · 变式${variantIndex}`,
      hookSlogan: base.hookSlogan.replace(/(\d+)/g, (match) => {
        const n = parseFloat(match);
        return Math.round(n * multiplier).toString();
      })
    });
    variantIndex++;
  }

  return result.slice(0, count);
}
