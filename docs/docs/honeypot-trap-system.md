# BlueLamp ハニーポットトラップシステム詳細

**バージョン**: 1.0  
**最終更新日**: 2025-07-02  
**ステータス**: 設計完了

## 1. 概要

BlueLampのハニーポットトラップシステムは、不正なAPIキー探索を検知し、即座にアカウントを停止する防御機構です。攻撃者が最初に発見しやすい場所に偽のAPIキー（トラップキー）を配置し、使用された瞬間に制裁を発動します。

## 2. トラップの種類

### 2.1 デコイディレクトリトラップ

初回実行時に作成される偽のディレクトリ構造：

```
~/.config/bluelamp/
├── config.json
└── api_keys.json      # トラップキー: sk-trap-config-001

~/.local/share/bluelamp/
├── credentials.json   # トラップキー: sk-trap-local-002
└── settings.json

~/.cache/bluelamp/
└── token.json        # トラップキー: sk-trap-cache-003
```

### 2.2 セッション内トラップ

本物のセッションディレクトリ内に配置される偽APIキー：

```
~/.openhands/sessions/
├── real-session-id/
│   └── events/1.json     # 本物のAPIキー（暗号化済み）
├── fake-session-001/
│   └── events/1.json     # トラップキー: sk-trap-session-001
├── fake-session-002/
│   └── events/1.json     # トラップキー: sk-trap-session-002
└── ... (50個のデコイセッション)
```

## 3. トラップキーの設計

### 3.1 命名規則

```javascript
// トラップキーのパターン
const TRAP_KEY_PATTERNS = {
    config: "sk-trap-config-{id}",      // 設定ファイル系
    local: "sk-trap-local-{id}",        // ローカルデータ系
    cache: "sk-trap-cache-{id}",        // キャッシュ系
    session: "sk-trap-session-{id}",    // セッション系
    hidden: "sk-proj-fake{random}"      // 本物に見せかけた系
};
```

### 3.2 リアルな偽装

```json
// ~/.config/bluelamp/config.json
{
    "version": "1.0.0",
    "api": {
        "key": "sk-proj-fakeABCD1234567890abcdef",
        "endpoint": "https://api.bluelamp.ai",
        "timeout": 30000
    },
    "user": {
        "id": "usr_fake123456",
        "email": "user@example.com"
    }
}
```

## 4. 検知と制裁の流れ

### 4.1 CLI側（トラップ配置）

```python
class TrapDeployment:
    def deploy_traps_on_first_run(self):
        """初回実行時にトラップを配置"""
        if self._is_first_run():
            # デコイディレクトリ作成
            self._create_decoy_directories()
            
            # トラップキー配置
            self._place_trap_keys()
            
            # 実行フラグ設定
            self._mark_traps_deployed()
```

### 4.2 Portal側（検知と制裁）

```javascript
// トラップキー検知ミドルウェア
async function trapDetectionMiddleware(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.body.apiKey;
    
    if (apiKey && isTrapKey(apiKey)) {
        // トラップ発動！
        await handleTrapTriggered(req, apiKey);
        
        return res.status(403).json({
            success: false,
            message: 'セキュリティ違反が検出されました',
            error: 'SECURITY_VIOLATION'
        });
    }
    
    next();
}

// 制裁処理
async function handleTrapTriggered(req, trapKey) {
    const user = await identifyUser(req);
    
    if (user) {
        // アカウント即時停止
        user.securityStatus.isBlocked = true;
        user.securityStatus.blockReason = 'ハニーポットトラップ発動';
        user.securityStatus.trapTriggered = {
            key: trapKey,
            timestamp: new Date(),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        };
        
        await user.save();
        
        // 全トークン無効化
        await revokeAllUserTokens(user._id);
        
        // 管理者に通知
        await notifyAdmins({
            event: 'TRAP_TRIGGERED',
            user: user.email,
            trapKey: trapKey
        });
    }
}
```

## 5. トラップの配置戦略

### 5.1 心理的誘導

攻撃者が最初に探す可能性が高い場所：

1. **~/.config/** - 設定ファイルの定番
2. **~/.local/share/** - アプリデータの標準位置
3. **~/.cache/** - 一時データとして見落としがち
4. **~/Documents/BlueLamp/** - 分かりやすい場所

### 5.2 発見確率の調整

```python
# トラップの配置優先度
TRAP_VISIBILITY = {
    "~/.config/bluelamp/api_keys.json": 0.9,      # 90%の確率で最初に発見
    "~/.bluelamp/config.json": 0.8,               # 80%
    "~/.local/share/bluelamp/creds.json": 0.7,    # 70%
    "~/.openhands/sessions/*/events/1.json": 0.3  # 30%（本物に近い）
}
```

## 6. 実装の注意点

### 6.1 誤検知の防止

```python
# 正規のAPIキーと区別
def is_legitimate_key(key):
    # 本物のAPIキーは特定のパターンに従う
    return key.startswith("cli_") and len(key) == 64

def is_trap_key(key):
    # トラップキーの識別
    return (
        key.startswith("sk-trap-") or
        key in KNOWN_TRAP_KEYS or
        is_honeypot_pattern(key)
    )
```

### 6.2 アピール機能

```javascript
// 誤検知の場合のアピール機能
const appealSchema = {
    userId: String,
    reason: String,
    evidence: String,
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
};
```

## 7. 効果測定

### 7.1 メトリクス

- トラップ発動率
- 発動までの時間
- どのトラップが効果的か
- 誤検知率

### 7.2 ログ分析

```javascript
// トラップ効果の分析
{
    "trapStats": {
        "totalTriggers": 142,
        "uniqueUsers": 23,
        "mostTriggered": "sk-trap-config-001",
        "averageTimeToTrigger": "3.2 days",
        "preventedBreaches": 142
    }
}
```

## 8. 今後の拡張

### 8.1 動的トラップ

- トラップキーを定期的に変更
- ユーザーごとに異なるトラップ
- 時限式トラップ

### 8.2 高度な検知

- 異常なアクセスパターン
- 複数トラップの連続試行
- 地理的異常の検知

## 9. 結論

ハニーポットトラップシステムは、BlueLampの多層防御の重要な一層です。攻撃者が本物のAPIキーに到達する前に捕獲し、被害を未然に防ぎます。心理的な抑止効果も含め、セキュリティ向上に大きく貢献します。