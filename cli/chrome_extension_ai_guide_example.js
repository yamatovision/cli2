// Chrome拡張機能 + AI ガイドの実装例

// manifest.json
const manifest = {
  "manifest_version": 3,
  "name": "AI Web Guide",
  "version": "1.0",
  "permissions": ["activeTab", "storage"],
  "action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }]
};

// content.js - ページ上で動作するスクリプト
class AIWebGuide {
  constructor() {
    this.overlay = null;
    this.currentTask = null;
  }

  // 現在のページを解析
  analyzePage() {
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      elements: []
    };

    // フォーム要素を検出
    document.querySelectorAll('input, button, select, textarea').forEach(el => {
      pageInfo.elements.push({
        type: el.tagName,
        id: el.id,
        name: el.name,
        placeholder: el.placeholder,
        text: el.textContent,
        position: el.getBoundingClientRect()
      });
    });

    return pageInfo;
  }

  // AIからのガイドを表示
  showGuide(guidance) {
    // オーバーレイ作成
    this.overlay = document.createElement('div');
    this.overlay.id = 'ai-guide-overlay';
    this.overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 10000;
        font-family: Arial, sans-serif;
      ">
        <h3>🤖 AIガイド</h3>
        <div id="guide-content">${guidance.instruction}</div>
        <button id="next-step">次へ</button>
        <button id="close-guide">閉じる</button>
      </div>
    `;
    document.body.appendChild(this.overlay);

    // 要素をハイライト
    if (guidance.elementToHighlight) {
      this.highlightElement(guidance.elementToHighlight);
    }
  }

  // 要素をハイライト
  highlightElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      const highlight = document.createElement('div');
      highlight.style.cssText = `
        position: fixed;
        top: ${rect.top - 5}px;
        left: ${rect.left - 5}px;
        width: ${rect.width + 10}px;
        height: ${rect.height + 10}px;
        border: 3px solid #ff0000;
        background: rgba(255, 0, 0, 0.2);
        z-index: 9999;
        pointer-events: none;
        animation: pulse 1s infinite;
      `;
      document.body.appendChild(highlight);
    }
  }

  // AIにガイダンスをリクエスト
  async requestGuidance(task) {
    const pageInfo = this.analyzePage();
    
    // AIに送信（実際はバックグラウンドスクリプト経由）
    const response = await chrome.runtime.sendMessage({
      action: 'getAIGuidance',
      task: task,
      pageInfo: pageInfo
    });

    return response;
  }
}

// 実際の使用例
const guide = new AIWebGuide();

// ユーザーがタスクを入力
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'startGuide') {
    const task = request.task; // 例: "MongoDBのアカウントを作成"
    
    // ステップ1: 現在のページを解析
    const guidance = await guide.requestGuidance(task);
    
    // ステップ2: ガイドを表示
    guide.showGuide({
      instruction: "メールアドレス入力欄に入力してください",
      elementToHighlight: "#email-input"
    });
  }
});

// background.js - AIとの通信を処理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAIGuidance') {
    // OpenAI APIを呼び出し
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'system',
          content: 'あなたはWebページ操作をガイドするアシスタントです。'
        }, {
          role: 'user',
          content: `
            タスク: ${request.task}
            現在のページ: ${request.pageInfo.url}
            利用可能な要素: ${JSON.stringify(request.pageInfo.elements)}
            
            次に何をすべきか教えてください。
          `
        }]
      })
    })
    .then(response => response.json())
    .then(data => {
      sendResponse({
        instruction: data.choices[0].message.content,
        nextAction: 'fill_email'
      });
    });
    
    return true; // 非同期レスポンス
  }
});