import { DifficultyLevel, QuizQuestion } from '../types';
import { WorldCapitalCity } from './worldCapitals';
import { cryptoRandom, cryptoShuffle } from '../utils/aleatoricEngine';

export interface MicroexpressionScenarioMeta {
  codeId: string;
  actionUnitCode: string;
  categoryZh: '认知' | '情绪' | '社会' | '行为';
  categoryRank: number;
  narrativeTitle: string;
  setting: string;
  conflictActors?: string;
  actorAction: string;
  observableFacialCues: string[];
  scientificLimitation: string;
  isAiGenerated?: boolean;
  socraticQuestion?: string;
  socraticClue?: string;
}

export interface MicroexpressionQuizItem {
  id: string;
  lawId: string;
  codeId: string;
  actionUnitCode: string;
  category: '认知' | '情绪' | '社会' | '行为';
  categoryRank: number;
  difficulty: DifficultyLevel;
  narrativeTitle: string;
  setting: string;
  actorAction: string;
  observableFacialCues: string[];
  questionPrompt: string;
  correctOption: string;
  distractors: string[];
  explanation: string;
  scientificLimitation: string;
  socraticQuestion: string;
  socraticClue: string;
}

export interface InjectedMicroexpressionQuestion extends QuizQuestion {
  chapterTheme: string;
  cityTag: string;
  subTag: string;
  sequenceToken: string;
  microScenario: MicroexpressionScenarioMeta;
}

export const MICROEXPRESSION_QUIZ_SCENARIOS: MicroexpressionQuizItem[] = [
  {
    id: 'ml-scen-001',
    lawId: 'ml-001',
    codeId: 'ML001',
    actionUnitCode: 'FACS 总纲',
    category: '认知',
    categoryRank: 1,
    difficulty: 'Easy',
    narrativeTitle: '急诊分诊台的“零猜测笔记”',
    setting: '凌晨医院神经科急诊问询室 · 顶灯强光环境',
    actorAction:
      '实习医生看到车祸擦伤患者频繁拧紧双眉并咬紧下颌，脱口断定“他神情心虚烦躁，肯定在隐瞒饮酒”。资深导师当即要求划掉主观情绪标签，只客观测记眉部、眼睑、嘴部与下颌的可见动作位移——追问才知患者撞裂了一颗磨牙且受强光刺痛。',
    observableFacialCues: [
      '前额与眉间区域出现频繁收缩',
      '咬肌绷紧伴随下颌短暂紧缩',
      '顶灯强光直射且存在局部躯体疼痛情境',
    ],
    questionPrompt:
      '在这段医患互动中，导师要求遵循的核心心理学原理与系统（ML001）是什么？',
    correctOption:
      '面部动作编码系统原理（FACS）：按解剖学动作单元（AU）客观记录可见肌肉运动，而非直接读取思想或情绪',
    distractors: [
      '情绪指纹读心法则：每出现一次皱眉加咬牙即可 100% 认定当事人在蓄意欺骗隐瞒',
      '杜乡肌肉自动显影定律：只要记录肌肉强度即可跨情境直接输出真实动机报告',
      '静息情绪诊断定理：无须排查光线、疼痛等生理外因，面部动作即等价于主观情绪',
    ],
    explanation:
      'Ekman 与 Friesen 于 1978 年创立的面部动作编码系统（FACS / ML001）核心在于将“可见肌肉运动的客观描述”与“内心情绪/动机推断”严格分离，避免在痛觉或强光干扰下草率贴标签。',
    scientificLimitation:
      'FACS 动作编码本身描述的是解剖学肌肉位移，不能单独证明特定情绪、意图或是否在撒谎。',
    socraticQuestion:
      '导师为什么先让实习生擦掉“心虚、烦躁”这些词，只写“眉部收紧、下颌紧缩”？观察与推论之间隔着什么边界？',
    socraticClue:
      '重点区分“眼睛客观看到的解剖学位移”与“大脑脑补出来的情绪诊断”——排除只谈读心或绝对测谎的选项。',
  },
  {
    id: 'ml-scen-002',
    lawId: 'ml-002',
    codeId: 'ML002',
    actionUnitCode: 'AU1',
    category: '情绪',
    categoryRank: 1,
    difficulty: 'Easy',
    narrativeTitle: '咨询室里的一场温暖澄清',
    setting: '青少年支持中心 · 下午茶话交流桌',
    actorAction:
      '社工与高中生讨论社团分工时，观察到对方靠近鼻梁那一侧的眉毛向上掀起，而外侧眉梢平缓，眉形呈微微上翘的“八字弧度”。社工没有武断说“你看起来好悲伤”，而是温柔确认后得知：学生既有点操心分工，又因为近视在努力辨认黑板小字。',
    observableFacialCues: [
      '靠近鼻梁内端的前额眉部明显上移',
      '外侧眉尾相对平缓，形成内高外低的八字轮廓',
      '额头中央呈现细微短水平褶皱',
    ],
    questionPrompt:
      '在本次互动场景中，对方出现的特征性面部动作单元编号（ML002）及其准确解码边界是？',
    correctOption:
      'AU1（Inner Brow Raiser / 眉毛内侧上提动作）：可见于担忧或求助情境，但不能仅凭它诊断一个人正在悲伤',
    distractors: [
      'AU1（绝对悲伤诊断单元）：只要鼻梁端眉毛一动，即可 100% 确诊临床级悲痛抑郁',
      'AU15（嘴角下拉动作）：主要源于降口角肌牵拉，专用于诊断对分工安排的愤怒怨恨',
      'AU12（颧大肌微笑牵引）：表示当事人内心处于高度兴奋与绝对配合状态',
    ],
    explanation:
      'FACS 将额肌内侧部分带动的眉毛靠鼻梁端上移编码为 AU1（Inner Brow Raiser / ML002）。它在担忧、悲伤或求助情境中常见，但也受仰视、眯眼看字影响，绝非悲伤的直接诊断。',
    scientificLimitation:
      'AU1 是纯粹的动作单元描述，不是情绪诊断；沟通中应以温和开放式核实替代情绪贴标。',
    socraticQuestion:
      '先锁定画面里发生位移的部位：变化发生在眉毛靠鼻梁的“内侧端”、眼睑还是嘴角？它能独自定罪“正在悲伤”吗？',
    socraticClue:
      '线索指向额肌内侧部牵引的眉部内端变化，并需注意“动作描述 ≠ 情绪诊断”的严格界定。',
  },
  {
    id: 'ml-scen-003',
    lawId: 'ml-003',
    codeId: 'ML003',
    actionUnitCode: 'AU2',
    category: '认知',
    categoryRank: 2,
    difficulty: 'Medium',
    narrativeTitle: '发布会后台的“挑眉插曲”',
    setting: '新品媒体沙龙 · 记者专访圆桌',
    actorAction:
      '设计师在介绍“14 天续航”时，看见资深科技主编靠近太阳穴一侧的左眉眉梢迅速向上挑了一下又落回笔记上。设计师差点误以为对方质疑数据造假而自乱阵脚，事后却得知那是主编听到信息亮点做记录时的个人习惯动作。',
    observableFacialCues: [
      '靠近太阳穴方向的眉梢外侧三分之一段向上抬起',
      '眉弓外端弧度短暂变陡，眉角上方出现弧形浅纹',
      '并未同步伴随上眼睑大幅瞪大或否定性言语',
    ],
    questionPrompt:
      '媒体主编在听取关键数字时呈现的面部动作（ML003）属于哪一编码单元，又该如何避免误读？',
    correctOption:
      'AU2（Outer Brow Raiser / 眉毛外侧上提动作）：主要由额肌外侧部分驱动，单独出现不能确定惊讶或怀疑，需结合语境',
    distractors: [
      'AU2（绝对轻蔑与质疑编码）：单侧眉尾挑动出现即证明听众完全不相信发言人的数据',
      'AU4（眉间区域下压动作）：由皱眉肌向中线拉低双眉，必然代表强烈的愤怒反感',
      'AU6（眼轮匝肌颊部抬升）：证明听众正在克制发自肺腑的大笑愉悦',
    ],
    explanation:
      'FACS 将眉毛外侧部分向上拉动编码为 AU2（Outer Brow Raiser / ML003）。人类在强调语气或捕捉信息亮点时常孤立激活额肌外侧束，不可仅凭单次挑眉推定惊讶、怀疑或轻蔑。',
    scientificLimitation:
      'AU2 单独出现无法确定惊讶、恐惧或质疑态度，必须结合其他面部动作、语言提问和对话情境判断。',
    socraticQuestion:
      '仔细核对挑起的位置：是靠近鼻梁的眉心内侧，还是靠近太阳穴的“眉梢外侧”？单靠这一次动作能断定质疑吗？',
    socraticClue:
      '区分额肌“外侧束”与“内侧束”——外侧眉梢上挑常充当信息高亮或语气标点，而非情绪判定锤。',
  },
  {
    id: 'ml-scen-004',
    lawId: 'ml-004',
    codeId: 'ML004',
    actionUnitCode: 'AU4',
    category: '情绪',
    categoryRank: 2,
    difficulty: 'Easy',
    narrativeTitle: '工位对面的“川字纹谜案”',
    setting: '互联网设计工作室 · 窗边逆光办公桌',
    actorAction:
      '新人每次站在总监工位旁交接设计稿，都看见总监双眉向下向内收拢、两眉正中拧出两条明显竖纹。新人为此焦虑了三天以为“总监对我极其不满愤怒”；团建才真相大白——总监只是因为逆光眩光加精细校对色差时习惯性收紧眉弓。',
    observableFacialCues: [
      '左右双眉整体向斜下方与鼻根中线移动',
      '两眉之间皮肤挤压出现明显纵向皱纹',
      '现场处于窗边斜射强逆光且在进行高精细度审图',
    ],
    questionPrompt:
      '在这个高误读率职场情景中，新人观察到的肌肉动作（ML004）及正确科学归因是？',
    correctOption:
      'AU4（Brow Lowerer / 眉毛与眉间区域下压）：可源自高度专注、认知思考或防眩光视觉调节，皱眉绝不等于愤怒',
    distractors: [
      'AU4（敌意爆发铁律）：两眉间只要挤压出纵向纹路，95% 以上证明对方即将发起人际攻击',
      'AU5（提上睑肌睁大动作）：强光下眼睛本能扩大眼裂以引入更多刺眼阳光',
      'AU1（额肌内侧八字抬升）：代表总监内心极为恐惧无法胜任审稿工作',
    ],
    explanation:
      'FACS 将皱眉肌等肌肉牵引眉毛向内向下移动编码为 AU4（Brow Lowerer / ML004）。该动作在深度脑力思考、视觉细查与光线刺眼防护中极常见，直接归因为“对我发火”属于典型基本归因错误。',
    scientificLimitation:
      '皱眉（AU4）不等于愤怒，它也高频来自于视觉适应或高负荷认知任务。',
    socraticQuestion:
      '在给人贴上“对我很生气”之前，先排查现场有哪两个客观物理/任务变量会自然引发两眉向中线收拢下压？',
    socraticClue:
      '逆光遮挡与精细审图都需要收紧眼眶上方肌肉——先锁定挤出眉间竖纹的编码单元及非情绪成因。',
  },
  {
    id: 'ml-scen-005',
    lawId: 'ml-005',
    codeId: 'ML005',
    actionUnitCode: 'AU5',
    category: '认知',
    categoryRank: 3,
    difficulty: 'Medium',
    narrativeTitle: '地铁扶梯口的突发停顿',
    setting: '晚高峰城市地铁换乘通道 · 昏暗角落扶梯出口',
    actorAction:
      '前方有人被行李箱绊倒瞬间，旁观女孩上方眼皮突然大幅向上拉升、眼睛明显睁大、虹膜上缘露出大片眼白并冻结望向出口。后方观察者察觉该警觉线索后没有随人流低头盲从，立即顺视线查看并发出精确到人的点名指令协助止停扶梯。',
    observableFacialCues: [
      '上眼睑缘突然向眉弓方向大幅抬起',
      '眼裂张开度显著扩大，上巩膜（眼白）外露增多',
      '昏暗光线与突发安全警觉情境交织',
    ],
    questionPrompt:
      '旁观女孩呈现的眼部动作编码（ML005）及其观察限定原则最准确的是？',
    correctOption:
      'AU5（Upper Lid Raiser / 上眼睑抬升动作）：反映视野扩张或注意力骤变，但也受光线、注视目标和眼睑结构影响',
    distractors: [
      'AU5（纯恐惧独享信号）：只有濒死恐惧才会抬起上眼睑，正常看远处小字绝对不会触发该肌肉',
      'AU6（眼周颊肌收紧动作）：下眼睑与苹果肌大幅向上推挤使眼睛眯成一条细缝',
      'AU15（降口角肌反应）：下颌连同双唇向斜下方垂拉以发出警报',
    ],
    explanation:
      'FACS 将提上睑肌收缩引起眼睛睁大编码为 AU5（Upper Lid Raiser / ML005）。它有助于瞬间拓宽视野、提示突发注意力变动，但室内照度、远眺看清小字或个人眼睑构造也会直接影响外观。',
    scientificLimitation:
      '光线、注视目标距离和个人面部解剖结构也会影响眼睛睁大程度，AU5 不能独立确定情绪。',
    socraticQuestion:
      '当一个人眼眶周围“明显睁大、上方眼白露出增多”时，是哪一部分眼皮在向哪移动？看黑板远字或昏暗适应是否也会如此？',
    socraticClue:
      '答案涉及“上眼睑抬升”带来的视野通道扩张线索，同时保留光线与注视距离的科学限定。',
  },
  {
    id: 'ml-scen-006',
    lawId: 'ml-006',
    codeId: 'ML006',
    actionUnitCode: 'AU6',
    category: '情绪',
    categoryRank: 3,
    difficulty: 'Medium',
    narrativeTitle: '酒会寒暄里的“职业鱼尾纹”',
    setting: '行业设计大赏后厅 · 商务社交酒会',
    actorAction:
      '大客户负责人在寒暄握手时颧骨上方脸颊明显向上鼓起、眼周皮肤收紧出鱼尾纹，让实习生深信“他真心爱死咱们方案，签单稳了”。总监却提醒检验反证：对方受过多年职业公关表情训练，且提及实际预算档期时始终闪烁回避。',
    observableFacialCues: [
      '脸颊软组织明显向眼眶下缘方向上提',
      '眼轮匝肌收缩使眼外角产生放射状褶皱与皮肤收紧',
      '言语承诺与实质商业投入却保持回避态度',
    ],
    questionPrompt:
      '针对该情境中“眼周起笑纹”的肌肉编码（ML006）以及对其流行神话的科学证伪，哪项正确？',
    correctOption:
      'AU6（Cheek Raiser / 脸颊抬升动作）：虽常伴随愉悦微笑出现，但受练习伪装、年龄皮肤与眼部结构影响，并非判断真实快乐的绝对标准',
    distractors: [
      'AU6（绝对诚实杜乡标志）：眼轮匝肌完全不受意识支配，只要出现眼周细纹即 100% 证明真心快乐与认可',
      'AU4（眉间降眉肌下压）：表明客户正在强忍对作品的极端轻蔑与愤怒',
      'AU2（额肌外侧眉尾抬升）：客户在用单侧挑眉提醒团队补充预算细节',
    ],
    explanation:
      'FACS 将眼轮匝肌眼眶部收缩牵引脸颊上提、改变眼角纹路编码为 AU6（Cheek Raiser / ML006）。近年对照实验已证实大多数人经提示或训练后可主动调用 AU6，且年龄、强光眯眼也会改变眼周外观，不能当作真伪快乐的铁律。',
    scientificLimitation:
      '年龄、眼部结构、其他肌肉联动及刻意训练都会影响 AU6 外观，它不是鉴别真快乐的绝对标准。',
    socraticQuestion:
      '流行文章常把“带眼角鱼尾纹的笑”神化为绝对无法伪装的真心印记——如果请演员或公关人员练习，这个推论还能成立吗？',
    socraticClue:
      '锁定牵拉脸颊上提、使眼周皮肤收紧的眼轮匝肌动作单元，同时排除“绝对不能假装”的错误断言。',
  },
  {
    id: 'ml-scen-007',
    lawId: 'ml-007',
    codeId: 'ML007',
    actionUnitCode: 'AU12',
    category: '社会',
    categoryRank: 2,
    difficulty: 'Easy',
    narrativeTitle: '评审长桌上的“全员礼貌微笑”',
    setting: '跨国分公司年度预算大会 · 正式汇报场合',
    actorAction:
      '负责人台上演示激进扩招计划时，台下财务和运营同事纷纷双唇展平上弯、嘴角整齐向耳后斜上方轻扬点头，令其暗喜“全票通过”；然而匿名反馈却有七成反对。商场地推“0元领礼物”也常借高频友好笑容瘫痪消费者警惕心。',
    observableFacialCues: [
      '左右嘴角稳定地向外上方（斜向颧骨方向）拉起',
      '伴随礼貌性点头而未提问核实高风险预算数字',
      '处于讲究职场体面与商业亲和力的社交规范情境',
    ],
    questionPrompt:
      '台下同事与商业推广员展现的该动作编码（ML007）及其核心社会心理学警示是？',
    correctOption:
      'AU12（Lip Corner Puller / 嘴角上扬动作）：微笑还常用于礼貌、社交沟通、尴尬缓冲与安抚，不能把所有微笑都视为愉悦或赞同',
    distractors: [
      'AU12（绝对赞成愉悦定律）：凡在会议或推销场景出现嘴角上扬，90% 以上代表发自内心的欣喜与信任',
      'AU15（降口角肌下拉动作）：员工用下垂嘴角无声抗议超额预算安排',
      'AU1（额肌内侧眉头上扬）：表明听众希望得到演讲者的同情与照顾',
    ],
    explanation:
      'FACS 将颧大肌主导的嘴角外上方提拉编码为 AU12（Lip Corner Puller / ML007）。在现代社会交际、职场礼仪与服务商业活动中，AU12 大量承担体面附和与冲突缓冲功能，切忌误读为内心喜悦或实质同意。',
    scientificLimitation:
      '仅凭 AU12 不足以区分愉悦性微笑和礼貌社交微笑，也无法替代实质风险与价格条款的冷核算。',
    socraticQuestion:
      '想一想职场礼仪与商场地推中，人们把双唇向耳后斜上方提拉（微笑）除了“开心”之外，最常承担什么社会功能？',
    socraticClue:
      '核心动作是颧大肌牵引唇角外上方移动；关键判断在于拆穿“所有微笑都等于快乐或同意”的社会误区。',
  },
  {
    id: 'ml-scen-008',
    lawId: 'ml-008',
    codeId: 'ML008',
    actionUnitCode: 'AU15',
    category: '情绪',
    categoryRank: 4,
    difficulty: 'Easy',
    narrativeTitle: '录音审听间的“静息脸误会”',
    setting: '深夜电台审听间 · 监听台玻璃窗内外',
    actorAction:
      '新人交付节目样音后，看到制作人戴着耳机一声不吭、左右嘴角明显向斜下方垂拉着，瞬间认定对方极度失望准备推翻重做。推门才知制作人在极度投入构思剪辑点，而他一完全松弛面肌时天生静息嘴角就微微下沉。',
    observableFacialCues: [
      '左右两片口角向下方呈下弯弧度低垂',
      '当事人在长达数分钟的静态凝神倾听状态下保持静止',
      '未建立对方日常自然中性“静息基准脸”参照系',
    ],
    questionPrompt:
      '在观察此类嘴角下沉外貌时（ML008），科学的动作编码与防误判原则是？',
    correctOption:
      'AU15（Lip Corner Depressor / 嘴角向下拉动动作）：虽见于部分悲伤中，但易受说话口型与个人静息面肌影响，不能单凭它推断悲伤或失望',
    distractors: [
      'AU15（绝对失望确诊标记）：人类只在深度绝望或怀有怨气时口角才会向下移位，静息状态绝对呈水平线',
      'AU12（颧大肌上拉动作）：制作人正因欣赏佳作而克制着嘴角向斜上方微弯',
      'AU5（上睑大幅抬升）：表明制作人被音频效果惊呆而目瞪口呆',
    ],
    explanation:
      'FACS 将降口角肌下拉唇角编码为 AU15（Lip Corner Depressor / ML008）。实际观察中，口腔发音咬字、肌肉休息态下垂及天生骨骼结构都会呈现类似轮廓，必须先校准个人中性静息基线。',
    scientificLimitation:
      '不能仅凭嘴角下垂就推断悲伤、沮丧或失望，必须排除言语口型及个人静息基线差异。',
    socraticQuestion:
      '判断一个人是否“真的因为你的方案失望而沉下嘴角”之前，最容易被观察者漏掉的参照对比前提是什么？',
    socraticClue:
      '提示聚焦唇角向下的编码（与上扬的 AU12 相反），以及“平时放空不说话时的基准轮廓 + 说话发音影响”。',
  },
  {
    id: 'ml-scen-009',
    lawId: 'ml-009',
    codeId: 'ML009',
    actionUnitCode: 'Meta (138 项研究)',
    category: '行为',
    categoryRank: 1,
    difficulty: 'Hard',
    narrativeTitle: '峰会候场廊的“铅笔测试反转”',
    setting: '千人国际设计峰会后台候场通道',
    actorAction:
      '演讲者按畅销书说法“嘴咬铅笔硬笑三分钟”却发现焦躁丝毫未减且两颊酸痛；她转而参照 2019 年涵盖 138 项研究的系统元分析，停止强求假笑奇迹，采用温和松弛紧绷眉间与下颌肌、配合稳健呼吸与开场动作锚点顺利登台。',
    observableFacialCues: [
      '先尝试强迫维持夸张微笑肌肉姿势但主观紧张未消除',
      '随后转为轻量放松持续紧绷的皱眉肌与咬肌张力',
      '结合具体行为微习惯和情境提示共同平复心率',
    ],
    questionPrompt:
      '该演讲者在候场区亲历并实践了 Coles、Larsen 与 Lench（2019）哪项经典心理学发现（ML009）？',
    correctOption:
      '面部反馈假说（Facial Feedback Hypothesis）：面部肌肉活动可产生影响主观情绪的微弱信号，但总体效应较小且依赖条件，不能当作确定的情绪控制开关',
    distractors: [
      '面部反馈万能开关定律：138 项元分析证明只要横咬铅笔强笑 2 分钟即可 100% 根治舞台恐惧与负面情绪',
      '纯神经零反馈结论：2019 年荟萃分析彻底推翻了面部肌肉运动与情绪主观体验之间的任何微弱相关性',
      '杜乡绝对逆转法则：只要牵动 AU12 微笑就一定会使皮质醇在 30 秒内清零',
    ],
    explanation:
      'Coles 等人（2019）发表在《Psychological Bulletin》的荟萃分析综合 138 项研究共 286 个效应量，确认面部反馈对主观情绪体验确实存在影响，但效应量总体较小且因任务与情境条件显著波动（small and variable）。',
    scientificLimitation:
      '面部肌肉活动能轻轻微调情绪体验，但效应较小且因条件而异，绝不能理解为可任意控制情绪的万能开关。',
    socraticQuestion:
      '对于“咬铅笔微笑就能改变心情”的传统假说，2019 年大规模荟萃分析既没有盲从夸大，也没有一棒打死——它的精确尺度是什么？',
    socraticClue:
      '关键词是“存在正向影响，但总体效应量较小（small）且因研究条件而异（variable）”，须搭配实际放松微行动。',
  },
  {
    id: 'ml-scen-010',
    lawId: 'ml-010',
    codeId: 'ML010',
    actionUnitCode: 'PSPI 解码边界综述',
    category: '社会',
    categoryRank: 1,
    difficulty: 'Hard',
    narrativeTitle: '答辩评审室的“面相共识反转”',
    setting: '高校科创大赛复议听证会 · 封闭评委讨论间',
    actorAction:
      '主答辩人答辩时全程面无笑容、直视桌面紧抿嘴唇，五位评委中有四位互相附和认定“这神态绝对心虚找人代写”。资深教授当场指出：选手因重感冒失声正顶着喉痛推导公式，并调出 Git 记录与数学板书证明其扎实原创实力，扭转从众误判。',
    observableFacialCues: [
      '答辩全程紧抿双唇、未挂微笑且眼神专注向下看讲台',
      '评委团队正在根据“没笑且抿嘴=心虚”产生从众一致性偏误',
      '客观记录（代码提交轨迹、现场数学推理与声带发炎病史）完整可查',
    ],
    questionPrompt:
      '那位社会心理学教授借用 Lisa Feldman Barrett 等人（2019）哪项重磅结论（ML010）说服了评审团？',
    correctOption:
      '面部表情与情绪非一一对应准则：同一情绪表现形式多变，同一面部动作也可源于非情绪生理因素，解码必须结合语境与客观记录',
    distractors: [
      '跨文化表情固定密码本：全世界人类在心虚欺骗时都会呈现出完全统一的不笑加抿唇特征',
      '微表情测谎终审原则：在缺乏书面代码证据下，单凭答辩时 3 秒微表情即可推翻其他全部客观材料',
      'FACS 情绪等价公理：每个单独的 AU 与内心真实意图之间存在 100% 无歧义的一对一等号',
    ],
    explanation:
      'Barrett 等人（2019）于《PSPI》发表的系统综述强力论证：从面部肌肉运动到情绪心理状态并非一对一固定密码映射，高度受社会情境、个体基准、生理不适与文化规范塑造，脱离语境与硬证据的看脸定罪极不科学。',
    scientificLimitation:
      '科学共识明确否定“固定表情字典可跨情境直接读心/测谎”；表情只是低权重线索，须让位于语境、语言内容与客观行为记录。',
    socraticQuestion:
      '为什么大多数评委看着同一张“没笑容抿嘴”的脸就匆忙下结论，却恰恰踩中了 2019 年《PSPI》情绪综述推翻的最大幻觉？',
    socraticClue:
      '审视“一对一固定读心密码本”与“多对多复杂语境依赖”之间的根本科学分歧。',
  },
];

export function buildShuffledOptionsWithIndex(
  correctText: string,
  distractors: string[],
  rng: () => number = cryptoRandom
): { options: string[]; correctAnswer: number } {
  const tagged = [
    { text: correctText, isCorrect: true },
    ...distractors.slice(0, 3).map((text) => ({ text, isCorrect: false })),
  ];
  for (let i = tagged.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = tagged[i];
    tagged[i] = tagged[j];
    tagged[j] = tmp;
  }
  const correctAnswer = tagged.findIndex((item) => item.isCorrect);
  return {
    options: tagged.map((item) => item.text),
    correctAnswer: correctAnswer >= 0 ? correctAnswer : 0,
  };
}

export function buildMicroexpressionChapterQuestion(
  item: MicroexpressionQuizItem,
  options?: {
    city?: WorldCapitalCity;
    pointIndex?: number;
    chapterIndex?: number;
    qIdx?: number;
    chapterTheme?: string;
    rng?: () => number;
  }
): InjectedMicroexpressionQuestion {
  const rng = options?.rng || cryptoRandom;
  const city = options?.city;
  const pointIndex = options?.pointIndex ?? 0;
  const chapterIndex = options?.chapterIndex ?? 0;
  const qIdx = options?.qIdx ?? 0;
  const districtZh = city?.districts[pointIndex]?.zh || item.setting;
  const cityTag = city ? `${city.cityFr} · ${city.cityZh}` : 'Microexpressions Lab · 微表情专场';
  const chapterTheme =
    options?.chapterTheme || `${item.codeId} · ${item.category}排行 #${item.categoryRank}`;

  const { options: shuffledOptions, correctAnswer } = buildShuffledOptionsWithIndex(
    item.correctOption,
    item.distractors,
    rng
  );

  const locationContext = city ? `「${city.cityZh} · ${districtZh}」沙龙对照实案：` : '';

  return {
    id: `micro-scen-${city ? `${city.index}-${pointIndex}-${chapterIndex}` : 'solo'}-${item.lawId}-${qIdx}`,
    category: item.category,
    question: `${locationContext}${item.questionPrompt}`,
    options: shuffledOptions,
    correctAnswer,
    explanation: item.explanation,
    difficulty: item.difficulty,
    relatedLawId: item.lawId,
    chapterTheme,
    cityTag,
    subTag: `微表情 · ${item.actionUnitCode}`,
    sequenceToken: `${item.lawId}::narrative`,
    microScenario: {
      codeId: item.codeId,
      actionUnitCode: item.actionUnitCode,
      categoryZh: item.category,
      categoryRank: item.categoryRank,
      narrativeTitle: item.narrativeTitle,
      setting: item.setting,
      actorAction: item.actorAction,
      observableFacialCues: item.observableFacialCues,
      scientificLimitation: item.scientificLimitation,
    },
  };
}

/**
 * Generates a full 10-scenario CSPRNG-randomized gauntlet covering ML001-ML010.
 * If priorityLawId is supplied (e.g. from clicking a specific ML card), places that scenario first
 * followed by the remaining 9 scenarios in fresh randomized order.
 */
export function generateMicroexpressionChallengeRun(
  priorityLawId?: string
): InjectedMicroexpressionQuestion[] {
  const pool = [...MICROEXPRESSION_QUIZ_SCENARIOS];
  let ordered: MicroexpressionQuizItem[];

  if (priorityLawId) {
    const first = pool.find((item) => item.lawId === priorityLawId);
    const rest = cryptoShuffle(pool.filter((item) => item.lawId !== priorityLawId));
    ordered = first ? [first, ...rest] : cryptoShuffle(pool);
  } else {
    ordered = cryptoShuffle(pool);
  }

  return ordered.map((item, idx) =>
    buildMicroexpressionChapterQuestion(item, {
      qIdx: idx,
      chapterTheme: `微表情社会互动实案 #${idx + 1}/10 (${item.codeId} · ${item.category} #${item.categoryRank})`,
      rng: cryptoRandom,
    })
  );
}

/**
 * Randomly selects one of ML001-ML010 using CSPRNG while avoiding back-to-back repeats.
 */
export function pickRandomMicroexpressionScenarioItem(
  excludeLawIds: string[] = []
): MicroexpressionQuizItem {
  const excluded = new Set(excludeLawIds);
  const candidates = MICROEXPRESSION_QUIZ_SCENARIOS.filter((item) => !excluded.has(item.lawId));
  const pool = candidates.length > 0 ? candidates : MICROEXPRESSION_QUIZ_SCENARIOS;
  const idx = Math.floor(cryptoRandom() * pool.length);
  return pool[idx] || MICROEXPRESSION_QUIZ_SCENARIOS[0];
}

