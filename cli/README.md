<a name="readme-top"></a>

<div align="center">
  <h1 align="center">🔵 BlueLamp CLI</h1>
  <p align="center">日本人向けAI開発アシスタント - 16専門エージェントシステム</p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-blue?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.12+">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" alt="Active Development">
  <br/>
  <img src="https://img.shields.io/badge/Powered%20by-OpenHands-orange?style=for-the-badge" alt="Powered by OpenHands">
  <img src="https://img.shields.io/badge/Agents-16%20Specialists-purple?style=for-the-badge" alt="16 Specialist Agents">
</div>

---

## 🌟 概要

BlueLamp CLIは、OpenHandsをベースにした日本人開発者向けのAI開発アシスタントです。16の専門エージェントが連携し、プロジェクトの企画から実装、デプロイまでの全工程を支援します。

### ✨ 主な特徴

- **16専門エージェントシステム**: 各開発フェーズに特化した専門エージェント
- **日本語完全対応**: 日本人開発者に最適化されたインターフェース
- **統合開発環境**: コード生成、テスト、デバッグ、デプロイを一元管理
- **最小構成設計**: 大規模コードクリーンアップにより実現した軽量アーキテクチャ

## 🤖 16専門エージェントシステム

BlueLamp CLIは以下の16の専門エージェントで構成されています：

### 📋 企画・設計フェーズ
- **00-orchestrator**: プロジェクト全体の統括・調整
- **01-requirements-engineer**: 要件定義・分析
- **02-uiux-designer**: UI/UXデザイン設計
- **03-data-modeling-engineer**: データモデル設計
- **04-system-architect**: システムアーキテクチャ設計

### 🛠️ 開発フェーズ
- **05-implementation-consultant**: 実装方針・技術選定
- **06-environment-setup**: 開発環境構築
- **07-prototype-implementation**: プロトタイプ開発
- **08-backend-implementation**: バックエンド実装
- **09-test-quality-verification**: テスト・品質保証

### 🚀 統合・運用フェーズ
- **10-api-integration**: API統合・連携
- **11-debug-detective**: デバッグ・問題解決
- **12-deploy-specialist**: デプロイ・運用
- **13-github-manager**: Git・GitHub管理
- **14-typescript-manager**: TypeScript専門管理

### 🔄 保守・拡張フェーズ
- **15-feature-expansion**: 機能拡張・新機能開発
- **16-refactoring-expert**: リファクタリング・最適化

## 🚀 クイックスタート

### 前提条件
- Python 3.12+
- Poetry
- Docker (オプション)

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/your-username/bluelamp-cli.git
cd bluelamp-cli

# 依存関係をインストール
poetry install

# BlueLamp CLIを実行
./bluelamp --help
```

### 基本的な使用方法

```bash
# 対話モードで開始
./bluelamp

# 特定のエージェントを指定
./bluelamp --agent requirements-engineer

# ヘルプを表示
./bluelamp --help
```

## 🔧 設定

### LLMプロバイダーの設定

BlueLamp CLIは複数のLLMプロバイダーに対応しています：

- **Anthropic Claude** (推奨): `anthropic/claude-sonnet-4-20250514`
- **OpenAI GPT**: `openai/gpt-4o`
- **Google Gemini**: `google/gemini-pro`

### 環境変数の設定

```bash
# .envファイルを作成
cp .env.example .env

# APIキーを設定
export ANTHROPIC_API_KEY="your-api-key-here"
export OPENAI_API_KEY="your-api-key-here"
```

## 📚 ドキュメント

詳細なドキュメントは`docs/`ディレクトリに含まれています：

- [セットアップガイド](./docs/setup.md)
- [エージェント使用方法](./docs/agents.md)
- [トラブルシューティング](./docs/troubleshooting.md)
- [開発者ガイド](./docs/development.md)

## 🤝 コントリビューション

BlueLamp CLIへの貢献を歓迎します！

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📈 開発状況

- ✅ 大規模コードクリーンアップ完了
- ✅ 最小構成アーキテクチャ実現
- ✅ 16専門エージェントシステム統合
- 🔄 継続的な機能改善・最適化

## 📜 ライセンス

このプロジェクトはMITライセンスの下で配布されています。詳細は[`LICENSE`](./LICENSE)ファイルをご覧ください。

## 🙏 謝辞

BlueLamp CLIは[OpenHands](https://github.com/All-Hands-AI/OpenHands)プロジェクトをベースに開発されています。OpenHandsチームと貢献者の皆様に深く感謝いたします。

### 使用技術・ライブラリ

- **OpenHands**: AI開発エージェントプラットフォーム
- **Python**: メイン開発言語
- **Poetry**: 依存関係管理
- **Docker**: コンテナ化技術

## 🔗 関連リンク

- [OpenHands公式サイト](https://docs.all-hands.dev/)
- [OpenHands GitHub](https://github.com/All-Hands-AI/OpenHands)
- [OpenHands論文](https://arxiv.org/abs/2407.16741)

---

<div align="center">
  <p>Made with ❤️ for Japanese developers</p>
  <p>Powered by <a href="https://github.com/All-Hands-AI/OpenHands">OpenHands</a></p>
</div>
