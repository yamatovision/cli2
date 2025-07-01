require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// プロンプトモデルの定義
const promptSchema = new mongoose.Schema({
  title: String,
  type: String,
  tags: [String],
  // 他のフィールドは更新に必要ないため省略
}, { timestamps: true });

const Prompt = mongoose.model('Prompt', promptSchema);

async function updateBlueLampTitles() {
  try {
    // MongoDBに接続
    await mongoose.connect('mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/GENIEMON?retryWrites=true&w=majority&appName=MotherPrompt-Cluster', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDBに接続しました');

    // bluelampタグ（小文字）を持つプロンプトを取得
    const prompts = await Prompt.find({
      tags: 'bluelamp'
    });

    console.log(`bluelampタグを持つプロンプト数: ${prompts.length}`);
    
    // デバッグ用：すべてのプロンプトのタグを確認
    const allPrompts = await Prompt.find({});
    console.log(`全プロンプト数: ${allPrompts.length}`);
    
    // タグの種類を確認
    const uniqueTags = new Set();
    allPrompts.forEach(p => {
      p.tags.forEach(tag => uniqueTags.add(tag));
    });
    console.log('存在するタグ:', Array.from(uniqueTags));

    // 各プロンプトのタイトルを更新
    for (const prompt of prompts) {
      // タイトルの★を#に変更
      if (prompt.title && prompt.title.includes('★')) {
        const oldTitle = prompt.title;
        prompt.title = prompt.title.replace(/★/g, '#');
        await prompt.save();
        console.log(`更新: "${oldTitle}" → "${prompt.title}"`);
      }
    }

    // オーケストレーターの特別処理
    const orchestrator = await Prompt.findOne({
      title: { $regex: /オーケストレーター/i },
      tags: 'bluelamp'
    });

    if (orchestrator) {
      // タイトルが#0で始まっていない場合は更新
      if (!orchestrator.title.startsWith('#0')) {
        const oldTitle = orchestrator.title;
        // 既存の番号を削除して#0を付ける
        orchestrator.title = '#0 オーケストレーター';
        await orchestrator.save();
        console.log(`オーケストレーター更新: "${oldTitle}" → "${orchestrator.title}"`);
      }
    }

    console.log('すべてのタイトルの更新が完了しました');

  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB接続を終了しました');
  }
}

// スクリプトを実行
updateBlueLampTitles();