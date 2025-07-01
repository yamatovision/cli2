"""
Portal認証機能を提供するモジュール

このモジュールは、BlueLamp CLIとPortalの認証連携を管理します。
APIキーの保存、読み込み、検証機能を提供します。
"""
import os
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any
import aiohttp
import asyncio
from datetime import datetime

logger = logging.getLogger('bluelamp.cli.auth')


class PortalAuthenticator:
    """Portal認証を管理するクラス"""
    
    def __init__(self, base_url: Optional[str] = None):
        """
        Args:
            base_url: PortalのベースURL（例: https://portal.example.com/api）
        """
        self.base_url = base_url or os.getenv("PORTAL_BASE_URL", "https://bluelamp-235426778039.asia-northeast1.run.app/api")
        self.auth_file = Path.home() / ".config" / "bluelamp" / "auth.json"
        self.api_key: Optional[str] = None
        self.user_info: Optional[Dict[str, Any]] = None
        self._last_check: Optional[datetime] = None
        
    def _ensure_config_dir(self):
        """設定ディレクトリが存在することを確認"""
        self.auth_file.parent.mkdir(parents=True, exist_ok=True)
        
    def save_api_key(self, api_key: str) -> None:
        """
        APIキーをファイルに保存
        
        Args:
            api_key: 保存するAPIキー
        """
        logger.info(f"save_api_key called with key: {api_key[:8] + '...' if api_key else 'None'}")
        
        self._ensure_config_dir()
        logger.info(f"Config directory ensured: {self.auth_file.parent}")
        
        # APIキーの形式を検証
        if not self._validate_api_key_format(api_key):
            logger.error(f"Invalid API key format: {api_key}")
            raise ValueError("Invalid API key format. Must start with 'CLI_' and be 68 characters long.")
        
        logger.info("API key format validation passed")
        
        auth_data = {
            "api_key": api_key,
            "saved_at": datetime.now().isoformat()
        }
        
        # ファイルに保存（パーミッションを制限）
        logger.info(f"Writing auth data to: {self.auth_file}")
        with open(self.auth_file, 'w') as f:
            json.dump(auth_data, f, indent=2)
        
        # ファイルのパーミッションを600に設定（所有者のみ読み書き可能）
        os.chmod(self.auth_file, 0o600)
        logger.info(f"Auth file saved with permissions 600: {self.auth_file}")
        
        # 保存確認
        if self.auth_file.exists():
            logger.info(f"Auth file exists after save: {self.auth_file}")
        else:
            logger.error(f"Auth file does not exist after save: {self.auth_file}")
        
        self.api_key = api_key
        logger.info("API key saved successfully")
        
    def load_api_key(self) -> Optional[str]:
        """
        保存されたAPIキーを読み込む
        
        Returns:
            APIキー（存在しない場合はNone）
        """
        if not self.auth_file.exists():
            logger.debug("Auth file not found")
            return None
            
        try:
            with open(self.auth_file, 'r') as f:
                auth_data = json.load(f)
                api_key = auth_data.get("api_key")
                
                if api_key and self._validate_api_key_format(api_key):
                    self.api_key = api_key
                    logger.debug("API key loaded successfully")
                    return api_key
                else:
                    logger.warning("Invalid API key format in auth file")
                    return None
                    
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Failed to load auth file: {e}")
            return None
            
    def _validate_api_key_format(self, api_key: str) -> bool:
        """
        APIキーの形式を検証
        
        Args:
            api_key: 検証するAPIキー
            
        Returns:
            形式が正しい場合True
        """
        if not api_key:
            return False
            
        # CLI_で始まり、全体で68文字
        if not api_key.startswith("CLI_"):
            return False
            
        if len(api_key) != 68:
            return False
            
        # CLI_の後は16進数文字列（小文字）
        hex_part = api_key[4:]
        try:
            int(hex_part, 16)
            return hex_part == hex_part.lower()
        except ValueError:
            return False
            
    async def verify_api_key(self, api_key: Optional[str] = None) -> Dict[str, Any]:
        """
        APIキーを検証
        
        Args:
            api_key: 検証するAPIキー（省略時は保存済みのキーを使用）
            
        Returns:
            検証結果の辞書
            
        Raises:
            aiohttp.ClientError: ネットワークエラー
            ValueError: APIキーが無効
        """
        if api_key is None:
            api_key = self.api_key
            
        if not api_key:
            raise ValueError("No API key provided")
            
        url = f"{self.base_url}/simple/auth/cli-verify"
        headers = {"X-API-Key": api_key}
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, headers=headers) as response:
                    # 404エラーを先にチェック
                    if response.status == 404:
                        logger.error(f"Authentication endpoint not found: {response.status}")
                        raise ValueError("Authentication service unavailable")
                    
                    # JSONレスポンスを安全にパース
                    try:
                        data = await response.json()
                    except Exception as json_error:
                        logger.error(f"Failed to parse JSON response: {json_error}")
                        if response.status == 404:
                            raise ValueError("Authentication service unavailable")
                        else:
                            raise ValueError(f"Invalid response format: {response.status}")
                    
                    if response.status == 200:
                        self.user_info = data.get("user")
                        self._last_check = datetime.now()
                        logger.info(f"Authentication successful for user: {self.user_info.get('name')}")
                        return data
                        
                    elif response.status == 401:
                        error_msg = data.get("error", "Invalid API key")
                        logger.error(f"Authentication failed: {error_msg}")
                        raise ValueError(f"Authentication failed: {error_msg}")
                        
                    elif response.status == 403:
                        error_msg = data.get("error", "User is disabled")
                        logger.error(f"Access forbidden: {error_msg}")
                        raise ValueError(f"Access forbidden: {error_msg}")
                        
                    else:
                        logger.error(f"Unexpected response status: {response.status}")
                        raise ValueError(f"Unexpected response status: {response.status}")
                        
            except aiohttp.ClientError as e:
                logger.error(f"Network error during authentication: {e}")
                raise
                
    def clear_auth(self) -> None:
        """認証情報をクリア"""
        if self.auth_file.exists():
            self.auth_file.unlink()
            
        self.api_key = None
        self.user_info = None
        self._last_check = None
        logger.info("Authentication cleared")
        
    def is_authenticated(self) -> bool:
        """
        認証済みかどうかを確認
        
        Returns:
            認証済みの場合True
        """
        return self.api_key is not None and self.user_info is not None
        
    def get_user_info(self) -> Optional[Dict[str, Any]]:
        """
        ユーザー情報を取得
        
        Returns:
            ユーザー情報の辞書（未認証の場合None）
        """
        return self.user_info
    
    def _get_email_input(self) -> str:
        """
        メールアドレス入力のヘルパーメソッド（同期処理）
        """
        try:
            email = input("Email: ").strip()
            return email
        except (EOFError, KeyboardInterrupt):
            return ""
    
    def _get_password_input(self) -> str:
        """
        パスワード入力のヘルパーメソッド（同期処理）
        パスワードを表示して入力（ユーザビリティ優先）
        """
        try:
            # 普通のinputを使用（パスワードが表示される）
            password = input("Password: ").strip()
            return password
        except (EOFError, KeyboardInterrupt):
            print()  # 改行を追加
            return ""
    
    async def login_with_email_password(self, email: Optional[str] = None, password: Optional[str] = None) -> bool:
        """
        メール/パスワードでPortal認証を行い、CLI APIキーを自動取得
        
        Args:
            email: メールアドレス（省略時は入力プロンプト）
            password: パスワード（省略時は入力プロンプト）
            
        Returns:
            ログイン成功時True
            
        Raises:
            aiohttp.ClientError: ネットワークエラー
            ValueError: 認証エラー
        """
        # メールアドレスの入力（同期処理）
        if email is None:
            email = self._get_email_input()
            if not email:
                raise ValueError("Email is required")
        
        # パスワードの入力（同期処理）
        if password is None:
            password = self._get_password_input()
            if not password:
                raise ValueError("Password is required")
        
        url = f"{self.base_url}/simple/auth/login"
        payload = {
            "email": email,
            "password": password,
            "clientType": "cli"
        }
        
        # デバッグ: 実際の接続先を表示
        logger.info(f"Connecting to Portal: {self.base_url}")
        print(f"Portal URL: {self.base_url}")
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, json=payload) as response:
                    data = await response.json()
                    
                    # デバッグ用ログ
                    logger.info(f"Login response status: {response.status}")
                    logger.info(f"Login response data: {data}")
                    
                    if response.status == 200 and data.get("success"):
                        response_data = data.get("data", {})
                        # CLI専用のAPIキーを取得（フォールバックなし）
                        cli_api_key = response_data.get("cliApiKey")
                        
                        logger.info(f"CLI API key in response: {cli_api_key[:8] + '...' if cli_api_key else 'None'}")
                        logger.info(f"Response data keys: {list(response_data.keys())}")
                        
                        if cli_api_key:
                            # CLI APIキーを保存
                            logger.info(f"Saving CLI API key to: {self.auth_file}")
                            self.save_api_key(cli_api_key)
                            logger.info("CLI API key saved successfully")
                            
                            # ユーザー情報を保存
                            self.user_info = response_data.get("user")
                            self._last_check = datetime.now()
                            
                            logger.info(f"Login successful for user: {self.user_info.get('name')}")
                            print(f"✅ Login successful! Welcome, {self.user_info.get('name')}")
                            return True
                        else:
                            logger.error("CLI API key not found in response")
                            logger.error(f"Response data keys: {list(response_data.keys())}")
                            logger.error("Portal側でCLI APIキーが生成されませんでした。")
                            logger.error("Portal側のログを確認し、clientType='cli'でのログイン処理を確認してください。")
                            raise ValueError("Portal側でCLI APIキーが生成されませんでした。レスポンスに'cliApiKey'フィールドが含まれていません。")
                            
                    elif response.status == 401:
                        error_msg = data.get("message", "Invalid email or password")
                        logger.error(f"Login failed: {error_msg}")
                        raise ValueError(f"Login failed: {error_msg}")
                        
                    else:
                        error_msg = data.get("message", f"Unexpected response status: {response.status}")
                        logger.error(f"Login error: {error_msg}")
                        raise ValueError(f"Login error: {error_msg}")
                        
            except aiohttp.ClientError as e:
                logger.error(f"Network error during login: {e}")
                raise
    
    async def prompt_for_login(self) -> bool:
        """
        ユーザーにログインを促すプロンプト（非同期版）
        
        Returns:
            ログイン成功時True
        """
        print("\n🔐 BlueLamp CLI 認証が必要です")
        print("Portalアカウントでログインしてください。")
        print()
        
        try:
            # 非同期関数を適切にawait
            return await self.login_with_email_password()
        except Exception as e:
            print(f"❌ ログインに失敗しました: {e}")
            return False

    def prompt_for_login_sync(self) -> bool:
        """
        ユーザーにログインを促すプロンプト（同期版・後方互換性のため保持）
        
        Returns:
            ログイン成功時True
        """
        print("\n🔐 BlueLamp CLI 認証が必要です")
        print("Portalアカウントでログインしてください。")
        print()
        
        try:
            # 非同期関数を同期的に実行
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.login_with_email_password())
        except Exception as e:
            print(f"❌ ログインに失敗しました: {e}")
            return False
    
    async def logout_from_portal(self) -> bool:
        """
        Portal側にログアウトリクエストを送信してCLI APIキーを無効化
        
        Returns:
            ログアウト成功時True
        """
        if not self.api_key:
            logger.debug("No API key to logout")
            return True
            
        url = f"{self.base_url}/simple/auth/cli-logout"
        headers = {"X-API-Key": self.api_key}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers) as response:
                    data = await response.json()
                    
                    if response.status == 200:
                        logger.info("Portal logout successful")
                        return True
                    else:
                        logger.warning(f"Portal logout failed: {data.get('error', 'Unknown error')}")
                        # Portal側のログアウトが失敗してもローカル認証情報は削除
                        return True
                        
        except aiohttp.ClientError as e:
            logger.warning(f"Network error during logout: {e}")
            # ネットワークエラーでもローカル認証情報は削除
            return True
        except Exception as e:
            logger.warning(f"Unexpected error during logout: {e}")
            # 予期しないエラーでもローカル認証情報は削除
            return True
    
    async def logout_async(self) -> bool:
        """
        非同期ログアウト処理（Portal側無効化 + ローカル認証情報削除）
        
        Returns:
            ログアウト成功時True
        """
        try:
            # Portal側でAPIキーを無効化
            await self.logout_from_portal()
            
            # ローカル認証情報をクリア
            self.clear_auth()
            
            logger.info("Logout completed successfully")
            print("✅ ログアウトしました")
            return True
            
        except Exception as e:
            logger.error(f"Logout error: {e}")
            # エラーが発生してもローカル認証情報は削除
            self.clear_auth()
            print("⚠️  ログアウトしました（一部エラーが発生しましたが、ローカル認証情報は削除されました）")
            return True

    def logout(self) -> bool:
        """
        同期ログアウト処理（後方互換性のため保持）
        
        Returns:
            ログアウト成功時True
        """
        try:
            # Portal側でAPIキーを無効化
            loop = asyncio.get_event_loop()
            loop.run_until_complete(self.logout_from_portal())
            
            # ローカル認証情報をクリア
            self.clear_auth()
            
            logger.info("Logout completed successfully")
            print("✅ ログアウトしました")
            return True
            
        except Exception as e:
            logger.error(f"Logout error: {e}")
            # エラーが発生してもローカル認証情報は削除
            self.clear_auth()
            print("⚠️  ログアウトしました（一部エラーが発生しましたが、ローカル認証情報は削除されました）")
            return True


# シングルトンインスタンス
_authenticator: Optional[PortalAuthenticator] = None


def get_authenticator(base_url: Optional[str] = None) -> PortalAuthenticator:
    """
    認証インスタンスを取得（シングルトン）
    
    Args:
        base_url: PortalのベースURL
        
    Returns:
        PortalAuthenticatorインスタンス
    """
    global _authenticator
    if _authenticator is None:
        _authenticator = PortalAuthenticator(base_url)
    return _authenticator


def main():
    """
    CLI認証のメイン関数
    """
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python -m openhands.cli.auth <command>")
        print("Commands: login, logout, status")
        return
    
    command = sys.argv[1]
    auth = get_authenticator()
    
    if command == "login":
        asyncio.run(auth.login_async())
    elif command == "logout":
        auth.logout()
    elif command == "status":
        if auth.is_authenticated():
            print(f"✅ Authenticated as: {auth.user_info.get('name', 'Unknown')}")
        else:
            print("❌ Not authenticated")
    else:
        print(f"Unknown command: {command}")


if __name__ == "__main__":
    main()