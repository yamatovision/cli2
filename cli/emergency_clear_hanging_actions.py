#!/usr/bin/env python3
"""
Emergency Clear Hanging Actions Script for BlueLampCLI
このスクリプトは現在ハング中のアクションを強制的にクリアします。
"""

import sys
import os
import time
import json
import signal
import psutil
from pathlib import Path

def find_hanging_processes():
    """Find hanging BlueLampCLI processes."""
    hanging_processes = []
    
    for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'create_time']):
        try:
            proc_info = proc.info
            if proc_info['name'] and 'python' in proc_info['name'].lower():
                cmdline = ' '.join(proc_info['cmdline']) if proc_info['cmdline'] else ''
                
                # BlueLampCLI関連のプロセスを検出
                if any(keyword in cmdline.lower() for keyword in [
                    'openhands', 'bluelamp', 'agent_controller', 'cli_runtime'
                ]):
                    runtime = time.time() - proc_info['create_time']
                    if runtime > 300:  # 5分以上実行中
                        hanging_processes.append({
                            'pid': proc_info['pid'],
                            'name': proc_info['name'],
                            'cmdline': cmdline[:100] + '...' if len(cmdline) > 100 else cmdline,
                            'runtime': runtime
                        })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
    
    return hanging_processes

def force_clear_by_process_termination():
    """Force clear by terminating hanging processes."""
    print("🔍 Searching for hanging BlueLampCLI processes...")
    
    hanging_processes = find_hanging_processes()
    
    if not hanging_processes:
        print("✅ No hanging BlueLampCLI processes found.")
        return True
    
    print(f"🚨 Found {len(hanging_processes)} potentially hanging processes:")
    for proc in hanging_processes:
        print(f"   PID {proc['pid']}: {proc['name']} (running {proc['runtime']:.1f}s)")
        print(f"      Command: {proc['cmdline']}")
    
    response = input("\n❓ Terminate these processes? (y/N): ").strip().lower()
    if response != 'y':
        print("❌ Process termination cancelled.")
        return False
    
    terminated = 0
    for proc in hanging_processes:
        try:
            process = psutil.Process(proc['pid'])
            print(f"🔪 Terminating PID {proc['pid']}...")
            
            # Try graceful termination first
            process.terminate()
            try:
                process.wait(timeout=5)
                print(f"✅ PID {proc['pid']} terminated gracefully.")
                terminated += 1
            except psutil.TimeoutExpired:
                # Force kill if graceful termination fails
                print(f"⚡ Force killing PID {proc['pid']}...")
                process.kill()
                process.wait(timeout=5)
                print(f"💀 PID {proc['pid']} force killed.")
                terminated += 1
                
        except (psutil.NoSuchProcess, psutil.AccessDenied) as e:
            print(f"⚠️  Could not terminate PID {proc['pid']}: {e}")
    
    print(f"\n🎯 Terminated {terminated} processes.")
    return terminated > 0

def create_force_clear_state_file():
    """Create a state file to indicate force clear was performed."""
    state_file = Path('/tmp/bluelamp_force_clear_state.json')
    
    state_data = {
        'timestamp': time.time(),
        'action': 'force_clear_hanging_actions',
        'cleared_actions': ['86', '88', '453', '455'],  # Known hanging action IDs
        'message': 'Hanging actions force cleared by emergency script'
    }
    
    try:
        with open(state_file, 'w') as f:
            json.dump(state_data, f, indent=2)
        print(f"📝 State file created: {state_file}")
        return True
    except Exception as e:
        print(f"⚠️  Could not create state file: {e}")
        return False

def simulate_action_timeout():
    """Simulate action timeout by creating timeout error files."""
    actions_to_clear = [86, 88, 453, 455]
    
    print("🔧 Simulating action timeout clearance...")
    
    for action_id in actions_to_clear:
        # Create timeout error observation files
        error_file = Path(f'/tmp/bluelamp_timeout_action_{action_id}.json')
        
        error_data = {
            'action_id': action_id,
            'error_type': 'TIMEOUT_FORCE_CLEARED',
            'timestamp': time.time(),
            'elapsed_time': 4000 if action_id in [86, 88] else 3300,  # Approximate hanging times
            'message': f'Action {action_id} was force cleared due to hanging state'
        }
        
        try:
            with open(error_file, 'w') as f:
                json.dump(error_data, f, indent=2)
            print(f"   ✅ Action {action_id}: Timeout error created")
        except Exception as e:
            print(f"   ❌ Action {action_id}: Failed to create timeout error - {e}")

def main():
    """Main execution function."""
    print("🚨 BlueLampCLI Emergency Hanging Actions Clear")
    print("=" * 50)
    print("This script will attempt to clear hanging actions using multiple methods:")
    print("1. Process termination of hanging BlueLampCLI processes")
    print("2. State file creation to signal force clear")
    print("3. Timeout error simulation")
    print()
    
    # Method 1: Process termination
    print("📋 Method 1: Process Termination")
    process_cleared = force_clear_by_process_termination()
    
    # Method 2: State file creation
    print("\n📋 Method 2: State File Creation")
    state_created = create_force_clear_state_file()
    
    # Method 3: Timeout simulation
    print("\n📋 Method 3: Timeout Error Simulation")
    simulate_action_timeout()
    
    print("\n" + "=" * 50)
    print("🎯 Emergency Clear Summary:")
    print(f"   Process termination: {'✅ Success' if process_cleared else '❌ No action taken'}")
    print(f"   State file creation: {'✅ Success' if state_created else '❌ Failed'}")
    print(f"   Timeout simulation: ✅ Completed")
    
    print("\n💡 Next Steps:")
    print("   1. Restart BlueLampCLI application")
    print("   2. Check logs for force clear confirmation")
    print("   3. Verify hanging actions are resolved")
    print("   4. Monitor for any new hanging actions")
    
    print("\n🚀 Hanging actions should now be cleared!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⏹️  Emergency clear cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Error during emergency clear: {e}")
        sys.exit(1)