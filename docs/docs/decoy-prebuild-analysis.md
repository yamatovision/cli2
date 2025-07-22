# デコイファイル事前作成方式の検討

## 現在の実装概要

現在の実装では、`decoy_trap.py`が初回実行時にデコイファイルを動的に作成する方式を採用しています。

### 現在の動作フロー
1. `DecoyTrapSystem`が初回実行をチェック（`~/.openhands/.traps_deployed`フラグファイル）
2. フラグファイルが存在しない場合、8個のデコイファイルを作成
3. 各デコイファイルには固有のトラップキー（偽のAPIキー）を含む
4. 作成完了後、フラグファイルを生成

### 現在のデコイファイル配置
- `~/.config/bluelamp/api_keys.json`
- `~/.local/share/bluelamp/credentials.json`
- `~/.cache/bluelamp/token.json`
- `~/.bluelamp/config.json`
- `~/.config/bluelamp/auth.json`
- 追加デコイ（オプション）:
  - `~/Documents/BlueLamp/api_config.json`
  - `~/.ssh/bluelamp_key.json`
  - `~/Desktop/.bluelamp_cache/keys.json`

## 事前作成方式のメリット・デメリット

### メリット
1. **初回起動の高速化**
   - ファイルI/O処理が不要
   - ユーザー体験の向上

2. **一貫性の保証**
   - すべてのユーザーが同じデコイファイルを持つ
   - トラブルシューティングが容易

3. **権限問題の回避**
   - 実行時のディレクトリ作成権限エラーを防げる
   - 特定の環境（読み取り専用ファイルシステム等）でも動作

4. **テストの簡素化**
   - デコイファイルの存在を前提にテストを書ける
   - CI/CDパイプラインでの動作が安定

### デメリット
1. **インストールサイズの増加**
   - 約8個のJSONファイル（各1-2KB）を含める必要がある
   - 実際の増加は最小限（約10-20KB）

2. **カスタマイズ性の低下**
   - ユーザーごとにランダムなトラップキーを生成できない
   - ただし、現在の実装でも固定キーを使用している

3. **配置の複雑さ**
   - インストール時に適切な場所にファイルを配置する必要がある
   - クロスプラットフォーム対応が必要

## 実装方法の選択肢

### 1. インストール時作成（推奨）

```python
# setup.py または pyproject.toml のpost-installスクリプト
def post_install():
    """パッケージインストール後にデコイファイルを作成"""
    from openhands.security.decoy_prebuild import create_decoy_files
    create_decoy_files()
```

**利点**:
- インストール時のみ実行される
- ユーザーのホームディレクトリに適切に配置
- プラットフォーム固有の処理が可能

**欠点**:
- インストールプロセスが複雑になる
- pip installのサンドボックス制限の考慮が必要

### 2. リポジトリに含める

```
cli/
├── decoy_files/
│   ├── config/
│   │   ├── bluelamp/
│   │   │   ├── api_keys.json
│   │   │   └── auth.json
│   ├── local/
│   │   └── share/
│   │       └── bluelamp/
│   │           └── credentials.json
│   └── install.py  # インストール用スクリプト
```

**利点**:
- ファイルの管理が容易
- バージョン管理が可能

**欠点**:
- インストール時の配置処理が必要
- .gitignoreの管理が必要（実際のデコイファイルと区別）

### 3. ビルドスクリプトで作成（部分的に推奨）

既存の`build_release.py`を拡張して、リリースビルド時にデコイファイルを含める。

```python
# build_release.py に追加
def _prepare_decoy_files(self):
    """デコイファイルをビルドに含める"""
    decoy_dir = self.build_dir / "decoy_files"
    decoy_dir.mkdir(exist_ok=True)
    
    # デコイファイルを生成
    from openhands.security.decoy_prebuild import generate_decoy_templates
    generate_decoy_templates(decoy_dir)
```

**利点**:
- リリースプロセスに統合
- 開発時とリリース時で異なる処理が可能

**欠点**:
- ビルドプロセスが複雑になる
- 開発環境での動作確認が必要

## 推奨実装案

### ハイブリッドアプローチ

1. **テンプレートファイルをリポジトリに含める**
   - `cli/decoy_templates/`ディレクトリに配置
   - 実際のパスとコンテンツのマッピングを定義

2. **インストール時にコピー機能を提供**
   - オプショナルなpost-installスクリプト
   - 手動インストールコマンドも提供

3. **実行時フォールバック**
   - デコイファイルが存在しない場合は現在の動的生成を使用
   - 段階的な移行が可能

### 実装ステップ

1. **デコイテンプレートディレクトリの作成**
```bash
cli/decoy_templates/
├── README.md
├── templates.json  # ファイルパスとコンテンツのマッピング
└── files/
    ├── api_keys.json
    ├── credentials.json
    ├── token.json
    ├── config.json
    └── auth.json
```

2. **インストールヘルパーの作成**
```python
# openhands/security/decoy_installer.py
class DecoyInstaller:
    def install_decoy_files(self, force=False):
        """デコイファイルをユーザー環境にインストール"""
        pass
```

3. **CLIコマンドの追加**
```bash
bluelamp security install-decoys
```

## セキュリティ考慮事項

1. **トラップキーの多様性**
   - テンプレートには複数のバリエーションを含める
   - インストール時にランダムに選択

2. **ファイル権限**
   - インストール時に適切な権限（0o600）を設定
   - 所有者のみ読み取り可能

3. **検出回避**
   - デコイファイルのパターンが予測されないように
   - 定期的にテンプレートを更新

## 結論

ファイル数が8個程度と少ないため、事前作成方式のメリットがデメリットを上回ると考えられます。
ハイブリッドアプローチを採用することで、段階的な移行と柔軟な対応が可能になります。