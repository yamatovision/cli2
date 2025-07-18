
import asyncio
from openhands.core.schema import AgentState

class MockController:
    def __init__(self):
        self.state = MockState()
    
    async def set_agent_state_to(self, new_state):
        print(f"  [Task] 状態変更開始: {new_state}")
        await asyncio.sleep(0.1)  # 状態変更の処理時間をシミュレート
        self.state.agent_state = new_state
        print(f"  [Task] 状態変更完了: {new_state}")

class MockState:
    def __init__(self):
        self.agent_state = AgentState.RUNNING
        self.last_error = ""

async def simulate_timing_issue():
    """タイミング問題のシミュレーション"""
    controller = MockController()
    end_states = [AgentState.ERROR, AgentState.FINISHED]
    
    print("🎭 タイミング問題シミュレーション開始")
    print(f"   初期状態: {controller.state.agent_state}")
    print(f"   終了条件: {end_states}")
    
    # エラー発生をシミュレート
    print("\n📨 エラー発生 -> 非同期状態変更開始")
    asyncio.create_task(controller.set_agent_state_to(AgentState.ERROR))
    
    # メインループをシミュレート
    loop_count = 0
    max_loops = 10
    
    print("\n🔄 メインループ開始")
    while controller.state.agent_state not in end_states and loop_count < max_loops:
        loop_count += 1
        print(f"  [Loop {loop_count}] 現在の状態: {controller.state.agent_state}")
        print(f"  [Loop {loop_count}] 終了条件チェック: {controller.state.agent_state in end_states}")
        
        await asyncio.sleep(1)  # 元のコードと同じ待機時間
    
    print(f"\n✅ ループ終了")
    print(f"   最終状態: {controller.state.agent_state}")
    print(f"   ループ回数: {loop_count}")
    print(f"   正常終了: {controller.state.agent_state in end_states}")

if __name__ == "__main__":
    asyncio.run(simulate_timing_issue())
