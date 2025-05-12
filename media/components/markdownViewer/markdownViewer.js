// @ts-check
import stateManager from '../../state/stateManager.js';
import { convertMarkdownToHtml, enhanceSpecialElements, setupCheckboxes } from '../../utils/simpleMarkdownConverter.js';

class MarkdownViewer {
  constructor() {
    this.container = document.querySelector('.markdown-content');
    this.initialize();

    // デバッグ出力
    console.log('MarkdownViewer初期化時のデフォルトコンテナ:', this.container ? this.container.id || 'id未設定' : 'null');
  }
  
  initialize() {
    // 初期化時に何もない場合は「読み込み中...」を表示
    if (this.container) {
      // 常に「読み込み中...」を表示（HTMLテンプレートの内容を優先しない）
      this.container.innerHTML = '<p>読み込み中...</p>';
      console.log('MarkdownViewer: 初期化時に「読み込み中...」を表示しました');
    } else {
      console.warn('MarkdownViewer: コンテナ要素が見つかりません');
    }

    // カスタムイベントのリスナーを設定
    this._setupEventListeners();
  }
  
  /**
   * 外部からの初期化用メソッド（既に初期化されている場合は何もしない）
   * エントリーポイントからの呼び出し用
   */
  init() {
    // 既に初期化済みの場合は何もしない
  }
  
  /**
   * カスタムイベントリスナーを設定
   */
  _setupEventListeners() {
    // マークダウン更新イベントを購読
    document.addEventListener('markdown-updated', (event) => {
      this.updateContent(event.detail.content);
    });
  }
  
  /**
   * マークダウンをHTMLに変換するだけの関数
   * @param {string} content マークダウンコンテンツ
   * @returns {string} 変換されたHTML
   */
  convertContent(content) {
    if (!content) {
      return '<p>ファイルが見つかりません</p>';
    }
    
    try {
      // マークダウンをHTMLに変換（simpleMarkdownConverterを使用）
      return convertMarkdownToHtml(content);
    } catch (error) {
      return `<p>マークダウンの変換に失敗しました: ${error.message}</p>
              <pre>${error.stack}</pre>`;
    }
  }
  
  /**
   * 特殊要素の強化処理を実行
   */
  enhanceContent() {
    // ディレクトリツリーと表の特別なスタイリングを適用
    enhanceSpecialElements();
    
    // チェックボックスのイベントリスナー設定
    setupCheckboxes();
  }
  
  /**
   * マークダウンコンテンツを更新
   * @param {string} content マークダウンテキスト
   * @param {Element} [targetContainer] 表示対象の特定コンテナ（指定がない場合はデフォルトコンテナを使用）
   */
  updateContent(content, targetContainer) {
    // デバッグログ：コンテナ指定状況
    console.log('MarkdownViewer.updateContent - コンテナ指定:',
      targetContainer ? (targetContainer.id || 'ID未設定のコンテナ指定あり') : 'コンテナ指定なし',
      'スコープ:', targetContainer ? targetContainer.closest('[id]')?.id : 'なし'
    );

    // アクティブなタブID確認
    const state = stateManager.getState();
    const activeTab = state?.activeTab || '不明';
    console.log(`MarkdownViewer.updateContent - アクティブタブID: ${activeTab}`);

    // 表示対象のコンテナを決定（指定がある場合はそれを使用、ない場合はデフォルトコンテナ）
    let container = targetContainer;

    // コンテナが未指定の場合はアクティブなタブに基づいて自動選択
    if (!container) {
      console.log('コンテナ未指定 - アクティブタブで自動選択');

      if (activeTab === 'requirements') {
        container = document.querySelector('#requirements-tab .markdown-content');
        console.log('要件定義タブのコンテナを自動選択:', container ? '成功' : '失敗');
      } else if (activeTab === 'scope-progress') {
        container = document.querySelector('#scope-progress-tab .markdown-content');
        console.log('進捗状況タブのコンテナを自動選択:', container ? '成功' : '失敗');
      }

      // 自動選択に失敗した場合はデフォルトコンテナにフォールバック
      if (!container) {
        container = this.container;
        console.log('コンテナ自動選択失敗 - デフォルトコンテナを使用:',
          container ? (container.id || 'ID未設定') : 'コンテナなし');
      }
    }

    if (!container) {
      console.error('MarkdownViewer.updateContent: 表示対象のコンテナが見つかりません');
      return;
    }

    if (!content) {
      container.innerHTML = '<p>ファイルが見つかりません</p>';
      return;
    }

    try {
      // 処理中の表示
      container.classList.add('loading');
      container.innerHTML = '<p>マークダウンを変換中...</p>';

      // 非同期で処理して UI ブロッキングを防止
      setTimeout(() => {
        try {
          // マークダウンをHTMLに変換（シンプル版を使用）
          const htmlContent = convertMarkdownToHtml(content);

          // HTMLコンテンツを設定
          container.innerHTML = htmlContent;

          // ディレクトリツリーと表の特別なスタイリングを適用
          enhanceSpecialElements();

          // チェックボックスのイベントリスナー設定
          setupCheckboxes();

          // 表示内容を記録
          this._lastDisplayedMarkdown = content;

          // 更新完了ログ
          console.log('MarkdownViewer.updateContent: 表示完了 - コンテンツ長:', content.length,
            'コンテナ:', container.closest('[id]')?.id || 'ID未設定');
        } catch (error) {
          container.innerHTML = `<p>マークダウンの表示に失敗しました: ${error.message}</p>
                                <pre>${error.stack}</pre>`;
          console.error('MarkdownViewer.updateContent: マークダウン変換エラー', error);
        } finally {
          // 処理中表示を解除
          container.classList.remove('loading');
        }
      }, 0);
    } catch (error) {
      container.innerHTML = `<p>マークダウンの表示に失敗しました: ${error.message}</p>
                           <pre>${error.stack}</pre>`;
      container.classList.remove('loading');
      console.error('MarkdownViewer.updateContent: 処理エラー', error);
    }
  }
  
  /**
   * テーブルのソート機能
   */
  _sortTable(table, columnIndex) {
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const headerRow = table.querySelector('th:nth-child(' + (columnIndex + 1) + ')');
    const isAscending = !headerRow.classList.contains('sort-asc');
    
    // ソート方向クラスを設定
    table.querySelectorAll('th').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
    });
    
    headerRow.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
    
    // 行をソート
    rows.sort((a, b) => {
      const cellA = a.querySelector('td:nth-child(' + (columnIndex + 1) + ')').textContent.trim();
      const cellB = b.querySelector('td:nth-child(' + (columnIndex + 1) + ')').textContent.trim();
      
      // 数値の場合は数値として比較
      if (!isNaN(cellA) && !isNaN(cellB)) {
        return isAscending ? Number(cellA) - Number(cellB) : Number(cellB) - Number(cellA);
      }
      
      // 文字列の場合は文字列として比較
      return isAscending ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
    });
    
    // テーブルを再構築
    const tbody = table.querySelector('tbody');
    rows.forEach(row => tbody.appendChild(row));
  }
}

// 初期化して公開
const markdownViewer = new MarkdownViewer();
export default markdownViewer;