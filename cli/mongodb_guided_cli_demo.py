#!/usr/bin/env python3
"""
Browser Agent を使用した MongoDB セットアップガイド CLI デモ

このスクリプトは Browser Agent がどのように動作するかを示すデモです。
実際の実装では OpenHands の Browser Agent を使用します。
"""

import time
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

class Color:
    """ターミナルカラー"""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'

class StepStatus(Enum):
    PENDING = "待機中"
    IN_PROGRESS = "実行中"
    USER_ACTION = "ユーザーアクション待ち"
    COMPLETED = "完了"
    ERROR = "エラー"

@dataclass
class GuideStep:
    """ガイドステップ"""
    id: int
    title: str
    action: str
    user_instruction: Optional[str] = None
    status: StepStatus = StepStatus.PENDING
    screenshot_path: Optional[str] = None

class MongoDBGuidedCLI:
    """MongoDB セットアップガイド CLI"""
    
    def __init__(self):
        self.steps: List[GuideStep] = []
        self.current_step = 0
        self.setup_steps()
    
    def setup_steps(self):
        """ステップを定義"""
        self.steps = [
            GuideStep(
                id=1,
                title="MongoDB Atlas サイトへアクセス",
                action="browser_agent.goto('https://cloud.mongodb.com')",
                user_instruction="ブラウザで https://cloud.mongodb.com を開いてください"
            ),
            GuideStep(
                id=2,
                title="サインアップページへ移動",
                action="browser_agent.click('Try Free')",
                user_instruction="「Try Free」または「無料で始める」ボタンをクリックしてください"
            ),
            GuideStep(
                id=3,
                title="アカウント情報入力",
                action="browser_agent.analyze_form_fields()",
                user_instruction="以下の情報を入力してください:\n  - メールアドレス\n  - パスワード（8文字以上）\n  - 名前（任意）"
            ),
            GuideStep(
                id=4,
                title="メール認証",
                action="browser_agent.wait_for_email_verification()",
                user_instruction="📧 メールを確認して認証リンクをクリックしてください"
            ),
            GuideStep(
                id=5,
                title="組織とプロジェクト作成",
                action="browser_agent.create_organization()",
                user_instruction="組織名とプロジェクト名を入力してください（例: MyCompany, MyFirstProject）"
            ),
            GuideStep(
                id=6,
                title="クラスター作成",
                action="browser_agent.create_free_cluster()",
                user_instruction="無料クラスター（M0 Sandbox）を選択して作成してください"
            ),
            GuideStep(
                id=7,
                title="データベースユーザー作成",
                action="browser_agent.setup_database_user()",
                user_instruction="データベースユーザーを作成:\n  - ユーザー名: dbUser\n  - パスワード: 安全なパスワードを生成"
            ),
            GuideStep(
                id=8,
                title="ネットワークアクセス設定",
                action="browser_agent.configure_network_access()",
                user_instruction="「Add IP Address」→「Allow Access from Anywhere」を選択（開発用）"
            ),
            GuideStep(
                id=9,
                title="接続文字列取得",
                action="browser_agent.get_connection_string()",
                user_instruction="「Connect」→「Connect your application」を選択"
            ),
            GuideStep(
                id=10,
                title="APIキー生成（オプション）",
                action="browser_agent.generate_api_key()",
                user_instruction="「Access Manager」→「API Keys」→「Create API Key」"
            )
        ]
    
    def display_header(self):
        """ヘッダー表示"""
        print(f"\n{Color.BOLD}🚀 MongoDB Atlas セットアップガイド{Color.END}")
        print("=" * 50)
        print(f"{Color.BLUE}Browser Agent が各ステップをガイドします{Color.END}\n")
    
    def display_current_step(self):
        """現在のステップを表示"""
        step = self.steps[self.current_step]
        
        print(f"\n{Color.BOLD}ステップ {step.id}/{len(self.steps)}: {step.title}{Color.END}")
        print("-" * 50)
        
        # Browser Agent の動作をシミュレート
        print(f"{Color.YELLOW}[Browser Agent 実行中...]{Color.END}")
        time.sleep(1)  # 実際はここで browser_agent が動作
        
        # ユーザーへの指示
        if step.user_instruction:
            print(f"\n{Color.GREEN}📌 実行してください:{Color.END}")
            print(f"   {step.user_instruction}")
        
        # 追加情報を表示
        self.show_additional_info(step)
    
    def show_additional_info(self, step: GuideStep):
        """ステップごとの追加情報"""
        if step.id == 3:
            print(f"\n{Color.BLUE}💡 ヒント:{Color.END}")
            print("   - パスワードは大文字・小文字・数字を含めてください")
            print("   - メールアドレスは実在するものを使用してください")
        
        elif step.id == 7:
            print(f"\n{Color.YELLOW}⚠️  重要:{Color.END}")
            print("   - このパスワードは後で使用するので安全に保管してください")
            print("   - 接続文字列に含まれます")
        
        elif step.id == 9:
            print(f"\n{Color.GREEN}📝 接続文字列の例:{Color.END}")
            print("   mongodb+srv://dbUser:<password>@cluster0.xxxxx.mongodb.net/")
            print("   ※ <password> を実際のパスワードに置き換えてください")
    
    def simulate_browser_agent_analysis(self):
        """Browser Agent の分析をシミュレート"""
        print(f"\n{Color.YELLOW}[Browser Agent 分析中...]{Color.END}")
        time.sleep(1)
        
        # 現在のページ情報を表示（実際は browser_agent.analyze_page() の結果）
        if self.current_step == 2:
            print("📄 現在のページ: MongoDB Atlas Sign Up")
            print("✅ 検出された要素:")
            print("   - Email 入力欄 (id: 'email-input')")
            print("   - Password 入力欄 (id: 'password-input')")
            print("   - 'Create Account' ボタン (class: 'signup-button')")
    
    def wait_for_user_confirmation(self) -> bool:
        """ユーザーの確認を待つ"""
        response = input(f"\n{Color.BOLD}完了しましたか？ (y/n/help): {Color.END}").lower()
        
        if response == 'help':
            self.show_help()
            return self.wait_for_user_confirmation()
        
        return response == 'y'
    
    def show_help(self):
        """ヘルプ表示"""
        print(f"\n{Color.BLUE}ヘルプ:{Color.END}")
        print("- 問題が発生した場合は、ページをリロードしてやり直してください")
        print("- CAPTCHAが表示された場合は、手動で解決してください")
        print("- 2段階認証が有効な場合は、認証コードを入力してください")
    
    def run(self):
        """メインループ"""
        self.display_header()
        
        while self.current_step < len(self.steps):
            self.display_current_step()
            self.simulate_browser_agent_analysis()
            
            if self.wait_for_user_confirmation():
                print(f"{Color.GREEN}✓ ステップ {self.current_step + 1} 完了{Color.END}")
                self.current_step += 1
            else:
                print(f"{Color.YELLOW}もう一度お試しください{Color.END}")
        
        self.show_completion_message()
    
    def show_completion_message(self):
        """完了メッセージ"""
        print(f"\n{Color.GREEN}{Color.BOLD}🎉 セットアップ完了！{Color.END}")
        print("=" * 50)
        print("\n取得した情報:")
        print("- 接続文字列: mongodb+srv://dbUser:<password>@cluster0.xxxxx.mongodb.net/")
        print("- データベース名: myDatabase")
        print("- コレクション名: myCollection")
        
        print(f"\n{Color.BLUE}次のステップ:{Color.END}")
        print("1. 接続文字列を環境変数に設定")
        print("2. アプリケーションから接続テスト")
        print("3. データモデルの設計")

def main():
    """エントリーポイント"""
    print("MongoDB Atlas セットアップガイドを開始します...")
    print("このデモは Browser Agent の動作をシミュレートしています")
    
    cli = MongoDBGuidedCLI()
    
    try:
        cli.run()
    except KeyboardInterrupt:
        print(f"\n\n{Color.YELLOW}ガイドを中断しました{Color.END}")
    except Exception as e:
        print(f"\n{Color.RED}エラーが発生しました: {e}{Color.END}")

if __name__ == "__main__":
    main()