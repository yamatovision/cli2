#!/usr/bin/env python3
"""
Python型エラー分析システム
mypyを使用してcliディレクトリ内のPythonコードの型エラーを収集・分析
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

# プロジェクトルートディレクトリ
PROJECT_ROOT = Path(__file__).parent.parent.parent
CLI_DIR = PROJECT_ROOT / "cli"
SCRIPTS_DIR = PROJECT_ROOT / "scripts" / "py-error"
TASKS_FILE = SCRIPTS_DIR / "tasks.json"
LOGS_DIR = SCRIPTS_DIR / "logs"
ERROR_LOG_FILE = LOGS_DIR / "errors_latest.json"

def ensure_directories():
    """必要なディレクトリを作成"""
    LOGS_DIR.mkdir(parents=True, exist_ok=True)

def load_tasks() -> Dict[str, Any]:
    """tasks.jsonを読み込み"""
    if TASKS_FILE.exists():
        try:
            with open(TASKS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            pass
    
    # デフォルトのtasks.json構造
    return {
        "updated": datetime.now().strftime("%Y/%m/%d %H:%M:%S"),
        "working": {}
    }

def save_tasks(tasks: Dict[str, Any]):
    """tasks.jsonを保存"""
    tasks["updated"] = datetime.now().strftime("%Y/%m/%d %H:%M:%S")
    with open(TASKS_FILE, 'w', encoding='utf-8') as f:
        json.dump(tasks, f, indent=2, ensure_ascii=False)

def check_tasks_status(tasks: Dict[str, Any]):
    """25分ルールチェック"""
    now = datetime.now()
    
    for agent, task in tasks.get("working", {}).items():
        try:
            started_at = datetime.strptime(task["startedAt"], "%Y/%m/%d %H:%M:%S")
            elapsed = (now - started_at).total_seconds()
            
            if elapsed > 25 * 60:  # 25分
                print(f"⚠️  警告: {agent}の作業が25分を超過しています")
                print(f"   → {task['error']}は放棄されたとみなされます")
        except (ValueError, KeyError):
            continue

def run_mypy_check() -> Dict[str, Any]:
    """mypyを実行して型エラーを収集"""
    print("🔍 mypyによる型チェックを実行中...")
    
    # mypy設定ファイルのパス
    mypy_config = CLI_DIR / "dev_config" / "python" / "mypy.ini"
    
    # mypyコマンドを構築
    cmd = [
        sys.executable, "-m", "mypy",
        "--config-file", str(mypy_config),
        "--show-error-codes",
        "--show-column-numbers",
        "--no-error-summary",
        str(CLI_DIR)
    ]
    
    try:
        # mypyを実行
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT
        )
        
        # エラー出力をパース（stdoutとstderrの両方を確認）
        raw_output = result.stdout + result.stderr
        errors = parse_mypy_output(raw_output)
        
        # エラーが見つからない場合、より詳細な出力を試す
        if not errors and result.returncode != 0:
            print("⚠️  初回チェックでエラーが見つからないため、詳細チェックを実行中...")
            detailed_cmd = cmd + ["--no-silence-site-packages"]
            detailed_result = subprocess.run(
                detailed_cmd,
                capture_output=True,
                text=True,
                cwd=PROJECT_ROOT
            )
            raw_output = detailed_result.stdout + detailed_result.stderr
            errors = parse_mypy_output(raw_output)
        
        return {
            "success": result.returncode == 0,
            "errors": errors,
            "raw_output": raw_output
        }
        
    except FileNotFoundError:
        print("❌ mypyが見つかりません。インストールしてください: pip install mypy")
        return {"success": False, "errors": [], "raw_output": "mypy not found"}
    except Exception as e:
        print(f"❌ mypy実行中にエラーが発生しました: {e}")
        return {"success": False, "errors": [], "raw_output": str(e)}

def parse_mypy_output(output: str) -> List[Dict[str, Any]]:
    """mypy出力をパースしてエラー情報を抽出"""
    errors = []
    
    for line in output.split('\n'):
        line = line.strip()
        if not line or line.startswith('Found') or line.startswith('Success'):
            continue
            
        # noteやhintは一旦スキップ（エラーのみ収集）
        if line.startswith('note:') or line.startswith('hint:'):
            continue
            
        # mypy出力形式: file:line:column: error: message [error-code]
        # または file:line: error: message [error-code]
        if ':' in line:
            parts = line.split(':', 4)  # 最大4つに分割
            if len(parts) >= 4:
                file_path = parts[0]
                try:
                    line_num = int(parts[1])
                    
                    # 3番目の部分が数字かどうかで列番号の有無を判定
                    if parts[2].strip().isdigit():
                        col_num = int(parts[2])
                        message_part = parts[3].strip()
                    else:
                        col_num = 0
                        message_part = parts[2].strip()
                    
                    # エラーメッセージとコードを分離
                    error_code = ""
                    if '[' in message_part and ']' in message_part:
                        bracket_start = message_part.rfind('[')
                        bracket_end = message_part.rfind(']')
                        if bracket_start < bracket_end:
                            error_code = message_part[bracket_start+1:bracket_end]
                            message_part = message_part[:bracket_start].strip()
                    
                    # エラータイプを抽出
                    error_type = "error"
                    if message_part.startswith("error:"):
                        message_part = message_part[6:].strip()
                    elif message_part.startswith("warning:"):
                        error_type = "warning"
                        message_part = message_part[8:].strip()
                    elif message_part.startswith("note:"):
                        error_type = "note"
                        message_part = message_part[5:].strip()
                    
                    # 相対パスに変換
                    if file_path.startswith(str(PROJECT_ROOT)):
                        file_path = os.path.relpath(file_path, PROJECT_ROOT)
                    elif file_path.startswith(str(CLI_DIR)):
                        file_path = os.path.relpath(file_path, PROJECT_ROOT)
                    else:
                        # cliディレクトリからの相対パスの場合
                        file_path = f"cli/{file_path}"
                    
                    errors.append({
                        "file": file_path,
                        "line": line_num,
                        "column": col_num,
                        "type": error_type,
                        "message": message_part,
                        "code": error_code,
                        "id": f"{error_code}:{os.path.basename(file_path)}:{line_num}"
                    })
                    
                except (ValueError, IndexError):
                    # パースできない行はスキップ
                    continue
    
    return errors

def save_error_log(errors: List[Dict[str, Any]], raw_output: str):
    """エラーログを保存"""
    log_data = {
        "timestamp": datetime.now().strftime("%Y/%m/%d %H:%M:%S"),
        "total_errors": len(errors),
        "errors": errors,
        "raw_output": raw_output
    }
    
    with open(ERROR_LOG_FILE, 'w', encoding='utf-8') as f:
        json.dump(log_data, f, indent=2, ensure_ascii=False)

def display_summary(errors: List[Dict[str, Any]], tasks: Dict[str, Any]):
    """エラーサマリーを表示"""
    print(f"\n📊 Python型エラー分析結果")
    print(f"=" * 50)
    print(f"総エラー数: {len(errors)}")
    
    if not errors:
        print("🎉 型エラーは見つかりませんでした！")
        return
    
    # エラータイプ別集計
    error_types = {}
    for error in errors:
        error_type = error.get("type", "unknown")
        error_types[error_type] = error_types.get(error_type, 0) + 1
    
    print(f"\nエラータイプ別:")
    for error_type, count in error_types.items():
        print(f"  {error_type}: {count}")
    
    # ファイル別集計
    file_errors = {}
    for error in errors:
        file_path = error.get("file", "unknown")
        file_errors[file_path] = file_errors.get(file_path, 0) + 1
    
    print(f"\nファイル別エラー数 (上位10件):")
    sorted_files = sorted(file_errors.items(), key=lambda x: x[1], reverse=True)[:10]
    for file_path, count in sorted_files:
        print(f"  {file_path}: {count}")
    
    # 作業中タスクの表示
    working_tasks = tasks.get("working", {})
    if working_tasks:
        print(f"\n🔧 作業中のタスク:")
        for agent, task in working_tasks.items():
            print(f"  {agent}: {task.get('error', 'unknown')} (開始: {task.get('startedAt', 'unknown')})")
    
    print(f"\n📝 詳細なエラー情報は {ERROR_LOG_FILE} に保存されました")

def main():
    """メイン処理"""
    ensure_directories()
    
    # tasks.jsonを読み込み
    tasks = load_tasks()
    
    # 25分ルールチェック
    check_tasks_status(tasks)
    
    # mypy型チェック実行
    result = run_mypy_check()
    
    # エラーログ保存
    save_error_log(result["errors"], result.get("raw_output", ""))
    
    # サマリー表示
    display_summary(result["errors"], tasks)
    
    # tasks.jsonを更新
    save_tasks(tasks)

if __name__ == "__main__":
    main()