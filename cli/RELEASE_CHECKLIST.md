# BlueLamp CLI リリースチェックリスト

## 公開前の確認事項

### 1. コードの確認
- [ ] すべてのテストが通過している
- [ ] 認証URLが本番環境を指している
- [ ] デバッグログが無効になっている
- [ ] 機密情報が含まれていない

### 2. パッケージ情報
- [ ] `pyproject.toml` のバージョンが更新されている
- [ ] パッケージ名: `bluelamp-ai`
- [ ] コマンド名: `bluelamp`, `ブルーランプ`
- [ ] 依存関係が正しく設定されている

### 3. ドキュメント
- [ ] README.mdが最新
- [ ] ライセンス情報が正しい（MIT）
- [ ] 著者情報が正しい

### 4. ビルドテスト
```bash
# クリーンビルド
rm -rf dist/
poetry build

# ビルドされたファイルを確認
ls -la dist/
```

### 5. ローカルインストールテスト
```bash
# 新しい仮想環境でテスト
python -m venv test-release
source test-release/bin/activate
pip install dist/bluelamp_ai-*.whl
bluelamp --version
ブルーランプ --version
deactivate
rm -rf test-release
```

### 6. 公開コマンド
```bash
# TestPyPI（最初のテスト）
poetry publish -r testpypi

# 本番PyPI
poetry publish
```

### 7. 公開後の確認
- [ ] https://pypi.org/project/bluelamp-ai/ でパッケージが表示される
- [ ] `pip install bluelamp-ai` でインストールできる
- [ ] コマンドが正常に動作する

## トラブルシューティング

### 名前の重複エラー
```
HTTP Error 400: The name 'bluelamp-ai' is already taken
```
→ バージョン番号を確認して更新

### 認証エラー
```
HTTP Error 403: Invalid or non-existent authentication information
```
→ APIトークンを再確認

### ビルドエラー
→ `poetry update` で依存関係を更新