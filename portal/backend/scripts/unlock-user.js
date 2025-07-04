#!/usr/bin/env node
/**
 * ユーザーアカウントのロックを解除するスクリプト
 * 使用方法: node unlock-user.js <email>
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const SimpleUser = require('../models/simpleUser.model');
const CliTokenService = require('../services/cli-token.service');

async function unlockUser(email) {
    try {
        // MongoDBに接続（本番環境）
        const dbConfig = require('../config/db.config');
        await mongoose.connect(dbConfig.url, dbConfig.options);
        
        console.log('データベースに接続しました');
        
        // ユーザーを検索
        const user = await SimpleUser.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            console.log('ユーザーが見つかりません:', email);
            return;
        }
        
        console.log('ユーザー情報:');
        console.log('- ID:', user._id);
        console.log('- 名前:', user.name);
        console.log('- メール:', user.email);
        console.log('- 現在のステータス:', user.status);
        
        if (user.securityStatus) {
            console.log('- セキュリティステータス:');
            console.log('  - ブロック状態:', user.securityStatus.isBlocked);
            console.log('  - ブロック理由:', user.securityStatus.blockReason);
            console.log('  - 違反回数:', user.securityStatus.violations?.length || 0);
        }
        
        // ロック解除の確認
        console.log('\nこのユーザーのロックを解除しますか？ (yes/no): ');
        
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        readline.question('', async (answer) => {
            if (answer.toLowerCase() === 'yes') {
                // セキュリティステータスをリセット
                user.securityStatus = {
                    violations: [],
                    isBlocked: false,
                    blockedAt: null,
                    blockReason: null,
                    canAppeal: true
                };
                
                // アカウントステータスも確認
                if (user.status !== 'active') {
                    user.status = 'active';
                }
                
                await user.save();
                
                console.log('\n✅ アカウントのロックを解除しました');
                console.log('ユーザーは再度ログインできるようになりました');
                
                // 既存のトークンも確認
                const tokens = await mongoose.connection.collection('clitokens').find({
                    userId: user._id,
                    isRevoked: false
                }).toArray();
                
                console.log(`\n既存の有効なトークン数: ${tokens.length}`);
                
            } else {
                console.log('解除をキャンセルしました');
            }
            
            readline.close();
            await mongoose.connection.close();
        });
        
    } catch (error) {
        console.error('エラー:', error);
        process.exit(1);
    }
}

// コマンドライン引数の確認
const email = process.argv[2];

if (!email) {
    console.log('使用方法: node unlock-user.js <email>');
    console.log('例: node unlock-user.js user@example.com');
    process.exit(1);
}

// 実行
unlockUser(email);