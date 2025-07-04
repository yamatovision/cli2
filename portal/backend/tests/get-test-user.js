/**
 * テスト用ユーザー情報取得スクリプト
 * MongoDBから実際のユーザー情報を取得してテストに使用
 */
const mongoose = require('mongoose');
const dbConfig = require('../config/db.config');
const SimpleUser = require('../models/simpleUser.model');

async function getTestUser() {
  try {
    // MongoDB接続
    await dbConfig.connect(mongoose);
    console.log('MongoDB接続成功');

    // アクティブなユーザーを1件取得
    const user = await SimpleUser.findOne({ 
      status: 'active',
      email: { $exists: true }
    }).select('email name role status').lean();

    if (user) {
      console.log('\n=== テスト用ユーザー情報 ===');
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('Status:', user.status);
      console.log('\n注意: パスワードは表示されません。');
      console.log('テスト時は実際のパスワードを使用してください。');
      
      // テストスクリプト用の出力
      console.log('\n=== テストスクリプト用 ===');
      console.log(`TEST_USER.email = '${user.email}'`);
      console.log(`TEST_USER.password = 'YOUR_PASSWORD_HERE'`);
    } else {
      console.log('アクティブなユーザーが見つかりません');
    }

    // 複数のユーザーを表示（選択用）
    const users = await SimpleUser.find({ 
      status: 'active',
      email: { $exists: true }
    }).select('email name role').limit(5).lean();

    if (users.length > 1) {
      console.log('\n=== 利用可能なユーザー一覧 ===');
      users.forEach((u, index) => {
        console.log(`${index + 1}. ${u.email} (${u.name}) - ${u.role}`);
      });
    }

  } catch (error) {
    console.error('エラー:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB接続を閉じました');
  }
}

// 実行
getTestUser();