# 🧠 システムプロンプト切り替え vs コンテクスト注入の違い

> **重要な質問**: 「セッション内切り替えはシステムプロンプトが変わるだけ？マイクロエージェントとの違いは？」

## 🎯 **核心的な違い**

### 📊 **比較表**

| 項目 | マイクロエージェント | セッション内切り替え |
|------|-------------------|-------------------|
| **変更箇所** | コンテクスト注入 | システムプロンプト交換 |
| **変更範囲** | 一時的な追加情報 | エージェントの根本的性格 |
| **変更タイミング** | メッセージごと | 明示的な切り替え時 |
| **持続性** | 1回のメッセージのみ | セッション終了まで |
| **エージェントの本質** | 変わらない | 完全に変わる |

---

## 🧩 **マイクロエージェント：コンテクスト注入**

### 🎯 **仕組み**

**定義**: システムプロンプトは変えずに、**追加情報をコンテクストに注入**

```mermaid
graph TD
    A[ユーザーメッセージ: "Reactでコンポーネント作って"] --> B[RecallAction]
    B --> C[React知識マイクロエージェント]
    C --> D[コンテクスト注入]
    
    E[システムプロンプト: CodeActAgent] --> F[LLM]
    D --> F
    G[会話履歴] --> F
    
    F --> H[React知識付きCodeActAgentとして回答]
    
    style E fill:#e1f5fe
    style D fill:#fff3e0
    style H fill:#e8f5e8
```

### 🔧 **実際のプロンプト構造**

```python
# マイクロエージェントの場合
final_prompt = f"""
{system_prompt}  # CodeActAgentのシステムプロンプト（不変）

{conversation_history}  # 会話履歴

<EXTRA_INFO>  # 🔑 ここが注入部分
The following information has been included based on a keyword match for "react".
Reactのベストプラクティス:
- コンポーネントはPascalCaseで命名
- useStateでstate管理
- propsは読み取り専用
</EXTRA_INFO>

{current_user_message}  # 現在のユーザーメッセージ
"""
```

### ✅ **マイクロエージェントの特徴**

1. **システムプロンプト不変**
   ```python
   # 常にCodeActAgentのシステムプロンプト
   system_prompt = "You are CodeActAgent, a helpful AI assistant..."
   ```

2. **一時的な知識追加**
   ```python
   # 1回のメッセージにのみ有効
   extra_info = microagent.content  # React知識
   ```

3. **エージェントの本質は不変**
   - CodeActAgentとしての基本動作
   - React知識が「おまけ」として追加

---

## 🔄 **セッション内切り替え：システムプロンプト交換**

### 🎯 **仕組み**

**定義**: **システムプロンプト自体を完全に交換**して、エージェントの根本的性格を変更

```mermaid
graph TD
    A[ユーザー: "/switch ★15デバッグエンジニア"] --> B[AgentController]
    B --> C[現在のエージェント保存]
    C --> D[新しいエージェント作成]
    
    E[CodeActAgentシステムプロンプト] --> F[削除]
    G[★15デバッグエンジニアシステムプロンプト] --> H[設定]
    
    D --> I[self.agent = DebugAgent]
    H --> I
    
    I --> J[完全に異なるエージェントとして動作]
    
    style E fill:#ffebee
    style G fill:#e8f5e8
    style J fill:#e8f5e8
```

### 🔧 **実際のプロンプト構造**

```python
# セッション内切り替えの場合

# 切り替え前（CodeActAgent）
system_prompt_before = """
You are CodeActAgent, a helpful AI assistant that can interact with a computer to solve tasks.
You should be thorough, methodical, and prioritize quality over speed.
"""

# 切り替え後（★15デバッグエンジニア）
system_prompt_after = """
あなたは★15デバッグエンジニアです。
専門分野：
- バグの根本原因分析
- 効率的なデバッグ手法
- テスト駆動デバッグ
- パフォーマンス問題の特定

性格：
- 論理的で体系的
- 問題を細分化して分析
- 再現可能なテストケースを重視
"""

# 🔑 システムプロンプト自体が完全に変わる
final_prompt = f"""
{system_prompt_after}  # 完全に異なるシステムプロンプト

{conversation_history}  # 同じ会話履歴（セッション継続）

{current_user_message}
"""
```

### ✅ **セッション内切り替えの特徴**

1. **システムプロンプト完全交換**
   ```python
   # エージェント自体が変わる
   self.agent = DebugAgent()  # 完全に異なるクラス
   ```

2. **永続的な性格変更**
   ```python
   # セッション終了まで継続
   while session_active:
       response = debug_agent.generate_response()
   ```

3. **エージェントの本質が変わる**
   - ★15デバッグエンジニアとしての専門動作
   - 思考パターン、アプローチ、専門知識すべてが変更

---

## 🎯 **具体的な動作例での比較**

### 🧩 **マイクロエージェント：コンテクスト注入**

```bash
# ユーザー
"Reactコンポーネントのバグを修正して"

# システム内部処理
1. システムプロンプト: CodeActAgent（不変）
2. RecallAction: "React"キーワード検出
3. React知識マイクロエージェント発動
4. コンテクスト注入: React知識を追加

# 最終プロンプト
"""
You are CodeActAgent...  # 元のシステムプロンプト

<EXTRA_INFO>
Reactのベストプラクティス...  # 注入された知識
</EXTRA_INFO>

User: Reactコンポーネントのバグを修正して
"""

# 結果
CodeActAgent + React知識 として回答

# 次のメッセージ
"TypeScriptでAPI作って"
# → React知識は消え、TypeScript知識が注入
```

### 🔄 **セッション内切り替え：システムプロンプト交換**

```bash
# ユーザー
"/switch ★15デバッグエンジニア"

# システム内部処理
1. 現在のエージェント（CodeActAgent）を停止
2. ★15デバッグエンジニアのシステムプロンプトを読み込み
3. self.agent = DebugAgent() に交換
4. セッション状態は継続

# 最終プロンプト
"""
あなたは★15デバッグエンジニアです...  # 完全に異なるシステムプロンプト

User: Reactコンポーネントのバグを修正して
"""

# 結果
★15デバッグエンジニア として回答

# 次のメッセージ
"さらにテストケースを追加して"
# → 引き続き★15デバッグエンジニアとして動作
```

---

## 🔧 **実装レベルでの違い**

### 🧩 **マイクロエージェント実装**

```python
class CodeActAgent:
    def __init__(self):
        self.system_prompt = "You are CodeActAgent..."  # 固定
    
    def step(self, state: State) -> Action:
        # 1. ユーザーメッセージ分析
        user_message = state.get_current_user_message()
        
        # 2. マイクロエージェント検索
        microagents = self.find_matching_microagents(user_message)
        
        # 3. コンテクスト構築
        context = self.build_context(state.history)
        for microagent in microagents:
            context += f"\n<EXTRA_INFO>\n{microagent.content}\n</EXTRA_INFO>"
        
        # 4. プロンプト構築（システムプロンプトは不変）
        prompt = f"{self.system_prompt}\n{context}\n{user_message}"
        
        # 5. LLM呼び出し
        return self.llm.generate(prompt)
```

### 🔄 **セッション内切り替え実装**

```python
class AgentController:
    def __init__(self):
        self.agent: Agent = CodeActAgent()  # 初期エージェント
        self.session_state = SessionState()  # セッション状態
    
    def switch_agent(self, target_agent_name: str):
        # 1. 現在のエージェント状態保存
        current_context = self.session_state.save_context()
        
        # 2. 新しいエージェント作成（🔑 完全に異なるクラス）
        if target_agent_name == "★15デバッグエンジニア":
            new_agent = DebugAgent()
        elif target_agent_name == "★2UI/UXデザイナー":
            new_agent = UIUXAgent()
        
        # 3. エージェント交換（🔑 システムプロンプトも変わる）
        self.agent = new_agent
        
        # 4. セッション状態復元
        self.session_state.restore_context(current_context)
    
    def step(self, user_message: str) -> str:
        # 現在のエージェントで処理（システムプロンプトは交換済み）
        return self.agent.step(user_message, self.session_state)

class DebugAgent(Agent):
    def __init__(self):
        self.system_prompt = "あなたは★15デバッグエンジニアです..."  # 専用プロンプト
    
    def step(self, user_message: str, state: SessionState) -> str:
        # デバッグ専用の思考パターン
        prompt = f"{self.system_prompt}\n{state.history}\n{user_message}"
        return self.llm.generate(prompt)
```

---

## 🎯 **セッション継続の仕組み**

### 📝 **セッション状態の管理**

```python
class SessionState:
    def __init__(self):
        self.conversation_history = []  # 会話履歴
        self.workspace_context = {}     # ワークスペース情報
        self.file_states = {}          # ファイル状態
        self.environment_vars = {}     # 環境変数
    
    def save_context(self) -> dict:
        """現在のセッション状態を保存"""
        return {
            'history': self.conversation_history,
            'workspace': self.workspace_context,
            'files': self.file_states,
            'env': self.environment_vars
        }
    
    def restore_context(self, context: dict):
        """セッション状態を復元"""
        self.conversation_history = context['history']
        self.workspace_context = context['workspace']
        self.file_states = context['files']
        self.environment_vars = context['env']
```

### 🔄 **エージェント切り替え時の継続性**

```python
# 切り替え前の状態
session_state = {
    'history': [
        "User: プロジェクトを作成して",
        "CodeActAgent: プロジェクトを作成しました",
        "User: バグがあるようです"
    ],
    'workspace': {'current_dir': '/project', 'files': ['app.py', 'test.py']},
    'files': {'app.py': 'def hello(): print("Hello")'}
}

# エージェント切り替え
controller.switch_agent("★15デバッグエンジニア")

# 切り替え後（セッション状態は継続）
session_state = {
    'history': [  # 🔑 履歴は保持
        "User: プロジェクトを作成して",
        "CodeActAgent: プロジェクトを作成しました",
        "User: バグがあるようです",
        "System: Switched to ★15デバッグエンジニア"
    ],
    'workspace': {'current_dir': '/project', 'files': ['app.py', 'test.py']},  # 🔑 ワークスペースも保持
    'files': {'app.py': 'def hello(): print("Hello")'}  # 🔑 ファイル状態も保持
}

# 新しいエージェントは過去の文脈を理解して動作
debug_agent.step("バグを修正して", session_state)
# → 過去の会話とファイル状態を理解してデバッグ開始
```

---

## 🎯 **ユーザー体験の違い**

### 🧩 **マイクロエージェント体験**

```bash
User: "Reactでコンポーネント作って"
CodeActAgent: "Reactのベストプラクティスに従って、以下のコンポーネントを作成します..."
# （React知識が自動的に活用される）

User: "TypeScriptでAPI作って"  
CodeActAgent: "TypeScriptの型安全性を活用して、以下のAPIを作成します..."
# （TypeScript知識が自動的に活用される）

# 🔑 ユーザーは常にCodeActAgentと会話している感覚
```

### 🔄 **セッション内切り替え体験**

```bash
User: "/switch ★15デバッグエンジニア"
System: "★15デバッグエンジニアに切り替えました"

User: "バグを修正して"
★15デバッグエンジニア: "まず、バグの再現手順を確認させてください。ログファイルを確認し、エラーの根本原因を特定します..."

User: "テストケースも追加して"
★15デバッグエンジニア: "バグ修正後、回帰テストを防ぐためのテストケースを以下のように追加します..."

# 🔑 ユーザーは★15デバッグエンジニアと会話している感覚
```

---

## 🎯 **まとめ：根本的な違い**

### 🧩 **マイクロエージェント**
- **本質**: CodeActAgent + 一時的な知識
- **変更**: コンテクストに情報追加
- **継続性**: 1メッセージのみ
- **体験**: 「賢いCodeActAgent」

### 🔄 **セッション内切り替え**
- **本質**: 完全に異なるエージェント
- **変更**: システムプロンプト完全交換
- **継続性**: セッション終了まで
- **体験**: 「専門家エージェント」

### 🎉 **結論**

**ユーザーの理解は完全に正しい**：

1. **セッション内切り替え** = セッション継続 + システムプロンプト交換
2. **マイクロエージェント** = システムプロンプト不変 + コンテクスト注入

**継続的な専門作業には「システムプロンプト交換」が最適**です！