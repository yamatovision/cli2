#!/usr/bin/env python3

import sys
import traceback
import os

# CLI2のパスを追加
sys.path.insert(0, '/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli2')

# 引数を設定
sys.argv = ['bluelamp2', '-t', 'echo hello']

try:
    from openhands.cli.main_delegation import main
    main()
except Exception as e:
    print('=== ERROR DETAILS ===')
    print(f'Error type: {type(e)}')
    print(f'Error message: {str(e)}')
    print('\n=== FULL TRACEBACK ===')
    traceback.print_exc()
    print('=== END ===')