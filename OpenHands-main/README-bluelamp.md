# BlueLamp - OpenHands CLI

BlueLampコマンドを使用してOpenHandsのインタラクティブモードを起動できます。

## インストール

```bash
# インストールスクリプトを実行
./install-bluelamp.sh
```

## 使い方

以下のいずれかのコマンドで起動できます：

```bash
# 英語コマンド
bluelamp

# 日本語コマンド
ブルーランプ
```

## 設定

`config.toml`ファイルで動作をカスタマイズできます：

- **エージェント**: デフォルトはCodeActAgent（要件定義エージェントとして動作予定）
- **ツール**: ファイル操作とbashコマンドのみ有効化
- **LLM**: Claude 3.5 Sonnetを使用

## 要件定義エージェントの設定

Claude Codeの要件定義エージェントを使用する場合：

1. 要件定義プロンプトファイルをコピー：
```bash
cp /path/to/01_requirements_engineer.md \
   openhands/agenthub/codeact_agent/prompts/requirements_engineer.j2
```

2. `config.toml`の以下の行のコメントを外す：
```toml
system_prompt_filename="requirements_engineer.j2"
```

## トラブルシューティング

- **コマンドが見つからない**: PATHに`/usr/local/bin`が含まれているか確認
- **権限エラー**: `sudo`でインストールスクリプトを実行
- **APIキーエラー**: 環境変数`ANTHROPIC_API_KEY`を設定するか、`config.toml`に記載
