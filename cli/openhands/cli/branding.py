"""
BlueLamp ブランディング定義モジュール

このモジュールはBlueLamp CLIのブランディング要素（ロゴ、カラー、メッセージ）を
一元管理します。
"""

from openhands import __version__

# BlueLamp ASCIIアート
BLUELAMP_BANNER = """
<blue>
╭─────────────────────────────────────────────────────────────────╮
│                                                                 │
│  ╔══╗ ┬   ╦ ╦ ╔═╗ ╦   ╔═╗ ╔╦╗ ╔═╗                             │
│  ╠═╗  │   ║ ║ ╠═╣ ║   ╠═╣ ║║║ ╠═╝                             │
│  ╚═╝  ┴─  ╚═╝ ╚═╝ ╚═╝ ╚═╝ ╩ ╩ ╩                               │
│                                                                 │
│                    🔵 BlueLamp CLI v{version} 🔵                    │
│                                                                 │
│              AIと一緒に、アイデアを形にしよう。                 │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
</blue>
""".format(version=__version__)

# カラーテーマ定義
COLORS = {
    # プライマリカラー（ブルー系）
    'primary': '#0066CC',      # メインブルー
    'primary_light': '#3399FF', # ライトブルー
    'primary_dark': '#003D7A',  # ダークブルー
    
    # セカンダリカラー
    'secondary': '#00AAFF',     # アクセントブルー
    'info': '#17A2B8',          # 情報表示用
    'success': '#28A745',       # 成功
    'warning': '#FFC107',       # 警告
    'error': '#DC3545',         # エラー
    
    # ニュートラルカラー
    'grey': '#808080',          # グレー
    'light_grey': '#D3D3D3',    # ライトグレー
    'dark_grey': '#404040',     # ダークグレー
    
    # 旧カラー（互換性のため）
    'gold': '#0066CC',          # 旧goldをprimaryにマップ
}

# プロンプトツールキット用スタイル定義
STYLE_DICT = {
    # メインカラー
    'blue': COLORS['primary'],
    'light_blue': COLORS['primary_light'],
    'dark_blue': COLORS['primary_dark'],
    
    # 状態カラー
    'info': COLORS['info'],
    'success': COLORS['success'],
    'warning': COLORS['warning'],
    'error': COLORS['error'],
    
    # ニュートラル
    'grey': COLORS['grey'],
    'light_grey': COLORS['light_grey'],
    'dark_grey': COLORS['dark_grey'],
    
    # 互換性（既存のgoldタグを置き換え）
    'gold': COLORS['primary'],
    
    # プロンプト専用
    'prompt': f"{COLORS['primary']} bold",
    'selected': f"{COLORS['secondary']} bold",
    'unselected': COLORS['grey'],
}

# 日本語メッセージ定義
MESSAGES = {
    # メイン画面
    'welcome': 'BlueLamp CLIへようこそ！',
    'build_prompt': '何を作りましょうか？',
    'loading_previous': '前回の会話を読み込んでいます。',
    'lets_start': 'さあ、始めましょう！',
    
    # エージェント状態
    'agent_running': 'エージェントが実行中です...',
    'agent_paused': 'エージェントを一時停止しました。',
    'agent_finished': 'タスクが完了しました。',
    'agent_waiting': 'エージェントがあなたの入力を待っています...',
    'agent_error': 'エラーが発生しました。',
    
    # 制御メッセージ
    'ctrl_c_exit': '終了しています...',
    'esc_cancel': 'ユーザーによってキャンセルされました。',
    'pausing_agent': 'エージェントを一時停止しています...',
    
    # 確認メッセージ
    'confirm_action': 'このアクションを実行しますか？',
    'confirm_yes': 'はい',
    'confirm_no': 'いいえ',
    'confirm_always': '常に許可',
    
    # セットアップ
    'no_settings': '設定が見つかりません。初期設定を開始します...',
    'setup_complete': '設定が完了しました！',
    'setup_failed': '設定に失敗しました。',
    
    # コマンド
    'command_help': 'ヘルプ',
    'command_status': 'ステータス',
    'command_settings': '設定',
    'command_clear': 'クリア',
    'command_exit': '終了',
    'command_save': '保存',
    'command_load': '読み込み',
    
    # エラーメッセージ
    'error_connection': '接続エラー: {error}',
    'error_generic': 'エラーが発生しました: {error}',
    'error_invalid_command': '無効なコマンドです: {command}',
    'error_file_not_found': 'ファイルが見つかりません: {file}',
    
    # 情報メッセージ
    'info_saving': '保存中...',
    'info_loading': '読み込み中...',
    'info_connecting': '接続中...',
    'info_initializing': '初期化中...',
    
    # プロンプト
    'prompt_continue': '続けますか？',
    'prompt_enter_command': 'コマンドを入力してください: ',
    'prompt_select_option': 'オプションを選択してください: ',
    
    # セッション関連
    'session_id': 'セッションID: {sid}',
    'session_resumed': 'セッション {sid} を再開しました',
    'session_error_recovery': '注意: 前回のセッションはエラーで終了しました。タスクを再開せず、状況を確認してください。',
    
    # タスク関連
    'task_completed': 'タスクが完了しました: {task}',
    'task_in_progress': 'タスクを実行中: {task}',
    'task_failed': 'タスクが失敗しました: {task}',
    
    # その他
    'press_key_continue': '続けるには任意のキーを押してください...',
    'shutting_down': 'シャットダウン中...',
}

# コマンド説明（日本語）
COMMAND_DESCRIPTIONS = {
    '/help': 'ヘルプを表示',
    '/status': '現在の状態を表示',
    '/settings': '設定画面を開く',
    '/clear': '画面をクリア',
    '/exit': 'BlueLamp CLIを終了',
    '/save': '現在のセッションを保存',
    '/load': '保存されたセッションを読み込み',
    '/stop': 'エージェントを停止',
    '/resume': 'エージェントを再開',
}

# 設定画面のラベル（日本語）
SETTINGS_LABELS = {
    'title': 'BlueLamp CLI 設定',
    'model': 'AIモデル',
    'api_key': 'APIキー',
    'temperature': '生成温度',
    'max_tokens': '最大トークン数',
    'save': '保存',
    'cancel': 'キャンセル',
    'reset': 'リセット',
    'advanced': '詳細設定',
    'basic': '基本設定',
}

def get_message(key: str, **kwargs) -> str:
    """
    メッセージキーから日本語メッセージを取得
    
    Args:
        key: メッセージキー
        **kwargs: フォーマット用の引数
        
    Returns:
        フォーマットされたメッセージ
    """
    message = MESSAGES.get(key, key)
    if kwargs:
        return message.format(**kwargs)
    return message

def get_color(key: str) -> str:
    """
    カラーキーから色コードを取得
    
    Args:
        key: カラーキー
        
    Returns:
        色コード（16進数）
    """
    return COLORS.get(key, COLORS['primary'])