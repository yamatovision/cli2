"""
新しいPortal認証機能を提供するモジュール

このモジュールは、BlueLamp CLIと新しいPortal API（/api/cli/*）の認証連携を管理します。
新しいCLIトークン形式とX-CLI-Tokenヘッダーに対応します。
"""
import os
import json
import logging
import platform
from pathlib import Path
from typing import Optional, Dict, Any
import aiohttp
import asyncio
from datetime import datetime

logger = logging.getLogger('bluelamp.cli.auth_new')


class NewPortalAuthenticator:
    """新しいPortal認証を管理するクラス"""
    
    def __init__(self, base_url: Optional[str] = None):
        """
        Args:
            base_url: PortalのベースURL（例: https://portal.example.com/api）
        """
        self.base_url = base_url or os.getenv("PORTAL_BASE_URL", "https://bluelamp-235426778039.asia-northeast1.run.app/api")
        self.auth_file = Path.home() / ".config" / "bluelamp" / "auth_new.json"
        self.cli_token: Optional[str] = None
        self.user_info: Optional[Dict[str, Any]] = None
        self._last_check: Optional[datetime] = None
        
    def _ensure_config_dir(self):
        """設定ディレクトリが存在することを確認"""
        self.auth_file.parent.mkdir(parents=True, exist_ok=True)
        
    def save_cli_token(self, token_data: Dict[str, Any]) -> None:
        """
        CLIトークンをファイルに保存
        
        Args:
            token_data: Portal APIから受信したトークンデータ
        """
        logger.info(f"save_cli_token called with token: {token_data.get('token', '')[:8] + '...' if token_data.get('token') else 'None'}")
        
        self._ensure_config_dir()
        logger.info(f"Config directory ensured: {self.auth_file.parent}")
        
        # トークンの形式を検証
        token = token_data.get('token')
        if not self._validate_cli_token_format(token):
            logger.error(f"Invalid CLI token format: {token}")
            raise ValueError("Invalid CLI token format. Must start with 'cli_' and contain valid characters.")
        
        logger.info("CLI token format validation passed")
        
        auth_data = {
            "token": token,
            "userId": token_data.get('userId'),
            "userEmail": token_data.get('userEmail'),
            "userName": token_data.get('userName'),
            "userRole": token_data.get('userRole'),
            "expiresIn": token_data.get('expiresIn'),
            "expiresAt": token_data.get('expiresAt'),
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
        
        self.cli_token = token
        self.user_info = {
            "userId": token_data.get('userId'),
            "email": token_data.get('userEmail'),
            "name": token_data.get('userName'),
            "role": token_data.get('userRole')
        }
        logger.info("CLI token saved successfully")
        
    def load_cli_token(self) -> Optional[str]:
        """
        保存されたCLIトークンを読み込む
        
        Returns:
            CLIトークン（存在しない場合はNone）
        """
        if not self.auth_file.exists():
            logger.debug("Auth file not found")
            return None
            
        try:
            with open(self.auth_file, 'r') as f:
                auth_data = json.load(f)
                token = auth_data.get("token")
                
                if token and self._validate_cli_token_format(token):
                    self.cli_token = token
                    # ユーザー情報も復元
                    self.user_info = {
                        "userId": auth_data.get('userId'),
                        "email": auth_data.get('userEmail'),
                        "name": auth_data.get('userName'),
                        "role": auth_data.get('userRole')
                    }
                    logger.debug("CLI token loaded successfully")
                    return token
                else:
                    logger.warning("Invalid CLI token format in auth file")
                    return None
                    
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Failed to load auth file: {e}")
            return None
            
    def _validate_cli_token_format(self, token: str) -> bool:
        """
        CLIトークンの形式を検証
        
        Args:
            token: 検証するCLIトークン
            
        Returns:
            形式が正しい場合True
        """
        if not token:
            return False
            
        # cli_で始まる
        if not token.startswith("cli_"):
            return False
            
        # 最小長チェック（cli_ + 最低限の文字数）
        if len(token) < 10:
            return False
            
        return True
            
    def _get_device_info(self) -> Dict[str, str]:
        """
        デバイス情報を取得
        
        Returns:
            デバイス情報の辞書
        """
        return {
            "deviceName": f"BlueLamp CLI on {platform.node()}",
            "platform": platform.system().lower(),
            "userAgent": "BlueLamp CLI v1.0"
        }
            
    async def verify_cli_token(self, token: Optional[str] = None) -> Dict[str, Any]:
        """
        CLIトークンを検証
        
        Args:
            token: 検証するCLIトークン（省略時は保存済みのトークンを使用）
            
        Returns:
            検証結果の辞書
            
        Raises:
            aiohttp.ClientError: ネットワークエラー
            ValueError: トークンが無効
        """
        if token is None:
            token = self.cli_token
            
        if not token:
            raise ValueError("No CLI token provided")
            
        url = f"{self.base_url}/cli/verify"
        headers = {"X-CLI-Token": token}
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, headers=headers) as response:
                    # 404エラーを先にチェック
                    if response.status == 404:
                        logger.error(f"CLI verification endpoint not found: {response.status}")
                        raise ValueError("CLI authentication service unavailable")
                    
                    # JSONレスポンスを安全にパース
                    try:
                        data = await response.json()
                    except Exception as json_error:
                        logger.error(f"Failed to parse JSON response: {json_error}")
                        if response.status == 404:
                            raise ValueError("CLI authentication service unavailable")
                        else:
                            raise ValueError(f"Invalid response format: {response.status}")
                    
                    if response.status == 200:
                        self.user_info = data.get("user")
                        self._last_check = datetime.now()
                        logger.info(f"CLI authentication successful for user: {self.user_info.get('name')}")
                        return data
                        
                    elif response.status == 401:
                        error_msg = data.get("error", "Invalid CLI token")
                        logger.error(f"CLI authentication failed: {error_msg}")
                        raise ValueError(f"CLI authentication failed: {error_msg}")
                        
                    elif response.status == 403:
                        error_msg = data.get("error", "User is disabled")
                        logger.error(f"Access forbidden: {error_msg}")
                        raise ValueError(f"Access forbidden: {error_msg}")
                        
                    else:
                        logger.error(f"Unexpected response status: {response.status}")
                        raise ValueError(f"Unexpected response status: {response.status}")
                        
            except aiohttp.ClientError as e:
                logger.error(f"Network error during CLI authentication: {e}")
                raise
                
    def clear_auth(self) -> None:
        """認証情報をクリア"""
        if self.auth_file.exists():
            self.auth_file.unlink()
            
        self.cli_token = None
        self.user_info = None
        self._last_check = None
        logger.info("CLI authentication cleared")
        
    def is_authenticated(self) -> bool:
        """
        認証済みかどうかを確認
        
        Returns:
            認証済みの場合True
        """
        return self.cli_token is not None and self.user_info is not None
        
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
        メール/パスワードで新しいPortal認証を行い、CLIトークンを自動取得
        
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
        
        url = f"{self.base_url}/cli/login"
        payload = {
            "email": email,
            "password": password,
            "deviceInfo": self._get_device_info()
        }
        
        # デバッグ: 実際の接続先を表示
        logger.info(f"Connecting to Portal: {self.base_url}")
        print(f"Portal URL: {self.base_url}")
        print(f"Login endpoint: {url}")
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, json=payload) as response:
                    # レスポンスのデバッグ情報
                    logger.info(f"Login response status: {response.status}")
                    
                    try:
                        data = await response.json()
                        logger.info(f"Login response data: {data}")
                    except Exception as json_error:
                        logger.error(f"Failed to parse JSON response: {json_error}")
                        text_response = await response.text()
                        logger.error(f"Raw response: {text_response}")
                        raise ValueError(f"Invalid JSON response: {response.status}")
                    
                    if response.status == 200 and data.get("success"):
                        response_data = data.get("data", {})
                        cli_token = response_data.get("token")
                        
                        logger.info(f"CLI token in response: {cli_token[:8] + '...' if cli_token else 'None'}")
                        logger.info(f"Response data keys: {list(response_data.keys())}")
                        
                        if cli_token:
                            # CLIトークンを保存
                            logger.info(f"Saving CLI token to: {self.auth_file}")
                            self.save_cli_token(response_data)
                            logger.info("CLI token saved successfully")
                            
                            logger.info(f"Login successful for user: {response_data.get('userName')}")
                            print(f"✅ Login successful! Welcome, {response_data.get('userName')}")
                            return True
                        else:
                            logger.error("CLI token not found in response")
                            logger.error(f"Response data keys: {list(response_data.keys())}")
                            raise ValueError("Portal側でCLIトークンが生成されませんでした。レスポンスに'token'フィールドが含まれていません。")
                            
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
    
    async def logout_from_portal(self) -> bool:
        """
        Portal側にログアウトリクエストを送信してCLIトークンを無効化
        
        Returns:
            ログアウト成功時True
        """
        if not self.cli_token:
            logger.debug("No CLI token to logout")
            return True
            
        url = f"{self.base_url}/cli/logout"
        headers = {"X-CLI-Token": self.cli_token}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers) as response:
                    try:
                        data = await response.json()
                    except:
                        data = {}
                    
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
            # Portal側でCLIトークンを無効化
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
            # Portal側でCLIトークンを無効化
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

    async def prompt_for_login(self) -> bool:
        """
        ユーザーにログインを促すプロンプト（非同期版）
        
        Returns:
            ログイン成功時True
        """
        print("\n🔐 BlueLamp CLI 新認証システム")
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
        print("\n🔐 BlueLamp CLI 新認証システム")
        print("Portalアカウントでログインしてください。")
        print()
        
        try:
            # 非同期関数を同期的に実行
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.login_with_email_password())
        except Exception as e:
            print(f"❌ ログインに失敗しました: {e}")
            return False