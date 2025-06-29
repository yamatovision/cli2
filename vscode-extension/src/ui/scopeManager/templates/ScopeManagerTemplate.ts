import * as vscode from 'vscode';
import { HtmlTemplateGenerator } from './HtmlTemplateGenerator';
import { IProjectInfo } from '../types/ScopeManagerTypes';

/**
 * スコープマネージャーのHTML生成を担当
 */
export class ScopeManagerTemplate {
  /**
   * スコープマネージャーのHTMLを生成
   * @param params パラメータオブジェクト
   */
  public static generateHtml(params: {
    webview: vscode.Webview;
    extensionUri: vscode.Uri;
    activeProject: IProjectInfo | null;
  }): string {
    const { webview, extensionUri, activeProject } = params;

    // nonce値を生成
    const nonce = HtmlTemplateGenerator.generateNonce();

    // CSPを設定
    const csp = HtmlTemplateGenerator.generateCSP(webview, nonce);

    // スタイルシートやスクリプトのURIを取得
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'media', 'styles', 'reset.css')
    );
    const designSystemStyleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'media', 'styles', 'design-system.css')
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'media', 'scopeManager.css')
    );
    // DialogManagerのスタイルシート
    const dialogManagerStyleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'media', 'components', 'dialogManager', 'dialogManager.css')
    );
    // PromptCardsのスタイルシート
    const promptCardsStyleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'media', 'components', 'promptCards', 'promptCards.css')
    );
    // スクリプト
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'media', 'scopeManager.js')
    );
    const sharingPanelScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'media', 'components', 'sharingPanel', 'sharingPanel.js')
    );

    // Material Iconsの読み込み
    const materialIconsUrl = 'https://fonts.googleapis.com/icon?family=Material+Icons';

    // プロジェクト情報の取得
    const projectName = activeProject?.name || '選択なし';
    const projectPath = activeProject?.path || '';

    // HTMLを生成して返す
    return `<!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="${csp}">
      <link href="${styleResetUri}" rel="stylesheet">
      <link href="${designSystemStyleUri}" rel="stylesheet">
      <link href="${styleMainUri}" rel="stylesheet">
      <link href="${dialogManagerStyleUri}" rel="stylesheet">
      <link href="${promptCardsStyleUri}" rel="stylesheet">
      <!-- ファイルブラウザのスタイルシートは削除済み -->
      <link href="${materialIconsUrl}" rel="stylesheet">
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet">
      <title>ブルーランプ</title>
      <style>
        /* VSCodeのネイティブドラッグ&ドロップメッセージを非表示にする */
        .monaco-editor .dnd-overlay, 
        .monaco-editor .dnd-overlay *,
        .monaco-dnd-overlay,
        .monaco-dnd-tree-overlay,
        [role="tooltip"][aria-label*="シフト"],
        [role="tooltip"][aria-label*="ドロップ"],
        [role="tooltip"][aria-label*="⌘"],
        [role="tooltip"][aria-label*="Cmd"] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        
        /* ドラッグ中のデフォルトポインタを変更 */
        body.dragging * {
          cursor: copy !important;
        }
        
        /* ドラッグ効果をより目立たせる */
        .drag-effect.active {
          background-color: rgba(74, 105, 189, 0.3) !important;
          z-index: 9999999 !important;
        }
        
        /* 選択中プロジェクトのスタイル */
        .project-item.active {
          background-color: rgba(74, 105, 189, 0.1);
          border-left: 3px solid var(--app-primary);
        }
        
        .file-input {
          opacity: 0;
          position: absolute;
          pointer-events: none;
        }
      </style>
      <script nonce="${nonce}">
        // 即時関数でVSCodeのドラッグ&ドロップメッセージを抑制
        (function() {
          // VSCodeのドラッグ&ドロップメッセージを検出して非表示にする
          function suppressVSCodeDragDropMessage() {
            // ドラッグ&ドロップ関連のオーバーレイを監視して非表示にする
            const observer = new MutationObserver(function(mutations) {
              document.querySelectorAll('.monaco-editor .dnd-overlay, .monaco-dnd-overlay, [aria-label*="ドロップする"], [aria-label*="⌘"]').forEach(function(el) {
                if (el) {
                  el.style.display = 'none';
                  el.style.opacity = '0';
                  el.style.visibility = 'hidden';
                  el.style.pointerEvents = 'none';
                }
              });
            });
            
            // document全体を監視
            observer.observe(document.documentElement, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ['style', 'class']
            });
            
            // ドラッグ&ドロップイベントをキャプチャ
            ['dragstart', 'dragover', 'dragenter', 'dragleave', 'drop'].forEach(function(eventName) {
              document.addEventListener(eventName, function(e) {
                // VSCodeのオーバーレイを強制的に非表示
                document.querySelectorAll('.monaco-editor .dnd-overlay, .monaco-dnd-overlay, [aria-label*="ドロップする"], [aria-label*="⌘"]').forEach(function(el) {
                  if (el) el.style.display = 'none';
                });
              }, true);
            });
          }
          
          // DOM読み込み完了時または既に読み込まれている場合に実行
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', suppressVSCodeDragDropMessage);
          } else {
            suppressVSCodeDragDropMessage();
          }
        })();
      </script>
    </head>
    <body>
      <div class="scope-manager-container">
        <div class="main-content">
          <!-- 左側: プロジェクトナビゲーション -->
          <div class="project-nav">
            <button class="toggle-nav-btn" id="toggle-nav-btn" title="パネルを開閉">
              <span class="material-icons">chevron_left</span>
            </button>
            <div class="project-label">PRJ</div>
            <div class="logo-container">
              <img src="${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'images', 'appgenius-logo.png'))}" alt="AppGenius" class="app-logo">
            </div>
            
            <div class="project-actions">
              <button class="button button-secondary" id="new-project-btn">
                <span class="material-icons">add</span>
                新規作成
              </button>
              <button class="button button-secondary" id="load-project-btn">
                <span class="material-icons">folder_open</span>
                読み込む
              </button>
            </div>
            
            <div id="project-list" class="project-list">
              <!-- プロジェクトリストはJSで動的に生成 -->
            </div>
          </div>
          
          <!-- 右側: コンテンツエリア -->
          <div class="content-area">
            <div class="card">
              <!-- タブバー -->
              <div class="tabs">
                <div class="project-display">
                  <span class="project-name">${projectName}</span>
                  <span class="project-path-display">${projectPath}</span>
                </div>
              </div>
              <!-- 進捗状況コンテンツ（ヘッダーなしで直接表示） -->
              <div class="progress-content">
                <div class="card-body">
                  <div class="markdown-content">
                    <!-- ここにSCOPE_PROGRESS.mdの内容がマークダウン表示される -->
                    <p>読み込み中...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- フローティングアクションバー -->
      <div class="floating-action-bar" id="floating-action-bar">
        <button class="fab-btn" id="open-files-btn" title="ファイルビューワーを開く">
          <span class="material-icons-outlined">folder</span>
          <span class="fab-label">ファイル</span>
        </button>
        <button class="fab-btn" id="open-gallery-btn" title="モックアップギャラリーを開く">
          <span class="material-icons-outlined">palette</span>
          <span class="fab-label">ギャラリー</span>
        </button>
        <button class="fab-btn primary" id="launch-bluelamp-btn" title="ブルーランプを起動">
          <span class="material-icons">rocket_launch</span>
          <span class="fab-label">ブルーランプ</span>
        </button>
      </div>
      
      <div id="error-container" style="display: none; position: fixed; bottom: 20px; right: 20px; background-color: var(--app-danger); color: white; padding: 10px; border-radius: 4px;"></div>
      
      <!-- メインスクリプト -->
      <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
      
      <!-- 共有パネルコンポーネント専用スクリプト -->
      <script type="module" nonce="${nonce}" src="${sharingPanelScriptUri}"></script>
      
      
      <!-- ファイルブラウザコンポーネント専用スクリプト -->
      <!-- ファイルブラウザのスクリプトは削除済み -->
    </body>
    </html>`;
  }

}