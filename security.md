# BlueLamp CLI セキュリティ設計ドキュメント

## 概要

このドキュメントは、BlueLamp CLIのセキュリティ設計について詳述します。特に、プロンプトの完全サーバーサイド管理とAPIキー隠蔽技術を組み合わせた保護戦略を中心に説明します。

## 目次

1. [セキュリティアーキテクチャ](#セキュリティアーキテクチャ)
2. [プロンプト保護戦略](#プロンプト保護戦略)
3. [APIキー隠蔽技術](#apiキー隠蔽技術)
4. [認証システムの設計](#認証システムの設計)
5. [実装ロードマップ](#実装ロードマップ)

## セキュリティアーキテクチャ

### 基本方針
BlueLamp CLIは、**プロンプトの完全サーバーサイド管理**と**APIキーの高度な隠蔽技術**を組み合わせることで、強固なセキュリティを実現します。

### アーキテクチャ概要
```
┌─────────────────┐     隠蔽されたAPIキー     ┌──────────────────┐
│  BlueLamp CLI   │ ◄────────────────────────► │   Portal API     │
│ (PyPIパッケージ)│     HTTPS + 証明書ピンニング │  (プロンプト配信) │
└─────────────────┘                            └──────────────────┘
        │                                               │
        │ プロンプトは一切含まない                        │ プロンプトDB
        │                                               │
        ▼                                               ▼
   ローカル実行                                    サーバー側で管理
```

### セキュリティの層

1. **第1層：プロンプトの完全分離**
   - プロンプトはローカルに一切存在しない
   - PyPIパッケージを解析されても無意味

2. **第2層：APIキーの高度な隠蔽**
   - ユーザーはAPIキーの存在を意識しない
   - 複数の隠蔽技術を組み合わせ

3. **第3層：通信の保護**
   - HTTPS通信
   - 証明書ピンニング
   - エンドポイントURLの隠蔽

4. **第4層：サーバー側の多層防御**
   - 認証・認可
   - レート制限
   - 異常検知
   - 監査ログ

## プロンプト保護戦略

### 完全サーバーサイド管理の利点

1. **絶対的な保護**
   - ローカルにプロンプトが存在しないため、解析不可能
   - 更新や修正が即座に反映可能

2. **柔軟なアクセス制御**
   - ユーザーのプランに応じた動的制御
   - 利用状況の完全な把握

3. **知的財産の保護**
   - プロンプトはBlueLampの最重要資産
   - 競合他社による分析を完全に防止

### 実装アーキテクチャ

```python
class SecurePromptSystem:
    """BlueLamp CLI プロンプト保護システム"""
    
    def __init__(self):
        # APIキーは完全に隠蔽（ユーザーは存在を知らない）
        self._auth = HiddenAuthManager()
        # エンドポイントも隠蔽
        self._endpoint = self._get_obfuscated_endpoint()
        # キャッシュマネージャー
        self._cache = SecureMemoryCache()
        
    async def get_prompt(self, agent_name: str, prompt_type: str) -> str:
        """サーバーからプロンプトを安全に取得"""
        # キャッシュチェック（メモリ内のみ）
        cache_key = f"{agent_name}:{prompt_type}"
        if cached := self._cache.get(cache_key):
            return cached
            
        # 隠蔽されたAPIキーを動的に取得
        hidden_key = await self._auth.get_hidden_api_key()
        
        # サーバーにリクエスト
        response = await self._secure_request(
            endpoint=f"{self._endpoint}/prompts/get",
            headers={
                "X-API-Key": hidden_key,
                "X-Device-ID": self._get_device_fingerprint()
            },
            data={
                "agent": agent_name,
                "type": prompt_type,
                "version": "1.0"
            }
        )
        
        # メモリキャッシュに保存（暗号化）
        prompt = response["prompt"]
        self._cache.set(cache_key, prompt, ttl=3600)
        
        return prompt
```

### サーバー側実装

```python
# Portal API側の実装
@app.post("/api/prompts/get")
async def get_prompt(request):
    # 多層認証
    user = await multi_layer_auth(request)
    
    # レート制限チェック
    if is_rate_limited(user.id):
        raise RateLimitError()
    
    # デバイス認証
    if not verify_device(user.id, request.headers.get("X-Device-ID")):
        raise UnauthorizedDeviceError()
    
    # プロンプト取得（プランに応じて）
    prompt = await prompt_db.get(
        agent=request.json["agent"],
        type=request.json["type"],
        user_plan=user.subscription_plan
    )
    
    # 監査ログ
    await audit_log.record({
        "user_id": user.id,
        "prompt_id": prompt.id,
        "timestamp": datetime.utcnow(),
        "ip_address": request.client.host
    })
    
    return {"prompt": prompt.content}
```

## APIキー隠蔽技術

### 1. 透過的な認証フロー

```python
class TransparentAuthManager:
    """ユーザーはAPIキーの存在を意識しない"""
    
    async def authenticate_user(self, username: str, password: str):
        # 1. 通常のPortalログイン
        auth_response = await self.portal_login(username, password)
        
        # 2. サーバーが一時的なAPIキーを発行（ユーザーには見えない）
        temp_api_key = auth_response['temp_api_key']
        
        # 3. 複数の隠蔽技術でAPIキーを保護
        await self._hide_api_key(temp_api_key)
        
        # ユーザーには単に「ログイン成功」としか見えない
        return True
```

### 2. 多層隠蔽技術

```python
class MultiLayerKeyHiding:
    """APIキーを複数の方法で隠蔽"""
    
    def __init__(self):
        # レイヤー1: メモリ分散
        self._distributed_storage = DistributedKeyStorage()
        
        # レイヤー2: 環境依存暗号化
        self._env_crypto = EnvironmentBoundCrypto()
        
        # レイヤー3: 動的難読化
        self._obfuscator = DynamicObfuscator()
        
    async def hide_api_key(self, api_key: str):
        # 1. デバイス固有のキーで暗号化
        encrypted = self._env_crypto.encrypt(api_key)
        
        # 2. 分割してメモリに分散保存
        parts = self._distributed_storage.split_and_store(encrypted)
        
        # 3. さらに難読化
        for part in parts:
            self._obfuscator.obfuscate(part)
```

### 3. 実装例：メモリ内分散保存

```python
class DistributedKeyStorage:
    """APIキーを発見困難な形で保存"""
    
    def __init__(self):
        # ダミーデータで埋め尽くす
        self._memory_pool = [os.urandom(32) for _ in range(100)]
        self._key_indices = []
        
    def split_and_store(self, api_key: str) -> None:
        # APIキーを8文字ずつに分割
        chunks = [api_key[i:i+8] for i in range(0, len(api_key), 8)]
        
        # ランダムな位置に挿入
        import random
        for chunk in chunks:
            idx = random.randint(0, len(self._memory_pool))
            self._memory_pool.insert(idx, chunk.encode())
            self._key_indices.append(idx)
            
    def reconstruct(self) -> str:
        # 実行時に再構築
        chunks = [self._memory_pool[i].decode() for i in self._key_indices]
        return "".join(chunks)
```

### 4. デバイスバインディング

```python
class DeviceBoundEncryption:
    """デバイス固有の情報でAPIキーを保護"""
    
    def _generate_device_key(self) -> bytes:
        import platform
        import uuid
        import hashlib
        
        # 複数の要素を組み合わせ
        factors = [
            str(uuid.getnode()),          # MACアドレス
            platform.machine(),            # マシンタイプ
            platform.processor(),          # プロセッサ
            os.path.expanduser("~"),       # ホームディレクトリ
            str(os.getuid()) if hasattr(os, 'getuid') else 'windows'
        ]
        
        combined = ":".join(factors)
        return hashlib.sha256(combined.encode()).digest()
        
    def encrypt_api_key(self, api_key: str) -> bytes:
        # 別のデバイスでは復号不可能
        from cryptography.fernet import Fernet
        key = base64.urlsafe_b64encode(self._generate_device_key())
        fernet = Fernet(key)
        return fernet.encrypt(api_key.encode())
```

## 認証システムの設計

### 多層防御アーキテクチャ

```python
class MultiLayerDefense:
    """サーバー側の多層防御実装"""
    
    async def verify_request(self, request) -> bool:
        # 層1: APIキー認証
        user = await self.verify_api_key(request.headers.get("X-API-Key"))
        if not user:
            self.log_failed_auth(request)
            return False
            
        # 層2: サブスクリプション確認
        if not user.has_active_subscription():
            self.log_expired_subscription(user)
            return False
            
        # 層3: デバイス認証
        device_id = request.headers.get("X-Device-ID")
        if not await self.verify_device(user.id, device_id):
            self.log_unknown_device(user, device_id)
            return False
            
        # 層4: レート制限
        if await self.check_rate_limit(user.id):
            self.log_rate_limit_exceeded(user)
            return False
            
        # 層5: 異常検知
        if await self.detect_anomaly(user, request):
            self.log_anomaly(user, request)
            return False
            
        # 層6: 地理的制限（オプション）
        if self.geo_restrictions_enabled:
            if not await self.verify_geo_location(request.client.host):
                self.log_geo_violation(user, request)
                return False
                
        return True
```

### レート制限の実装

```python
class IntelligentRateLimiter:
    """ユーザーの行動パターンに基づく動的レート制限"""
    
    def __init__(self):
        self.limits = {
            'free': {'requests_per_minute': 10, 'requests_per_hour': 100},
            'pro': {'requests_per_minute': 60, 'requests_per_hour': 1000},
            'enterprise': {'requests_per_minute': 300, 'requests_per_hour': 10000}
        }
        
    async def check_limit(self, user_id: str, plan: str) -> bool:
        # 通常の制限チェック
        current_usage = await self.get_usage(user_id)
        limits = self.limits[plan]
        
        # 異常なスパイクを検出
        if self.detect_usage_spike(user_id, current_usage):
            # 一時的により厳しい制限を適用
            limits = {'requests_per_minute': 5, 'requests_per_hour': 50}
            
        return current_usage < limits
```

### 異常検知システム

```python
class AnomalyDetector:
    """機械学習ベースの異常検知"""
    
    def __init__(self):
        self.normal_patterns = {}
        self.ml_model = self._load_anomaly_model()
        
    async def detect_anomaly(self, user_id: str, request: dict) -> bool:
        features = self._extract_features(request)
        
        # 1. 統計的異常検知
        if self._statistical_anomaly(user_id, features):
            return True
            
        # 2. パターンベース検知
        if self._pattern_anomaly(user_id, features):
            return True
            
        # 3. ML モデルによる検知
        if self.ml_model.predict(features) > 0.8:
            return True
            
        return False
        
    def _extract_features(self, request):
        return {
            'request_time': request.timestamp,
            'prompt_type': request.prompt_type,
            'request_frequency': self._get_frequency(request.user_id),
            'geographic_location': request.ip_location,
            'device_fingerprint': request.device_id
        }
```

## 実装ロードマップ

### フェーズ1：即座に実装（1週間）

1. **基本インフラ構築**
   ```python
   # Portal API側
   - プロンプトDB設計とマイグレーション
   - 基本的なAPIエンドポイント実装
   - 既存認証システムとの統合
   
   # CLI側
   - SecurePromptManagerの基本実装
   - APIキー隠蔽の第1層実装
   - メモリキャッシュ機能
   ```

2. **必須セキュリティ機能**
   - HTTPS通信の実装
   - 基本的なレート制限（10req/分）
   - APIキー認証

### フェーズ2：中期実装（2-3週間）

1. **高度な隠蔽技術**
   ```python
   # APIキー保護の強化
   - メモリ分散保存
   - デバイスバインディング
   - 動的難読化
   
   # エンドポイント保護
   - URL隠蔽実装
   - 証明書ピンニング
   ```

2. **多層防御の実装**
   - デバイス認証機能
   - 動的レート制限
   - 基本的な異常検知

### フェーズ3：長期実装（1-2ヶ月）

1. **高度なセキュリティ機能**
   - ML ベースの異常検知
   - リアルタイム監視ダッシュボード
   - 自動ブロッキングシステム

2. **エンタープライズ機能**
   - 地理的アクセス制限
   - IP ホワイトリスト
   - 詳細な監査ログ

## パフォーマンス最適化

### スマートキャッシング戦略

```python
class SmartCacheManager:
    """インテリジェントなキャッシュ管理"""
    
    def __init__(self):
        self.memory_cache = TTLCache(maxsize=100, ttl=3600)
        self.usage_stats = defaultdict(int)
        
    async def get_prompt(self, name: str) -> str:
        # 1. ホットキャッシュチェック
        if name in self.memory_cache:
            self.usage_stats[name] += 1
            return self.memory_cache[name]
            
        # 2. プリフェッチ候補の判定
        if self.should_prefetch(name):
            await self.prefetch_related_prompts(name)
            
        # 3. サーバーから取得
        prompt = await self.fetch_from_server(name)
        
        # 4. 使用頻度に基づくキャッシュ優先度
        if self.usage_stats[name] > 5:
            self.memory_cache.set_priority(name, HIGH)
            
        return prompt
```

### ネットワーク最適化

```python
class OptimizedNetworkClient:
    """効率的なネットワーク通信"""
    
    def __init__(self):
        # HTTP/2 対応
        self.session = httpx.AsyncClient(http2=True)
        # 接続プール
        self.connection_pool = ConnectionPool(max_connections=10)
        
    async def batch_fetch_prompts(self, prompt_names: List[str]):
        """複数プロンプトの一括取得"""
        response = await self.session.post(
            "/api/prompts/batch",
            json={"prompts": prompt_names}
        )
        return response.json()
```

## セキュリティ監視とアラート

### リアルタイム監視

```python
class SecurityMonitor:
    """セキュリティイベントの監視"""
    
    def __init__(self):
        self.alert_thresholds = {
            'failed_auth': 5,
            'rate_limit': 10,
            'anomaly_score': 0.8
        }
        
    async def monitor_events(self):
        while True:
            events = await self.collect_events()
            
            for event in events:
                if self.is_critical(event):
                    await self.send_alert(event)
                    
                if self.requires_action(event):
                    await self.take_action(event)
```

## まとめ

### 実装の核心

1. **プロンプトの完全サーバーサイド管理**
   - ローカルには一切プロンプトを保存しない
   - API経由でのみアクセス可能

2. **APIキーの高度な隠蔽**
   - ユーザーは存在を意識しない
   - 複数の技術を組み合わせて保護

3. **多層防御システム**
   - クライアント側とサーバー側の両方で実装
   - 攻撃コストを最大化

### 成功の鍵

- **段階的実装**: 基本機能から始めて徐々に強化
- **ユーザー体験**: セキュリティを感じさせない設計
- **継続的改善**: 脅威の進化に対応

### 期待される効果

| 攻撃タイプ | 現状 | 実装後 |
|-----------|------|--------|
| ソースコード解析 | 容易 | 不可能 |
| リバースエンジニアリング | 可能 | 極めて困難 |
| 不正利用 | 制限なし | 完全制御 |
| プロンプト盗用 | 簡単 | 不可能 |

---

最終更新: 2024年12月30日



#0 オーケストレーター
http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/a01c31cd5fae25ce6f9e932ab624a6c1
#1 要件定義エンジニア
http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/f22f9af6fa134d3c550cd0b196460d44

### #2 UI/UXデザイナー

http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/491aca0243b594df870ff2a0e2c55acf
### #3 データモデリングエンジニア

http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/322b217089692b7094296d1e7e8c8f04
### #4 システムアーキテクト

http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/34fa3d00f36bfab18f792df8afa740ac
### #5 実装コンサルタント

http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/de801246ded4432b2a7dc6f42efb77e3
### #6 環境構築

http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/414e4d38adc1e2478ef58dfd76cd85c9
### #7 プロトタイプ実装

http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/eb05b8a6413e66106b4b119c70c5999e
### #8 バックエンド実装

http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/bde348d5df3305bf8fb1182725aab9ec
### #9 テスト・品質検証

http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/6a3df9f87fe84a693fce679215e4ccdc
### #10 API統合

http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/ddf8c3f5fad4b124e88616c213bfeabf
### #11 デバッグ探偵

http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/3900bf2028a173fd6a80cc49f30ea7fe
### #12 デプロイスペシャリスト

http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/cc66782acd2a10e4e759b26ac38657bc
### #13 GitHubマネージャー

http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/895feeaf0cae8c341d89822f57f8b462
### #14 TypeScriptマネージャー

http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/8fd2ed68b40276130ae5bca636bfe806
### #15 機能拡張プランナー

http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/32c3492101ad9450d4e0243423e42c1a



### #16 リファクタリングエキスパート

http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/28108a79bffb777b147af6dfa002fdfd


