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
│                    B L U E L A M P                              │
│                    ─────────────────                            │
│                    さあ始めましょう                             │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
</blue>
"""

# カラーテーマ定義
COLORS = {
    # プライマリカラー（水色系）
    'primary': '#00AAFF',      # メイン水色（参照CLIと同じ明るい水色）
    'primary_light': '#66DDFF', # ライト水色
    'primary_dark': '#0088CC',  # ダーク水色
    
    # セカンダリカラー
    'secondary': '#17A2B8',     # アクセント水色（ターコイズ）
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
    'confirm_proceed': '続行しますか？ (h)はい/(i)いいえ/(t)つねに許可',
    'confirm_agent_handoff': 'エージェントを切り替えますか？ (h)はい/(i)いいえ/(t)つねに許可',
    'confirm_task_completion': 'タスクを完了しますか？ (h)はい/(i)いいえ/(t)つねに許可',
    'agent_switch_confirmation': 'エージェントを切り替えますか？ (h)はい/(i)いいえ/(t)つねに許可',
    'file_operation_confirmation': 'ファイル操作を実行しますか？ (h)はい/(i)いいえ/(t)つねに許可',
    'file_read_confirmation': 'ファイルを閲覧しますか？ (h)はい/(i)いいえ/(t)つねに許可',
    'file_edit_confirmation': 'ファイルを編集しますか？ (h)はい/(i)いいえ/(t)つねに許可',
    'command_execution_confirmation': 'コマンドを実行しますか？ (h)はい/(i)いいえ/(t)つねに許可',
    'confirm_yes': 'はい',
    'confirm_no': 'いいえ',
    'confirm_always': 'つねに許可',
    
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
    
    # Portal認証関連
    'portal_auth_required': 'Portal認証が必要です。',
    'portal_auth_prompt': 'Portalアカウントでログインしてください。',
    'portal_auth_success': '認証成功: {name} としてログインしました。',
    'portal_auth_error': '認証エラー: {error}',
    'portal_network_error': 'ネットワークエラー: {error}',
    'portal_auth_cancelled': '認証がキャンセルされました。',
    'portal_authenticated': '認証済み: {name} としてログイン中',
    'portal_key_invalid': 'APIキーが無効化されています。新しいキーを入力してください。',
    'portal_connection_error': '警告: Portal接続エラー - {error}',
    'portal_offline_mode': 'オフラインモードで続行します。',
    'portal_auth_check_failed': '認証エラー: APIキーが無効化されました。現在のタスク完了後に終了します。',
    'portal_retry_prompt': 'もう一度試すか、Ctrl+Cで終了してください。',
    'portal_connection_check': 'Portal接続を確認してください。',
}

# コマンド説明（日本語）
COMMAND_DESCRIPTIONS = {
    '/help': 'ヘルプを表示',
    '/status': '現在の状態を表示',
    '/settings': '設定画面を開く',
    '/clear': '画面をクリア',
    '/exit': 'BlueLamp CLIを終了',
    '/logout': 'ログアウトして認証情報をクリア',
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

def get_message(key: str, target_agent_name: str = None, current_agent_name: str = None, **kwargs) -> str:
    """
    メッセージキーから日本語メッセージを取得
    
    Args:
        key: メッセージキー
        target_agent_name: 切り替え先エージェント名（動的メッセージ生成用）
        current_agent_name: 現在のエージェント名（動的メッセージ生成用）
        **kwargs: フォーマット用の引数
        
    Returns:
        フォーマットされたメッセージ
    """
    # 動的メッセージ生成（エージェント切り替え用）
    if key == 'confirm_task_completion' and target_agent_name:
        # オーケストレーター構成に基づく適切な表現
        if current_agent_name == 'OrchestrationAgent':
            # オーケストレーター → サブエージェント: 「依頼」
            return f'{target_agent_name}に依頼しますか？ (h)はい/(i)いいえ/(t)つねに許可'
        elif target_agent_name == 'OrchestrationAgent':
            # サブエージェント → オーケストレーター: 「戻る」
            return f'オーケストレーターに戻りますか？ (h)はい/(i)いいえ/(t)つねに許可'
        else:
            # その他の場合（フォールバック）
            return f'{target_agent_name}に切り替えますか？ (h)はい/(i)いいえ/(t)つねに許可'
    
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