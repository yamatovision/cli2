#!/usr/bin/env python3
"""
BlueLamp ヘルスチェックスクリプト
PyPI公開後の動作確認とモニタリング
"""

import sys
import subprocess
import time
import json
import requests
from datetime import datetime
from pathlib import Path

def check_pypi_availability():
    """PyPIでのパッケージ可用性をチェック"""
    print("🔍 PyPIでのパッケージ可用性をチェック中...")
    
    try:
        response = requests.get("https://pypi.org/pypi/bluelamp-ai/json", timeout=10)
        if response.status_code == 200:
            data = response.json()
            latest_version = data['info']['version']
            print(f"✅ PyPI: bluelamp-ai v{latest_version} が利用可能")
            return True, latest_version
        else:
            print(f"❌ PyPI: HTTPステータス {response.status_code}")
            return False, None
    except Exception as e:
        print(f"❌ PyPI接続エラー: {e}")
        return False, None

def check_portal_api():
    """Portal APIの稼働状況をチェック"""
    print("🔍 Portal APIの稼働状況をチェック中...")
    
    portal_url = "https://bluelamp-235426778039.asia-northeast1.run.app"
    
    try:
        # ヘルスチェックエンドポイント
        response = requests.get(f"{portal_url}/health", timeout=10)
        if response.status_code == 200:
            print(f"✅ Portal API: {portal_url} が正常稼働中")
            return True
        else:
            print(f"❌ Portal API: HTTPステータス {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Portal API接続エラー: {e}")
        return False

def check_cli_installation():
    """CLIのインストール可能性をチェック"""
    print("🔍 CLIのインストール可能性をチェック中...")
    
    try:
        # 仮想環境でのテストインストール
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "--user", "--upgrade", "bluelamp-ai"
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print("✅ CLI: PyPIからのインストールが成功")
            
            # バージョン確認
            version_result = subprocess.run([
                "bluelamp", "--version"
            ], capture_output=True, text=True, timeout=10)
            
            if version_result.returncode == 0:
                print(f"✅ CLI: バージョン確認成功 - {version_result.stdout.strip()}")
                return True
            else:
                print(f"❌ CLI: バージョン確認失敗 - {version_result.stderr}")
                return False
        else:
            print(f"❌ CLI: インストール失敗 - {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ CLI: インストールテストエラー - {e}")
        return False

def generate_monitoring_report():
    """モニタリングレポートを生成"""
    print("\n📊 モニタリングレポートを生成中...")
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "checks": {}
    }
    
    # PyPI可用性チェック
    pypi_available, version = check_pypi_availability()
    report["checks"]["pypi"] = {
        "status": "success" if pypi_available else "failed",
        "version": version,
        "url": "https://pypi.org/project/bluelamp-ai/"
    }
    
    # Portal APIチェック
    portal_available = check_portal_api()
    report["checks"]["portal_api"] = {
        "status": "success" if portal_available else "failed",
        "url": "https://bluelamp-235426778039.asia-northeast1.run.app"
    }
    
    # CLIインストールチェック
    cli_installable = check_cli_installation()
    report["checks"]["cli_installation"] = {
        "status": "success" if cli_installable else "failed",
        "command": "pip install bluelamp-ai"
    }
    
    # レポート保存
    report_file = Path(__file__).parent / "monitoring_report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"📄 レポート保存: {report_file}")
    
    # サマリー表示
    total_checks = len(report["checks"])
    successful_checks = sum(1 for check in report["checks"].values() if check["status"] == "success")
    
    print(f"\n📈 モニタリング結果サマリー:")
    print(f"   総チェック数: {total_checks}")
    print(f"   成功: {successful_checks}")
    print(f"   失敗: {total_checks - successful_checks}")
    print(f"   成功率: {(successful_checks/total_checks)*100:.1f}%")
    
    return report

def main():
    """メイン実行関数"""
    print("🔵 BlueLamp ヘルスチェック開始")
    print("=" * 50)
    
    report = generate_monitoring_report()
    
    print("\n" + "=" * 50)
    print("🔵 BlueLamp ヘルスチェック完了")
    
    # 全てのチェックが成功した場合は0、失敗があった場合は1を返す
    all_success = all(check["status"] == "success" for check in report["checks"].values())
    return 0 if all_success else 1

if __name__ == "__main__":
    sys.exit(main())