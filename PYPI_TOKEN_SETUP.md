# PyPIトークン設定ガイド

## 1. PyPIトークンの取得
1. https://pypi.org/manage/account/ にアクセス
2. "API tokens" セクションに移動
3. "Add API token" をクリック
4. Token name: "bluelamp-ai-publish"
5. Scope: "Entire account" または "Project: bluelamp-ai"
6. "Add token" をクリック
7. 表示されたトークンをコピー（pypi-xxx...形式）

## 2. Poetryにトークンを設定
```bash
cd cli2
poetry config pypi-token.pypi <your-token-here>
```

## 3. 公開実行
```bash
./publish_to_pypi.sh
```

## 4. 確認
```bash
pip install bluelamp-ai==1.0.10
ブルーランプ --help
```

## 注意事項
- トークンは一度しか表示されません
- 安全な場所に保存してください
- 必要に応じて.envファイルに追加可能