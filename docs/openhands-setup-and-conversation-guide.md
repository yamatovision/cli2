# OpenHands セットアップと効果的な会話ガイド

## OpenHandsのセットアップ手順

### 1. システム要件
- Python 3.12以上
- 8GB以上のRAM推奨
- Docker（オプション）

### 2. インストール方法

#### 方法A: pip インストール（推奨）
```bash
# 仮想環境の作成（推奨）
python -m venv openhands-env
source openhands-env/bin/activate  # Mac/Linux
# または
openhands-env\Scripts\activate  # Windows

# OpenHandsのインストール
pip install openhands

# 環境変数の設定
export ANTHROPIC_API_KEY="your-api-key-here"
# または .env ファイルに記載
```

#### 方法B: Docker 版
```bash
# Dockerイメージをプル
docker pull ghcr.io/all-hands-ai/openhands:latest

# コンテナを起動
docker run -it --rm \
  -v $(pwd):/workspace \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -p 3000:3000 \
  ghcr.io/all-hands-ai/openhands:latest
```

### 3. 初回起動と設定

```bash
# CLIモードで起動
openhands

# 初回起動時の設定プロンプトに従う
# - LLMプロバイダーの選択
# - APIキーの確認
# - ワークスペースの設定
```

### 4. プロジェクトの初期化

```bash
# プロジェクトディレクトリに移動
cd /path/to/your/project

# OpenHands用の初期化
openhands /init

# これにより .openhands/microagents/repo.md が作成される
```

## 200kトークンを超えた場合の対処法

### 問題の詳細
- Claude APIのコンテキストウィンドウは200kトークン
- 長時間の会話や大量のコード生成で限界に達する
- 超過すると**新しいセッション**として再開（文脈が失われる）

### 解決策

#### 1. **セッション分割戦略**
```bash
# タスクを小さく分割して実行
# 悪い例：
"アプリケーション全体を作成してください"

# 良い例：
"まず認証機能のバックエンドAPIを作成してください"
# 完了後、新しいセッションで：
"次にフロントエンドの認証UIを作成してください"
```

#### 2. **コンテキスト管理コマンド**
```bash
# 現在のコンテキスト使用量を確認
/status

# 重要な情報を保存してからリセット
/save checkpoint-auth-complete
/new  # 新しいセッションを開始

# 前回の続きから
/resume checkpoint-auth-complete
```

#### 3. **プロジェクトファイルの活用**
```markdown
# .openhands/context-summary.md を作成
## 完了したタスク
- ✅ 認証API実装完了
- ✅ データベース設計完了

## 現在の状態
- 実装中: ユーザー管理UI
- 次のタスク: 権限管理システム

## 重要な決定事項
- JWT認証を使用
- PostgreSQLを採用
```

## OpenHandsとの効果的な会話例

### 1. 初回の挨拶とプロジェクト理解

```
You: こんにちは。私はBlueLamp CLIという開発支援ツールを、OpenHandsのような自律的マルチエージェントシステムにアップグレードしたいと考えています。

まず、私のプロジェクトについて理解していただくため、以下のドキュメントを読んでください：

1. プロジェクト概要: /docs/openhands-briefing-document.md
2. 現在の仕様: /docs/bluelamp-cli-requirements-v2.md
3. 目標アーキテクチャ: /docs/bluelamp-autonomous-multi-agent-proposal.md
4. 技術的な設計: /docs/orchestrator-ai-architecture.md

これらを読んだ後、以下について教えてください：
- このプロジェクトの実現可能性
- OpenHandsの経験から学べること
- 推奨される実装アプローチ
```

### 2. 技術的な深掘り

```
You: OpenHandsの内部実装について詳しく教えてください。特に：

1. dispatch_agentの仕組み
   - どのようにサブエージェントを生成しているか
   - エージェント間の通信方法
   - 並列実行の実装

2. コンテキスト管理
   - 200kトークンの制約をどう回避しているか
   - エージェント間での情報共有方法
   - セッション管理の実装

3. UI/UXの実装
   - リアルタイムの進捗表示方法
   - ターミナルUIの実装技術
   - ユーザーインタラクション

具体的なコード例があれば見せてください。
```

### 3. 実装計画の相談

```
You: BlueLamp CLIの実装計画について相談させてください。

私の提案する「軽量オーケストレーター + 専門エージェント」アーキテクチャについて：

/docs/orchestrator-ai-architecture.md を確認した上で、以下の点についてアドバイスをください：

1. アーキテクチャの妥当性
   - ルールベースオーケストレーターは適切か
   - エージェント独立実行の利点と欠点
   - 改善すべき点

2. 実装の優先順位
   - どの機能から実装すべきか
   - MVP（最小実行可能製品）の定義
   - 段階的な機能追加計画

3. 技術選定
   - TypeScriptでの実装における注意点
   - 必要なライブラリ/フレームワーク
   - テスト戦略
```

### 4. 実装開始

```
You: それでは実装を始めましょう。以下の順序で進めたいと思います：

Phase 1: 基本的なオーケストレーター
1. src/orchestrator/index.ts - メインオーケストレータークラス
2. src/orchestrator/rule-engine.ts - ルールベース判断エンジン
3. src/orchestrator/session-manager.ts - セッション管理
4. src/orchestrator/types.ts - 型定義

以下の要件で実装してください：
- 既存のBlueLamp CLI（単一ファイル）と統合可能
- 16エージェントの管理機能
- 並列実行サポート
- 進捗の可視化

まずは orchestrator/index.ts から作成してください。
```

### 5. コンテキスト枯渇時の対処

```
You: 長時間の開発でコンテキストが一杯になってきました。
現在の進捗を要約して、次のセッションに引き継げるようにしてください。

## 要約に含めてほしい内容：
1. 完了したファイル一覧
2. 実装した主要機能
3. 未完了のタスク
4. 重要な設計決定
5. 次のステップ

この要約を .openhands/progress-summary.md として保存してください。
```

### 6. トラブルシューティング

```
You: 実装中に以下の問題が発生しました：

## 問題1: エージェントの並列実行でレート制限エラー
- 10個のエージェントを同時実行
- Claude APIのレート制限（5リクエスト/分）に到達
- エラー: "Rate limit exceeded"

## 問題2: メモリ使用量の増大
- 長時間実行でメモリが500MB以上
- エージェントセッションが解放されない
- ガベージコレクションが効かない

これらの問題を解決する方法を教えてください。
できれば、OpenHandsではどのように対処しているかも知りたいです。
```

### 7. 最適化とベストプラクティス

```
You: 基本実装は完了しました。次は最適化フェーズです。

現在のパフォーマンス：
- エージェント起動: 平均3-5秒
- メモリ使用: 300-500MB
- 並列実行: 最大5エージェント

目標：
- エージェント起動: 1秒以内
- メモリ使用: 200MB以下
- 並列実行: 10エージェント以上

OpenHandsの最適化テクニックを参考に、以下を実装してください：
1. エージェントプーリング
2. 遅延読み込み
3. キャッシュ戦略
4. 非同期処理の最適化
```

## ファイル共有のベストプラクティス

### 1. プロジェクト構造を明確に
```
You: 現在のプロジェクト構造は以下の通りです：

bluelamp-cli/
├── src/
│   ├── index.ts (267行の既存実装)
│   ├── orchestrator/ (新規追加予定)
│   └── agents/ (16エージェント実装予定)
├── docs/
│   ├── openhands-briefing-document.md
│   ├── bluelamp-cli-requirements-v2.md
│   └── orchestrator-ai-architecture.md
└── package.json
```

### 2. 重要なファイルは明示的に共有
```
You: 以下の重要なファイルを確認してください：

1. 要件定義: cat docs/bluelamp-cli-requirements-v2.md
2. 提案書: cat docs/bluelamp-autonomous-multi-agent-proposal.md
3. 現在の実装: cat src/index.ts

これらを踏まえて実装を進めてください。
```

### 3. 進捗の定期的な保存
```
You: 現在までの実装を確認して、進捗レポートを作成してください：

1. 実装完了: ls -la src/orchestrator/
2. テスト状況: npm test
3. 次のタスク: cat TODO.md

この情報を .openhands/checkpoint-{date}.md として保存してください。
```

## まとめ

OpenHandsを効果的に使用するポイント：

1. **明確な指示**: 曖昧な要求より具体的なタスク
2. **段階的な実装**: 大きなタスクを小さく分割
3. **コンテキスト管理**: 定期的な要約と保存
4. **ファイル活用**: コードで会話より、ファイルで情報共有
5. **継続性の確保**: チェックポイントとレジューム機能の活用

これらの方法により、200kトークンの制約下でも効率的に開発を進められます。
