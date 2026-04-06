# AI Writing Teacher

Web小説投稿初心者向けの、創作講師AI PoCです。  
最初の実装では「書き方の講師」「プロット相談」「短文改善」の3モードに絞り、`System Prompt`、教材参照、学習者プロフィール抽出の土台を先に作っています。

## できること

- 初心者向けに優しい言い回しで創作の悩みに答える
- Vectra ベクタDB による意味検索RAGで教材トピックを参照する
- 会話から学習者プロフィールを抽出し、SQLite にサーバー永続化する
- モード別専門エージェント（LectureAgent / PlotAgent / RevisionAgent）で応答する
- ブラウザ内/サーバーのセッションを切り替え可能（UUID Cookie で識別）
- LLM-as-judge パターンによる5観点自動採点パイプライン
- `OPENAI_API_KEY` がない環境でもモック応答で画面確認できる

## セットアップ

1. Node.js 20 以上を用意する
2. 依存関係をインストールする
3. 必要に応じて `.env.local` を作る

### `.env.local` 例

```bash
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4.1-mini
EMBEDDING_MODEL=text-embedding-3-small
EVAL_JUDGE_MODEL=gpt-4.1
```

## 開発コマンド

```bash
npm install
npm run dev
```

型チェック:

```bash
npm run typecheck
```

本番ビルド:

```bash
npm run build
```

### 初回セットアップ（DB・ベクタインデックス）

```bash
# SQLite データベースの初期化
npm run db:migrate

# コーパスをベクタインデックスに登録（OPENAI_API_KEY 必須）
npm run seed
```

### テスト・評価

```bash
# ユニットテスト
npm test

# 5観点LLM自動採点スイート（OPENAI_API_KEY 必須）
npm run eval
```

## 現在の構成

- `app/`: Next.js App Router UI / API
- `components/`: クライアントUI
- `lib/agent/`: 教師エージェント
  - `base.ts`: Agent インターフェース定義
  - `router.ts`: モード別エージェントルーター
  - `shared.ts`: OpenAI 呼び出し共通ユーティリティ
  - `agents/`: LectureAgent / PlotAgent / RevisionAgent
  - `teacher-agent.ts`: オーケストレーター（外部API窓口）
- `lib/rag/`: 教材コーパスとベクタ検索
  - `vector-store.ts`: Vectra ラッパー
  - `embedding.ts`: OpenAI Embeddings ユーティリティ
  - `search.ts`: async 検索（ベクタ/キーワードフォールバック）
- `lib/db/`: SQLite + Drizzle ORM
  - `schema.ts`: users / sessions / learner_profiles テーブル
  - `client.ts`: DB シングルトン接続
  - `session-repository.ts`: セッション CRUD
- `lib/memory/`: 学習者プロフィール
  - `profile.ts`: キーワードベース抽出
  - `store.ts`: DB 永続化・マージロジック
- `lib/auth/`: UUID Cookie ユーザー識別
- `lib/eval/`: 評価パイプライン
  - `dataset.ts`: 10件の構造化テストケース
  - `scorer-prompt.ts`: LLM ジャッジ用プロンプト
  - `scorer.ts`: 5観点自動採点
  - `runner.ts`: スイートランナー
  - `__tests__/`: Vitest ユニットテスト
- `scripts/`: seed-corpus / db-migrate / run-eval
- `docs/`: 企画・安全性・評価の文書

## 次の実装候補

- ベクタDB導入によるRAG強化 ✅ 実装済（Vectra）
- ユーザー単位メモリのサーバー永続化 ✅ 実装済（SQLite + Drizzle）
- マルチエージェント分割 ✅ 実装済（Agent インターフェース + Router）
- 評価データセットと自動採点 ✅ 実装済（LLM-as-judge + Vitest）
- ストリーミング応答対応
- 難易度別コーパス分岐
- CI での eval パイプライン自動実行
