// @ts-check

/**
 * 環境変数アシスタントの機能を管理するクラス
 */
class EnvironmentVariablesManager {
  constructor() {
    this.selectedPlatform = null;
    this.envVariables = [];
    this.initialize();
  }

  initialize() {
    this.setupEventListeners();
    this.addDefaultEnvVariable();
  }

  setupEventListeners() {
    // プラットフォーム選択ボタン
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('platform-btn')) {
        this.selectPlatform(event.target);
      }
    });

    // 環境変数追加ボタン
    const addBtn = document.getElementById('add-env-variable');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addEnvVariable());
    }

    // .envファイル生成ボタン
    const generateBtn = document.getElementById('generate-env-file');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateEnvFile());
    }

    // コピーボタン
    const copyBtn = document.getElementById('copy-env-variables');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyToClipboard());
    }

    // .envファイル読み込みボタン
    const importBtn = document.getElementById('import-env-file');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.importEnvFile());
    }

    // 環境変数の変更を監視
    document.addEventListener('input', (event) => {
      if (event.target.classList.contains('env-key') || event.target.classList.contains('env-value')) {
        this.updatePreview();
      }
    });

    // 削除ボタン
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('remove-btn') || event.target.closest('.remove-btn')) {
        const item = event.target.closest('.env-variable-item');
        if (item) {
          this.removeEnvVariable(item);
        }
      }
    });
  }

  selectPlatform(button) {
    // 既存の選択を解除
    document.querySelectorAll('.platform-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // 新しい選択を設定
    button.classList.add('active');
    this.selectedPlatform = button.dataset.platform;

    // プラットフォーム固有の環境変数を追加
    this.addPlatformSpecificVariables();
  }

  addPlatformSpecificVariables() {
    // 既存の環境変数をクリア（デフォルト以外）
    const list = document.getElementById('env-variables-list');
    if (!list) return;

    // プラットフォーム固有の環境変数を追加
    const platformVars = this.getPlatformVariables(this.selectedPlatform);
    platformVars.forEach(variable => {
      this.addEnvVariable(variable.key, variable.value, variable.description);
    });

    this.updatePreview();
  }

  getPlatformVariables(platform) {
    const variables = {
      vercel: [
        { key: 'VERCEL_URL', value: '', description: 'Vercel deployment URL' },
        { key: 'NEXT_PUBLIC_VERCEL_URL', value: '', description: 'Public Vercel URL' }
      ],
      netlify: [
        { key: 'NETLIFY_SITE_URL', value: '', description: 'Netlify site URL' },
        { key: 'NETLIFY_SITE_ID', value: '', description: 'Netlify site ID' }
      ],
      aws: [
        { key: 'AWS_REGION', value: 'us-east-1', description: 'AWS region' },
        { key: 'AWS_ACCESS_KEY_ID', value: '', description: 'AWS access key' },
        { key: 'AWS_SECRET_ACCESS_KEY', value: '', description: 'AWS secret key' }
      ],
      gcp: [
        { key: 'GOOGLE_CLOUD_PROJECT', value: '', description: 'GCP project ID' },
        { key: 'GOOGLE_APPLICATION_CREDENTIALS', value: '', description: 'GCP credentials file path' }
      ]
    };

    return variables[platform] || [];
  }

  addDefaultEnvVariable() {
    this.addEnvVariable('NODE_ENV', 'development', 'Node.js environment');
  }

  addEnvVariable(key = '', value = '', description = '') {
    const list = document.getElementById('env-variables-list');
    if (!list) return;

    const item = document.createElement('div');
    item.className = 'env-variable-item';
    item.innerHTML = `
      <input type="text" class="env-key" placeholder="変数名 (例: API_KEY)" value="${key}">
      <input type="text" class="env-value" placeholder="値" value="${value}">
      <button class="remove-btn" title="削除">
        <span class="material-icons">delete</span>
      </button>
    `;

    list.appendChild(item);
    this.updatePreview();
  }

  removeEnvVariable(item) {
    item.remove();
    this.updatePreview();
  }

  updatePreview() {
    const preview = document.getElementById('env-preview-content');
    if (!preview) return;

    const items = document.querySelectorAll('.env-variable-item');
    let content = '# Environment Variables\n';
    
    if (this.selectedPlatform) {
      content += `# Platform: ${this.selectedPlatform.toUpperCase()}\n`;
    }
    
    content += '\n';

    items.forEach(item => {
      const key = item.querySelector('.env-key').value.trim();
      const value = item.querySelector('.env-value').value.trim();
      
      if (key) {
        content += `${key}=${value}\n`;
      }
    });

    if (items.length === 0) {
      content += '# 環境変数がありません\n';
    }

    preview.textContent = content;
  }

  generateEnvFile() {
    const preview = document.getElementById('env-preview-content');
    if (!preview) return;

    const content = preview.textContent;
    
    // VSCodeにファイル作成を要求
    if (window.vscode) {
      window.vscode.postMessage({
        command: 'createEnvFile',
        content: content
      });
    }

    // 成功メッセージを表示
    this.showNotification('.envファイルを生成しました', 'success');
  }

  copyToClipboard() {
    const preview = document.getElementById('env-preview-content');
    if (!preview) return;

    const content = preview.textContent;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(content).then(() => {
        this.showNotification('クリップボードにコピーしました', 'success');
      }).catch(() => {
        this.showNotification('コピーに失敗しました', 'error');
      });
    } else {
      // フォールバック
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showNotification('クリップボードにコピーしました', 'success');
    }
  }

  importEnvFile() {
    // VSCodeにファイル選択を要求
    if (window.vscode) {
      window.vscode.postMessage({
        command: 'selectEnvFile'
      });
    }
  }

  // VSCodeからの.envファイル内容を処理
  loadEnvContent(content) {
    // 既存の環境変数をクリア
    const list = document.getElementById('env-variables-list');
    if (!list) return;
    
    list.innerHTML = '';

    // .envファイルの内容を解析
    const lines = content.split('\n');
    lines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        if (key) {
          this.addEnvVariable(key.trim(), value ? value.trim() : '');
        }
      }
    });

    this.updatePreview();
    this.showNotification('.envファイルを読み込みました', 'success');
  }

  showNotification(message, type = 'info') {
    // 通知要素を作成
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span class="material-icons">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}</span>
      <span>${message}</span>
    `;

    // スタイルを設定
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // 3秒後に削除
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// グローバルに公開
window.environmentVariablesManager = new EnvironmentVariablesManager();

// VSCodeからのメッセージを処理
window.addEventListener('message', (event) => {
  const message = event.data;
  
  switch (message.command) {
    case 'loadEnvContent':
      if (window.environmentVariablesManager) {
        window.environmentVariablesManager.loadEnvContent(message.content);
      }
      break;
  }
});

// CSS アニメーションを追加
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

export default window.environmentVariablesManager;