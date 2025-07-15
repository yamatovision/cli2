# PyPIパッケージ削除ガイド

## 方法1: PyPI Web Interface
1. https://pypi.org/manage/project/bluelamp-ai/ にアクセス
2. "Settings" タブを選択
3. "Delete project" セクションで削除実行

## 方法2: twine コマンド
```bash
# パッケージ全体を削除（注意：元に戻せません）
twine delete bluelamp-ai
```

## 方法3: PyPI API
```bash
# APIを使用した削除
curl -X DELETE https://upload.pypi.org/legacy/ \
  -u username:password \
  -d name=bluelamp-ai
```

## 注意事項
- 削除は元に戻せません
- 同じバージョン番号は再利用できません
- 削除後、同じパッケージ名での再公開は可能

## 削除後の手順
1. pyproject.tomlでバージョンを1.0.0に確認
2. poetry build
3. twine upload dist/*