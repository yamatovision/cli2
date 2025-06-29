/**
 * 特定のユーザーのポータルセッションをクリアするスクリプト
 */

const mongoose = require('mongoose');
const SimpleUser = require('../backend/models/simpleUser.model');

// MongoDB接続設定
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/GENIEMON?retryWrites=true&w=majority&appName=MotherPrompt-Cluster';

async function clearPortalSession() {
  try {
    // MongoDBに接続
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB に接続しました\n');

    // 特定のユーザーを検索
    const user = await SimpleUser.findOne({ email: 'shiraishi.tatsuya@mikoto.co.jp' });
    
    if (!user) {
      console.log('ユーザーが見つかりません');
      return;
    }

    console.log('対象ユーザー:', user.name);
    console.log('現在のセッション数:', user.activeSessions ? user.activeSessions.length : 0);
    
    if (user.activeSessions && user.activeSessions.length > 0) {
      // portalセッションのみをクリア
      const beforeCount = user.activeSessions.length;
      user.activeSessions = user.activeSessions.filter(session => session.clientType !== 'portal');
      const afterCount = user.activeSessions.length;
      
      await user.save();
      console.log(`\nportalセッションをクリアしました (${beforeCount} → ${afterCount})`);
    } else {
      console.log('\nアクティブなセッションがありません');
    }

    // 更新後の状態を確認
    const updatedUser = await SimpleUser.findOne({ email: 'shiraishi.tatsuya@mikoto.co.jp' });
    console.log('\n更新後のセッション:');
    if (updatedUser.activeSessions && updatedUser.activeSessions.length > 0) {
      updatedUser.activeSessions.forEach((session, index) => {
        console.log(`  [${index + 1}] ${session.clientType} - ${session.sessionId.substring(0, 10)}...`);
      });
    } else {
      console.log('  なし');
    }

    // 接続を閉じる
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

// スクリプトを実行
clearPortalSession();