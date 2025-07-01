const mongoose = require('mongoose');

// MongoDB接続文字列
const MONGODB_URI = 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/GENIEMON?retryWrites=true&w=majority&appName=MotherPrompt-Cluster';

// SimpleUserモデルの定義
const SimpleUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  isDeleted: Boolean,
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active'
  },
  createdAt: Date,
  updatedAt: Date
});

const SimpleUser = mongoose.model('SimpleUser', SimpleUserSchema);

async function fixUserStatus() {
  try {
    // MongoDBに接続
    console.log('MongoDBに接続中...');
    await mongoose.connect(MONGODB_URI);
    console.log('接続成功！\n');

    // statusがundefinedまたはnullのユーザーを検索
    console.log('=== statusが未設定のユーザーを検索 ===');
    const usersWithoutStatus = await SimpleUser.find({
      $or: [
        { status: { $exists: false } },
        { status: null }
      ]
    });

    console.log(`statusが未設定のユーザー数: ${usersWithoutStatus.length}`);

    if (usersWithoutStatus.length > 0) {
      console.log('\n以下のユーザーのstatusを"active"に設定します:');
      usersWithoutStatus.forEach(user => {
        console.log(`- ${user.name} (${user.email})`);
      });

      // 一括更新
      const result = await SimpleUser.updateMany(
        {
          $or: [
            { status: { $exists: false } },
            { status: null }
          ]
        },
        { $set: { status: 'active' } }
      );

      console.log(`\n更新結果: ${result.modifiedCount}件のユーザーを更新しました`);
    }

    // 修正後の確認
    console.log('\n=== 修正後の確認 ===');
    const metavicerUser = await SimpleUser.findOne({ email: 'metavicer@gmail.com' });
    if (metavicerUser) {
      console.log('metavicer@gmail.com のstatus:', metavicerUser.status);
    }

    // findByEmailメソッドのテスト
    console.log('\n=== findByEmailメソッドのテスト ===');
    const foundUser = await SimpleUser.findOne({ 
      email: 'metavicer@gmail.com'.toLowerCase(),
      status: 'active'
    });
    
    if (foundUser) {
      console.log('findByEmailの条件でユーザーが見つかりました:', foundUser.name);
    } else {
      console.log('findByEmailの条件でユーザーが見つかりません');
    }

  } catch (error) {
    console.error('エラー:', error.message);
  } finally {
    // 接続を閉じる
    await mongoose.connection.close();
    console.log('\n接続を閉じました');
  }
}

// 実行
fixUserStatus();