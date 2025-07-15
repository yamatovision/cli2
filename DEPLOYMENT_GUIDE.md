# BlueLamp AI デプロイメントガイド

## 🔄 ローカル開発 vs 一般公開版

### ローカル開発用
- **コマンド**: `bluelamp`, `bluelamp2`
- **環境**: Poetry仮想環境（特定パス）
- **用途**: 開発・テスト・デバッグ

### 一般公開用
- **コマンド**: `ブルーランプ`, `ブルーランプ拡張`
- **環境**: ユーザーのPython環境
- **用途**: エンドユーザー向け

## 📦 PyPI公開手順

### 1. 準備
```bash
# APIトークンを設定
poetry config pypi-token.testpypi <your-testpypi-token>
poetry config pypi-token.pypi <your-pypi-token>
```

### 2. テスト公開
```bash
./publish_to_pypi.sh
# TestPyPIを選択してテスト
```

### 3. 本番公開
```bash
./publish_to_pypi.sh
# 本番PyPIを選択して公開
```

## 🧪 テスト方法

### ローカルテスト
```bash
# 仮想環境作成
python3 -m venv test_env
source test_env/bin/activate

# ローカルインストール
pip install dist/bluelamp_ai-1.0.0-py3-none-any.whl

# テスト実行
ブルーランプ --help
ブルーランプ拡張 --help
```

### TestPyPIテスト
```bash
pip install --index-url https://test.pypi.org/simple/ bluelamp-ai
```

### 本番テスト
```bash
pip install bluelamp-ai
```

## 🔧 バージョン管理

### バージョンアップ
```bash
# pyproject.tomlのversionを更新
# 例: version = "1.0.1"

# 再ビルド
poetry build

# 公開
./publish_to_pypi.sh
```

## 📋 チェックリスト

### 公開前確認
- [ ] README_PUBLIC.mdが最新
- [ ] バージョン番号が正しい
- [ ] ローカルテストが通る
- [ ] 日本語コマンドが動作する
- [ ] 依存関係が正しい

### 公開後確認
- [ ] PyPIページが正しく表示される
- [ ] インストールが成功する
- [ ] コマンドが正常に動作する
- [ ] ドキュメントが正しい

## 🚨 トラブルシューティング

### よくある問題
1. **日本語コマンドが認識されない**
   - TOMLファイルでクォートが正しいか確認
   - エントリーポイントが正しく設定されているか確認

2. **依存関係エラー**
   - poetry.lockを更新
   - 依存関係の競合を解決

3. **パッケージサイズが大きい**
   - 不要なファイルを除外
   - .gitignoreを確認