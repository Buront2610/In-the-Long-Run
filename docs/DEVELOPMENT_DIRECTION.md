# 今後の開発方針設計書

**Version**: 0.1  
**目的**: レビューで指摘された品質リスクを、今後の実装判断とロードマップに落とし込む。  
**位置づけ**: `docs/DESIGN.md` はゲームの世界観・長期仕様を扱う。本書は、現行実装をその理想へ近づけるための開発方針、優先順位、受け入れ基準を扱う。

---

## 1. 基本方針

現行プロジェクトは、国家運営・マクロ経済・公共選択論・制度進化を扱うシミュレーションゲームとして十分な土台を持っている。一方で、今後の拡張に入る前に、プレイヤーが画面上で読んだルールと、エンジンが実際に判定するルールを一致させる必要がある。

今後の開発では、次の順序を守る。

1. **信頼できるMVPにする**
   表示、データ、ゲームエンジン、テストの整合性を優先する。

2. **意思決定のフィードバックを強くする**
   プレイヤーが「なぜその結果になったか」「次に何を検討すべきか」を理解できるUIにする。

3. **データ駆動の拡張に耐える構造にする**
   制度、イベント、シナリオ、外交、利益団体を増やしても、typoや仕様漏れが静かに壊れないようにする。

4. **プロダクト品質を上げる**
   アクセシビリティ、UIテスト、E2E、長期シミュレーション検証、セーブ/ロードを段階的に追加する。

---

## 2. 設計原則

### 2.1 表示ルールと実行ルールを分けない

制度の解禁条件、外交アクションの実行可否、イベント効果、政策変更制限は、UIとゲームエンジンが同じ判定関数を使う。

避ける状態:

- UIでは採用不可に見えるが、エンジンでは採用できる。
- UIには条件が表示されているが、実装では判定されていない。
- 説明テキストだけが更新され、ゲームロジックが追従していない。

採用する方針:

```ts
const result = canAdoptInstitution(state, institution);

if (!result.ok) {
  return result.reasons;
}
```

UIは `result.reasons` を表示し、エンジンは同じ `result.ok` を採用可否に使う。

### 2.2 ターン結果は独立した成果物として扱う

ターン進行後の結果表示を、履歴配列の末尾差分から推測しない。ターン実行の前後スナップショットと、重要な変化理由を含む `TurnReport` を生成する。

目標:

- `TurnSummary` は「直近ターンの結果」を表示する。
- `history` は長期グラフ用の時系列データとして扱う。
- 将来のセーブ、Undo、リプレイ、デバッグログに拡張しやすくする。

### 2.3 数値フィールドの意味を一つにする

`gdpGrowth` のように、内部計算では基調成長率、UIでは実現成長率として見えてしまうフィールドをなくす。

今後の方向性:

```ts
interface EconomicState {
  potentialGrowth: number; // 経済の基調・潜在的な成長力
  realizedGrowth: number;  // 直近ターンで実際にGDPへ反映された成長率
}
```

短期的には互換性維持のため `gdpGrowth` を残してもよいが、UIが表示する値は実現成長率に寄せる。

### 2.4 データのtypoを実行時まで持ち越さない

制度やイベントの `effects` は、任意の文字列キーではなく、明示的な union 型で表現する。

```ts
type EffectKey =
  | "gdp"
  | "potentialGrowth"
  | "realizedGrowth"
  | "population"
  | "populationGrowth"
  | "inflation"
  | "unemployment"
  | "taxRate"
  | "debt"
  | "tradeBalance"
  | "giniCoefficient"
  | "treasury"
  | "legitimacy"
  | "corruption"
  | "stability"
  | "unrest"
  | "bureaucracyEfficiency";

type Effects = Partial<Record<EffectKey, number>>;
```

テスト・開発環境では未知キーをエラーにする。本番で即クラッシュを避ける場合でも、検出可能な警告を出す。

### 2.5 履歴は軽く、再現性は強くする

履歴にはグラフや年表に必要な指標だけを保存する。将来的な完全再現は `scenario + seed + action log` を基本にする。

長期的な目標:

```ts
interface SavedRun {
  schemaVersion: number;
  scenarioId: string;
  seed: string;
  actions: PlayerActionLog[];
}
```

これにより、セーブ/ロード、リプレイ、バランス検証、バグ再現を同じ仕組みで扱える。

---

## 3. 最優先で直す領域

### 3.1 ドキュメントとデータの整合性

課題:

- READMEの制度数、イベント数、シナリオ数が現行データとズレている。
- 機能追加後に説明が追従しない構造になっている。

方針:

- READMEでは厳密な件数を避け、変わりにくい表現にする。
- 件数が必要な場合は、データファイルから生成または検証する。
- `docs/DESIGN.md` は理想仕様、READMEは現行実装の案内として役割を分ける。

受け入れ基準:

- READMEを読んだ内容と現行ゲームの選択肢が矛盾しない。
- 新しい制度、イベント、シナリオを追加したとき、少なくともテストで件数や参照整合性を確認できる。

### 3.2 制度解禁条件

課題:

- `unlockConditions` は説明文字列であり、実際の採用判定では使われていない。
- `InstitutionPanel` と `GameEngine.adoptInstitution()` の採用可否が、今後さらにズレる可能性がある。

方針:

`unlockConditions` は表示専用として残すのではなく、実行可能な `unlockRules` に移行する。

```ts
type InstitutionUnlockRule =
  | { kind: "minEconomic"; field: keyof EconomicState; value: number }
  | { kind: "maxEconomic"; field: keyof EconomicState; value: number }
  | { kind: "minPolitical"; field: keyof PoliticalState; value: number }
  | { kind: "maxPolitical"; field: keyof PoliticalState; value: number }
  | { kind: "governmentTypeIn"; values: GovernmentType[] }
  | { kind: "institutionAdopted"; institutionId: string }
  | { kind: "spendingAtLeast"; field: keyof SpendingCategory; value: number }
  | { kind: "treasuryAtLeast"; value: number };

interface Institution {
  unlockRules: InstitutionUnlockRule[];
}
```

実装単位:

1. `unlockRules` 型を追加する。
2. `canAdoptInstitution(state, institution)` を追加する。
3. UIとエンジンの両方を `canAdoptInstitution` に接続する。
4. 既存の `unlockConditions` は、移行期間中は説明文として残す。
5. 移行完了後、表示文は `unlockRules` から生成する。

受け入れ基準:

- 条件未達の制度はUIでもエンジンでも採用できない。
- 採用不可理由が、財源不足、前提制度不足、政治条件不足などに分かれて表示される。
- 制度データに未知の条件種別がある場合、テストで落ちる。

### 3.3 ターン履歴と結果サマリー

課題:

- `GameEngine.nextTurn()` はターン処理前に `recordHistory()` を呼ぶ。
- `TurnSummary` は `history` の末尾2件を比較するため、直近ターンの結果とズレる。

方針:

`nextTurn()` は `TurnReport` を生成する。React側は履歴推測ではなく、直近の `TurnReport` を表示する。

```ts
interface TurnSnapshot {
  year: number;
  economic: Pick<EconomicState,
    | "gdp"
    | "realizedGrowth"
    | "inflation"
    | "unemployment"
    | "debtToGdpRatio"
    | "fiscalBalance"
    | "treasury"
  >;
  political: Pick<PoliticalState,
    | "stability"
    | "legitimacy"
    | "corruption"
    | "unrest"
  >;
}

interface TurnReport {
  before: TurnSnapshot;
  after: TurnSnapshot;
  yearAdvancedTo: number;
  deltas: Record<string, number>;
  generatedEvents: string[];
  news: string[];
  warnings: string[];
}
```

履歴はターン処理後に保存する。既存テストで「履歴はターン前」を前提にしているものは、新仕様に合わせて更新する。

受け入れ基準:

- 最初のターン終了直後から結果サマリーが表示される。
- サマリーのGDP、インフレ、失業率、安定度の差分が、ターン前後の実値差分と一致する。
- `history` は長期グラフとして自然な年次推移になる。

### 3.4 GDP成長率の意味整理

課題:

- `effectiveGrowth` でGDPを更新しているが、表示される `gdpGrowth` は実際のGDP増減率と一致しない可能性がある。

方針:

段階的に `potentialGrowth` と `realizedGrowth` へ分離する。

短期:

- GDP更新直後に実現成長率を算出し、UIに表示する。
- 既存の `gdpGrowth` を参照するイベント条件やTipsは、どちらの意味で使うべきか整理する。

中期:

- 内部の景気モメンタムや潜在成長力は `potentialGrowth` に寄せる。
- UI、TurnReport、HistoryRecordは `realizedGrowth` を表示する。

受け入れ基準:

- 「GDP成長率」と表示される値が、実際のGDP変化率と一致する。
- イベント条件で使う成長率が、実現値なのか潜在値なのか明確である。
- テストで `after.gdp / before.gdp - 1` と表示成長率の一致を確認する。

### 3.5 効果キー検証

課題:

- `applyEffect(state, key, delta)` は未知のキーを黙って無視する。
- 制度やイベントが増えるほど、typoによる静かなバランス崩壊が起きやすい。

方針:

- `EffectKey` と `Effects` を導入する。
- `Institution.effects`、`EventChoice.effects`、外交効果を `Effects` に寄せる。
- `applyEffect` の `default` で未知キーを検出する。
- データファイルに対する schema validation テストを追加する。

受け入れ基準:

- 存在しない効果キーを入れると、テストで失敗する。
- `applyEffect` の処理対象キーと `EffectKey` が一致している。
- 制度、イベント、外交アクションの効果が共通の型で扱われる。

### 3.6 イベントチェーン

課題:

- `pendingChainEventId` が単一値のため、複数の後続イベントを扱えない。
- 非連鎖選択肢で保留中の連鎖イベントが消える仕様は、将来的に違和感が出やすい。
- 連鎖イベントコピー時に `triggersEventId` が落ちる。

方針:

`pendingChainEventId` を `pendingChainEventIds` に変更し、キューとして扱う。

```ts
interface GameState {
  pendingChainEventIds: string[];
}
```

イベントテンプレートをインスタンス化するときは、選択肢全体をコピーする。

```ts
choices: template.choices.map((choice) => ({
  ...choice,
  effects: { ...choice.effects },
}))
```

受け入れ基準:

- 連鎖イベントが複数保留できる。
- 無関係なイベント選択で、既存の保留連鎖が消えない。
- 連鎖イベントからさらに連鎖できる。

---

## 4. UI/UXの方向性

UIの詳細な再設計は `docs/UI_UX_IMPROVEMENT_PLAN.md` を基準にする。本書では、ゲームロジック改善と接続するUI方針だけを定める。

### 4.1 UIは数値一覧ではなく意思決定を支援する

毎ターンの基本動線:

1. 国家の状態を見る。
2. 重大リスクを見る。
3. 政策、制度、政治、外交のどこを触るべきか判断する。
4. 変更後の予測を見る。
5. ターンを進める。
6. 結果と原因を見る。

この流れを、概況、財政、制度、政治、外交、歴史の画面構成に反映する。

### 4.2 アクセシビリティは後回しにしない

優先対応:

- `EventDialog` に `role="dialog"`、`aria-modal`、初期フォーカス、Escape対応を追加する。
- `WorldMap` の地域選択をキーボードで操作できるようにする。
- `HistoryChart` にスクリーンリーダー向けの要約を追加する。
- ボタン、タブ、スライダー、外交アクションに明確な `disabled` 理由を持たせる。

受け入れ基準:

- 主要操作がキーボードだけで可能。
- モーダル表示中にフォーカスが背後へ逃げない。
- 色だけに依存しない状態表示になっている。

### 4.3 インラインスタイルの整理

現状の大きなインラインスタイルは、短期的には許容する。ただしUI拡張前に、以下を段階的に切り出す。

- `src/styles/tokens.ts`
- `src/components/ui/Panel.tsx`
- `src/components/ui/MetricCard.tsx`
- `src/components/ui/RiskBadge.tsx`
- `src/components/ui/ActionButton.tsx`

この整理は、見た目の刷新そのものではなく、今後のUI改修を安全にするための下準備として扱う。

---

## 5. テスト方針

### 5.1 既存テストはゲームロジックの安全網として維持する

現行の Node `assert` ベースのテストは、ゲームエンジンの広い範囲を押さえている。短期的には維持し、P0修正に合わせてテストを追加する。

P0で追加するテスト:

- 制度解禁条件の達成/未達。
- UIとエンジンで同じ採用判定が使われること。
- TurnReportの前後差分。
- 実現GDP成長率と実際のGDP変化率の一致。
- 未知の効果キー検出。
- イベントチェーンキュー。

### 5.2 データ検証テストを追加する

制度、イベント、シナリオはデータ駆動で増えるため、ロジックテストとは別に schema validation を行う。

検証対象:

- institution id の一意性。
- prerequisite id の存在。
- unlock rule の形式。
- effect key の妥当性。
- event choice の効果と連鎖先id。
- scenario の初期値範囲。

### 5.3 UIテストは主要動線から入れる

導入順:

1. Vitest
2. React Testing Library
3. Playwright
4. アクセシビリティ検査

最初のE2Eシナリオ:

1. シナリオを選択する。
2. 財政政策を変更する。
3. 次ターンへ進める。
4. イベントが出た場合は選択する。
5. ターン結果が表示される。
6. 制度画面で採用可否理由が表示される。

### 5.4 長期バランス回帰テスト

100から1000ターンの seed 固定シミュレーションを追加し、極端な破綻を検出する。

検出したいもの:

- GDPが異常に発散する。
- インフレや失業率が常に上限へ張り付く。
- 債務比率が通常プレイで即死水準に達し続ける。
- ランダムイベントが特定カテゴリに偏りすぎる。
- どのシナリオでも同じ戦略が最適になる。

---

## 6. ロードマップ

### Phase 0: 現状把握とドキュメント整合

目的:

現行実装の説明を正しくし、以降の修正範囲を明確にする。

作業:

- READMEの機能数表現を現行実装に合わせる。
- `docs/DESIGN.md`、`docs/UI_UX_IMPROVEMENT_PLAN.md`、本書の役割を整理する。
- 制度、イベント、シナリオのデータ検証テストを追加する。

完了条件:

- READMEと現行実装の目立つ矛盾がない。
- データ追加時に最低限の参照整合性をテストできる。

### Phase 1: ルール整合性の修正

目的:

プレイヤーが読んだルールとゲームエンジンの判定を一致させる。

作業:

- `unlockRules` と `canAdoptInstitution` を導入する。
- UIとエンジンの制度採用判定を共通化する。
- `EffectKey` / `Effects` を導入する。
- `applyEffect` の未知キー検出を追加する。

完了条件:

- 制度採用条件の表示と実判定が一致する。
- 既存の制度・イベント効果が型とテストで検証される。

### Phase 2: ターン結果と成長率の再設計

目的:

ターン結果表示、履歴、GDP成長率の意味を揃える。

作業:

- `TurnSnapshot` / `TurnReport` を追加する。
- `nextTurn()` が直近ターンの結果を返す、または state に保持する。
- `TurnSummary` を `TurnReport` ベースに変更する。
- `gdpGrowth` を `potentialGrowth` / `realizedGrowth` へ段階移行する。
- `history` をターン後スナップショットとして保存する。

完了条件:

- 1ターン目から正しいサマリーが出る。
- 表示されるGDP成長率が実際のGDP変化率と一致する。
- 長期グラフが自然な時系列になる。

### Phase 3: イベントとシミュレーションの堅牢化

目的:

イベントチェーン、ランダムイベント、長期プレイ時の破綻を減らす。

作業:

- `pendingChainEventIds` キューを導入する。
- 連鎖イベントの選択肢コピーを修正する。
- イベント発生条件の schema validation を追加する。
- seed 固定の長期シミュレーションテストを追加する。

完了条件:

- 複数連鎖イベントが自然に処理される。
- 長期プレイで明らかな数値発散を検出できる。

### Phase 4: UIの意思決定支援化

目的:

国家運営ゲームとして、プレイヤーが「何を見て、何を判断すべきか」を読み取りやすくする。

作業:

- `OverviewPanel`、`CommandHeader`、`ContextRail` を導入する。
- タブを `概況 / 財政 / 制度 / 政治 / 外交 / 歴史` に整理する。
- TurnReportを文脈レールまたは年次報告として表示する。
- 制度採用不可理由、外交アクション不可理由、政策変更の予測を表示する。

完了条件:

- ゲーム開始後、最初に国家の重大リスクが見える。
- ターン結果が画面を塞がず、直近の判断材料として残る。
- 各画面が単なる一覧ではなく、次の行動につながる。

### Phase 5: プロダクト品質

目的:

継続開発と公開に耐える品質へ上げる。

作業:

- Vitest + React Testing Library を導入する。
- Playwrightで主要動線のE2Eを追加する。
- アクセシビリティ対応を進める。
- セーブ/ロードを追加する。
- GitHub Pagesなどでデモ公開する。
- DependabotやCodeQLなどのセキュリティ補助を検討する。

完了条件:

- 主要導線が自動テストされる。
- キーボード操作とスクリーンリーダー向けの最低限の対応がある。
- 公開デモがREADMEから辿れる。

---

## 7. 推奨PR分割

### PR 1: READMEとデータ検証

- READMEの件数表現を修正する。
- 制度、イベント、シナリオのid整合性テストを追加する。

### PR 2: 制度解禁条件

- `unlockRules` を追加する。
- 既存制度データへルールを移行する。
- `canAdoptInstitution` をUIとエンジンで共通利用する。

### PR 3: 効果キー型安全化

- `EffectKey` / `Effects` を追加する。
- `applyEffect` に未知キー検出を追加する。
- 既存データの効果キーを検証する。

### PR 4: TurnReport

- `TurnSnapshot` / `TurnReport` を追加する。
- `nextTurn()` と `TurnSummary` を更新する。
- 履歴テストを新仕様へ更新する。

### PR 5: GDP成長率整理

- `potentialGrowth` / `realizedGrowth` へ移行する。
- UI表示とイベント条件を整理する。
- 実現成長率の一致テストを追加する。

### PR 6: イベントチェーンキュー

- `pendingChainEventIds` を導入する。
- 連鎖イベントコピーを修正する。
- 複数連鎖と再連鎖のテストを追加する。

### PR 7: UI概況化

- `OverviewPanel`、`CommandHeader`、`ContextRail` を追加する。
- TurnReportとリスク表示をUIへ接続する。

---

## 8. 当面の非目標

次の要素は魅力的だが、P0/P1の整合性が終わるまでは主目的にしない。

- 複数国家AIの本格実装。
- 戦争システムの全面実装。
- サンドボックスモードの完成。
- 大規模なUIテーマ刷新。
- リアルな地政学モデル。
- セーブデータのクラウド同期。

これらは、ルール整合性、ターン結果、データ検証が固まった後に進める。

---

## 9. 判断基準

実装方針で迷った場合は、次の優先順位で判断する。

1. **プレイヤーに表示されるルールと実判定が一致するか**
2. **ターン結果を説明できるか**
3. **テストで壊れ方を検出できるか**
4. **データ追加時に安全か**
5. **将来のセーブ、リプレイ、長期検証に接続できるか**
6. **UIが次の意思決定を助けるか**

このゲームの魅力は、制度、財政、利益団体、外交、歴史イベントが絡み合うところにある。その複雑さを増やす前に、まず土台となるルールの信頼性を固める。

