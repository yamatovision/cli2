#!/usr/bin/env node
/**
 * ハニーポット検知システムのテストスクリプト
 */

const axios = require('axios');

// テスト環境の設定
const API_BASE_URL = process.env.API_URL || 'http://localhost:8080/api';

// テスト用データ
const TEST_TRAP_KEYS = [
    'sk-trap-session-001',
    'sk-trap-config-001',
    'sk-proj-fakeABCD1234567890abcdef',
    'bluelamp_token_trap_xyz789abcdef'
];

const NORMAL_KEY = 'cli_normal_key_1234567890abcdef';

// 色付きコンソール出力
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

async function testHoneypotDetection() {
    console.log(`${colors.blue}=== ハニーポット検知テスト開始 ===${colors.reset}\n`);
    
    // 1. 正常なキーのテスト
    console.log(`${colors.yellow}1. 正常なAPIキーのテスト${colors.reset}`);
    try {
        const response = await axios.post(`${API_BASE_URL}/test/honeypot-test`, {
            apiKey: NORMAL_KEY
        });
        
        if (!response.data.trapDetected) {
            console.log(`${colors.green}✅ 正常なキーは検知されませんでした${colors.reset}`);
        } else {
            console.log(`${colors.red}❌ 正常なキーが誤検知されました${colors.reset}`);
        }
    } catch (error) {
        console.log(`${colors.red}❌ エラー: ${error.message}${colors.reset}`);
    }
    
    // 2. トラップキーのテスト
    console.log(`\n${colors.yellow}2. トラップキーの検知テスト${colors.reset}`);
    
    for (const trapKey of TEST_TRAP_KEYS) {
        console.log(`\nテスト中: ${trapKey}`);
        
        try {
            const response = await axios.post(`${API_BASE_URL}/test/honeypot-test`, {
                apiKey: trapKey
            });
            
            // トラップキーは403エラーになるはず
            console.log(`${colors.red}❌ トラップキーが検知されませんでした${colors.reset}`);
            
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log(`${colors.green}✅ トラップキーが正しく検知されました${colors.reset}`);
                console.log(`   メッセージ: ${error.response.data.message}`);
            } else {
                console.log(`${colors.red}❌ 予期しないエラー: ${error.message}${colors.reset}`);
            }
        }
    }
    
    // 3. 実際のプロンプトAPIでのテスト
    console.log(`\n${colors.yellow}3. プロンプトAPIでのハニーポット検知テスト${colors.reset}`);
    
    try {
        const response = await axios.get(`${API_BASE_URL}/cli/prompts`, {
            headers: {
                'X-API-Key': TEST_TRAP_KEYS[0]
            }
        });
        
        console.log(`${colors.red}❌ トラップキーでアクセスできてしまいました${colors.reset}`);
        
    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.log(`${colors.green}✅ プロンプトAPIでトラップキーが検知されました${colors.reset}`);
            console.log(`   エラー: ${error.response.data.error}`);
            console.log(`   詳細: ${JSON.stringify(error.response.data.details, null, 2)}`);
        } else {
            console.log(`${colors.red}❌ 予期しないエラー: ${error.message}${colors.reset}`);
        }
    }
    
    // 4. 統計情報の取得
    console.log(`\n${colors.yellow}4. ハニーポット統計情報${colors.reset}`);
    
    try {
        const response = await axios.get(`${API_BASE_URL}/test/honeypot-stats`);
        console.log(`${colors.green}統計情報:${colors.reset}`);
        console.log(JSON.stringify(response.data.stats, null, 2));
    } catch (error) {
        console.log(`${colors.red}❌ 統計取得エラー: ${error.message}${colors.reset}`);
    }
    
    console.log(`\n${colors.blue}=== テスト完了 ===${colors.reset}`);
}

// 実行
testHoneypotDetection().catch(error => {
    console.error(`${colors.red}テスト実行エラー: ${error.message}${colors.reset}`);
    process.exit(1);
});