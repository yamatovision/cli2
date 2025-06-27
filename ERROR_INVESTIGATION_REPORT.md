# BlueLamp CLI起動エラー調査レポート

## エラー概要
BlueLamp CLIの起動時に4つのエラー/警告が発生しています。以下、重要度順に原因と解決策を報告します。

## 1. 【致命的エラー】requirements_engineer.j2ファイル欠落エラー

### エラーメッセージ
```
エラーが発生しました: System prompt file "requirements_engineer.j2" not found at /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli/openhands/agenthub/codeact_agent/prompts/requirements_engineer.j2
```

### 原因
- `agent_config.py`のデフォルトシステムプロンプトファイル名が`requirements_engineer.j2`に設定されていたが、実際のファイル名は`requirements_engineer_agent.j2`だった
- これは古いファイル名への参照が残っていたことが原因（「削除したが参照が残っていた」状態）

### 解決策
✅ **既に修正済み**: `agent_config.py`の22行目でデフォルト値を`orchestration_agent.j2`に変更済み

## 2. 【中程度】agent_configs.tomlの不明なセクション警告

### エラーメッセージ
```
11:25:50 - bluelamp:WARNING: utils.py:307 - 不明なセクション [agents] が /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli/agent_configs.toml で見つかりました
11:25:50 - bluelamp:WARNING: utils.py:307 - 不明なセクション [delegation] が /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli/agent_configs.toml で見つかりました
```

### 原因
- `utils.py`の`known_sections`リスト（296-304行目）に`agents`と`delegation`セクションが含まれていない
- BlueLampシステムが使用する新しい設定セクションがknown_sectionsに登録されていない

### 解決策
`utils.py`の`known_sections`に以下を追加：
```python
known_sections = {
    # 既存のセクション...
    'agents',      # 追加
    'delegation',  # 追加
}
```

## 3. 【中程度】WORKSPACE環境変数の非推奨警告

### エラーメッセージ
```
11:25:50 - bluelamp:WARNING: utils.py:324 - 非推奨: WORKSPACE_BASE および WORKSPACE_MOUNT_PATH 環境変数は非推奨です。代わりに RUNTIME_MOUNT を使用してください。
```

### 原因
- 古い環境変数（`WORKSPACE_BASE`、`WORKSPACE_MOUNT_PATH`）が設定されているか、コード内で使用されている
- `utils.py`の323-327行目で明示的に警告を出力
- `main.py`の422行目と427行目で`config.workspace_base`を使用している（DeprecationWarning）

### 解決策
- 環境変数を`RUNTIME_MOUNT`形式に変更（例：`RUNTIME_MOUNT=/my/host/dir:/workspace:rw`）
- コード内の`workspace_base`の使用箇所を新しい方式に移行

## 4. 【低優先度】pydubのffmpeg/avconv警告

### エラーメッセージ
```
/Users/tatsuya/Library/Caches/pypoetry/virtualenvs/openhands-ai-WioRcPD9-py3.12/lib/python3.12/site-packages/pydub/utils.py:170: RuntimeWarning: Couldn't find ffmpeg or avconv - defaulting to ffmpeg, but may not work
```

### 原因
- pydubライブラリが音声/動画処理のためにffmpegまたはavconvを探しているが、システムにインストールされていない
- pydubの依存関係として音声処理が含まれているが、BlueLampではおそらく使用されていない

### 解決策
- 音声処理が必要な場合：`brew install ffmpeg`（macOS）でffmpegをインストール
- 不要な場合：警告を無視（機能に影響なし）

## まとめ

最も重要な問題は**requirements_engineer.j2ファイルの欠落エラー**で、これはCLIの起動を妨げる致命的エラーでした。このエラーは既に修正済みです。

その他の警告は機能に影響を与えませんが、クリーンな実行のためには対処することを推奨します。特に`known_sections`への追加は簡単な修正で警告を解消できます。