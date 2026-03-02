import type { GameEvent, GameState } from "./types";

// ── Random Event Templates ──────────────────────────────────────────────────

export const RANDOM_EVENTS: GameEvent[] = [
  // Natural disasters
  {
    id: "earthquake",
    title: "大地震",
    description: "大規模な地震が国土を襲い、甚大な被害をもたらしました。都市部のインフラは壊滅的な打撃を受け、数千人が家を失っています。国際社会は支援の用意があると表明していますが、復興には巨額の費用と長い時間が必要です。政府の対応速度と質が、政権への信頼を左右する重大な局面です。",
    year: 0,
    effects: { gdpGrowth: -3, stability: -10 },
    choices: [
      {
        text: "大規模な復興予算を投入する — 「国家の底力を見せるとき」",
        effects: { treasury: -50, stability: 5, gdpGrowth: 1 },
      },
      {
        text: "国際社会に支援を要請する — 外交的資産を活用する",
        effects: { treasury: -20, legitimacy: -5, stability: 3 },
      },
      {
        text: "被災地の自助努力に委ねる — 「小さな政府」の原則を貫く",
        effects: { unrest: 10, stability: -5 },
      },
    ],
    tip: "災害対応は政権の正統性を左右する重大な局面です。迅速な対応は支持率を上げるが、遅い対応は致命的な政治的ダメージとなる。",
  },
  {
    id: "flood",
    title: "大洪水",
    description: "異常気象による記録的な豪雨が河川の氾濫を引き起こし、広範囲が浸水しました。農業地帯は壊滅的な被害を受け、今季の収穫は絶望的です。食糧価格の高騰が予想され、都市部の低所得層への影響が懸念されています。治水インフラの不備が改めて浮き彫りになりました。",
    year: 0,
    effects: { gdpGrowth: -2, populationGrowth: -0.5 },
    choices: [
      {
        text: "治水インフラに緊急投資する — 長期的な防災体制を構築",
        effects: { treasury: -40, gdpGrowth: 1, stability: 3 },
      },
      {
        text: "被災農家に補助金を支給する — 即効性のある救済策",
        effects: { treasury: -25, unrest: -5 },
      },
    ],
    tip: "インフラ投資は短期的な出費だが、長期的な安定と成長の基盤である。「一銭の予防は一ポンドの治療に値する」——ベンジャミン・フランクリン。",
  },
  {
    id: "drought",
    title: "干ばつ",
    description: "数ヶ月にわたる深刻な干ばつにより、農業生産が前年比40%も減少しました。食糧価格は急騰し、都市部では食料を求める市民の長い列ができています。歴史が教えるように、食糧危機は社会不安の最も強力な触媒です。政府の対応が遅れれば、暴動に発展する可能性もあります。",
    year: 0,
    effects: { inflation: 3, unrest: 8 },
    choices: [
      {
        text: "食糧を緊急輸入する — 国際市場から調達して危機を回避",
        effects: { treasury: -30, tradeBalance: -10, unrest: -5 },
      },
      {
        text: "食糧の配給制を導入する — 公平な分配を優先する",
        effects: { unrest: -3, legitimacy: -5, corruption: 3 },
      },
    ],
    tip: "食糧危機は革命の引き金になりうる最も危険な事態の一つです。フランス革命もロシア革命も、パンの値段から始まった。",
  },
  {
    id: "plague",
    title: "疫病の流行",
    description:
      "致死率の高い感染症が急速に拡大し、医療体制は崩壊寸前に追い込まれています。経済活動は停滞し、港は閉鎖され、市民は恐怖に震えています。歴史的に、疫病は社会構造を根底から変える力を持ちます。黒死病が封建制を揺るがしたように、この危機もまた、既存の秩序を試す試金石となるでしょう。",
    year: 0,
    effects: { populationGrowth: -2, gdpGrowth: -4, unrest: 10 },
    choices: [
      {
        text: "厳格な隔離政策を実施する — 感染拡大の阻止を最優先",
        effects: {
          gdpGrowth: -2,
          populationGrowth: 0.5,
          stability: -3,
          unrest: 5,
        },
      },
      {
        text: "医療研究に大規模投資する — 科学の力で危機を克服する",
        effects: { treasury: -60, populationGrowth: 1, legitimacy: 5 },
      },
      {
        text: "経済活動を優先し制限を最小化する — 「経済も人を殺す」",
        effects: { populationGrowth: -1, gdpGrowth: 1, unrest: 8 },
      },
    ],
    tip: "疫病対策は公衆衛生と経済のトレードオフを鋭く突きつけます。アルベール・カミュ：「ペストに対する誠実な戦い方はただ一つ——それは正直さだ」。",
  },
  // Political
  {
    id: "charismatic_leader",
    title: "カリスマ的指導者の登場",
    description:
      "国民的人気を誇る新たな政治的指導者が台頭し、既存の政治構造に衝撃を与えています。その弁舌は民衆の心を掴み、改革への期待が高まる一方、既存の権力構造に対する脅威ともなっています。歴史上、カリスマ的指導者の登場は国家の転換点となることが多い——良い方向にも悪い方向にも。",
    year: 0,
    effects: { legitimacy: 5, stability: 3 },
    choices: [
      {
        text: "改革の同志として迎え入れる — 変革の推進力とする",
        effects: { legitimacy: 10, stability: 5, corruption: -5 },
      },
      {
        text: "政治的脅威として警戒する — 権力基盤を守る",
        effects: { stability: -3, unrest: 5, corruption: 2 },
      },
    ],
    tip: "マックス・ウェーバー：「カリスマ的支配は本質的に不安定である。カリスマは日常化するか、消滅するかのいずれかだ」。カリスマ的指導者は希望にも脅威にもなりうる両刃の剣です。",
  },
  {
    id: "political_scandal",
    title: "政治スキャンダル",
    description:
      "調査報道により、政権中枢の大規模な汚職・権力濫用が発覚しました。公金の私的流用、利益誘導、隠蔽工作——次々と暴露される不正の実態に、国民の怒りと失望が広がっています。この危機をどう処理するかが、政権の存亡と国家制度の信頼性を左右します。",
    year: 0,
    effects: { legitimacy: -10, corruption: 5, unrest: 8 },
    choices: [
      {
        text: "徹底的な調査と粛清を行う — 「膿を出し切る」",
        effects: { corruption: -10, stability: -5, legitimacy: 5 },
      },
      {
        text: "穏便に処理し沈静化を図る — 政権安定を優先する",
        effects: { corruption: 3, stability: 2, legitimacy: -5 },
      },
      {
        text: "制度改革で再発防止に取り組む — 構造的対策を講じる",
        effects: {
          corruption: -5,
          bureaucracyEfficiency: 5,
          treasury: -15,
        },
      },
    ],
    tip: "アクトン卿：「権力は腐敗し、絶対的権力は絶対的に腐敗する」。腐敗は制度が弱体化した隙間に生まれます。",
  },
  {
    id: "civil_revolution_threat",
    title: "市民革命の危機",
    description:
      "長年蓄積された社会的不満が臨界点に達し、全国規模の抗議運動が発生しています。広場には数万人の市民が集結し、「体制の刷新」を要求しています。軍の一部にも動揺が見られ、弾圧を命じても実行されない可能性があります。歴史は繰り返す——しかし、革命の後に何が来るかは予測できません。",
    year: 0,
    effects: { unrest: 15, stability: -10 },
    choices: [
      {
        text: "民主的改革を約束し対話する — 「革命より改革を」",
        effects: { legitimacy: 8, unrest: -10, stability: 5 },
      },
      {
        text: "武力で鎮圧する — 秩序の維持を最優先する",
        effects: { unrest: -8, stability: 5, legitimacy: -15, corruption: 5 },
      },
    ],
    tip: "トクヴィル：「革命は圧政が最も過酷な時ではなく、少しだけ改善された時に起こる」。革命は抑え込めても、その根本原因は残り続けます。",
  },
  // Economic
  {
    id: "resource_discovery",
    title: "資源の発見",
    description:
      "国内で大規模な天然資源（石油・鉱物・希少金属）の鉱床が発見され、経済発展の好機が訪れています。しかし、多くの資源国が「資源の呪い」に苦しんでいることを歴史は教えています。資源の富を真の発展に結びつけられるかは、制度の質にかかっています。",
    year: 0,
    effects: { gdpGrowth: 2, treasury: 30 },
    choices: [
      {
        text: "国有化して国家収入に充てる — 国民の共有財産として管理",
        effects: { treasury: 50, corruption: 5, gdpGrowth: 1 },
      },
      {
        text: "民間企業に開発を委ねる — 市場メカニズムで効率化",
        effects: {
          gdpGrowth: 2,
          giniCoefficient: 0.03,
          unemployment: -2,
        },
      },
      {
        text: "国際共同開発とする — 技術移転と外交関係強化を狙う",
        effects: { tradeBalance: 10, gdpGrowth: 1.5, legitimacy: 3 },
      },
    ],
    tip: "「資源の呪い」——天然資源の富は適切な制度なしには腐敗と停滞を生みます。ノルウェーの政府系ファンドは数少ない成功例です。",
  },
  {
    id: "tech_innovation",
    title: "技術革新",
    description:
      "画期的な技術革新により産業構造が変化し、新たな経済機会が生まれています。しかし、創造的破壊は旧来の産業と雇用を脅かし、社会的な摩擦を生みます。技術革新の果実を広く分かち合えるかどうかは、制度設計と政策対応にかかっています。",
    year: 0,
    effects: { gdpGrowth: 3, unemployment: 3 },
    choices: [
      {
        text: "技術導入を積極的に支援する — 「創造的破壊」を受け入れる",
        effects: { gdpGrowth: 2, unemployment: -1, treasury: -20 },
      },
      {
        text: "既存産業の保護を優先する — 雇用と社会安定を守る",
        effects: { gdpGrowth: -1, unemployment: -2, stability: 3 },
      },
    ],
    tip: "シュンペーター：「創造的破壊こそが資本主義の本質的事実である」。革新は古い秩序を破壊して新しい成長を生むが、その過程は痛みを伴う。",
  },
  {
    id: "bubble_burst",
    title: "バブル崩壊",
    description: "投機的に膨れ上がった資産価格が崩壊し、金融危機が連鎖的に広がっています。銀行は不良債権に苦しみ、企業は資金繰りに窮し、失業率が急上昇しています。「安定は不安定を生む」というミンスキーの予言が現実となりました。政府は前例のない規模の対応を迫られています。",
    year: 0,
    effects: { gdpGrowth: -5, unemployment: 5, treasury: -40 },
    choices: [
      {
        text: "大規模な財政出動で景気を刺激する — ケインズ的対応",
        effects: { treasury: -60, gdpGrowth: 2, debt: 50 },
      },
      {
        text: "市場の自律回復を待つ — 「清算主義」的アプローチ",
        effects: { unemployment: 3, unrest: 10, gdpGrowth: -2 },
      },
      {
        text: "金融規制を強化する — 再発防止のための構造改革",
        effects: { gdpGrowth: -1, stability: 5, corruption: -3 },
      },
    ],
    tip: "ミンスキー：安定は不安定を生む。繁栄の中にこそ危機の種がある。バーナンキ：「大恐慌の教訓は、金融危機を放置してはならないということだ」。",
  },
  {
    id: "trade_route_change",
    title: "貿易路の変化",
    description:
      "国際的な貿易路が変化し、自国の交易パターンに大きな影響が出ています。新たな海運路の開拓、あるいは地政学的変動により、従来の貿易相手国との結びつきが弱まる一方、新たな市場への接続可能性が開けています。この変化に適応できるかが、経済の命運を分けます。",
    year: 0,
    effects: { tradeBalance: -5, gdpGrowth: -1 },
    choices: [
      {
        text: "新たな貿易相手国を開拓する — 外交的イニシアティブを発揮",
        effects: { tradeBalance: 8, treasury: -15, gdpGrowth: 1 },
      },
      {
        text: "国内産業の育成に切り替える — 内需主導の成長を目指す",
        effects: { gdpGrowth: 0.5, tradeBalance: 3, unemployment: -2 },
      },
    ],
    tip: "グローバル経済では、外部環境の変化への適応力が生存を左右します。ダーウィン：「最も強い種が生き残るのではない。変化に最も適応した種が生き残る」。",
  },
  // Social
  {
    id: "population_boom",
    title: "人口急増",
    description:
      "急激な人口増加により、雇用・住居・食糧・教育への圧力が急速に高まっています。若年人口の急増は「人口ボーナス」をもたらす可能性がある一方、適切な雇用機会がなければ「時限爆弾」にもなりかねません。この人口動態の変化にどう対応するかが、今後数十年の国家の姿を決めます。",
    year: 0,
    effects: { populationGrowth: 2, unemployment: 3, unrest: 5 },
    choices: [
      {
        text: "都市インフラを大規模に拡張する — 人口増加に投資で対応",
        effects: { treasury: -40, unemployment: -2, stability: 3 },
      },
      {
        text: "移民政策を制限する — 人口圧力の軽減を図る",
        effects: { populationGrowth: -1, unrest: -3, gdpGrowth: -0.5 },
      },
    ],
    tip: "マルサス：人口は幾何級数的に増加し、食糧は算術級数的にしか増加しない。しかし技術革新がマルサスの罠からの脱出を可能にした——制度が正しければ。",
  },
  {
    id: "education_reform",
    title: "教育改革運動",
    description: "知識人・学生・保護者が連帯し、教育制度の抜本的改革を求める社会運動が全国に広がっています。現行の教育制度は「暗記偏重」「創造性の軽視」「機会の不平等」と批判されており、国際的な競争力の低下も指摘されています。教育は「最も確実な投資」だが、その果実は遠い未来にしか実らない。",
    year: 0,
    effects: { unrest: 3, legitimacy: -3 },
    choices: [
      {
        text: "包括的な教育改革を実施する — 未来への投資",
        effects: { treasury: -30, gdpGrowth: 0.5, legitimacy: 5, unrest: -5 },
      },
      {
        text: "段階的な改善に留める — 急激な変化を避ける",
        effects: { treasury: -10, unrest: -2 },
      },
    ],
    tip: "教育への投資は最も確実な長期的成長戦略の一つです。ネルソン・マンデラ：「教育は世界を変えるために使うことのできる最も強力な武器である」。",
  },
  {
    id: "labor_strike",
    title: "労働者ストライキ",
    description:
      "主要産業の労働者が大規模なストライキを敢行し、経済活動が広範囲にわたって停滞しています。賃金の停滞、労働条件の悪化、格差の拡大への不満が爆発しました。労使関係は国家の社会契約の核心であり、その破綻は体制の正統性そのものを揺るがしかねません。",
    year: 0,
    effects: { gdpGrowth: -2, unrest: 8 },
    choices: [
      {
        text: "労働者の要求を受け入れる — 社会的対話を重視する",
        effects: {
          gdpGrowth: -0.5,
          unrest: -10,
          giniCoefficient: -0.02,
          treasury: -15,
        },
      },
      {
        text: "交渉で妥協点を探る — 双方の歩み寄りを促す",
        effects: { unrest: -5, stability: 2 },
      },
      {
        text: "ストライキを違法化し弾圧する — 経済秩序を守る",
        effects: { unrest: 5, stability: 3, legitimacy: -8 },
      },
    ],
    tip: "労使関係は社会の安定を映す鏡です。マルクス：「万国の労働者よ、団結せよ」ハイエク：「自由な市場には自由な労使関係が必要だ」——この対立は今も続く。",
  },
  // Diplomatic
  {
    id: "military_threat",
    title: "隣国の軍事的脅威",
    description:
      "隣国が国境沿いに大規模な軍事演習を実施し、安全保障上の緊張が急激に高まっています。外交筋によれば、領土紛争を背景とした示威行動とみられますが、意図的なエスカレーションの可能性も排除できません。軍参謀本部は即座に対応策の策定を求めています。",
    year: 0,
    effects: { stability: -5, unrest: 5 },
    choices: [
      {
        text: "軍備を増強し抑止力を高める — 「力による平和」を追求する",
        effects: { treasury: -40, stability: 5, unrest: -3, gdpGrowth: -0.5 },
      },
      {
        text: "外交交渉による解決を目指す — 対話のチャンネルを開く",
        effects: { stability: 3, legitimacy: 3, unrest: -2 },
      },
      {
        text: "国際社会に仲裁を求める — 多国間協調で圧力をかける",
        effects: { legitimacy: 2, stability: 2 },
      },
    ],
    tip: "クラウゼヴィッツ：戦争は他の手段をもってする政治の延長である。軍事的脅威への対応は、国家の外交的成熟度を試す試金石となる。",
  },
  // ── New Diplomatic Events ──────────────────────────────────────────────
  {
    id: "trade_war",
    title: "貿易摩擦の激化",
    description:
      "主要貿易相手国が自国産品への関税を大幅に引き上げました。「不公正な貿易慣行への対抗措置」と主張していますが、国内の保護主義的世論に応えた政治的決定との見方が有力です。輸出産業は深刻な打撃を受けており、報復措置を求める声が高まっています。",
    year: 0,
    effects: { tradeBalance: -8, gdpGrowth: -1, unrest: 5 },
    choices: [
      {
        text: "報復関税で対抗する — 「我々は脅しには屈しない」",
        effects: { tradeBalance: -3, unrest: -3, stability: 2, gdpGrowth: -0.5 },
      },
      {
        text: "外交交渉で関税の段階的撤廃を求める",
        effects: { tradeBalance: 2, legitimacy: 3, treasury: -10 },
      },
      {
        text: "国内産業の多角化で対応する — 危機を機会に変える",
        effects: { treasury: -25, gdpGrowth: 0.5, tradeBalance: -2 },
      },
    ],
    tip: "リカードの比較優位説は自由貿易の理論的基盤だが、現実の政治では「集中した損失と拡散した利益」の非対称性が保護主義を生む。",
  },
  {
    id: "diplomatic_marriage",
    title: "外交的同盟の提案",
    description:
      "有力な隣国から、政治的・経済的な同盟関係の強化が提案されています。同盟は安全保障を強化し、貿易の拡大をもたらす可能性がありますが、同盟国の紛争に巻き込まれるリスクも伴います。「永遠の同盟はない、あるのは永遠の国益だけだ」というパーマストンの言葉が脳裏をよぎります。",
    year: 0,
    effects: { legitimacy: 2 },
    choices: [
      {
        text: "同盟を受諾する — 安全保障を優先する",
        effects: { stability: 5, tradeBalance: 5, treasury: -15 },
      },
      {
        text: "経済協力のみに留める — 政治的独立性を維持する",
        effects: { tradeBalance: 3, gdpGrowth: 0.3 },
      },
      {
        text: "丁重に辞退する — 非同盟の立場を堅持する",
        effects: { legitimacy: -3, stability: -2 },
      },
    ],
    tip: "ビスマルク：「政治とは可能性の芸術である」同盟は安全保障の乗数効果を持つが、その代償として外交的自由度を失う。",
  },
  {
    id: "refugee_crisis",
    title: "難民危機",
    description:
      "近隣国の内戦から逃れた大量の難民が国境に押し寄せています。人道的責任と国内の社会的影響のバランスが問われる重大な局面です。国際社会は注視しており、対応次第で国家の評価が大きく左右されます。受け入れ体制の整備には多大なコストがかかりますが、拒否は道義的批判を招きます。",
    year: 0,
    effects: { unrest: 8, stability: -3 },
    choices: [
      {
        text: "大規模な受け入れを決断する — 人道的責任を果たす",
        effects: { treasury: -30, legitimacy: 8, populationGrowth: 0.5, unrest: 3 },
      },
      {
        text: "限定的な受け入れと支援に留める",
        effects: { treasury: -15, legitimacy: 2, unrest: -2 },
      },
      {
        text: "国境を封鎖する — 国内の安全を最優先する",
        effects: { unrest: -5, legitimacy: -10, stability: 3 },
      },
    ],
    tip: "難民問題は「人道的義務」と「国家主権」の根源的な緊張を体現する。グローバル化時代の国家は、この二律背反から逃れることができない。",
  },
  {
    id: "international_summit",
    title: "国際首脳会議",
    description:
      "主要国による国際首脳会議への参加が求められています。気候変動、貿易、安全保障など多岐にわたる議題が予定されており、国際社会における自国の立場を明確にする好機です。しかし、国際合意は国内政策の自由度を制約する可能性もあります。",
    year: 0,
    effects: { legitimacy: 3 },
    choices: [
      {
        text: "積極的にリーダーシップを発揮する",
        effects: { treasury: -20, legitimacy: 8, tradeBalance: 3, stability: 2 },
      },
      {
        text: "協調姿勢を見せつつ国益を守る",
        effects: { treasury: -10, legitimacy: 3, tradeBalance: 1 },
      },
      {
        text: "参加を見送り、国内問題に集中する",
        effects: { legitimacy: -5, stability: 1 },
      },
    ],
    tip: "国際協調は「囚人のジレンマ」の繰り返しゲームである。単発では裏切りが得だが、長期的関係では協力の方が合理的になりうる。",
  },
  // ── New Political Events ──────────────────────────────────────────────
  {
    id: "constitutional_crisis",
    title: "憲法危機",
    description:
      "政府と議会（または他の権力機関）の間で深刻な権限争いが発生し、憲法秩序そのものが揺らいでいます。この対立は単なる政治的駆け引きを超え、国家の根本的な統治構造に関わる問題です。国民は不安を抱えながらも、この危機が制度改革の契機となることを期待しています。",
    year: 0,
    effects: { stability: -8, legitimacy: -5, unrest: 8 },
    choices: [
      {
        text: "憲法改正を通じて権限関係を明確化する",
        effects: { stability: 5, legitimacy: 5, treasury: -15, corruption: -3 },
      },
      {
        text: "行政権の優越を主張し危機を収束させる",
        effects: { stability: 3, legitimacy: -8, corruption: 3 },
      },
      {
        text: "国民投票で国民の判断に委ねる",
        effects: { legitimacy: 8, stability: -3, unrest: -5 },
      },
    ],
    tip: "憲法危機は「制度の臨界点（クリティカル・ジャンクチャー）」である。ここでの選択が、以後数十年の政治発展の経路を決定する。",
  },
  {
    id: "succession_crisis",
    title: "後継者問題",
    description:
      "国家の最高指導者の後継をめぐり、権力闘争が激化しています。有力な後継候補が複数存在し、それぞれが軍部、官僚機構、経済界などの支持基盤を持っています。権力の移行は国家にとって最も脆弱な瞬間であり、この局面をどう乗り切るかが国家の成熟度を示します。",
    year: 0,
    effects: { stability: -10, unrest: 10, corruption: 5 },
    choices: [
      {
        text: "制度的な権力移行メカニズムを確立する",
        effects: { stability: 8, legitimacy: 10, treasury: -10, corruption: -5 },
      },
      {
        text: "最も有力な候補を支持し、迅速な権力移行を図る",
        effects: { stability: 5, unrest: -5, legitimacy: -3 },
      },
      {
        text: "権力闘争を放置し、自然な淘汰に任せる",
        effects: { stability: -5, unrest: 5, corruption: 5 },
      },
    ],
    tip: "イブン・ハルドゥーン：「王朝は三世代で衰退する」後継者問題の制度的解決は、王朝循環を打破する鍵である。",
  },
  {
    id: "press_censorship_demand",
    title: "報道規制の要求",
    description:
      "政権中枢から、批判的な報道機関に対する規制強化の要求が出されています。「国家の安全と秩序を守るため」という名目ですが、実態は政権批判の封殺にほかなりません。報道の自由を守るべきか、秩序を優先すべきか——この選択は国家の方向性を決定づけます。",
    year: 0,
    effects: { stability: -3, legitimacy: -3 },
    choices: [
      {
        text: "報道の自由を断固として擁護する",
        effects: { legitimacy: 8, corruption: -3, unrest: 3, stability: -2 },
      },
      {
        text: "「責任ある報道」の名の下に部分的規制を導入する",
        effects: { legitimacy: -3, corruption: 2, stability: 3, unrest: -2 },
      },
      {
        text: "包括的な報道規制を実施する",
        effects: { legitimacy: -10, corruption: 5, stability: 5, unrest: -5 },
      },
    ],
    tip: "「報道の自由がなければ、あらゆる形態の自由は幻想に過ぎない」——報道の自由は腐敗を抑止し、権力に説明責任を課す制度的装置である。",
  },
  {
    id: "corruption_network_exposed",
    title: "巨大汚職ネットワークの発覚",
    description:
      "内部告発により、政府高官と大企業が結託した巨大な汚職ネットワークが白日の下にさらされました。公共事業の入札操作、税金の横領、規制の見返りとしての賄賂——その規模は国家予算の数パーセントに及ぶと推定されています。国民の怒りは沸点に達しています。",
    year: 0,
    effects: { legitimacy: -12, corruption: 8, unrest: 12 },
    choices: [
      {
        text: "徹底的な捜査と厳罰を行い、制度改革に着手する",
        effects: { corruption: -15, stability: -8, legitimacy: 10, treasury: -20, bureaucracyEfficiency: 5 },
      },
      {
        text: "関係者の一部を処分し、穏便に収束させる",
        effects: { corruption: -3, stability: 2, legitimacy: -5, unrest: -3 },
      },
      {
        text: "制度改革に集中し、個人の追及は二の次にする",
        effects: { corruption: -8, bureaucracyEfficiency: 5, treasury: -15, unrest: 3 },
      },
    ],
    tip: "アクトン卿：「権力は腐敗する。絶対的権力は絶対的に腐敗する」腐敗は制度の隙間に巣食い、放置すれば国家を内側から蝕む。",
  },
];

// ── Event Generator ─────────────────────────────────────────────────────────

export function generateRandomEvent(
  year: number,
  state: GameState,
): GameEvent | null {
  // ~35% chance of an event each turn (slightly increased for more dynamic gameplay)
  if (Math.random() > 0.35) {
    return null;
  }

  // Filter events by relevance to current state
  const candidates = RANDOM_EVENTS.filter((e) => {
    if (e.id === "bubble_burst" && state.economic.gdpGrowth < 0) return false;
    if (e.id === "labor_strike" && state.economic.unemployment > 20)
      return false;
    if (
      e.id === "resource_discovery" &&
      state.economic.gdpGrowth > 8
    )
      return false;
    // Diplomatic events need some GDP
    if (e.id === "trade_war" && state.economic.gdp < 300) return false;
    if (e.id === "international_summit" && state.economic.gdp < 500) return false;
    // Political events need context
    if (e.id === "constitutional_crisis" && state.political.stability > 60) return false;
    if (e.id === "succession_crisis" && state.political.electionCycle > 0) return false;
    if (e.id === "corruption_network_exposed" && state.political.corruption < 40) return false;
    return true;
  });

  if (candidates.length === 0) return null;

  const template = candidates[Math.floor(Math.random() * candidates.length)];

  return {
    ...template,
    year,
    // Deep copy choices so runtime mutations don't affect templates
    choices: template.choices.map((c) => ({
      text: c.text,
      effects: { ...c.effects },
    })),
    effects: { ...template.effects },
  };
}
