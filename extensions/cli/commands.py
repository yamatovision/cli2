import asyncio
import sys
from pathlib import Path

from prompt_toolkit import print_formatted_text
from prompt_toolkit.shortcuts import clear, print_container
from prompt_toolkit.widgets import Frame, TextArea

from extensions.cli.settings import (
    display_settings,
    modify_llm_settings_advanced,
    modify_llm_settings_basic,
)
from extensions.cli.tui import (
    COLOR_GREY,
    UsageMetrics,
    cli_confirm,
    display_help,
    display_shutdown_message,
    display_status,
)
from extensions.cli.utils import (
    add_local_config_trusted_dir,
    get_local_config_trusted_dirs,
    read_file,
    write_to_file,
)
from prompt_toolkit.formatted_text import HTML
from core.config import (
    OpenHandsConfig,
)
from core.schema import AgentState
from core.events import EventSource
from core.events.action import (
    ChangeAgentStateAction,
    MessageAction,
)
from core.events.stream import EventStream
from core.storage.settings.file_settings_store import FileSettingsStore


async def handle_commands(
    command: str,
    event_stream: EventStream,
    usage_metrics: UsageMetrics,
    sid: str,
    config: OpenHandsConfig,
    current_dir: str,
    settings_store: FileSettingsStore,
) -> tuple[bool, bool]:
    close_repl = False
    new_session_requested = False

    # コマンドの前後の空白を削除
    command = command.strip()
    
    # /だけの場合はコマンドメニューを表示
    if command == '/':
        display_command_menu()
        return False, False
    
    # 先頭が/で始まる場合のみコマンドとして処理
    elif command.startswith('/'):
        # スペースで分割して最初の部分（コマンド名）を取得
        command_parts = command.split(maxsplit=1)
        command_name = command_parts[0] if command_parts else command
        
        # 既知のコマンドをチェック
        if command_name == '/exit':
            close_repl = handle_exit_command(
                event_stream,
                usage_metrics,
                sid,
            )
        elif command_name == '/help':
            handle_help_command(config.default_agent)
            # helpコマンドの後はプロンプトに戻る
            close_repl = False
        elif command_name == '/init':
            close_repl = await handle_init_command(
                config, event_stream, current_dir,
            )
        elif command_name == '/status':
            handle_status_command(usage_metrics, sid)
            # statusコマンドの後はプロンプトに戻る
            close_repl = False
        elif command_name == '/new':
            close_repl, new_session_requested = handle_new_command(
                event_stream, usage_metrics, sid,
            )
        elif command_name == '/settings':
            await handle_settings_command(config, settings_store)
            # settingsコマンドの後はプロンプトに戻る
            close_repl = False
        elif command_name == '/resume':
            close_repl, new_session_requested = await handle_resume_command(event_stream)
        elif command_name == '/logout':
            close_repl = await handle_logout_command(event_stream)
        else:
            # 認識されないコマンドの場合は、通常のメッセージとして処理
            close_repl = True
            action = MessageAction(content=command)
            event_stream.add_event(action, EventSource.USER)
    else:
        # /で始まらない場合は通常のメッセージとして処理
        close_repl = True
        action = MessageAction(content=command)
        event_stream.add_event(action, EventSource.USER)

    return close_repl, new_session_requested


def handle_exit_command(
    event_stream: EventStream, usage_metrics: UsageMetrics, sid: str,
) -> bool:
    close_repl = False

    confirm_exit = (
        cli_confirm('\nセッションを終了しますか？', ['はい終了します', 'いいえ続けます']) == 0
    )

    if confirm_exit:
        event_stream.add_event(
            ChangeAgentStateAction(AgentState.STOPPED),
            EventSource.ENVIRONMENT,
        )
        display_shutdown_message(usage_metrics, sid)
        close_repl = True

    return close_repl


def handle_help_command(agent_type: str | None = None) -> None:
    display_help(agent_type)


async def handle_init_command(
    config: OpenHandsConfig, event_stream: EventStream, current_dir: str,
) -> bool:
    # Microagent functionality has been removed
    print_formatted_text(
        '\n/initコマンドは削除されました。\n',
    )
    return False


def handle_status_command(usage_metrics: UsageMetrics, sid: str) -> None:
    display_status(usage_metrics, sid)


def handle_new_command(
    event_stream: EventStream, usage_metrics: UsageMetrics, sid: str,
) -> tuple[bool, bool]:
    close_repl = False
    new_session_requested = False

    new_session_requested = (
        cli_confirm(
            '\n現在のセッションが終了し、会話履歴が失われます。\n\n続行しますか？',
            ['はい、続行', 'いいえ、やめる'],
        )
        == 0
    )

    if new_session_requested:
        close_repl = True
        new_session_requested = True
        event_stream.add_event(
            ChangeAgentStateAction(AgentState.STOPPED),
            EventSource.ENVIRONMENT,
        )
        display_shutdown_message(usage_metrics, sid)

    return close_repl, new_session_requested


async def handle_settings_command(
    config: OpenHandsConfig,
    settings_store: FileSettingsStore,
) -> None:
    display_settings(config)
    modify_settings = cli_confirm(
        '\nWhich settings would you like to modify?',
        [
            'Basic',
            'Advanced',
            'Go back',
        ],
    )

    if modify_settings == 0:
        await modify_llm_settings_basic(config, settings_store)
    elif modify_settings == 1:
        await modify_llm_settings_advanced(config, settings_store)


# FIXME: Currently there's an issue with the actual 'resume' behavior.
# Setting the agent state to RUNNING will currently freeze the agent without continuing with the rest of the task.
# This is a workaround to handle the resume command for the time being. Replace user message with the state change event once the issue is fixed.
async def handle_resume_command(
    event_stream: EventStream,
) -> tuple[bool, bool]:
    close_repl = True
    new_session_requested = False

    event_stream.add_event(
        MessageAction(content='continue'),
        EventSource.USER,
    )

    # event_stream.add_event(
    #     ChangeAgentStateAction(AgentState.RUNNING),
    #     EventSource.ENVIRONMENT,
    # )

    return close_repl, new_session_requested




async def handle_logout_command(event_stream: EventStream | None = None) -> bool:
    """
    ログアウトコマンドの処理
    
    Args:
        event_stream: イベントストリーム（エージェント停止用）
    
    Returns:
        bool: 常にTrue（REPLを閉じる）
    """
    from extensions.cli.auth import get_authenticator
    import sys
    
    try:
        # 確認プロンプトを表示
        confirm_logout = (
            cli_confirm('\nログアウトしますか？', ['はい、ログアウト', 'いいえ、続ける']) == 0
        )
        
        if confirm_logout:
            authenticator = get_authenticator()
            # 非同期ログアウトを実行
            await authenticator.logout_async()
            print_formatted_text('\n✅ ログアウトしました\n')
            print_formatted_text('👋 またのご利用をお待ちしています！\n')
            
            # エージェントを停止
            if event_stream:
                event_stream.add_event(
                    ChangeAgentStateAction(AgentState.STOPPED),
                    EventSource.ENVIRONMENT,
                )
            
            # CLIを強制終了
            sys.exit(0)
        else:
            print_formatted_text('\nログアウトをキャンセルしました。\n')
            return False
            
    except Exception as e:
        print_formatted_text(f'\n❌ ログアウト中にエラーが発生しました: {e}\n')
        return False


def display_command_menu() -> None:
    """コマンドメニューを表示"""
    print_formatted_text('\n📦 使用可能なコマンド:')
    print_formatted_text(HTML('<grey>────────────────────────────────────────</grey>'))
    
    commands = [
        ('/help', 'ヘルプを表示'),
        ('/status', '現在の状態を表示'),
        ('/settings', '設定画面を開く'),
        ('/new', '新しい会話を開始'),
        ('/resume', 'エージェントを再開'),
        ('/logout', 'ログアウトして認証情報をクリア'),
        ('/exit', 'BlueLamp CLIを終了'),
    ]
    
    for cmd, desc in commands:
        print_formatted_text(HTML(f'<cyan>{cmd:<15}</cyan> <grey>{desc}</grey>'))
    
    print_formatted_text(HTML('<grey>────────────────────────────────────────</grey>'))
    print_formatted_text('')


def check_folder_security_agreement(config: OpenHandsConfig, current_dir: str) -> bool:
    # Directories trusted by user for the CLI to use as workspace
    # Config from ~/.openhands/config.toml overrides the app config

    app_config_trusted_dirs = config.sandbox.trusted_dirs
    local_config_trusted_dirs = get_local_config_trusted_dirs()

    trusted_dirs = local_config_trusted_dirs
    if not local_config_trusted_dirs:
        trusted_dirs = app_config_trusted_dirs

    is_trusted = current_dir in trusted_dirs

    if not is_trusted:
        security_frame = Frame(
            TextArea(
                text=(
                    f' Do you trust the files in this folder?\n\n'
                    f'   {current_dir}\n\n'
                    ' OpenHands may read and execute files in this folder with your permission.'
                ),
                style=COLOR_GREY(),
                read_only=True,
                wrap_lines=True,
            ),
            style=f'fg:{COLOR_GREY()}',
        )

        clear()
        print_container(security_frame)
        print_formatted_text('')

        confirm = (
            cli_confirm('続行しますか？', ['はい、続行', 'いいえ、終了']) == 0
        )

        if confirm:
            add_local_config_trusted_dir(current_dir)

        return confirm

    return True
