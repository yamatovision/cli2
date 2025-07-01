#!/usr/bin/env python3
"""Portal URLの確認"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from openhands.cli.auth import PortalAuthenticator

# 環境変数を確認
print("環境変数 PORTAL_BASE_URL:", os.getenv("PORTAL_BASE_URL", "未設定"))

# 実際に使用されるURLを確認
auth = PortalAuthenticator()
print("実際のbase_url:", auth.base_url)

# デフォルト値を確認
print("\nauth.pyのデフォルト値確認:")
with open("openhands/cli/auth.py", "r") as f:
    for i, line in enumerate(f):
        if "PORTAL_BASE_URL" in line and "getenv" in line:
            print(f"行{i+1}: {line.strip()}")