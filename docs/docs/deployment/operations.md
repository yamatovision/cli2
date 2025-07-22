# BlueLamp 運用手順書

**バージョン**: 1.0  
**最終更新日**: 2025-07-02  
**対象**: BlueLamp v1.0.0本番環境

## 📋 概要

BlueLampプロジェクトの本番環境運用に関する包括的な手順書です。PyPI配布、Portal API、モニタリングシステムの運用方法を記載しています。

## 🏗️ システム構成

### アーキテクチャ概要
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PyPI Package  │    │   Portal API     │    │  Monitoring     │
│   bluelamp-ai   │◄──►│  Cloud Run       │◄──►│  Health Check   │
│   v1.0.0        │    │  Asia-Northeast1 │    │  Scripts        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 主要コンポーネント

1. **PyPI Package**: `bluelamp-ai` v1.0.0
   - 配布URL: https://pypi.org/project/bluelamp-ai/
   - インストール: `pip install bluelamp-ai`

2. **Portal API**: Cloud Run本番環境
   - URL: https://bluelamp-235426778039.asia-northeast1.run.app
   - リージョン: asia-northeast1 (東京)
   - 認証: JWT + CLI Token

3. **モニタリング**: ヘルスチェックシステム
   - スクリプト: `monitoring/health_check.py`
   - レポート: JSON形式で自動生成

## 🚀 デプロイ手順

### 1. PyPIパッケージの更新

#### 1.1 バージョン更新
```bash
cd /path/to/BlueLamp/cli

# pyproject.tomlのバージョンを更新
vim pyproject.toml
# version = "1.0.1" # 例

# RELEASE_NOTES.mdを更新
vim RELEASE_NOTES.md
```

#### 1.2 ビルドと公開
```bash
# パッケージビルド
poetry build

# PyPIに公開
poetry publish
```

#### 1.3 公開確認
```bash
# 数分後にPyPIで確認
curl -s https://pypi.org/pypi/bluelamp-ai/json | jq '.info.version'

# インストールテスト
pip install --upgrade bluelamp-ai
bluelamp --version
```

### 2. Portal APIの更新

#### 2.1 コード変更のデプロイ
```bash
cd /path/to/BlueLamp/portal

# ソースコードから直接デプロイ（コード変更がある場合）
./deploy-source.sh

# または既存イメージの再デプロイ（設定変更のみ）
./deploy.sh
```

#### 2.2 デプロイ確認
```bash
# サービス状態確認
gcloud run services describe bluelamp \
  --platform managed \
  --region asia-northeast1

# ヘルスチェック
curl https://bluelamp-235426778039.asia-northeast1.run.app/health
```

### 3. 環境変数の管理

#### 3.1 Portal API環境変数
```bash
# 現在の環境変数確認
gcloud run services describe bluelamp \
  --platform managed \
  --region asia-northeast1 \
  --format="yaml(spec.template.spec.containers[0].env)"

# 環境変数更新
gcloud run services update bluelamp \
  --platform managed \
  --region asia-northeast1 \
  --set-env-vars="NEW_VAR=value"
```

#### 3.2 重要な環境変数一覧
| 変数名 | 説明 | 例 |
|--------|------|-----|
| NODE_ENV | 環境設定 | production |
| PORT | サーバーポート | 5000 |
| API_HOST | ホスト名 | bluelamp-235426778039.asia-northeast1.run.app |
| MONGODB_URI | MongoDB接続文字列 | mongodb+srv://... |
| JWT_SECRET | JWT署名用シークレット | bluelamp_jwt_secret_key |
| CORS_ORIGIN | CORS許可オリジン | https://geniemon.vercel.app |

## 📊 モニタリング

### 1. ヘルスチェックの実行

#### 1.1 手動実行
```bash
cd /path/to/BlueLamp/cli
python3 monitoring/health_check.py
```

#### 1.2 自動実行（cron設定例）
```bash
# crontabに追加
# 毎時0分にヘルスチェック実行
0 * * * * cd /path/to/BlueLamp/cli && python3 monitoring/health_check.py >> /var/log/bluelamp-health.log 2>&1
```

### 2. 監視項目

#### 2.1 PyPI可用性
- **チェック内容**: PyPI APIからパッケージ情報取得
- **正常条件**: HTTP 200レスポンス、最新バージョン情報取得
- **異常時対応**: PyPI側の問題の可能性、時間をおいて再確認

#### 2.2 Portal API稼働状況
- **チェック内容**: `/health`エンドポイントへのリクエスト
- **正常条件**: HTTP 200レスポンス
- **異常時対応**: Cloud Runサービス再起動、ログ確認

#### 2.3 CLI インストール可能性
- **チェック内容**: `pip install bluelamp-ai`の実行
- **正常条件**: インストール成功、`bluelamp --version`実行可能
- **異常時対応**: PyPI反映待ち、依存関係問題の調査

### 3. ログ管理

#### 3.1 Portal APIログ
```bash
# リアルタイムログ確認
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=bluelamp" \
  --location=asia-northeast1

# 過去のログ検索
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bluelamp" \
  --limit=50 \
  --format="table(timestamp,severity,textPayload)"
```

#### 3.2 ログレベル
- **INFO**: 正常な動作ログ
- **WARN**: 警告（処理は継続）
- **ERROR**: エラー（処理失敗）
- **DEBUG**: デバッグ情報（開発時のみ）

## 🔧 トラブルシューティング

### 1. PyPI関連の問題

#### 1.1 パッケージが見つからない
**症状**: `pip install bluelamp-ai`で「No matching distribution found」
**原因**: PyPIへの反映遅延、パッケージ名間違い
**対処法**:
```bash
# PyPI反映確認
curl -s https://pypi.org/pypi/bluelamp-ai/json

# キャッシュクリア
pip cache purge
pip install --no-cache-dir bluelamp-ai
```

#### 1.2 依存関係エラー
**症状**: インストール時に依存関係の競合
**原因**: Python環境の問題、依存パッケージのバージョン競合
**対処法**:
```bash
# 仮想環境での確認
python3 -m venv test_env
source test_env/bin/activate
pip install bluelamp-ai

# 依存関係の詳細確認
pip show bluelamp-ai
pip check
```

### 2. Portal API関連の問題

#### 2.1 API応答なし
**症状**: Portal APIにアクセスできない
**原因**: Cloud Runサービス停止、ネットワーク問題
**対処法**:
```bash
# サービス状態確認
gcloud run services list --platform managed --region asia-northeast1

# サービス再起動
gcloud run services update bluelamp \
  --platform managed \
  --region asia-northeast1 \
  --traffic 100
```

#### 2.2 認証エラー
**症状**: CLI認証が失敗する
**原因**: JWT設定問題、データベース接続問題
**対処法**:
```bash
# 環境変数確認
gcloud run services describe bluelamp \
  --platform managed \
  --region asia-northeast1 \
  --format="yaml(spec.template.spec.containers[0].env)"

# データベース接続確認
# MongoDB Atlasの接続状況を確認
```

### 3. CLI関連の問題

#### 3.1 コマンドが見つからない
**症状**: `bluelamp: command not found`
**原因**: PATHの問題、インストール場所の問題
**対処法**:
```bash
# インストール場所確認
pip show -f bluelamp-ai

# PATHに追加
export PATH="$HOME/.local/bin:$PATH"

# または絶対パスで実行
python3 -m openhands.cli.main --help
```

#### 3.2 依存関係エラー
**症状**: 実行時にモジュールが見つからない
**原因**: 不完全なインストール、環境の問題
**対処法**:
```bash
# 再インストール
pip uninstall bluelamp-ai
pip install bluelamp-ai

# 依存関係の確認
pip check
```

## 🔄 定期メンテナンス

### 1. 週次メンテナンス

#### 1.1 システム状態確認
- [ ] PyPI可用性確認
- [ ] Portal API稼働確認
- [ ] CLI動作確認
- [ ] ログ確認（エラー、警告の有無）

#### 1.2 パフォーマンス確認
```bash
# Portal APIレスポンス時間測定
curl -w "@curl-format.txt" -o /dev/null -s https://bluelamp-235426778039.asia-northeast1.run.app/health

# Cloud Runメトリクス確認
gcloud monitoring metrics list --filter="resource.type=cloud_run_revision"
```

### 2. 月次メンテナンス

#### 2.1 セキュリティ更新
- [ ] 依存パッケージの脆弱性確認
- [ ] JWT秘密鍵のローテーション検討
- [ ] アクセスログの監査

#### 2.2 容量・コスト確認
- [ ] Cloud Runの使用量確認
- [ ] MongoDB Atlasの容量確認
- [ ] PyPIダウンロード数確認

## 📞 緊急時対応

### 1. 緊急連絡先
- **開発チーム**: [連絡先情報]
- **インフラ担当**: [連絡先情報]
- **プロジェクトマネージャー**: [連絡先情報]

### 2. エスカレーション手順
1. **レベル1**: 自動復旧試行（再起動等）
2. **レベル2**: 開発チームへの連絡
3. **レベル3**: 緊急対応チーム招集
4. **レベル4**: 外部ベンダー連絡

### 3. 緊急時コマンド集
```bash
# Portal API緊急再起動
gcloud run services update bluelamp \
  --platform managed \
  --region asia-northeast1 \
  --traffic 100

# 緊急時のサービス停止
gcloud run services update bluelamp \
  --platform managed \
  --region asia-northeast1 \
  --traffic 0

# ログの緊急確認
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bluelamp AND severity>=ERROR" \
  --limit=100 \
  --format="table(timestamp,severity,textPayload)"
```

## 📚 関連ドキュメント

- [デプロイ情報](./deploy.md)
- [セキュリティ実装計画](../security-implementation-plan.md)
- [API仕様書](../api/)
- [進捗管理](../SCOPE_PROGRESS.md)

## 📝 変更履歴

| 日付 | バージョン | 変更内容 | 担当者 |
|------|------------|----------|--------|
| 2025-07-02 | 1.0 | 初版作成、PyPI配布対応 | デプロイスペシャリスト |

---

**注意**: この文書は機密情報を含みます。適切な権限を持つ担当者のみがアクセスしてください。