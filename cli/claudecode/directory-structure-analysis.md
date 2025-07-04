# Claude Code 推定ディレクトリ構造

難読化されたコードから推測される元のディレクトリ構造です。

## 主要なディレクトリ構造

```
claude-code/
├── src/                    # メインソースコード
│   ├── cli/               # CLIコマンド関連
│   │   ├── commands/      # 各種コマンド実装
│   │   ├── config/        # 設定管理
│   │   └── utils/         # CLIユーティリティ
│   │
│   ├── core/              # コア機能
│   │   ├── session/       # セッション管理
│   │   ├── auth/          # 認証関連
│   │   └── api/           # API通信
│   │
│   ├── mcp/               # MCP (Model Context Protocol) 関連
│   │   ├── server/        # MCPサーバー管理
│   │   ├── transport/     # トランスポート層（stdio, SSE, HTTP）
│   │   └── config/        # MCP設定
│   │
│   ├── utils/             # 共通ユーティリティ
│   │   ├── error/         # エラーハンドリング
│   │   ├── logger/        # ロギング機能
│   │   └── helpers/       # ヘルパー関数
│   │
│   ├── ui/                # UI関連（React Components）
│   │   ├── components/    # UIコンポーネント
│   │   └── hooks/         # React Hooks
│   │
│   └── services/          # サービス層
│       ├── update/        # 自動更新サービス
│       ├── telemetry/     # テレメトリ（Sentry統合）
│       └── storage/       # データ永続化
│
├── lib/                   # 外部ライブラリ統合
│   ├── sentry/           # Sentry SDK統合
│   ├── aws/              # AWS SDK（Bedrock、SSO）
│   └── highlight/        # シンタックスハイライト
│
├── scripts/              # ビルド・開発スクリプト
├── dist/                 # ビルド出力
│   ├── dist-cjs/        # CommonJS版
│   ├── dist-es/         # ESModules版
│   └── dist-types/      # TypeScript型定義
│
└── node_modules/         # 依存関係

```

## 検出された技術スタック

### 1. **フレームワーク・ライブラリ**
- React（UIコンポーネント用）
- Commander.js（CLIコマンド処理）
- Ink（React for CLI）

### 2. **外部サービス統合**
- Sentry（エラートラッキング）
- AWS SDK
  - Bedrock（AI モデル接続）
  - SSO/SSO-OIDC（認証）
  - STS（一時認証情報）

### 3. **ビルドシステム**
- TypeScript（tsconfig.es.json, tsconfig.types.json）
- ESBuild または類似のバンドラー
- ソースマップサポート

### 4. **主要なモジュール**

#### CLI関連
- コマンドパーサー
- 設定管理（local/user/project スコープ）
- インタラクティブモード処理

#### セッション管理
- 会話の永続化
- セッション再開機能
- 状態管理

#### MCP統合
- サーバー管理
- トランスポート抽象化
- プロトコル実装

#### 監視・ロギング
- Sentryエラー収集
- コンソールロギング
- デバッグモード

## ファイル拡張子
- `.js` / `.mjs` / `.cjs` - JavaScript
- `.ts` - TypeScript（推定）
- `.jsx` / `.tsx` - React コンポーネント

## 特記事項

1. **モノリポ構造**: AWS SDKの参照から、モノリポまたはマルチパッケージ構造の可能性
2. **プラグイン可能**: MCPサーバーの動的追加機能から、プラグインアーキテクチャ採用
3. **クロスプラットフォーム**: Node.js、ブラウザ、React Native対応の記述あり
4. **セキュリティ重視**: 認証トークン、権限管理の実装

この構造は難読化されたコードからの推測であり、実際の構造とは異なる可能性があります。