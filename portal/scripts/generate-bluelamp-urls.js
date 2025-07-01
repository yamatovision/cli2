require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// プロンプトモデルの定義
const promptSchema = new mongoose.Schema({
  title: String,
  type: String,
  tags: [String],
  isPublic: { type: Boolean, default: false },
  publicUrl: String,
  publicApiKey: String,
  publicSettings: {
    requireApiKey: { type: Boolean, default: false },
    allowedOrigins: [String],
    rateLimit: {
      maxRequests: Number,
      windowMs: Number
    }
  }
}, { timestamps: true });

const Prompt = mongoose.model('Prompt', promptSchema);

async function generateBlueLampUrls() {
  try {
    // MongoDBに接続
    await mongoose.connect('mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/GENIEMON?retryWrites=true&w=majority&appName=MotherPrompt-Cluster', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDBに接続しました');

    // bluelampタグを持つプロンプトを取得
    const prompts = await Prompt.find({
      tags: 'bluelamp',
      title: { $regex: /^#\d+\s/ }
    });
    
    // 番号順にソート（#0, #1, #2... #16）
    prompts.sort((a, b) => {
      const numA = parseInt(a.title.match(/^#(\d+)/)?.[1] || '999');
      const numB = parseInt(b.title.match(/^#(\d+)/)?.[1] || '999');
      return numA - numB;
    });

    console.log(`BlueLampプロンプト数: ${prompts.length}`);

    // Markdownコンテンツを生成
    let markdown = `# BlueLamp プロンプト共有URL一覧

このドキュメントには、BlueLampシステムの各エージェントプロンプトの共有URLが記載されています。

## 使用方法

各URLは公開APIエンドポイントです。以下の形式でPOSTリクエストを送信してください：

\`\`\`bash
curl -X POST [URL] \\
  -H "Content-Type: application/json" \\
  -d '{"message": "あなたのメッセージ"}'
\`\`\`

## プロンプト一覧

`;

    // 各プロンプトの情報を追加
    for (const prompt of prompts) {
      const number = prompt.title.match(/^#(\d+)/)?.[1] || '?';
      const name = prompt.title.replace(/^#\d+\s*/, '');
      
      // コピー版はスキップ
      if (prompt.title.includes('(コピー)')) {
        continue;
      }
      
      // 共有URLを生成（既存のpublicUrlを使用、なければ新規生成）
      let shareUrl = prompt.publicUrl;
      if (!shareUrl && prompt.isPublic) {
        // 既に公開されているが、URLがない場合は生成
        shareUrl = `https://portal.bluelamp.ai/api/prompts/${prompt._id}/public`;
      }
      
      markdown += `### ${prompt.title}

- **ID**: ${prompt._id}
- **タイプ**: ${prompt.type === 'system' ? 'システムプロンプト' : 'ユーザープロンプト'}
- **公開状態**: ${prompt.isPublic ? '公開' : '非公開'}
${shareUrl ? `- **共有URL**: ${shareUrl}` : '- **共有URL**: 未生成（プロンプト管理画面から共有ボタンをクリックしてください）'}

---

`;
    }

    // 更新日時を追加
    markdown += `
## 更新情報

最終更新: ${new Date().toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
`;

    // docsディレクトリを作成（存在しない場合）
    const docsDir = path.join(__dirname, '..', 'docs');
    await fs.mkdir(docsDir, { recursive: true });

    // Markdownファイルを保存
    const filePath = path.join(docsDir, 'bluelamp-prompt-urls.md');
    await fs.writeFile(filePath, markdown, 'utf8');
    
    console.log(`Markdownファイルを作成しました: ${filePath}`);

  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB接続を終了しました');
  }
}

// スクリプトを実行
generateBlueLampUrls();