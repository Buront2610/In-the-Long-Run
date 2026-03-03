# 予算配分システムの抜本的再設計

## 設計思想

現行の「税収の配分%（合計無制約）」から、現実のマクロ経済を反映した「対GDP比での歳出水準」に変更する。

**核心原則:**
- 政府支出は「GDPの何%を使うか」で決める（現実の財政政策と同じ）
- 歳入（税率×GDP）と歳出（各カテゴリ合計×GDP）の差が財政収支
- **赤字財政は悪ではない** — 不況時のケインズ的赤字支出は経済を回復させる
- **債務は即死ではない** — r < g（金利 < 成長率）なら債務GDP比は自然に安定する
- **総力戦経済**を再現する — 国防費GDP比15%超で特殊モード発動

## 変更箇所一覧

### 1. 型定義の変更 (`types.ts`)

```
SpendingCategory の意味を変更:
  旧: 各カテゴリ = 税収の配分% (0-100, 合計無制約)
  新: 各カテゴリ = GDP比の支出% (defense: 0-50, 他: 0-30)

EconomicState に追加:
  fiscalBalance: number      // 財政収支 (GDP比%)
  primaryBalance: number     // 基礎的財政収支 (利払い前)
  totalSpendingRate: number  // 総歳出のGDP比%
  totalRevenueRate: number   // 総歳入のGDP比% (≒税率)
  isWarEconomy: boolean      // 総力戦経済モード
```

### 2. デフォルト値の変更 (`constants.ts`)

現実的なGDP比%に変更:
```
governmentSpending: {
  defense: 3,          // 平時の先進国: 2-4%
  education: 5,        // OECD平均: 4-6%
  infrastructure: 4,   // 先進国: 3-5%
  welfare: 10,         // 先進国: 8-20%
  research: 2,         // 先進国: 1.5-3%
}
// 合計: 24% of GDP
// 税率30%なら → 財政収支: +6% (黒字)
```

各シナリオも調整:
- 新興国: defense 5%, education 3%, welfare 5% — 低福祉・高軍事
- 古代帝国: defense 8%, education 1%, welfare 2% — 軍事主体
- 体制移行: defense 4%, welfare 12% — ソ連型の重い社会保障

### 3. ゲームエンジンの経済シミュレーション改修 (`GameEngine.ts`)

#### 3a. 財政計算の完全書き直し

```
歳入 = taxRate / 100 × GDP
歳出 = (defense + education + infrastructure + welfare + research) / 100 × GDP
基礎的収支 = 歳入 - 歳出
利払い = debt × 実効金利
財政収支 = 基礎的収支 - 利払い

if 赤字 → debt += |財政収支|
if 黒字 → debt -= 黒字の一部 (自動返済)
```

#### 3b. ケインズ的フィスカル・マルチプライヤー（新規追加）

不況時（失業率 > NAIRU）の赤字支出は成長を促進する:
```
outputGap = unemployment - NAIRU  // 正なら不況
if outputGap > 0 && fiscalBalance < 0:
  multiplier = 1.0 + outputGap * 0.05  // 不況が深いほど乗数が大きい
  fiscalStimulus = |deficit| / GDP × multiplier × 2.0
  → GDP成長率にプラス

if outputGap <= 0 && fiscalBalance < 0:
  // 好況時の赤字は主にインフレを加速（クラウディングアウト）
  overheatingPressure = |deficit| / GDP × 3.0
  → インフレ率にプラス
```

**教育的意義**: プレイヤーは「不況時は赤字を出してでも支出すべき」「好況時に赤字を出すと過熱する」を体験で学べる。

#### 3c. 債務持続可能性のリアルなモデル

```
実効金利 = ベース金利(2%) + リスクプレミアム + インフレ連動
リスクプレミアム:
  債務GDP比 < 60%:  0%
  60-100%:          (ratio - 60) × 0.02%  (緩やかに上昇)
  100-200%:         0.8% + (ratio - 100) × 0.03%
  200%超:           3.8% + (ratio - 200) × 0.05%  (急上昇)

債務安定条件: gdpGrowth > 実効金利 なら債務GDP比は自然に低下
→ 日本型: 高債務でも低金利なら持続可能
→ ギリシャ型: 成長率が金利を下回ると雪だるま式に悪化
```

#### 3d. 総力戦経済メカニクス（新規追加）

defense > 15% of GDP で「総力戦経済」モードが発動:

```
効果:
1. 失業率が急速に低下 (軍需+徴兵)
   unemployment -= (defense - 15) × 0.8
   下限: 1%

2. GDP成長率に一時的ブースト (軍需産業の拡大)
   warEconomyGrowth = (defense - 15) × 0.3

3. インフレ圧力 (供給制約 + 需要過多)
   warInflation = (defense - 15) × 0.8

4. 他の支出カテゴリの効果が減衰 (資源が軍に吸われる)
   civilianEfficiency = max(0.3, 1.0 - (defense - 15) × 0.05)
   教育・福祉・インフラの効果 × civilianEfficiency

5. 不満と正統性のトレードオフ
   外敵の脅威がある場合: legitimacy +3, unrest -2 (挙国一致)
   脅威がない場合: unrest +5 (なぜ戦争を?)

6. 戦後経済の崩壊リスク
   defenseを急に下げると → GDP成長率に大きなマイナス (軍縮不況)
   → 失業率が急上昇 (復員兵の雇用問題)
```

**教育的意義**: WW2アメリカの完全雇用と急成長、戦後の一時的不況、ソ連の軍事経済の限界などを体験できる。

### 4. 利益団体の閾値調整 (`GameEngine.ts: updateInterestGroups`)

GDP比%に合わせて閾値を変更:
```
MILITARY:   defense > 4%  → 満足 (旧: > 20%)
WORKERS:    welfare > 12% → 満足 (旧: > 25%)
INTELLECTUALS: education + research > 8% → 満足 (旧: > 30%)
FARMERS:    変更なし (インフレ依存)
```

### 5. applyPolicy のスライダー上限変更 (`GameEngine.ts`)

```
spending_defense:        clamp(value, 0, 50)  // 総力戦で最大50%
spending_education:      clamp(value, 0, 30)
spending_infrastructure: clamp(value, 0, 30)
spending_welfare:        clamp(value, 0, 30)
spending_research:       clamp(value, 0, 20)
```

### 6. PolicyPanel UI の全面改修 (`PolicyPanel.tsx`)

新UIの構成:
```
┌─────────────────────────────────────────┐
│ 財政政策                                 │
├─────────────────────────────────────────┤
│ ■ 歳入・歳出サマリー                     │
│   歳入: 300 (GDP比 30%)                  │
│   歳出: 240 (GDP比 24%)                  │
│   利払い: 16                             │
│   財政収支: +44 (GDP比 +4.4%) ■黒字      │
│   ─────────────────────────             │
│   国家債務: 400 (GDP比 40%)              │
├─────────────────────────────────────────┤
│ ■ 税率                                   │
│   [==============================] 30%   │
├─────────────────────────────────────────┤
│ ■ 歳出配分 (対GDP比)                     │
│                                          │
│   国防  [===---] 3.0%  → 実額: 30       │
│   教育  [=====--] 5.0%  → 実額: 50      │
│   ｲﾝﾌﾗ  [====---] 4.0%  → 実額: 40      │
│   福祉  [=========-] 10.0% → 実額: 100  │
│   研究  [==-----] 2.0%  → 実額: 20      │
│         ─────────────────                │
│   合計: 24.0% (実額: 240)                │
│                                          │
│   ■ 財政収支バー                          │
│   歳入 30% [████████████████████████████]│
│   歳出 24% [████████████████████░░░░░░░░]│
│            ↑ここが財政余裕（黒字 6%）      │
│                                          │
│   ⚠️ 国防費15%超で総力戦経済に突入        │
├─────────────────────────────────────────┤
│ ■ 特殊アクション                          │
│   [反腐敗キャンペーン]  [貿易促進]         │
│   ※ターン内1回のみ実行可能               │
└─────────────────────────────────────────┘
```

### 7. 制度の解禁条件テキストの更新 (`constants.ts`)

spending閾値に言及するテキストを新スケールに合わせる:
- "国防費10以上" → "国防費GDP比3%以上"
- "教育予算15以上" → "教育予算GDP比4%以上"
- "福祉予算20以上" → "福祉予算GDP比8%以上"

### 8. シナリオ初期値の調整 (`constants.ts: SCENARIOS`)

全4シナリオのgovernmentSpending初期値を現実的なGDP比%に調整。

### 9. 特殊アクションのターン制限

`promote_trade` と `anti_corruption` に1ターン1回の制限を追加。
GameStateに `actionsUsedThisTurn: Set<string>` を追加し、nextTurn()でリセット。

### 10. EconomyPanel の改善 (`EconomyPanel.tsx`)

財政収支を経済指標に追加:
- 財政収支 (GDP比%)
- 総力戦経済モード表示

## 実装順序

1. **types.ts** — EconomicState に新フィールド追加
2. **constants.ts** — デフォルト値・シナリオ値を新スケールに変更
3. **GameEngine.ts** — simulateEconomy() 書き直し + 総力戦 + ターン制限
4. **PolicyPanel.tsx** — UI全面刷新
5. **EconomyPanel.tsx** — 財政収支・総力戦表示追加
6. **利益団体閾値** — 新スケール対応

## バランスの指標

良いバランスの状態:
- 平時の健全財政: 税率25-35%, 支出20-30%, 小幅黒字
- 不況時: 赤字支出で3-5年で回復可能
- 総力戦: 10-15年は維持可能だが、それ以降は経済疲弊
- 債務GDP比200%: 持続可能だが余裕なし（日本モデル）
- 債務GDP比300%: ゲームオーバー圏（変更なし）
