# BlueLamp セキュリティ実装計画書

## 概要
本ドキュメントは、BlueLamp CLIとPortalの連携によるセキュアな認証システムの実装計画です。
CLI側とPortal側の両チームが理解し、整合性を保ちながら開発を進めるための指針となります。

## 現状の課題

### CLI側の現状
- **認証方法**: LLMプロバイダー（Anthropic等）のAPIキーを直接入力
- **問題点**: Portalとの連携がなく、独立した認証システム
- **保存場所**: `~/.openhands/settings.json`にAPIキーを保存

### Portal側の現状
- **APIキー管理**: 管理者が手動でAnthropicキーを追加
- **問題点**: ユーザーが自分でAPIキーを生成できない
- **認証**: メール/パスワードによるログインは実装済み

## 目標とする新システム

### 全体アーキテクチャ
```
┌─────────────────┐                    ┌──────────────────┐
│   CLI (/cli)    │ ◄─── HTTPS ────► │ Portal (/portal) │
│                 │                    │                  │
│ - メール/パス   │                    │ - 認証処理       │
│   ログイン      │                    │ - トークン発行   │
│ - トークン隠蔽  │                    │ - プロンプト配信 │
└─────────────────┘                    └──────────────────┘
```

### 新しい認証フロー
1. **ユーザーがCLIでログイン**
   ```
   $ bluelamp login
   Email: user@example.com
   Password: ********
   ```

2. **CLIがPortalに認証リクエスト**
   - メール/パスワードをPortalに送信
   - HTTPS通信で安全に送信

3. **Portalが認証とトークン発行**
   - ユーザー認証
   - 専用APIトークンを自動発行
   - トークンをCLIに返却

4. **CLIがトークンを隠蔽保存**
   - 受け取ったトークンを暗号化
   - ユーザーには見えない形で保存

## 実装内容

### エージェントA（CLI側）の実装タスク

#### 1. メール/パスワードログイン機能
**ファイル**: `/cli/openhands/cli/auth.py` (新規作成)
```python
# 実装内容
- メール/パスワード入力UI
- Portalへの認証リクエスト
- レスポンス処理
```

#### 2. Portal通信クライアント
**ファイル**: `/cli/openhands/portal/client.py` (新規作成)
```python
# 実装内容
- HTTPSでPortalと通信
- 認証エンドポイントへのアクセス
- エラーハンドリング
```

#### 3. トークン隠蔽管理
**ファイル**: `/cli/openhands/security/token_manager.py` (新規作成)
```python
# 実装内容
- トークンの暗号化保存
- デバイスバインディング
- メモリ内での安全な管理
```

#### 4. 既存コードの改修
- `settings.py`: Portal認証の追加
- `agents.py`: プロンプト取得方法の変更

### エージェントB（Portal側）の実装タスク

#### 1. CLI認証エンドポイント
**ファイル**: `/portal/backend/routes/cli-auth.routes.js` (新規作成)
```javascript
// 実装内容
POST /api/cli/login
- メール/パスワード認証
- CLIトークン発行
- レスポンス形式の定義
```

#### 2. CLIトークンモデル
**ファイル**: `/portal/backend/models/cliToken.model.js` (新規作成)
```javascript
// スキーマ定義
- userId: ユーザーID
- token: ランダムトークン
- createdAt: 作成日時
- lastUsed: 最終利用日時
- deviceInfo: デバイス情報
```

#### 3. トークン管理サービス
**ファイル**: `/portal/backend/services/cli-token.service.js` (新規作成)
```javascript
// 実装内容
- トークン生成ロジック
- トークン検証
- 有効期限管理
```

#### 4. プロンプト配信エンドポイント
**ファイル**: `/portal/backend/routes/prompt-secure.routes.js` (新規作成)
```javascript
// 実装内容
POST /api/prompts/{promptId}
- CLIトークン認証
- プロンプト取得
- アクセスログ記録
```

## API仕様

### 1. ログインAPI
```
POST /api/cli/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (Success):
{
  "success": true,
  "token": "cli_token_xxxxx",
  "userId": "user123",
  "expiresIn": 604800  // 7日間（秒）
}

Response (Error):
{
  "success": false,
  "error": "Invalid credentials"
}
```

### 2. プロンプト取得API
```
POST /api/prompts/{promptId}
Headers:
  X-CLI-Token: cli_token_xxxxx

Response (Success):
{
  "success": true,
  "prompt": {
    "id": "promptId",
    "content": "プロンプト内容",
    "version": "1.0"
  }
}

Response (Error):
{
  "success": false,
  "error": "Unauthorized"
}
```

## セキュリティ考慮事項

### CLI側
1. **トークンの隠蔽**
   - ユーザーには見えない形で保存
   - デバイス固有の暗号化
   - メモリ内での安全な管理

2. **通信の安全性**
   - HTTPS必須
   - 証明書検証

### Portal側
1. **トークン管理**
   - ランダムで推測困難なトークン
   - 有効期限の設定
   - 使用履歴の記録

2. **アクセス制御**
   - レート制限
   - 異常アクセスの検知
   - ログ記録

## 高度なセキュリティ実装（CLI側）

### 1. APIキー分散保存戦略

#### 実装方針
```python
# トークンを3つに分割
part1: RAMメモリに保存
part2: ~/.bluelamp/cache/data.tmp に保存
part3: 環境変数 BLUELAMP_SESSION に保存
```

#### 具体的な実装
```python
class DistributedTokenManager:
    def store_token(self, token):
        # Base64エンコード
        encoded = base64.b64encode(token.encode()).decode()
        
        # 3分割
        length = len(encoded)
        part1 = encoded[:length//3]
        part2 = encoded[length//3:2*length//3]
        part3 = encoded[2*length//3:]
        
        # 分散保存
        self.ram_storage[self.get_random_key()] = part1
        self.save_to_file("~/.bluelamp/.p2", part2)
        os.environ['BL_P3'] = part3
```

### 2. ゴミファイル戦略

#### 2.1 偽の重要ディレクトリ作成
```
cli/
├── core_modules/        # 偽物（重要そうな名前）
│   ├── authentication/
│   │   ├── api_keys.py     # 偽のAPIキー管理
│   │   └── crypto_utils.py # 偽の暗号化
│   └── security/
│       └── license_check.py # 偽のライセンス
├── bluelamp_core/      # 偽物（製品名を使用）
└── .private/           # 偽物（隠しディレクトリ）
    └── master_keys.json
```

#### 2.2 紛らわしい並列構造
```
本物：openhands/
偽物：openhand/   （タイポに見せかける）
偽物：oh_core/    （略称に見せかける）
偽物：openhands2/ （新バージョンに見せかける）
```

#### 2.3 偽の設定ファイル群
```
cli/
├── .env.production     # 環境変数（罠）
├── secrets.json        # シークレット（罠）
├── api_config.yaml     # API設定（罠）
├── auth_tokens.db      # トークンDB（罠）
└── master_key.pem      # マスターキー（罠）
```

#### 2.4 APIキー関連のゴミファイル強化
```
cli/
├── keys/
│   ├── api_key_backup.json
│   ├── api_key_cache.db
│   ├── api_key_encrypted.bin
│   ├── api_key_fragments/
│   │   ├── part1.key
│   │   ├── part2.key
│   │   └── part3.key
│   └── recovery_keys/
├── .api_keys/
│   ├── production.key
│   ├── staging.key
│   └── development.key
└── token_storage/
    ├── active_tokens.json
    ├── expired_tokens.json
    └── token_registry.db
```

#### 2.5 ハニーポット型ゴミファイル
```python
# api_keys.py（偽物）の中身
"""
IMPORTANT: Production API Keys
DO NOT SHARE OR COMMIT
"""

API_KEY = "sk-bluelamp-trap-2024-detector"
SECRET = "this-is-a-honeypot-if-you-use-this-we-will-know"

# 罠コード
def get_api_key():
    import sys
    sys.exit(1)  # 使用したら強制終了
```

### 3. ビルド・配布戦略

#### 3.1 ビルドプロセス
```
1. 開発（通常のディレクトリ構造）
   ↓
2. ゴミファイル生成（400個）
   ↓
3. バンドル（1ファイルに結合）
   ↓
4. 難読化（変数名・関数名を無意味に）
   ↓
5. 配布（PyPIまたは単一実行ファイル）
```

#### 3.2 自動ゴミファイル生成スクリプト
```python
# build_security.py
def generate_decoy_structure():
    # APIキー関連の偽ファイルを重点的に生成
    api_decoys = [
        "keys/api_key_backup.json",
        "token_storage/active_tokens.json",
        ".api_keys/production.key",
        "core_modules/authentication/api_keys.py"
    ]
    
    for path in api_decoys:
        create_honeypot_file(path)
        
    # 合計400個のゴミファイル生成
    for i in range(400):
        create_random_decoy()
```

### 4. 最終的なセキュリティ層

```
1. プロンプト：100%サーバー側（ローカルには存在しない）
2. APIトークン：3箇所に分散保存
3. ゴミファイル：400個で攪乱（特にAPIキー関連を強化）
4. 難読化：全体を読みにくく
5. バンドル：1ファイルで配布

攻撃コスト：極めて高い
得られるもの：7日間有効なトークンのみ
→ 割に合わない
```

## 実装ロードマップ

### 開発の流れ
```
開発：ローカルで通常開発
　↓
テスト：段階的に機能追加
　↓
リリース：ゴミファイル生成 + 難読化 + パッケージ化
```

### ステップ1：プロンプトAPI化（認証なし版）
**目的：動作確認、基本構造の確立**
```python
# 最初はシンプルに認証なしで実装
response = requests.get("http://portal.com/api/prompts/agent/orchestrator")
prompt = response.json()["content"]
```

**実装内容：**
- Portal側：プロンプト取得API（認証なし）
- CLI側：ローカルファイル読み込みからAPI呼び出しへ変更
- エラーハンドリング
- 基本的なキャッシュ機能

### ステップ2：認証システム追加
**目的：セキュリティの基礎実装**
```python
# 認証ヘッダー追加
headers = {"X-CLI-Token": "cli_token_abc123"}
response = requests.get(url, headers=headers)
```

**実装内容：**
- Portal側：ログインAPI、トークン発行
- CLI側：メール/パスワードログイン機能
- トークン保存（この段階では平文でOK）
- 認証付きAPI呼び出し

### ステップ3：トークン分散保存
**目的：セキュリティ強化**
```python
# 3箇所に分散
part1 → RAMメモリ
part2 → ~/.bluelamp/cache/data.tmp
part3 → 環境変数 BLUELAMP_SESSION
```

**実装内容：**
- トークン分割・結合ロジック
- 分散保存の実装
- 起動時の復元処理
- デバイスバインディング（オプション）

### ステップ4：リリース準備（難読化＆ゴミファイル）
**目的：配布用パッケージの作成**
```bash
# 開発時
$ python main.py  # 通常実行

# リリース時
$ python build_release.py
→ ゴミファイル400個生成
→ 難読化処理
→ パッケージ作成
```

**実装内容：**
- ゴミファイル自動生成スクリプト
- 難読化の設定
- ビルドプロセスの自動化
- CI/CD統合

## 詳細スケジュール

### Week 1：基本API実装
| 曜日 | タスク |
|------|--------|
| 月 | Portal側 - プロンプトAPI作成（認証なし） |
| 火 | CLI側 - API呼び出し実装 |
| 水 | エラーハンドリング・リトライ処理 |
| 木 | キャッシュ機能実装 |
| 金 | 統合テスト・調整 |

### Week 2：認証システム
| 曜日 | タスク |
|------|--------|
| 月 | Portal側 - ログインAPI・トークン発行 |
| 火 | CLI側 - ログイン機能UI |
| 水 | トークン管理（基本版） |
| 木 | 認証フロー統合テスト |
| 金 | エラーケース対応 |

### Week 3：セキュリティ強化
| 曜日 | タスク |
|------|--------|
| 月 | トークン分散保存設計 |
| 火 | 分散保存実装（RAM/ファイル/環境変数） |
| 水 | トークン復元ロジック |
| 木 | 再起動テスト・エッジケース対応 |
| 金 | パフォーマンス最適化 |

### Week 4：リリース準備
| 曜日 | タスク |
|------|--------|
| 月 | ゴミファイル生成スクリプト作成 |
| 火 | 難読化ツール設定・テスト |
| 水 | ビルドプロセス自動化 |
| 木 | 最終統合テスト |
| 金 | 🚀 リリース |

## 移行計画（旧システムからの移行）

### フェーズ1: 基礎実装（Week 1-2）
- プロンプトAPI実装
- 認証システム基本実装
- 動作確認

### フェーズ2: セキュリティ強化（Week 3）
- トークン分散保存
- デバイスバインディング
- セキュリティテスト

### フェーズ3: リリース準備（Week 4）
- ゴミファイル戦略
- 難読化設定
- パッケージング自動化

## 成功基準

1. **ユーザー体験**
   - シンプルなログインフロー
   - APIキーを意識させない

2. **セキュリティ**
   - トークンの安全な管理
   - 不正アクセスの防止

3. **パフォーマンス**
   - レスポンス時間 < 200ms
   - オフライン時の適切な処理

## 次のステップ

このドキュメントをベースに、以下の詳細を検討する必要があります：

1. **トークンの具体的な隠蔽方法**
2. **エラーハンドリングの詳細**
3. **既存ユーザーの移行方法**
4. **モニタリングとログの設計**

---

最終更新: 2024年12月30日