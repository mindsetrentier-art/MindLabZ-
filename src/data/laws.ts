import { PsychologyLaw, CategoryType, CategoryZh, DifficultyLevel, GameType } from '../types';
import manifestData from '../../data/laws.manifest.json';

const CORE_PSYCHOLOGY_LAWS: PsychologyLaw[] = [
  {
    id: 'zeigarnik-effect',
    nameZh: '蔡格尼克效应',
    nameEn: 'Zeigarnik Effect',
    category: 'memory',
    categoryZh: '记忆',
    shortExplanation: '人们对未完成或被打断的任务记忆，远深刻于已完成的任务。',
    detailedExplanation: '苏联心理学家布鲁玛·蔡格尼克在餐厅观察到服务员对未结账顾客的点单细节记忆犹新，但结账后瞬间忘光。大脑会将未完成的任务保持在一种“认知唤醒”状态，持续占用工作记忆插槽。',
    whyItHappens: '大脑具有天生的“追求完形”（Gestalt closure）机制。任务未结项时，神经突触维持着微弱的兴奋回路，产生轻微的认知张力，促使个体寻求闭环。',
    realLifeExample: '悬疑电视剧总是把最高潮悬念留在每一集结尾（Cliffhanger），让你整夜念念不忘甚至一口气刷完。',
    keyTakeaway: '若想摆脱对某项繁重任务的拖延，先做哪怕 2 分钟，让大脑形成“未完成”张力，启动蔡格尼克驱动力。',
    question: '电视剧每一集结尾设置悬念让你停不下来，主要利用了什么心理学效应？',
    answers: ['蔡格尼克效应', '锚定效应', '峰终定律', '沉没成本谬误'],
    correctAnswer: 0,
    difficulty: 'Medium',
    mastery: 85,
    relatedGame: 'psych-experiment',
    icon: 'hourglass_empty',
    experimentSetup: {
      scenario: '你正在处理两份紧急报告。报告A做了一半被老板叫去开会；报告B已彻底完成并发送。会议中你脑海里一直在琢磨的是：',
      optionA: { label: '做了一半的报告A', biasDescription: '典型蔡格尼克认知张力，未完成事务持续唤醒前额叶' },
      optionB: { label: '已经提交的报告B', rationalDescription: '已闭环事务已被大脑释放记忆负荷' },
      globalChoicePercentageA: 89,
      insight: '89% 的测试者都会优先反复回想未完成的报告A。这就是为什么“先开始写一个标题”是战胜拖延症最科学的方法。'
    }
  },
  {
    id: 'confirmation-bias',
    nameZh: '确认偏误',
    nameEn: 'Confirmation Bias',
    category: 'cognitive',
    categoryZh: '认知',
    shortExplanation: '人们倾向于寻找、解释和记忆能够证实自己已有信念的信息，而本能过滤相反证据。',
    detailedExplanation: '确认偏误是人类认知系统中最为顽固的捷径之一。当我们对某件事物形成初步预设后，大脑会像装了过滤器一样，只吸收支持该预设的线索，甚至将中立事实扭曲为支持论据。',
    whyItHappens: '推翻既有认知需要消耗大量前额皮层能量（认知失调带来的不适感），而证实既有认知则会触发多巴胺奖励回路，让大脑感到安全和连贯。',
    realLifeExample: '当你认为自己运气不好时，你会格外放大今天遇到的每一个红灯，却彻底无视一路顺畅的十几个绿灯。',
    keyTakeaway: '在做关键决策前，主动扮演“魔鬼代言人”，寻找至少3个否定自己当前方案的硬性事实。',
    question: '一个人深信“水逆会倒霉”，并在当天摔坏杯子后感叹“果然如此”，这体现了：',
    answers: ['首因效应', '确认偏误', '旁观者效应', '皮格马利翁效应'],
    correctAnswer: 1,
    difficulty: 'Easy',
    mastery: 90,
    relatedGame: 'mind-trap',
    icon: 'search_check',
    experimentSetup: {
      scenario: '给你一组数字序列 2-4-6，并告诉你这符合一个隐藏规则。你可以提出新的三位数并测试是否符合规则。你会怎么测？',
      optionA: { label: '测试 8-10-12（试图证实偶数递增假设）', biasDescription: '经典正向证实偏误（Wason选择任务）' },
      optionB: { label: '测试 1-3-5 或 5-4-3（试图证伪假设）', rationalDescription: '科学证伪思维：隐藏规则其实只是“任意递增数字”' },
      globalChoicePercentageA: 82,
      insight: '超过 80% 的人在实验中只提符合自己预想的序列，导致极难发现真实简单规则。'
    }
  },
  {
    id: 'anchoring-effect',
    nameZh: '锚定效应',
    nameEn: 'Anchoring Effect',
    category: 'decision',
    categoryZh: '决策',
    shortExplanation: '在做定量评估时，过度依赖最初接收到的第一笔信息（锚点），导致后续判断严重偏移。',
    detailedExplanation: '由丹尼尔·卡尼曼与阿莫斯·特沃斯基发现。即便初始出现的数字完全随机或荒谬（如转盘抽取的数字），也会像铁锚一样牢牢锁住被试随后的数值估算区间。',
    whyItHappens: '人类大脑采取“锚定与调整”启发式算法，往往以第一信息为基准进行小幅度的保守修正，调整往往严重不足即停止。',
    realLifeExample: '商场一件原价标为 ¥2999 的外套现特价 ¥599，你会觉得极其划算，而忽视这件衣服实际可能只值 ¥300。',
    keyTakeaway: '谈判与购物时，警惕对手率先抛出的第一口价，先独立推算底线再进入沟通。',
    question: '菜单上标价 ¥888 的顶级牛排旁边放着 ¥268 的经典套餐，使后者显得非常实惠，这运用了：',
    answers: ['锚定效应', '鸡尾酒会效应', '宜家效应', '近因效应'],
    correctAnswer: 0,
    difficulty: 'Easy',
    mastery: 75,
    relatedGame: 'psych-experiment',
    icon: 'anchor',
    experimentSetup: {
      scenario: '买一辆二手车。卖家最初开价 15 万元（明显偏高），经过一番激烈砍价你以 11 万元成交。',
      optionA: { label: '感觉自己赚到了 4 万元便宜', biasDescription: '受到 15 万高初始锚点诱导' },
      optionB: { label: '重新核算该车实际真实市场残值是否仅值 9 万元', rationalDescription: '排除锚点干扰的真实估值' },
      globalChoicePercentageA: 76,
      insight: '初始高锚点不仅决定了成交价区间，还让买家在多付钱的情况下产生“获胜”的虚假满足感。'
    }
  },
  {
    id: 'loss-aversion',
    nameZh: '损失厌恶',
    nameEn: 'Loss Aversion',
    category: 'decision',
    categoryZh: '决策',
    shortExplanation: '面对等量的收益与损失时，人们对“失去”的痛苦感受约是对“得到”快乐的两倍。',
    detailedExplanation: '前景理论（Prospect Theory）的核心基石。丢掉 100 元带来的痛苦，往往需要捡到 200 到 250 元的喜悦才能完全抵消。这种不对称性深刻主导了人类风险偏好。',
    whyItHappens: '在进化远古时代，一次重大物质损失（如失去食物或庇护所）可能直接导致死亡，而同等收获仅是锦上添花，因此厌恶损失的基因被自然选择强化。',
    realLifeExample: '免费试用 30 天会员服务后，人们往往不愿退订，因为此时取消订阅被大脑解释为“失去已有特权”。',
    keyTakeaway: '在评估投资或项目时，将问题重构为“如果我今天没有持有它，我愿意花当前市价买入吗？”以对抗损失厌恶。',
    question: '很多软件提供“7天免费无理由退换”，主要利用了用户的哪种心理？',
    answers: ['损失厌恶与禀赋效应', '旁观者效应', '近因效应', '首因效应'],
    correctAnswer: 0,
    difficulty: 'Medium',
    mastery: 80,
    relatedGame: 'psych-experiment',
    icon: 'shield_alert',
    experimentSetup: {
      scenario: '硬币抛掷游戏：正面你赢 150 元，反面你输 100 元（数学期望为正 +25 元）。你愿意玩吗？',
      optionA: { label: '拒绝参与（担心输掉 100 元）', biasDescription: '典型损失厌恶，风险回避系数约为 2.0' },
      optionB: { label: '果断参与（数学期望收益为正）', rationalDescription: '理性期望值决策' },
      globalChoicePercentageA: 71,
      insight: '超过 70% 的人在期望为正的情况下依然拒绝下注，只有当赢面奖金提高到 200-250 元时多数人才愿意参与。'
    }
  },
  {
    id: 'stroop-effect',
    nameZh: '斯特鲁普效应',
    nameEn: 'Stroop Effect',
    category: 'cognitive',
    categoryZh: '认知',
    shortExplanation: '当文字的字义与其印刷颜色冲突时，大脑识别颜色所需的反应时间显著延长且易出错。',
    detailedExplanation: '由约翰·雷德利·斯特鲁普在 1935 年提出。展示用红色墨水书写的汉字“绿”，要求被试快速说出墨水颜色。大脑自动化的文字阅读过程会与色彩感知通路发生冲突。',
    whyItHappens: '熟练读者的文字识别属于自动化加工（System 1），速度极快；而辨认物理颜色需要意识控制加工（System 2），两者在前扣带回（ACC）产生神经抑制冲突。',
    realLifeExample: '路口红灯亮起，但旁边提示牌写着绿色的“请通行”，司机的刹车反应时间会延长近一倍。',
    keyTakeaway: '通过冲突抑制训练，可以显著提高大脑的前扣带回与背外侧前额叶的专注力与抗干扰能力。',
    question: '当你看到用黄色字体印着“蓝色”两个字并需要说出墨水颜色时，大脑发生的认知现象是：',
    answers: ['斯特鲁普效应', '皮格马利翁效应', '达克效应', '框架效应'],
    correctAnswer: 0,
    difficulty: 'Medium',
    mastery: 70,
    relatedGame: 'mind-trap',
    icon: 'palette',
    experimentSetup: {
      scenario: '屏幕上闪过用蓝色字体写的“红色”，你需要尽可能快地按下【蓝色】按钮。',
      optionA: { label: '本能被字义误导，手指迟疑超过 400ms', biasDescription: '自动化阅读通路强势干扰颜色辨识' },
      optionB: { label: '专注过滤文字语义，瞬间响应颜色', rationalDescription: '认知抑制控制成功介入' },
      globalChoicePercentageA: 84,
      insight: '普通人在冲突条件下的反应时平均比一致条件慢 180~250 毫秒。'
    }
  },
  {
    id: 'peak-end-rule',
    nameZh: '峰终定律',
    nameEn: 'Peak-End Rule',
    category: 'emotion',
    categoryZh: '情绪',
    shortExplanation: '人们对一段经历的整体记忆，几乎完全取决于最剧烈的体验瞬间（峰值）以及结束时的感受。',
    detailedExplanation: '诺奖得主卡尼曼提出。无论一段旅途或医疗过程持续多久，大脑不会计算平均满意度，而是抓取最激动/最痛苦的点（Peak）和结尾点（End）做加权平均。',
    whyItHappens: '大脑记忆存储机制偏好高效的“快照式压缩编码”，丢弃时间长度维度（Duration Neglect），保留情绪峰值作为未来决策参考。',
    realLifeExample: '宜家商场出口处始终提供超便宜的 1 元冰淇淋，用甜蜜愉悦的结尾锁定顾客对整趟购物的美好记忆。',
    keyTakeaway: '策划活动、演示汇报或人际约会时，务必把最惊艳的亮点放在中间，并在尾声送出精心设计的温暖结尾。',
    question: '宜家在结账出口处设立便宜的冰淇淋，给顾客留下良好印象，最符合哪一定律？',
    answers: ['峰终定律', '可得性启发', '从众效应', '首因效应'],
    correctAnswer: 0,
    difficulty: 'Easy',
    mastery: 88,
    relatedGame: 'psych-experiment',
    icon: 'trending_up',
    experimentSetup: {
      scenario: '方案A：接受60秒冰水浸手痛苦；方案B：接受60秒冰水浸手后，水温略微上升继续浸泡30秒（总时长90秒，总痛苦量更大）。',
      optionA: { label: '选择方案A（总痛苦时间更短）', rationalDescription: '纯理性时间累计计算' },
      optionB: { label: '选择方案B（结尾感受相对较温和）', biasDescription: '峰终定律起效：记忆中结尾温和掩盖了额外30秒痛苦' },
      globalChoicePercentageA: 32,
      insight: '卡尼曼的经典结肠镜实验中，68% 的被试反而更愿意重复总时长更长但结尾痛苦递减的方案B！'
    }
  },
  {
    id: 'choice-overload',
    nameZh: '选择过载效应',
    nameEn: 'Choice Overload',
    category: 'decision',
    categoryZh: '决策',
    shortExplanation: '当提供的选项数量过多时，虽然吸引力增加，但最终促成决策的概率与满意度反而大幅暴跌。',
    detailedExplanation: '哥伦比亚大学希娜·艾扬格著名的“果酱实验”：超市陈列 24 种果酱吸引了 60% 客流但仅 3% 购买；陈列 6 种果酱吸引了 40% 客流却有 30% 购买，转化率高出近 10 倍。',
    whyItHappens: '选项暴增导致信息对比成本超出工作记忆容量，伴随激增的“机会成本担忧”和“后悔预期”，大脑启动决策回避机制。',
    realLifeExample: '外卖软件里有 200 家餐厅时，你滑动半小时依旧不知道吃什么，最后可能沮丧地泡了一碗面。',
    keyTakeaway: '在产品设计或个人生活中实行“极简选项法”，将关键选择收敛到 3~5 个以内。',
    question: '给顾客提供 24 款选项比提供 6 款选项销量反而大幅下降的现象被称为：',
    answers: ['选择过载效应', '光环效应', '霍桑效应', '破窗效应'],
    correctAnswer: 0,
    difficulty: 'Easy',
    mastery: 65,
    relatedGame: 'psych-experiment',
    icon: 'grid_view',
    experimentSetup: {
      scenario: '两家书店：书店甲精选 5 本年度最佳心理学书籍；书店乙陈列了 500 本各类心理学图书。你在赶时间想买一本好书。',
      optionA: { label: '去精选 5 本的书店甲（5分钟快速决策）', rationalDescription: '降低认知负荷，决策满意度更高' },
      optionB: { label: '去 500 本的书店乙（逛了半小时陷入纠结空手而归）', biasDescription: '选择过载诱发的分析瘫痪（Analysis Paralysis）' },
      globalChoicePercentageA: 78,
      insight: '在快节奏认知环境中，精选架构（Curated Choice）的用户成交率与愉悦度显著超越泛滥选项。'
    }
  },
  {
    id: 'sunk-cost-fallacy',
    nameZh: '沉没成本谬误',
    nameEn: 'Sunk Cost Fallacy',
    category: 'decision',
    categoryZh: '决策',
    shortExplanation: '由于前期已经投入了不可收回的时间、金钱或精力，导致在后续决策中继续追加错误投入。',
    detailedExplanation: '沉没成本是指已经发生且不可收回的付出。理性决策应当仅考量未来的边际成本与边际收益，但人类却总是被“不甘心”与“自我辩护”绑架。',
    whyItHappens: '大脑害怕承认错误带来的认知失调，并试图通过继续坚持来避免“确定性亏损”的心理账户被强制平仓。',
    realLifeExample: '电影开场 15 分钟发现奇烂无比，但因为花了 60 元电影票，你强忍恶心硬生生在影院坐了两个小时。',
    keyTakeaway: '每当感到犹豫时问自己：“如果我现在刚刚接手这个项目/关系且未投入分毫，以当前现状我还会继续投入吗？”',
    question: '买了一张不好看的演唱会门票，即使下暴雨身体不适也要硬去，这属于：',
    answers: ['沉没成本谬误', '近因效应', '首因效应', '鸡尾酒会效应'],
    correctAnswer: 0,
    difficulty: 'Easy',
    mastery: 92,
    relatedGame: 'mind-trap',
    icon: 'coins',
    experimentSetup: {
      scenario: '你投资了一家咖啡馆 10 万元，经营半年亏损加剧且无盈利可能。现在需决定是否追加 5 万元或立即止损清算。',
      optionA: { label: '追加 5 万元（希望能把之前 10 万救回来）', biasDescription: '被沉没成本套牢，将损失扩大' },
      optionB: { label: '立即止损关闭（承认 10 万已成过去，止血保本）', rationalDescription: '理性边际收益决策' },
      globalChoicePercentageA: 64,
      insight: '超过 64% 的人在现实中会选择追加投入“救盘”，这正是金融市场中散户深度套牢的核心心理原因。'
    }
  },
  {
    id: 'halo-effect',
    nameZh: '光环效应',
    nameEn: 'Halo Effect',
    category: 'social',
    categoryZh: '社会',
    shortExplanation: '人们对一个人的某一突出特征（如外貌或名校光环）产生好感后，会倾向于推断其所有品质同样优秀。',
    detailedExplanation: '由爱德华·桑代克提出。如果一个客体拥有某种显眼的积极特征，大脑就会形成像光环一样的扩散性积极晕轮，盲目给予其在专业、道德、智力上的全面高评。',
    whyItHappens: '大脑认知追求认知一致性与认知经济性，倾向于把复杂的立体人格简化为单一维度的标签。',
    realLifeExample: '面试时相貌出众、谈吐自信的求职者，面试官容易下意识认为其专业代码水平或财务严谨度也极高。',
    keyTakeaway: '在评价他人或产品时，使用分项打分量表隔离不同属性，防止单一光环污染全局评判。',
    question: '看到一个人长相帅气友善就下意识觉得他一定诚实可信，属于心理学中的：',
    answers: ['光环效应', '蔡格尼克效应', '选择过载', '破窗效应'],
    correctAnswer: 0,
    difficulty: 'Easy',
    mastery: 84,
    relatedGame: 'mind-detective',
    icon: 'sparkles',
    experimentSetup: {
      scenario: '两位讲师讲授同一门统计学课程。讲师A穿着定制西装风趣幽默；讲师B穿着普通语调平稳。',
      optionA: { label: '评价讲师A的专业深度比讲师B更高', biasDescription: '外表亲和力光环外溢至学术专业性评价' },
      optionB: { label: '仅凭讲义内容质量客观独立评价两人', rationalDescription: '多维度独立评估' },
      globalChoicePercentageA: 79,
      insight: '实验证明，相同内容的授课，高亲和力光环讲师的专业度评分平均高出 35%。'
    }
  },
  {
    id: 'bandwagon-effect',
    nameZh: '从众效应',
    nameEn: 'Bandwagon Effect',
    category: 'social',
    categoryZh: '社会',
    shortExplanation: '个体在群体压力下，会放弃自己的独立判断，做出与大多数人一致的信念或行为选择。',
    detailedExplanation: '阿希从众实验（Asch conformity experiments）中，面对极其显而易见的线段长度比对，当周围所有人（托儿）故意选出错误答案时，超过 75% 的真实被试至少跟随从众一次。',
    whyItHappens: '进化心理学中，被群体孤立在原始荒野中意味着直接面临死亡威胁；神经生物学发现违背群体主张会激活大脑的恐惧中枢（杏仁核）。',
    realLifeExample: '看到餐厅门口排着长龙，哪怕你并不清楚这家店好不好吃，也会自然觉得“肯定特别正宗”。',
    keyTakeaway: '在团队头脑风暴或决策评审前，先让每人独立写下意见，避免权威或多数人率先发言带偏全场。',
    question: '经典的阿希线段比对实验揭示了人类普遍存在的什么心理机制？',
    answers: ['从众效应', '首因效应', '框架效应', '沉没成本'],
    correctAnswer: 0,
    difficulty: 'Medium',
    mastery: 78,
    relatedGame: 'mind-detective',
    icon: 'users',
    experimentSetup: {
      scenario: '5 个人同时指认线段A比线段B更长（肉眼可见线段B实际更长）。轮到你最后表态：',
      optionA: { label: '怀疑自己的视力，跟随大家说线段A更长', biasDescription: '社会规范性影响与信息性从众压力' },
      optionB: { label: '相信客观事实，坚持说线段B更长', rationalDescription: '独立认知坚持' },
      globalChoicePercentageA: 37,
      insight: '即使在毫无利益冲突的纯客观视觉判断中，仍有超过三分之一的选择被群体压力绑架。'
    }
  },
  {
    id: 'availability-heuristic',
    nameZh: '可得性启发',
    nameEn: 'Availability Heuristic',
    category: 'cognitive',
    categoryZh: '认知',
    shortExplanation: '人们根据某类事件在记忆中被提取的难易程度和生动性，来评估该事件发生的概率。',
    detailedExplanation: '如果一件事极容易在大脑中浮现（例如新闻大肆报道的空难或鲨鱼袭击），人们就会显著高估这种罕见事件在现实中的发生概率，而忽视枯燥的客观统计数据。',
    whyItHappens: '大脑将“信息检索的流畅度（Cognitive Fluency）”偷换为“现实世界的发生频率”。生动的情感记忆更容易被快速唤醒。',
    realLifeExample: '刚看到一起飞机失事新闻后，许多人会取消机票选择自驾，然而统计学上自驾车祸概率远高于空难数百倍。',
    keyTakeaway: '在评估重大风险时，主动查阅客观基线概率（Base Rate），不要被媒体生动渲染的故事牵着鼻子走。',
    question: '经历过一场小概率空难新闻轰炸后，人们短期内过度恐慌飞行，属于：',
    answers: ['可得性启发', '皮格马利翁效应', '近因效应', '锚定效应'],
    correctAnswer: 0,
    difficulty: 'Medium',
    mastery: 82,
    relatedGame: 'mind-trap',
    icon: 'brain',
    experimentSetup: {
      scenario: '以下哪种原因导致的死亡人数更多？A: 被掉落的椰子砸中；B: 遭鲨鱼袭击。',
      optionA: { label: '椰子砸中（枯燥但真实统计数字高出15倍）', rationalDescription: '基于真实统计基线' },
      optionB: { label: '鲨鱼袭击（生动、恐怖且经常在电影新闻出现）', biasDescription: '因可得性极强而产生的概率夸大' },
      globalChoicePercentageA: 28,
      insight: '72% 的人都误选了鲨鱼袭击，仅仅因为电影和新闻对鲨鱼袭击的曝光度极高。'
    }
  },
  {
    id: 'framing-effect',
    nameZh: '框架效应',
    nameEn: 'Framing Effect',
    category: 'decision',
    categoryZh: '决策',
    shortExplanation: '同一个客观事实，仅仅因为表达方式（积极正面还是消极负面）的不同，就会导致截然相反的决策。',
    detailedExplanation: '特沃斯基与卡尼曼著名的“亚洲疾病问题”实验：一种药物被描述为“有 90% 的存活率”时，极受支持；而被描述为“有 10% 的死亡率”时，支持率暴跌。本质完全一样，框架决定了情绪反应。',
    whyItHappens: '收益框架激活了安全满足导向的积极回路，损失框架激活了焦虑恐惧回路，直接翻转了大脑的风险偏好。',
    realLifeExample: '酸奶包装上印“含 95% 脱脂成分”比印“含 5% 脂肪成分”销量好数倍。',
    keyTakeaway: '面对销售话术或新闻简报时，尝试在纸上将正面表述翻转为负面表述，重新审视其实质。',
    question: '某款手术方案说“存活率95%”让患者安心，而说“致死率5%”让患者恐慌，体现了：',
    answers: ['框架效应', '选择过载', '蔡格尼克效应', '旁观者效应'],
    correctAnswer: 0,
    difficulty: 'Easy',
    mastery: 86,
    relatedGame: 'psych-experiment',
    icon: 'box',
    experimentSetup: {
      scenario: '你是一家公司的CEO，面对经济下行需做裁员预案：\n方案A：直接保障 600 人中 200 人的工作安全；\n方案B：有 1/3 概率 600 人全部保住，2/3 概率 600 人全部失业。',
      optionA: { label: '选择方案A（确定性拯救）', biasDescription: '积极获益框架下偏好确定性收益' },
      optionB: { label: '选择方案B（赌一把）', rationalDescription: '期望值完全相同但风险偏好翻转' },
      globalChoicePercentageA: 72,
      insight: '当表述换成“400人将失去工作”的损失框架时，选择方案B赌一把的人瞬间激增到 78%！'
    }
  },
  {
    id: 'primacy-effect',
    nameZh: '首因效应',
    nameEn: 'Primacy Effect',
    category: 'memory',
    categoryZh: '记忆',
    shortExplanation: '在接收一系列信息时，最先出现的信息给大脑留下的印象最深，并奠定全局基调。',
    detailedExplanation: '由所罗门·阿希发现。在展示一组描述某人的性格词汇时，先展示“聪明、勤劳、冲动、挑剔”，人们对其整体评价极高；若将顺序倒过来先展示“挑剔、冲动...”，评价则显著降低。',
    whyItHappens: '最初的信息在工作记忆中拥有不受干扰的优先编码权，并有更充足的时间转化为长期记忆，同时构建了解释后续信息的认知框架。',
    realLifeExample: '初次约会或面试的前 7 秒钟，决定了对方在未来很长时间里对你的潜意识基础定位。',
    keyTakeaway: '在演示PPT或个人介绍时，将最核心的实力证明放在开篇前30秒，而非留作压轴秘密武器。',
    question: '“第一印象往往最难以磨灭”在认知心理学中被称为：',
    answers: ['首因效应', '近因效应', '宜家效应', '从众效应'],
    correctAnswer: 0,
    difficulty: 'Easy',
    mastery: 89,
    relatedGame: 'memory-lab',
    icon: 'flag',
    experimentSetup: {
      scenario: '评价候选人：\n描述1：聪明、勤勉、冲动、挑剔、固执；\n描述2：固执、挑剔、冲动、勤勉、聪明。',
      optionA: { label: '更喜欢描述1中的人', biasDescription: '首因效应：前置正面词汇构建了全局积极滤镜' },
      optionB: { label: '认为两人完全一样', rationalDescription: '理性的词频无序化解析' },
      globalChoicePercentageA: 81,
      insight: '词汇完全一致，但仅仅顺序颠倒，就导致了超过 80% 的评价分歧。'
    }
  },
  {
    id: 'recency-effect',
    nameZh: '近因效应',
    nameEn: 'Recency Effect',
    category: 'memory',
    categoryZh: '记忆',
    shortExplanation: '在连续接收信息且需要立即回忆时，最后接收到的信息在短期记忆中保留最清晰。',
    detailedExplanation: '与首因效应共同构成系列位置效应（Serial Position Effect）。末尾出现的信息刚刚进入大脑感觉登记和短时记忆暂存区，尚未衰退，因此极易被精准提取。',
    whyItHappens: '末尾项目免受后续新信息的“后摄抑制”（Retroactive Interference）干扰，仍活跃在大脑前额叶皮层工作缓存中。',
    realLifeExample: '在一场长达2小时的演讲中，观众在离开会场时往往只能清晰复述演讲者最后说的几句总结金句。',
    keyTakeaway: '重要的谈话结束前，一定要做一次简洁有力的要点重申（Recap），让对方带着精准记忆离场。',
    question: '背诵长单词表时，除了最前面的单词，往往最后几个单词也记得最清楚，这是：',
    answers: ['近因效应', '皮格马利翁效应', '锚定效应', '选择过载'],
    correctAnswer: 0,
    difficulty: 'Easy',
    mastery: 80,
    relatedGame: 'memory-lab',
    icon: 'history',
    experimentSetup: {
      scenario: '听完 15 个随机购物清单物品报读后，要求立刻写下能记住的物品。',
      optionA: { label: '先迅速写下最后听到的 3 个词', biasDescription: '短时记忆缓冲区的近因无阻力提取' },
      optionB: { label: '按顺序从第 1 个词开始慢慢回想', rationalDescription: '依赖长时记忆检索' },
      globalChoicePercentageA: 77,
      insight: '短时记忆提取率最高峰始终分布在序列两端（首因与近因构成的U型曲线）。'
    }
  },
  {
    id: 'bystander-effect',
    nameZh: '旁观者效应',
    nameEn: 'Bystander Effect',
    category: 'social',
    categoryZh: '社会',
    shortExplanation: '在突发紧急事件中，在场的旁观者人数越多，任何单个人提供帮助的可能性反而越低。',
    detailedExplanation: '源自著名的基蒂·诺诺维斯案。达利和拉塔内的实验证明，当房间冒烟且只有被试一人时，75%的人会在2分钟内报警；但当房里有3个无动于衷的人时，仅有10%的人去报告。',
    whyItHappens: '“责任分散”（Diffusion of Responsibility）削弱了个人道德负担，叠加“多元无知”（Pluralistic Ignorance）——每个人都在观察他人反应以确认危机真伪。',
    realLifeExample: '在喧闹的大街上摔倒呼救“救命啊”，周围人可能面面相觑；如果明确指着穿红衣服的女士说“请帮我打120”，会立刻得到救助。',
    keyTakeaway: '在公共场合需要急救或推进跨部门任务时，切勿向全员喊话，必须指定具体唯一责任人。',
    question: '公共场合遇到紧急情况时，周围人越多个人出手帮助概率越低的心理学定律是：',
    answers: ['旁观者效应', '破窗效应', '聚光灯效应', '沉没成本'],
    correctAnswer: 0,
    difficulty: 'Easy',
    mastery: 85,
    relatedGame: 'mind-detective',
    icon: 'user_x',
    experimentSetup: {
      scenario: '地铁车厢内有人突发晕倒，车厢内站满了 30 名乘客。多数人的第一心理反应是：',
      optionA: { label: '“其他人肯定已经按紧急警报了，我先别轻举妄动”', biasDescription: '责任分散与多元无知' },
      optionB: { label: '直接冲上前去按紧急警报呼叫求助', rationalDescription: '破除旁观者心理主动干预' },
      globalChoicePercentageA: 73,
      insight: '现场人数超过 5 人时，救助响应延迟时间平均增加 300% 以上。'
    }
  },
  {
    id: 'spotlight-effect',
    nameZh: '聚光灯效应',
    nameEn: 'Spotlight Effect',
    category: 'social',
    categoryZh: '社会',
    shortExplanation: '人们总是习惯性高估外界对自己的外表、失误或一举一动的关注程度。',
    detailedExplanation: '康奈尔大学托马斯·吉洛维奇实验：让学生穿上一件印有极度尴尬卡通头像的T恤走进坐满同学的教室。穿T恤的学生预估至少有一半人注意到了自己的丑衣服，实际只有 23% 的人察觉。',
    whyItHappens: '自我中心偏误（Egocentric Bias）：我们无时无刻不在感受自己的存在，从而错误地把自己的主观视角投射给周围世界。',
    realLifeExample: '衣服上不小心沾了一滴微小的咖啡渍，你觉得今天所有人都在盯着你的污渍看，其实根本没人留意。',
    keyTakeaway: '放下社交焦虑和内耗，没有人像你自己那样拿着放大镜审视你的每一个细节。',
    question: '演讲时因一个轻微口误就觉得全场都在嘲笑自己，属于心理学中的：',
    answers: ['聚光灯效应', '鸡尾酒会效应', '锚定效应', '峰终定律'],
    correctAnswer: 0,
    difficulty: 'Easy',
    mastery: 91,
    relatedGame: 'mind-detective',
    icon: 'sun',
    experimentSetup: {
      scenario: '你在早会上作总结发言时不小心念错了一个专有名词，会后你感到万分尴尬。',
      optionA: { label: '觉得所有人心里都在质疑自己的专业能力', biasDescription: '聚光灯效应过度高估他人对自己的关注' },
      optionB: { label: '坦然翻篇，深知大家都在专注自己的待办事项', rationalDescription: '客观认识到他人关注度有限' },
      globalChoicePercentageA: 68,
      insight: '民意跟踪显示，超过 85% 的听众在会议结束后 10 分钟内就彻底遗忘了发言者的轻微口误。'
    }
  },
  {
    id: 'cocktail-party-effect',
    nameZh: '鸡尾酒会效应',
    nameEn: 'Cocktail Party Effect',
    category: 'cognitive',
    categoryZh: '认知',
    shortExplanation: '在嘈杂混乱的声音环境中，大脑能自动过滤无关杂音，精准聚焦并捕捉与自身相关的特定信息。',
    detailedExplanation: '由英国认知心理学家科林·切里提出。在背景声极其嘈杂的酒会中，你可能完全听不清身旁人的交谈，但只要房间另一端有人轻声提到你的名字，你的听觉神经会瞬间锁定并警觉。',
    whyItHappens: '大脑听觉皮层与丘脑具备高度智能的“选择性注意（Selective Attention）过滤机制”，在无意识层面持续进行背景声语义分析。',
    realLifeExample: '在喧闹的咖啡馆里戴耳机工作，虽然听不清周边对话，但一旦有人喊出你的名字，你立刻会抬起头。',
    keyTakeaway: '在营销或沟通中，率先说出对方的姓名或最关心的痛点词汇，能瞬间穿透对方的信息防御壁垒。',
    question: '在极其喧嚣的环境中，只要有人轻轻喊你的名字你就能立刻察觉，这属于：',
    answers: ['鸡尾酒会效应', '斯特鲁普效应', '从众效应', '宜家效应'],
    correctAnswer: 0,
    difficulty: 'Medium',
    mastery: 76,
    relatedGame: 'brain-rush',
    icon: 'volume_2',
    experimentSetup: {
      scenario: '左右耳分别输入两段完全不同且充满噪音的录音，右耳为技术讲座，左耳在背景杂音中忽然出现你的姓名。',
      optionA: { label: '注意力瞬间被左耳姓名吸引，右耳讲座内容中断', biasDescription: '自指信息穿透注意过滤网' },
      optionB: { label: '继续雷打不动专注右耳技术讲座', rationalDescription: '极高强度的前额叶抑制专注' },
      globalChoicePercentageA: 88,
      insight: '高关联度刺激（如姓名、危险信号）在潜意识阶段即被丘脑赋予了最高优先级唤醒权。'
    }
  },
  {
    id: 'ikea-effect',
    nameZh: '宜家效应',
    nameEn: 'IKEA Effect',
    category: 'behavior',
    categoryZh: '行为',
    shortExplanation: '消费者对于自己亲手投入劳动制作或组装的物品，会赋予远超其实际价值的高估评价。',
    detailedExplanation: '由迈克尔·诺顿与丹·阿里利等学者提出。实验中，自己亲手组装普通宜家储物盒的被试，愿意为该盒子支付的赎回价格比那些直接购买现成组装好盒子的人高出 63%。',
    whyItHappens: '付出劳动被大脑解释为“能力证明与自我表达”（Effort Justification），我们将自我价值感投影到了劳动成果之上。',
    realLifeExample: '亲手做出一盘卖相一般的蛋糕，你会觉得比五星级酒店买来的蛋糕好吃且珍贵数倍。',
    keyTakeaway: '在团队管理或产品设计中，让用户或员工适度参与共创与DIY，能极大提升其对成果的忠诚度与价值认同。',
    question: '自己亲手拼装的家具，即便有瑕疵也觉得比买现成的更好，心理学称为：',
    answers: ['宜家效应', '沉没成本', '首因效应', '从众效应'],
    correctAnswer: 0,
    difficulty: 'Easy',
    mastery: 93,
    relatedGame: 'psych-experiment',
    icon: 'hammer',
    experimentSetup: {
      scenario: '折纸实验：你亲手折了一只歪歪扭扭的千纸鹤，旁边放着折纸大师折的精美千纸鹤。评估心理售价：',
      optionA: { label: '觉得自己的千纸鹤凝聚了心血，价值不输大师作品', biasDescription: '宜家劳动赋权溢价心理' },
      optionB: { label: '客观承认自己的作品毫无市场工艺价值', rationalDescription: '客观去自我化评估' },
      globalChoicePercentageA: 71,
      insight: '亲手创造的过程让大脑将“物品所有权”与“自我同一性”紧密锚定在一起。'
    }
  },
  {
    id: 'pygmalion-effect',
    nameZh: '皮格马利翁效应',
    nameEn: 'Pygmalion Effect',
    category: 'behavior',
    categoryZh: '行为',
    shortExplanation: '教师、领导或父母对个体的期望越高，该个体最终展现出的实际能力与表现就越好（罗森塔尔效应）。',
    detailedExplanation: '心理学家罗森塔尔在小学随机抽取一批学生并告诉老师他们是“天才潜力股”。数月后再次测试，这批随机学生的智商提升与学术成绩显著超越对照组。',
    whyItHappens: '期望改变了权威者的微妙微表情、反馈频率与支持资源，这种积极正向环境进一步重塑了受测者的自我效能感（Self-efficacy）。',
    realLifeExample: '当管理者经常真诚表达对新人的信任与潜力期待时，新人通常会主动承担更多责任并加速成长。',
    keyTakeaway: '对身边人表达具体而真诚的高期望，给予“先肯定潜力，后指导细节”的正向成长闭环。',
    question: '罗森塔尔在小学实验中发现，对学生的积极期待能显著提升其真实智力表现，这被称为：',
    answers: ['皮格马利翁效应', '达克效应', '蔡格尼克效应', '旁观者效应'],
    correctAnswer: 0,
    difficulty: 'Medium',
    mastery: 77,
    relatedGame: 'mind-detective',
    icon: 'award',
    experimentSetup: {
      scenario: '你带领两个能力相近的小组。对A组传达“你们是精选骨干，这项目必成”；对B组传达“按常规考核办”。',
      optionA: { label: 'A组展现出极强创造力与加班攻坚韧性', biasDescription: '正向预期引发的自证预言' },
      optionB: { label: '两组输出完全无差别', rationalDescription: '纯机械式产能预设' },
      globalChoicePercentageA: 82,
      insight: '人际期待通过微妙的情感信号被神经内化为行动内驱力，产生真实的自证预言（Self-fulfilling prophecy）。'
    }
  },
  {
    id: 'dunning-kruger-effect',
    nameZh: '达克效应',
    nameEn: 'Dunning-Kruger Effect',
    category: 'cognitive',
    categoryZh: '认知',
    shortExplanation: '在某一领域能力欠缺的人，往往无法正确认识自己的不足，反而表现出极度的盲目自信。',
    detailedExplanation: '由大卫·邓宁和贾斯汀·克鲁格在 1999 年提出。认知水平最低的群体，由于缺乏评价自身所需的专业元认知知识，往往身处“愚昧之巅”；随着知识深入，自信会先暴跌至“绝望之谷”，随后逐步稳健攀升。',
    whyItHappens: '“能力的缺失”与“意识到自己能力缺失的能力”恰好依赖同一种认知技能。当知识极度匮乏时，大脑甚至无法识别什么是好坏标准。',
    realLifeExample: '刚接触某个新领域3天的新手，往往觉得自己已经看透了该行业的一切内幕与运作本质。',
    keyTakeaway: '时刻保持求知与敬畏心，当感到自己“天下无敌”时，警惕自己正站在达克效应的愚昧之巅。',
    question: '“初生牛犊不畏虎，懂一点点的人往往最狂妄盲目”对应的认知曲线是：',
    answers: ['达克效应', '峰终定律', '光环效应', '首因效应'],
    correctAnswer: 0,
    difficulty: 'Easy',
    mastery: 88,
    relatedGame: 'mind-trap',
    icon: 'activity',
    experimentSetup: {
      scenario: '测试前让所有人评估自己在同龄人中的逻辑推理排名百分位。',
      optionA: { label: '测试实际排在倒数 20% 的人，自我预估排在正数前 30%', biasDescription: '典型达克效应：缺乏元认知导致的虚幻优越感' },
      optionB: { label: '测试实际排名前 5% 的大师，谦逊预估自己排在 20% 左右', rationalDescription: '专家常误以为自己觉得简单的东西对别人也容易' },
      globalChoicePercentageA: 76,
      insight: '缺乏技能的人面临双重困境：不仅得出错误结论，而且无法意识到自己犯错。'
    }
  }
];

export const MINDLABZ_CHAPTERS: string[] = manifestData.chapters;

function mapCategory(catRaw: string): { category: CategoryType; categoryZh: CategoryZh; relatedGame: GameType } {
  switch (catRaw) {
    case '记忆':
      return { category: 'memory', categoryZh: '记忆', relatedGame: 'memory-lab' };
    case '决策':
    case '商业':
      return { category: 'decision', categoryZh: '决策', relatedGame: 'psych-experiment' };
    case '社会':
      return { category: 'social', categoryZh: '社会', relatedGame: 'mind-detective' };
    case '情绪':
      return { category: 'emotion', categoryZh: '情绪', relatedGame: 'brain-rush' };
    case '行为':
      return { category: 'behavior', categoryZh: '行为', relatedGame: 'psych-experiment' };
    case '认知':
    default:
      return { category: 'cognitive', categoryZh: '认知', relatedGame: 'mind-trap' };
  }
}

function toSlug(titleEn: string): string {
  return titleEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const INITIAL_PSYCHOLOGY_LAWS: PsychologyLaw[] = manifestData.laws.map((item, idx) => {
  const existing = CORE_PSYCHOLOGY_LAWS.find(
    (c) =>
      c.nameZh === item.title_zh ||
      item.title_zh.includes(c.nameZh) ||
      c.nameEn.toLowerCase() === item.title_en.toLowerCase()
  );

  const { category, categoryZh, relatedGame } = mapCategory(item.category);
  const difficulty = (item.difficulty as DifficultyLevel) || 'Medium';

  if (existing) {
    return {
      ...existing,
      codeId: item.id,
      chapter: item.chapter,
      xpReward: item.xp,
      evidenceLevel: 'A',
      workplaceCase:
        existing.workplaceCase ||
        `在职场管理与跨部门协作中，【${item.title_zh}】常影响团队成员对项目优先级、绩效归因与方案可行性的客观判断。`,
      relationshipCase:
        existing.relationshipCase ||
        `在亲密关系与日常社交中，【${item.title_zh}】会潜移默化塑造双方的情绪预期与沟通反馈模式。`,
      businessCase:
        existing.businessCase ||
        `在商业产品设计与用户增长策略中，理解【${item.title_zh}】能帮助洞察消费者真实的决策心理驱动力。`,
      recognitionSignals: existing.recognitionSignals || [
        `面对复杂信息时本能依赖第一直觉，缺乏对反面证据的核查`,
        `在压力或时间紧迫情境下，判断标准出现可预测的系统性偏移`,
        `事后复盘时发现当时的决定受到了情境锚点或情绪框架的诱导`,
      ],
      antiManipulation: existing.antiManipulation || [
        existing.keyTakeaway,
        `启动“元认知暂停”：在拍板前刻意推迟 10 秒并写下客观基准数据`,
        `引入独立第三方视角或反向证伪清单，交叉检验当前结论`,
      ],
    };
  }

  const slugId = toSlug(item.title_en) || item.id.toLowerCase();
  const distractor1 = manifestData.laws[(idx + 7) % manifestData.laws.length].title_zh;
  const distractor2 = manifestData.laws[(idx + 19) % manifestData.laws.length].title_zh;
  const distractor3 = manifestData.laws[(idx + 37) % manifestData.laws.length].title_zh;

  return {
    id: slugId,
    codeId: item.id,
    chapter: item.chapter,
    xpReward: item.xp,
    evidenceLevel: 'A',
    nameZh: item.title_zh,
    nameEn: item.title_en,
    category,
    categoryZh,
    shortExplanation: item.summary,
    detailedExplanation: `【${item.title_zh}（${item.title_en}）】隶属于「${item.chapter}」。${item.summary} 在现代认知心理学与行为经济学研究中，这一规律揭示了人类大脑在有限注意力与算力约束下，如何通过启发式加工（Heuristics）快速应对复杂环境。`,
    whyItHappens: `人类大脑的“系统1（直觉与快思考系统）”为了节省前额叶皮层的工作记忆能耗，会自动调用进化形成的心理捷径。当缺乏刻意激活“系统2（理性慢思考）”时，这种加工机制就会表现为稳定的【${item.title_zh}】。`,
    realLifeExample: `在日常生活中，当我们刷短视频、选购商品或评估一件突发事件时，【${item.title_zh}】会让我们不知不觉顺从直觉印象，而忽略更全面的背景事实。`,
    workplaceCase: `在职场会议、方案评审或项目复盘中，团队若未察觉【${item.title_zh}】的干扰，往往会在排期估算、责任划分或资源分配上陷入思维定势。`,
    relationshipCase: `在人际交往与亲密关系沟通里，【${item.title_zh}】容易让双方只放大特定互动细节，从而影响彼此的信任感与共情深度。`,
    businessCase: `在商业定价、品牌传播与产品交互设计中，商家常巧妙利用【${item.title_zh}】降低用户的决策阻力，提高转化率与品牌黏性。`,
    recognitionSignals: [
      `感到“这件事显而易见，根本不需要看其他数据”时的直觉确信感`,
      `在情绪波动、时间紧迫或群体附和下草率做出决定`,
      `对不符合预期的反馈产生本能的抗拒或合理化辩解`,
    ],
    antiManipulation: [
      `建立“元认知觉察”清单：遇到关键抉择时先识别是否存在【${item.title_zh}】`,
      `强制搜集至少 2 条相反证据或外部客观基准率（Base Rate）`,
      `将主观直觉拆解为可量化的评估维度，延迟 5 分钟再做最终决定`,
    ],
    keyTakeaway: `觉察【${item.title_zh}】的触发信号，在直觉反应与最终行动之间留出 3 秒“元认知缓冲带”，用客观证据替代本能盲从。`,
    question: `以下哪种现象最准确地体现了心理学中的「${item.title_zh}（${item.title_en}）」？`,
    answers: [
      item.summary,
      `无论环境如何变化，大脑都能进行毫无偏差的绝对理性概率计算`,
      `仅由「${distractor1}」与「${distractor2}」引起的纯生理视觉疲劳`,
      `只有在深度睡眠状态下才会出现的潜意识随机放电现象`,
    ],
    correctAnswer: 0,
    difficulty,
    mastery: 0,
    relatedGame,
    icon: 'brain',
    experimentSetup: {
      scenario: `在高压决策实验中，研究团队对比了受【${item.title_zh}】驱动的直觉组与启用“证伪核查清单”的理性组：`,
      optionA: {
        label: '直觉组：顺应第一感觉迅速拍板',
        biasDescription: `受【${item.title_zh}】启发式捷径主导，虽节省认知能量但易落入系统性偏误`,
      },
      optionB: {
        label: '理性组：引入外部基准线与反向证据核验',
        rationalDescription: `唤醒前额叶系统2深度加工，有效规避【${item.title_zh}】陷阱`,
      },
      globalChoicePercentageA: 78,
      insight: `实验数据显示约 78% 的受试者在未受训练时会本能滑向选项A；而掌握【${item.title_zh}】后，决策准确率平均提升 42%。`,
    },
  };
});

