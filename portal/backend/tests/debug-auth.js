/**
 * CLI認証デバッグスクリプト
 */
const mongoose = require('mongoose');
const dbConfig = require('../config/db.config');
const SimpleUser = require('../models/simpleUser.model');
const CliTokenService = require('../services/cli-token.service');

async function debugAuth() {
  try {
    // MongoDB接続
    await dbConfig.connect(mongoose);
    console.log('MongoDB接続成功');

    const email = 'cli-test@bluelamp.com';
    const password = 'clitest123!';

    console.log('\n=== ステップ1: ユーザー検索 ===');
    const user = await SimpleUser.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('ユーザーが見つかりません');
      
      // 全ユーザーのメールアドレスを表示
      const allUsers = await SimpleUser.find({}).select('email').limit(10);
      console.log('\n存在するユーザー:');
      allUsers.forEach(u => console.log(` - ${u.email}`));
      return;
    }

    console.log('ユーザー発見:', {
      id: user._id,
      email: user.email,
      name: user.name,
      status: user.status,
      role: user.role
    });

    console.log('\n=== ステップ2: パスワード検証 ===');
    const isPasswordValid = await user.validatePassword(password);
    console.log('パスワード検証結果:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('パスワードが一致しません');
      return;
    }

    console.log('\n=== ステップ3: CLIトークン生成 ===');
    try {
      const tokenData = await CliTokenService.generateToken(
        user._id,
        {
          deviceName: 'Debug Test',
          platform: 'nodejs',
          userAgent: 'Debug Script'
        },
        {
          expirationDays: 7,
          revokeExisting: true
        }
      );

      console.log('トークン生成成功:', {
        token: tokenData.token.substring(0, 30) + '...',
        tokenId: tokenData.tokenId,
        expiresAt: tokenData.expiresAt
      });

      // トークン検証
      console.log('\n=== ステップ4: トークン検証 ===');
      const verifyResult = await CliTokenService.verifyToken(tokenData.token);
      console.log('トークン検証結果:', verifyResult ? '成功' : '失敗');

    } catch (error) {
      console.error('トークン生成エラー:', error.message);
      console.error('スタックトレース:', error.stack);
    }

  } catch (error) {
    console.error('エラー:', error.message);
    console.error('スタックトレース:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB接続を閉じました');
  }
}

// 実行
debugAuth();