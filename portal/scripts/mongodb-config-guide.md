# MongoDB設定ガイド

## 環境変数一覧

MongoDB接続の設定に使用する環境変数は以下の通りです。これらの設定を調整することでパフォーマンスと安定性を最適化できます。

| 環境変数 | 説明 | デフォルト値 | 推奨値 |
|----------|------|-------------|--------|
| `MONGODB_URI` | MongoDB接続文字列 | mongodb+srv://... | 環境に応じたURI |
| `DB_SERVER_TIMEOUT_MS` | サーバー選択タイムアウト(ms) | 30000 | 10000〜60000 |
| `DB_SOCKET_TIMEOUT_MS` | ソケットタイムアウト(ms) | 45000 | 30000〜90000 |
| `DB_CONNECT_TIMEOUT_MS` | 接続タイムアウト(ms) | 30000 | 10000〜60000 |
| `DB_MAX_POOL_SIZE` | 最大接続プール数 | 10 | 5〜20 |
| `DB_RETRY_WRITES` | 書き込み再試行設定 | true | 通常はtrue |
| `SKIP_DB_CONNECTION` | DB接続をスキップ | なし | 開発環境でのみ'true' |

## タイムアウト設定について

* **サーバー選択タイムアウト**: MongoDBサーバーを選択する際のタイムアウト時間。通常は30秒が適切。
* **ソケットタイムアウト**: クエリや操作の実行待機時間。長時間実行される可能性のある操作がある場合は増やす。
* **接続タイムアウト**: 初期接続の確立にかかる最大時間。ネットワーク状況が良くない場合は増やす。

## パフォーマンス最適化

* **最大接続プール数**: 同時に維持する接続の最大数。システムリソースと同時処理数を考慮して設定。
* **書き込み再試行**: ネットワーク障害時に自動的に書き込みを再試行するかどうか。通常はtrueを推奨。

## 設定例（開発環境）

```
MONGODB_URI=mongodb://localhost:27017/appgenius
DB_SERVER_TIMEOUT_MS=15000
DB_SOCKET_TIMEOUT_MS=30000
DB_CONNECT_TIMEOUT_MS=15000
DB_MAX_POOL_SIZE=5
```

## 設定例（本番環境）

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
DB_SERVER_TIMEOUT_MS=30000
DB_SOCKET_TIMEOUT_MS=45000
DB_CONNECT_TIMEOUT_MS=30000
DB_MAX_POOL_SIZE=10
```

## トラブルシューティング

1. **接続タイムアウトが頻発する場合**: 
   - `DB_SERVER_TIMEOUT_MS`と`DB_CONNECT_TIMEOUT_MS`の値を増やす
   - ネットワーク接続を確認

2. **クエリタイムアウトが発生する場合**:
   - `DB_SOCKET_TIMEOUT_MS`の値を増やす
   - インデックスの最適化を検討

3. **パフォーマンスが低下する場合**:
   - `DB_MAX_POOL_SIZE`を調整（増やすと同時処理性能が向上するが、リソース消費も増加）
   - インデックスが適切に設定されているか確認