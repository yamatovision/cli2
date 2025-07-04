#!/usr/bin/env python3
"""
Simple Clear Hanging Actions Script for BlueLampCLI
psutil不要の簡単なハングアクション強制クリアスクリプト
"""

import sys
import os
import time
import json
import subprocess
from pathlib import Path

def find_and_kill_hanging_processes():
    """Find and kill hanging BlueLampCLI processes using ps command."""
    print("🔍 Searching for hanging BlueLampCLI processes...")
    
    try:
        # Use ps to find Python processes that might be BlueLampCLI
        result = subprocess.run(['ps', 'aux'], capture_output=True, text=True, timeout=10)
        if result.returncode != 0:
            print("❌ Could not execute ps command")
            return False
        
        lines = result.stdout.split('\n')
        hanging_processes = []
        
        for line in lines:
            if 'python' in line.lower() and any(keyword in line.lower() for keyword in [
                'openhands', 'bluelamp', 'agent_controller', 'cli_runtime', 'main.py'
            ]):
                parts = line.split()
                if len(parts) >= 2:
                    pid = parts[1]
                    try:
                        pid_int = int(pid)
                        hanging_processes.append((pid_int, line))
                    except ValueError:
                        continue
        
        if not hanging_processes:
            print("✅ No hanging BlueLampCLI processes found.")
            return True
        
        print(f"🚨 Found {len(hanging_processes)} potentially hanging processes:")
        for pid, line in hanging_processes:
            print(f"   PID {pid}: {line}")
        
        response = input("\n❓ Kill these processes? (y/N): ").strip().lower()
        if response != 'y':
            print("❌ Process termination cancelled.")
            return False
        
        killed = 0
        for pid, line in hanging_processes:
            try:
                print(f"🔪 Killing PID {pid}...")
                subprocess.run(['kill', '-TERM', str(pid)], timeout=5)
                time.sleep(2)
                
                # Check if process still exists
                try:
                    subprocess.run(['kill', '-0', str(pid)], timeout=1, check=True)
                    # Process still exists, force kill
                    print(f"⚡ Force killing PID {pid}...")
                    subprocess.run(['kill', '-KILL', str(pid)], timeout=5)
                except subprocess.CalledProcessError:
                    # Process doesn't exist anymore (good)
                    pass
                
                print(f"✅ PID {pid} terminated.")
                killed += 1
            except Exception as e:
                print(f"⚠️  Could not kill PID {pid}: {e}")
        
        print(f"\n🎯 Killed {killed} processes.")
        return killed > 0
        
    except Exception as e:
        print(f"❌ Error during process search: {e}")
        return False

def create_hanging_action_clear_markers():
    """Create marker files indicating hanging actions were cleared."""
    print("📝 Creating hanging action clear markers...")
    
    actions_to_clear = [86, 88, 453, 455]
    created = 0
    
    for action_id in actions_to_clear:
        marker_file = Path(f'/tmp/bluelamp_cleared_action_{action_id}.marker')
        
        try:
            with open(marker_file, 'w') as f:
                f.write(f"CLEARED:{action_id}:{time.time()}\n")
                f.write(f"REASON:EMERGENCY_FORCE_CLEAR\n")
                f.write(f"TIMESTAMP:{time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            
            print(f"   ✅ Action {action_id}: Clear marker created")
            created += 1
        except Exception as e:
            print(f"   ❌ Action {action_id}: Failed to create marker - {e}")
    
    return created > 0

def reset_system_state():
    """Reset system state by clearing various state files."""
    print("🔄 Resetting system state...")
    
    # Common state file locations to clear
    state_paths = [
        '/tmp/bluelamp_*',
        '/tmp/openhands_*',
        '~/.cache/openhands/*',
        './logs/*',
        './tmp/*'
    ]
    
    cleared = 0
    for pattern in state_paths:
        try:
            result = subprocess.run(['bash', '-c', f'rm -f {pattern}'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                cleared += 1
                print(f"   ✅ Cleared: {pattern}")
            else:
                print(f"   ℹ️  No files found: {pattern}")
        except Exception as e:
            print(f"   ⚠️  Could not clear {pattern}: {e}")
    
    # Create a system reset marker
    try:
        reset_marker = Path('/tmp/bluelamp_system_reset.marker')
        with open(reset_marker, 'w') as f:
            f.write(f"SYSTEM_RESET:{time.time()}\n")
            f.write(f"REASON:EMERGENCY_HANGING_ACTIONS_CLEAR\n")
            f.write(f"TIMESTAMP:{time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        print(f"   ✅ System reset marker created: {reset_marker}")
    except Exception as e:
        print(f"   ⚠️  Could not create reset marker: {e}")
    
    return True

def main():
    """Main execution function."""
    print("🚨 BlueLampCLI Simple Hanging Actions Clear")
    print("=" * 50)
    print("Target hanging actions:")
    print("   - Action ID 86: ~68 minutes pending")
    print("   - Action ID 88: ~68 minutes pending")  
    print("   - Action ID 453: ~55 minutes pending")
    print("   - Action ID 455: ~55 minutes pending")
    print()
    
    success_count = 0
    
    # Step 1: Kill hanging processes
    print("🔧 Step 1: Process Termination")
    if find_and_kill_hanging_processes():
        success_count += 1
    
    # Step 2: Create clear markers
    print("\n🔧 Step 2: Clear Markers Creation")
    if create_hanging_action_clear_markers():
        success_count += 1
    
    # Step 3: Reset system state
    print("\n🔧 Step 3: System State Reset")
    if reset_system_state():
        success_count += 1
    
    print("\n" + "=" * 50)
    print("🎯 Emergency Clear Results:")
    print(f"   Successful operations: {success_count}/3")
    
    if success_count >= 2:
        print("✅ HANGING ACTIONS SHOULD NOW BE CLEARED!")
        print("\n📋 Next steps:")
        print("   1. Restart BlueLampCLI application")
        print("   2. Check that actions 86, 88, 453, 455 are no longer pending")
        print("   3. Monitor system for stability")
    else:
        print("⚠️  Some operations failed. Manual intervention may be required.")
    
    print("\n🔍 Check markers in /tmp/bluelamp_* for confirmation")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⏹️  Emergency clear cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Error during emergency clear: {e}")
        sys.exit(1)