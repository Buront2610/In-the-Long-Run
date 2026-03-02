# In the Long Run

> **「なぜ国家は繁栄し、なぜ衰退するのか」を、プレイヤー自身の意思決定を通じて体感するゲーム**

タイトル「In the Long Run」は、ケインズの名言「In the long run we are all dead（長期的にはわれわれは皆死んでいる）」に由来する。公共選択論とマクロ経済学を中核メカニクスに据え、プレイヤーは国家の政治・経済・外交を導く。

## 📖 設計書

ゲームの詳細な設計仕様（コンセプト・制度変遷・経済モデル・政治制度・外交/軍事システムなど）は以下を参照：

**[docs/DESIGN.md](docs/DESIGN.md)**

## 🎮 主な機能

- **経済シミュレーション**: GDP・インフレ率・失業率・財政・貿易収支・ジニ係数の動的変化
- **政治システム**: 11種類の政体（部族社会〜議会制民主主義）、正統性・腐敗・安定度
- **制度管理**: 12の制度（政治/経済/社会/軍事）を条件に応じて採用
- **利益団体**: 7つの利益集団がプレイヤーの政策に動的に反応
- **ランダムイベント**: 15種の危機・好機に対して選択肢で対応
- **経済学者の名言**: ケインズ、フリードマン、ピケティ等の状況に応じたTips
- **世界地図**: 国際情勢の俯瞰と外交・貿易の可視化
- **4つのシナリオ**: 現代民主国家、新興国の挑戦、古代帝国の興亡、体制移行の苦悩

## 🛠️ 技術スタック

- **フレームワーク**: React 19 + TypeScript
- **ビルドツール**: Vite
- **フォント**: Noto Sans JP（セルフホスト）
- **外部ライブラリ不使用**: 全UI/チャートをピュアReact + インラインスタイル + SVGで実装

## 🚀 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# リント
npm run lint
```

## 📁 プロジェクト構成

```
src/
├── game/                  # ゲームエンジン
│   ├── types.ts           # 型定義
│   ├── constants.ts       # 初期値・定数
│   ├── GameEngine.ts      # メインエンジン
│   ├── events.ts          # ランダムイベント
│   └── tips.ts            # 経済学者の名言
├── components/            # UIコンポーネント
│   ├── StartScreen.tsx    # スタート画面
│   ├── WorldMap.tsx       # 世界地図
│   ├── EconomyPanel.tsx   # 経済指標
│   ├── PolicyPanel.tsx    # 政策設定
│   ├── InstitutionPanel.tsx # 制度管理
│   ├── InterestGroupPanel.tsx # 利益団体
│   ├── HistoryChart.tsx   # 歴史グラフ
│   ├── NewsTicker.tsx     # ニュース
│   ├── TipPopup.tsx       # Tips表示
│   ├── EventDialog.tsx    # イベントダイアログ
│   └── GameOverScreen.tsx # ゲームオーバー
├── App.tsx                # メインアプリ
└── main.tsx               # エントリーポイント
docs/
└── DESIGN.md              # ゲーム設計書（詳細仕様）
```
