# BlueLamp CLI パッケージ公開ガイド

## 概要
BlueLamp CLIをPyPIに公開するための手順書です。

## 前提条件
- PyPIアカウント（https://pypi.org/）
- Poetry 2.1.2以上がインストールされていること
- GitHubリポジトリへのアクセス権限

## 手動公開手順

### 1. バージョン更新
```bash
# pyproject.tomlのバージョンを更新
poetry version patch  # 0.45.0 → 0.45.1
# または
poetry version minor  # 0.45.0 → 0.46.0
# または
poetry version major  # 0.45.0 → 1.0.0
```

### 2. 変更をコミット
```bash
git add pyproject.toml
git commit -m "chore: bump version to $(poetry version -s)"
git push origin main
```

### 3. ビルド
```bash
poetry build
```

### 4. TestPyPIでテスト（推奨）
```bash
# TestPyPIのトークンを設定
poetry config repositories.testpypi https://test.pypi.org/legacy/
poetry config pypi-token.testpypi <your-test-pypi-token>

# TestPyPIに公開
poetry publish -r testpypi

# テストインストール
pip install -i https://test.pypi.org/simple/ bluelamp-ai
```

### 5. 本番PyPIに公開
```bash
# PyPIトークンを設定
poetry config pypi-token.pypi <your-pypi-token>

# 公開
poetry publish
```

## GitHub Actions経由の自動公開

### 1. PyPI APIトークンの取得
1. https://pypi.org/manage/account/token/ にアクセス
2. 新しいAPIトークンを作成
3. スコープは「Entire account」または特定のプロジェクトに設定

### 2. GitHubシークレットの設定
1. GitHubリポジトリの Settings → Secrets and variables → Actions
2. 「New repository secret」をクリック
3. Name: `PYPI_API_TOKEN`
4. Value: PyPIで作成したトークン

### 3. リリースの作成
```bash
# タグを作成
git tag v0.45.0
git push origin v0.45.0

# GitHubでリリースを作成
# または、GitHub CLIを使用
gh release create v0.45.0 --title "v0.45.0" --notes "Release notes here"
```

## ユーザーへのインストール方法

### pipでのインストール
```bash
# 通常のインストール
pip install bluelamp-ai

# 開発版のインストール
pip install bluelamp-ai --pre

# アップグレード
pip install --upgrade bluelamp-ai
```

### pipxでのインストール（推奨）
```bash
# pipxのインストール（未インストールの場合）
python -m pip install --user pipx
python -m pipx ensurepath

# BlueLamp CLIのインストール
pipx install bluelamp-ai

# アップグレード
pipx upgrade bluelamp-ai
```

### ソースからのインストール
```bash
git clone https://github.com/BlueLamp-AI/BlueLamp.git
cd BlueLamp
poetry install
```

## 公開後の確認

### 1. PyPIページの確認
https://pypi.org/project/bluelamp-ai/

### 2. インストールテスト
```bash
# 新しい仮想環境でテスト
python -m venv test-env
source test-env/bin/activate  # Windows: test-env\Scripts\activate
pip install bluelamp-ai
openhands --version
```

### 3. 機能テスト
```bash
# 基本的な動作確認
openhands --help
openhands /path/to/project
```

## トラブルシューティング

### 認証エラー
```
HTTP Error 403: Invalid or non-existent authentication information
```
→ APIトークンが正しく設定されているか確認

### パッケージ名の重複
```
HTTP Error 400: The name 'bluelamp-ai' is already taken
```
→ バージョン番号が既存のものと重複していないか確認

### 依存関係エラー
→ poetry.lockファイルを更新：`poetry update`

## セキュリティ注意事項
- APIトークンは絶対に公開リポジトリにコミットしない
- `.env`ファイルや設定ファイルにトークンを保存する場合は`.gitignore`に追加
- GitHub Secretsを使用して安全に管理

## バージョニング規則
- パッチリリース（0.45.0 → 0.45.1）: バグ修正
- マイナーリリース（0.45.0 → 0.46.0）: 後方互換性のある新機能
- メジャーリリース（0.45.0 → 1.0.0）: 破壊的変更を含む