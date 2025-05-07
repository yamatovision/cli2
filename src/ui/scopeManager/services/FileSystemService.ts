import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../../../utils/logger';
import { FileOperationManager } from '../../../utils/fileOperationManager';
import { AppGeniusEventBus, AppGeniusEventType } from '../../../services/AppGeniusEventBus';

/**
 * ファイルシステムサービスインターフェース
 * ScopeManagerPanelのファイル操作関連の責務を分離
 */
export interface IFileSystemService {
  // ファイル操作
  readMarkdownFile(filePath: string): Promise<string>;
  createDefaultStatusFile(projectPath: string, projectName?: string): Promise<void>;
  fileExists(filePath: string): Promise<boolean>;
  
  // ディレクトリ操作
  getDirectoryStructure(projectPath: string): Promise<string>;
  ensureDirectoryExists(dirPath: string): Promise<void>;
  
  // ファイル監視
  setupFileWatcher(statusFilePath: string, onFileChanged: (filePath: string) => void): vscode.Disposable;
  setupEnhancedFileWatcher(statusFilePath: string, onFileChanged: (filePath: string) => void, options?: { delayedReadTime?: number }): vscode.Disposable;
  setupStatusFileEventListener(projectPath: string, statusFilePath: string, onStatusUpdate: (filePath: string) => void): vscode.Disposable;
  dispose(): void;
  
  // 新規メソッド
  loadStatusFile(projectPath: string, outputCallback?: (content: string) => void): Promise<string>;
  updateDirectoryStructure(projectPath: string): Promise<string>;
  setupProjectFileWatcher(projectPath: string, outputCallback: (filePath: string) => void): vscode.Disposable;
  
  // イベント
  onStatusFileChanged: vscode.Event<string>;
  onDirectoryStructureUpdated: vscode.Event<string>;
}

/**
 * ファイルシステムサービス実装クラス
 */
export class FileSystemService implements IFileSystemService {
  private _onStatusFileChanged = new vscode.EventEmitter<string>();
  public readonly onStatusFileChanged = this._onStatusFileChanged.event;
  
  private _onDirectoryStructureUpdated = new vscode.EventEmitter<string>();
  public readonly onDirectoryStructureUpdated = this._onDirectoryStructureUpdated.event;
  
  private _disposables: vscode.Disposable[] = [];
  private _fileManager: FileOperationManager;
  private _fileWatcher: vscode.FileSystemWatcher | null = null;
  private _docsDirWatcher: fs.FSWatcher | null = null;
  private _extensionPath: string;
  
  // シングルトンインスタンス
  private static _instance: FileSystemService;
  
  public static getInstance(): FileSystemService {
    if (!FileSystemService._instance) {
      FileSystemService._instance = new FileSystemService();
    }
    return FileSystemService._instance;
  }
  
  private constructor() {
    this._fileManager = FileOperationManager.getInstance();
    // 拡張機能のパスを取得
    this._extensionPath = vscode.extensions.getExtension('mikoto.appgenius-ai')?.extensionPath || '';
  }
  
  /**
   * マークダウンファイルを読み込む
   * @param filePath ファイルパス
   */
  public async readMarkdownFile(filePath: string): Promise<string> {
    try {
      // ファイルが存在するか確認
      if (!fs.existsSync(filePath)) {
        throw new Error(`ファイルが見つかりません: ${filePath}`);
      }
      
      // ファイルの内容を読み込む
      const content = await this._fileManager.readFileAsString(filePath);
      
      Logger.info(`FileSystemService: マークダウンコンテンツを読み込みました: ${filePath}`);
      
      // 読み込んだファイルの内容をイベントとして通知
      this._onStatusFileChanged.fire(filePath);
      
      return content;
    } catch (error) {
      Logger.error(`FileSystemService: マークダウンコンテンツの読み込みに失敗しました: ${filePath}`, error as Error);
      throw error;
    }
  }
  
  /**
   * 進捗ファイルパスを取得 - 新旧両方のファイル名に対応
   * @param projectPath プロジェクトパス
   * @param preferredName 優先するファイル名（省略可能）
   * @returns 有効な進捗ファイルパス
   */
  public getProgressFilePath(projectPath: string, preferredName?: string): string {
    const docsDir = path.join(projectPath, 'docs');
    
    // 新旧のパスを生成
    const newPath = path.join(docsDir, 'SCOPE_PROGRESS.md');
    const oldPath = path.join(docsDir, 'CURRENT_STATUS.md');
    
    // 優先ファイル名が指定されている場合はそれを優先
    if (preferredName === 'SCOPE_PROGRESS.md' && fs.existsSync(newPath)) {
      return newPath;
    } else if (preferredName === 'CURRENT_STATUS.md' && fs.existsSync(oldPath)) {
      return oldPath;
    }
    
    // デフォルト優先順位: SCOPE_PROGRESS.md > CURRENT_STATUS.md > 新規作成用パス
    if (fs.existsSync(newPath)) {
      return newPath;
    } else if (fs.existsSync(oldPath)) {
      return oldPath;
    }
    
    // どちらも存在しない場合は新しい命名規則を使用
    return newPath;
  }

  /**
   * 進捗ファイルを作成 - 新旧両方のファイル名に対応
   * @param projectPath プロジェクトパス
   * @param projectName プロジェクト名
   * @param fileName ファイル名（SCOPE_PROGRESS.md または CURRENT_STATUS.md）
   */
  public async createProgressFile(
    projectPath: string, 
    projectName?: string, 
    fileName: string = 'SCOPE_PROGRESS.md'
  ): Promise<void> {
    try {
      if (!projectPath) {
        throw new Error('プロジェクトパスが指定されていません');
      }
      
      // ファイル名を検証
      const validFileName = fileName === 'CURRENT_STATUS.md' ? 
        'CURRENT_STATUS.md' : 'SCOPE_PROGRESS.md';
        
      // docsディレクトリの確認
      const docsDir = path.join(projectPath, 'docs');
      await this.ensureDirectoryExists(docsDir);
      
      // ファイルパスの生成
      const filePath = path.join(docsDir, validFileName);
      
      // ファイルが既に存在する場合は何もしない
      if (fs.existsSync(filePath)) {
        Logger.info(`FileSystemService: 進捗ファイルは既に存在します: ${filePath}`);
        return;
      }
      
      // テンプレートの読み込み
      // テンプレートのファイル名も対応する必要があります
      const templateName = validFileName === 'CURRENT_STATUS.md' ? 
        'CURRENT_STATUSTEMPLATE.md' : 'SCOPE_PROGRESS_TEMPLATE.md';
        
      let templatePath = path.join(this._extensionPath, 'docs', templateName);
      
      // プロジェクト名が未指定の場合はディレクトリ名を使用
      const actualProjectName = projectName || path.basename(projectPath);
      
      // テンプレート読み込みと内容生成
      let templateContent = '';
      
      try {
        if (fs.existsSync(templatePath)) {
          // テンプレートファイルを読み込む
          templateContent = fs.readFileSync(templatePath, 'utf8');
          
          // テンプレートに応じて置換パターンを変更
          if (templateName === 'CURRENT_STATUSTEMPLATE.md') {
            // 古いテンプレート用の置換
            templateContent = templateContent
              .replace(/# AppGeniusスコープマネージャー使用ガイド/, `# ${actualProjectName} - スコープマネージャー使用ガイド`)
              .replace(/\(YYYY\/MM\/DD更新\)/g, `(${new Date().toISOString().split('T')[0].replace(/-/g, '/')}更新)`);
          } else {
            // 新しいテンプレート用の置換
            templateContent = templateContent
              .replace(/\[プロジェクト名\]/g, actualProjectName)
              .replace(/YYYY-MM-DD/g, new Date().toISOString().split('T')[0]);
          }
          
          Logger.info(`FileSystemService: ${templateName}を読み込みました: ${templatePath}`);
        } else {
          // テンプレートが見つからない場合はフォールバック
          if (templateName === 'SCOPE_PROGRESS_TEMPLATE.md') {
            // SCOPE_PROGRESS_TEMPLATEが見つからない場合はCURRENT_STATUSTEMPLATEを試す
            const fallbackPath = path.join(this._extensionPath, 'docs', 'CURRENT_STATUSTEMPLATE.md');
            if (fs.existsSync(fallbackPath)) {
              templateContent = fs.readFileSync(fallbackPath, 'utf8');
              templateContent = templateContent
                .replace(/# AppGeniusスコープマネージャー使用ガイド/, `# ${actualProjectName} - スコープマネージャー使用ガイド`)
                .replace(/\(YYYY\/MM\/DD更新\)/g, `(${new Date().toISOString().split('T')[0].replace(/-/g, '/')}更新)`);
              Logger.warn(`FileSystemService: ${templateName}が見つからないため、CURRENT_STATUSTEMPLATEを使用します`);
            } else {
              // それでも見つからない場合はデフォルトテンプレート
              templateContent = this._getDefaultProgressTemplate(actualProjectName);
              Logger.warn(`FileSystemService: どちらのテンプレートも見つかりません。デフォルトテンプレートを使用します。`);
            }
          } else {
            // CURRENT_STATUSTEMPLATEが見つからない場合はデフォルトテンプレート
            templateContent = this._getDefaultTemplate(actualProjectName);
            Logger.warn(`FileSystemService: ${templateName}が見つかりませんでした。デフォルトテンプレートを使用します。検索パス: ${templatePath}`);
          }
        }
      } catch (error) {
        // エラーが発生した場合はデフォルトテンプレートを使用
        if (validFileName === 'SCOPE_PROGRESS.md') {
          templateContent = this._getDefaultProgressTemplate(actualProjectName);
        } else {
          templateContent = this._getDefaultTemplate(actualProjectName);
        }
        Logger.error(`FileSystemService: ${templateName}の読み込みに失敗しました: ${templatePath}`, error as Error);
      }
      
      // ファイルに書き込み
      await fs.promises.writeFile(filePath, templateContent, 'utf8');
      
      // ファイルが作成されたことをイベントとして通知
      this._onStatusFileChanged.fire(filePath);
      
      Logger.info(`FileSystemService: 進捗ファイルを作成しました: ${filePath}`);
    } catch (error) {
      Logger.error(`FileSystemService: 進捗ファイルの作成に失敗しました`, error as Error);
      throw error;
    }
  }
  
  /**
   * デフォルトのステータスファイルを作成
   * @param projectPath プロジェクトパス
   * @param projectName プロジェクト名（省略時はディレクトリ名）
   */
  public async createDefaultStatusFile(projectPath: string, projectName?: string): Promise<void> {
    try {
      // 互換性のために古いファイル名を使用
      return this.createProgressFile(projectPath, projectName, 'CURRENT_STATUS.md');
    } catch (error) {
      Logger.error('FileSystemService: ステータスファイルの作成中にエラーが発生しました', error as Error);
      throw error;
    }
  }
  
  /**
   * ディレクトリ構造を取得
   * @param projectPath プロジェクトパス
   */
  public async getDirectoryStructure(projectPath: string): Promise<string> {
    if (!projectPath) {
      return '';
    }
    
    try {
      // ディレクトリツールを利用してプロジェクト構造を取得
      const { execSync } = require('child_process');
      
      // コマンドを実行
      const command = process.platform === 'win32'
        ? `cmd /c cd "${projectPath}" && tree /F /A`
        : `find "${projectPath}" -type f | grep -v "node_modules" | grep -v ".git" | sort`;
      
      const output = execSync(command, { maxBuffer: 10 * 1024 * 1024 }).toString();
      
      return output;
    } catch (error) {
      Logger.error('FileSystemService: ディレクトリ構造の取得中にエラーが発生しました', error as Error);
      return 'ディレクトリ構造の取得に失敗しました。';
    }
  }
  
  /**
   * ディレクトリの存在確認・作成
   * @param dirPath ディレクトリパス
   */
  public async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        Logger.info(`FileSystemService: ディレクトリを作成しました: ${dirPath}`);
      }
    } catch (error) {
      Logger.error(`FileSystemService: ディレクトリの作成に失敗しました: ${dirPath}`, error as Error);
      throw error;
    }
  }
  
  /**
   * ファイル変更の監視を設定
   * @param statusFilePath 監視対象のステータスファイルパス
   * @param onFileChanged ファイル変更時のコールバック
   */
  public setupFileWatcher(statusFilePath: string, onFileChanged: (filePath: string) => void): vscode.Disposable {
    try {
      // 既存の監視があれば破棄
      if (this._fileWatcher) {
        this._fileWatcher.dispose();
        this._fileWatcher = null;
      }
      
      if (this._docsDirWatcher) {
        this._docsDirWatcher.close();
        this._docsDirWatcher = null;
      }
      
      if (!statusFilePath) {
        throw new Error('監視対象のファイルパスが指定されていません');
      }
      
      const projectPath = path.dirname(path.dirname(statusFilePath)); // docs/<file>からプロジェクトパスを取得
      
      // docs ディレクトリが存在しない場合は作成
      const docsDir = path.join(projectPath, 'docs');
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }
      
      // CURRENT_STATUS.md と SCOPE_PROGRESS.md の両方を監視
      const watchers: vscode.FileSystemWatcher[] = [];
      
      // 監視するファイル名のパターンを定義
      const fileNames = ['CURRENT_STATUS.md', 'SCOPE_PROGRESS.md'];
      
      // 各ファイル名のパターンに対してウォッチャーを作成
      for (const fileName of fileNames) {
        const watchPath = path.join(docsDir, fileName);
        
        if (fs.existsSync(watchPath)) {
          // ファイルが存在する場合はそのファイルのみを監視
          const pattern = new vscode.RelativePattern(vscode.Uri.file(docsDir), fileName);
          const watcher = vscode.workspace.createFileSystemWatcher(
            pattern,
            false, // 作成イベントを無視しない
            false, // 変更イベントを無視しない
            false  // 削除イベントを無視しない
          );
          
          // ファイル変更時のイベントハンドラを設定
          watcher.onDidChange(async (uri) => {
            Logger.info(`【重要】FileSystemService: ファイル変更イベント検出: ${uri.fsPath}`);
            
            // ファイルが存在するか確認
            if (fs.existsSync(uri.fsPath)) {
              // 最終更新日時を取得して確実に変更を検出
              const stats = fs.statSync(uri.fsPath);
              Logger.info(`FileSystemService: ファイル情報 - 最終更新: ${stats.mtime}, サイズ: ${stats.size}バイト`);
              
              // ファイル内容をすぐに読み込んで通知
              try {
                const content = await this.readMarkdownFile(uri.fsPath);
                Logger.info(`FileSystemService: ファイル読み込み成功 - 長さ: ${content.length}文字`);
                
                // イベントを発火（より早く反応できるように先に実行）
                this._onStatusFileChanged.fire(uri.fsPath);
                Logger.info(`FileSystemService: イベント発火完了 - onStatusFileChanged`);
                
                // コールバックも呼び出して従来の動作も維持
                onFileChanged(uri.fsPath);
                Logger.info(`FileSystemService: コールバック実行完了 - onFileChanged`);
              } catch (error) {
                Logger.error(`FileSystemService: ファイル変更検出後の読み込みに失敗: ${uri.fsPath}`, error as Error);
                onFileChanged(uri.fsPath);
                this._onStatusFileChanged.fire(uri.fsPath);
              }
            } else {
              Logger.warn(`FileSystemService: 変更が検出されたファイルが存在しません: ${uri.fsPath}`);
            }
          });
          
          // ファイル作成時のイベントハンドラを設定
          watcher.onDidCreate(async (uri) => {
            Logger.info(`FileSystemService: ファイルが作成されました: ${uri.fsPath}`);
            onFileChanged(uri.fsPath);
            this._onStatusFileChanged.fire(uri.fsPath);
          });
          
          watchers.push(watcher);
          Logger.info(`FileSystemService: ${fileName}ファイルの監視を設定: ${watchPath}`);
        } else {
          // ファイルが存在しない場合でも、各パターンのファイル作成を監視
          const pattern = new vscode.RelativePattern(docsDir, fileName);
          const watcher = vscode.workspace.createFileSystemWatcher(pattern);
          
          // ファイル作成時にマークダウンコンテンツを更新
          watcher.onDidCreate(async (uri) => {
            Logger.info(`FileSystemService: ${fileName}ファイルが作成されました: ${uri.fsPath}`);
            onFileChanged(uri.fsPath);
            this._onStatusFileChanged.fire(uri.fsPath);
          });
          
          // ファイル変更時にマークダウンコンテンツを更新
          watcher.onDidChange(async (uri) => {
            Logger.info(`【重要】FileSystemService: ファイル変更イベント検出: ${uri.fsPath}`);
            
            // ファイルが存在するか確認
            if (fs.existsSync(uri.fsPath)) {
              // 最終更新日時を取得して確実に変更を検出
              const stats = fs.statSync(uri.fsPath);
              Logger.info(`FileSystemService: ファイル情報 - 最終更新: ${stats.mtime}, サイズ: ${stats.size}バイト`);
              
              // ファイル内容をすぐに読み込んで通知
              try {
                const content = await this.readMarkdownFile(uri.fsPath);
                Logger.info(`FileSystemService: ファイル読み込み成功 - 長さ: ${content.length}文字`);
                
                // イベントを発火（より早く反応できるように先に実行）
                this._onStatusFileChanged.fire(uri.fsPath);
                Logger.info(`FileSystemService: イベント発火完了 - onStatusFileChanged`);
                
                // コールバックも呼び出して従来の動作も維持
                onFileChanged(uri.fsPath);
                Logger.info(`FileSystemService: コールバック実行完了 - onFileChanged`);
              } catch (error) {
                Logger.error(`FileSystemService: ファイル変更検出後の読み込みに失敗: ${uri.fsPath}`, error as Error);
                onFileChanged(uri.fsPath);
                this._onStatusFileChanged.fire(uri.fsPath);
              }
            } else {
              Logger.warn(`FileSystemService: 変更が検出されたファイルが存在しません: ${uri.fsPath}`);
            }
          });
          
          watchers.push(watcher);
          Logger.info(`FileSystemService: ${fileName}ファイル作成の監視を設定: ${docsDir}`);
        }
      }
      
      // 複合ウォッチャーを作成
      this._fileWatcher = {
        dispose: () => {
          watchers.forEach(w => w.dispose());
        }
      };
      
      // イベントバスからの更新イベントをリッスン
      const eventBus = AppGeniusEventBus.getInstance();
      
      // CURRENT_STATUS_UPDATED イベントを処理
      const currentStatusEventListener = eventBus.onEventType(AppGeniusEventType.CURRENT_STATUS_UPDATED, async (event) => {
        // 自分自身が送信したイベントは無視（循環を防ぐ）
        if (event.source === 'FileSystemService') {
          return;
        }
        
        // プロジェクトIDが一致しない場合は無視
        if (!projectPath || !event.projectId || 
            !projectPath.includes(event.projectId)) {
          return;
        }
        
        Logger.info('FileSystemService: 他のコンポーネントからのCURRENT_STATUS更新イベントを受信しました');
        
        // 進捗ファイルパスを取得（SCOPE_PROGRESS.md優先）
        const progressFilePath = this.getProgressFilePath(projectPath);
        if (fs.existsSync(progressFilePath)) {
          onFileChanged(progressFilePath);
          this._onStatusFileChanged.fire(progressFilePath);
        }
      });
      
      // SCOPE_PROGRESS_UPDATED イベントも処理（まだ定義されていなければコメントアウト）
      /*
      const scopeProgressEventListener = eventBus.onEventType(AppGeniusEventType.SCOPE_PROGRESS_UPDATED, async (event) => {
        // 自分自身が送信したイベントは無視（循環を防ぐ）
        if (event.source === 'FileSystemService') {
          return;
        }
        
        // プロジェクトIDが一致しない場合は無視
        if (!projectPath || !event.projectId || 
            !projectPath.includes(event.projectId)) {
          return;
        }
        
        Logger.info('FileSystemService: 他のコンポーネントからのSCOPE_PROGRESS更新イベントを受信しました');
        
        // 進捗ファイルパスを取得（SCOPE_PROGRESS.md優先）
        const progressFilePath = this.getProgressFilePath(projectPath);
        if (fs.existsSync(progressFilePath)) {
          onFileChanged(progressFilePath);
          this._onStatusFileChanged.fire(progressFilePath);
        }
      });
      */
      
      this._disposables.push(currentStatusEventListener);
      //this._disposables.push(scopeProgressEventListener); // まだ定義されていなければコメントアウト
      
      // 複合disposableを返す
      return {
        dispose: () => {
          watchers.forEach(w => w.dispose());
          currentStatusEventListener.dispose();
          //scopeProgressEventListener.dispose(); // まだ定義されていなければコメントアウト
        }
      };
    } catch (error) {
      Logger.error('FileSystemService: ファイル監視の設定中にエラーが発生しました', error as Error);
      throw error;
    }
  }
  
  /**
   * デフォルトテンプレートを取得（従来の形式）
   */
  private _getDefaultTemplate(projectName: string): string {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');
    
    return `# ${projectName} - 進行状況 (${today}更新)

## スコープ状況

### 完了済みスコープ
（完了したスコープはまだありません）

### 進行中スコープ
（実装中のスコープはまだありません）

### 未着手スコープ
- [ ] 基本機能の実装 (0%)
  - 説明: プロジェクトの基本機能を実装します
  - ステータス: 未着手
  - スコープID: scope-${Date.now()}
  - 関連ファイル:
    - (ファイルはまだ定義されていません)
`;
  }
  
  /**
   * デフォルトの進捗テンプレートを取得（SCOPE_PROGRESS形式）
   */
  private _getDefaultProgressTemplate(projectName: string): string {
    const today = new Date().toISOString().split('T')[0];
    
    return `# ${projectName} 開発プロセス進捗状況

**バージョン**: 0.1 (初期版)  
**最終更新日**: ${today}  
**ステータス**: プロジェクト開始・要件定義準備段階

## 1. 基本情報

- **ステータス**: 開始段階 (0% 完了)
- **完了タスク数**: 0/10
- **進捗率**: 0%
- **次のマイルストーン**: 要件定義完了 (目標: [日付])

## 2. 実装概要

${projectName}は、[プロジェクトの簡潔な説明を1-2文で記述します]。このプロジェクトは現在、プロジェクト準備が完了し、要件定義フェーズを開始しています。

## 3. 参照ドキュメント

- **開発方法論**: [developmentway2.md](/docs/prompts/developmentway2.md)
- **要件定義テンプレート**: [ideal_requirements_template.md](/docs/prompts/ideal_requirements_template.md)
- **サンプル技術スタック**: [sample-tech-stack.md](/docs/samples/sample-tech-stack.md)

## 4. 開発フロー進捗状況

AppGeniusでの開発は以下のフローに沿って進行します。現在の進捗は以下の通りです：

| フェーズ | 状態 | 進捗 | 担当エージェント | 成果物 | 依存/並列情報 |
|---------|------|------|----------------|--------|--------------|
| **0. プロジェクト準備** | ✅ 完了 | 100% | - | プロジェクトリポジトリ、環境設定 | 先行必須 |
| **1. 要件定義** | 🔄 進行中 | 5% | プロジェクトファウンデーション (#1) | [requirements.md](/docs/requirements.md) | 先行必須 |
| **2. 技術選定** | ⏱ 未着手 | 0% | プロジェクトファウンデーション (#1) | [tech-stack.md](/docs/architecture/tech-stack.md) | フェーズ1後 |
| **3. モックアップ作成** | ⏱ 未着手 | 0% | モックアップクリエイター (#2) | [mockups/](/mockups/) | フェーズ1後 |
| **4. データモデル設計** | ⏱ 未着手 | 0% | データモデルアーキテクト (#3) | [shared/index.ts](/shared/index.ts) | フェーズ3後、5と並列可 |
| **5. API設計** | ⏱ 未着手 | 0% | APIデザイナー (#4) | [docs/api/](/docs/api/) | フェーズ3後、4と並列可 |
| **6. 実装計画** | ⏱ 未着手 | 0% | スコーププランナー (#8) | SCOPE_PROGRESS.md 更新 | フェーズ4,5後 |
| **7. バックエンド実装** | ⏱ 未着手 | 0% | バックエンド実装エージェント (#10) | サーバーサイドコード | フェーズ6後、8と並列可 |
| **8. フロントエンド実装** | ⏱ 未着手 | 0% | フロントエンド実装エージェント (#9) | クライアントサイドコード | フェーズ6後、7と並列可 |
| **9. テスト** | ⏱ 未着手 | 0% | テスト管理エージェント (#11) | テストコード | フェーズ7,8後 |
| **10. デプロイ準備** | ⏱ 未着手 | 0% | デプロイ設定エージェント (#13) | [docs/deployment/](/docs/deployment/) | フェーズ9後 |

## 5. タスクリスト

### プロジェクト準備フェーズ
- [x] 1. プロジェクトリポジトリ作成
- [x] 2. 開発環境のセットアップ
- [x] 3. 初期ディレクトリ構造の作成
- [x] 4. README.mdの作成
- [x] 5. 開発フレームワークの初期設定

### 要件定義フェーズ
- [ ] 6. プロジェクト目的と背景の明確化
- [ ] 7. ターゲットユーザーの特定
- [ ] 8. 主要機能リストの作成
- [ ] 9. 画面一覧の作成
- [ ] 10. ユーザーストーリーの作成
- [ ] 11. 技術要件の定義

## 6. 次のステップ

要件定義が完了したら、以下のステップに進みます：

1. **技術スタックの選定**
   - プロジェクト要件に適した技術の評価
   - フロントエンド/バックエンド技術の決定
   - インフラストラクチャとデプロイ方法の検討

2. **モックアップ作成**
   - 共通コンポーネントの設計
   - 優先度の高い画面から順にモックアップ作成
   - ユーザーフローとインタラクションの検討

## 7. エラー引き継ぎログ

このセクションは、AI間の知識継承のための重要な機能です。複雑なエラーや課題に遭遇した場合、次のAIが同じ問題解決に時間を浪費しないよう記録します。

**重要ルール**:
1. エラーが解決されたらすぐに該当ログを削除すること
2. 一度に対応するのは原則1タスクのみ（並列開発中のタスクを除く）
3. 試行済みのアプローチと結果を詳細に記録すること
4. コンテキストウィンドウの制限を考慮し、簡潔かつ重要な情報のみを記載すること
5. 解決の糸口や参考リソースを必ず含めること

### 現在のエラーログ

| タスクID | 問題・課題の詳細 | 試行済みアプローチとその結果 | 現状 | 次のステップ | 参考資料 |
|---------|----------------|------------------------|------|------------|---------|
| - | - | - | - | - | - |
`;
  }
  
  /**
   * ファイルが存在するか確認する
   * @param filePath ファイルパス
   * @returns ファイルが存在する場合はtrue、それ以外はfalse
   */
  public async fileExists(filePath: string): Promise<boolean> {
    try {
      if (!filePath) {
        return false;
      }
      
      return new Promise<boolean>((resolve) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
          resolve(!err);
        });
      });
    } catch (error) {
      Logger.error(`FileSystemService: ファイル存在確認に失敗しました: ${filePath}`, error as Error);
      return false;
    }
  }
  
  /**
   * 拡張されたファイル監視機能
   * ファイル変更時の遅延読み込みオプションなど追加機能を提供
   * @param statusFilePath 監視対象のステータスファイルパス
   * @param onFileChanged ファイル変更時のコールバック
   * @param options オプション設定（遅延読み込み時間など）
   */
  public setupEnhancedFileWatcher(
    statusFilePath: string, 
    onFileChanged: (filePath: string) => void,
    options?: { delayedReadTime?: number }
  ): vscode.Disposable {
    try {
      // 基本的なファイル監視を設定
      const baseWatcher = this.setupFileWatcher(statusFilePath, async (filePath) => {
        // ファイル変更時に即時通知
        Logger.info(`FileSystemService(Enhanced): ファイル変更検出: ${filePath}`);
        
        try {
          // 即時読み込みと通知
          await this.readMarkdownFile(filePath);
          onFileChanged(filePath);
          
          // 遅延読み込みオプションが有効な場合は2回目の読み込みを実行
          const delayTime = options?.delayedReadTime || 100;
          if (delayTime > 0) {
            setTimeout(async () => {
              Logger.info(`FileSystemService(Enhanced): 遅延読み込み(${delayTime}ms後): ${filePath}`);
              
              try {
                await this.readMarkdownFile(filePath);
                onFileChanged(filePath);
              } catch (delayedError) {
                Logger.warn(`FileSystemService(Enhanced): 遅延読み込み中にエラー: ${filePath}`, delayedError as Error);
              }
            }, delayTime);
          }
        } catch (error) {
          Logger.error(`FileSystemService(Enhanced): ファイル読み込み中にエラー: ${filePath}`, error as Error);
          // エラーがあっても通知だけは行う
          onFileChanged(filePath);
        }
      });
      
      // 基本的なウォッチャーを返す
      return baseWatcher;
    } catch (error) {
      Logger.error(`FileSystemService(Enhanced): ファイル監視の設定に失敗: ${statusFilePath}`, error as Error);
      // 空のdisposableを返す
      return { dispose: () => {} };
    }
  }
  
  /**
   * ステータスファイル用のイベントリスナーを設定
   * AppGeniusEventBusからのCURRENT_STATUS_UPDATEDイベントをリッスン
   * @param projectPath プロジェクトパス
   * @param statusFilePath ステータスファイルパス
   * @param onStatusUpdate ステータス更新時のコールバック
   */
  public setupStatusFileEventListener(
    projectPath: string,
    statusFilePath: string,
    onStatusUpdate: (filePath: string) => void
  ): vscode.Disposable {
    try {
      // イベントバスからのCURRENT_STATUS_UPDATEDイベントをリッスン
      const eventBus = AppGeniusEventBus.getInstance();
      const listener = eventBus.onEventType(AppGeniusEventType.CURRENT_STATUS_UPDATED, async (event) => {
        // 自分自身が送信したイベントは無視（循環を防ぐ）
        if (event.source === 'FileSystemService') {
          return;
        }
        
        // プロジェクトIDが一致しない場合は無視
        if (!projectPath || !event.projectId || 
            !projectPath.includes(event.projectId)) {
          return;
        }
        
        Logger.info(`FileSystemService: 他のコンポーネントからのCURRENT_STATUS更新イベントを受信: projectPath=${projectPath}`);
        
        // ステータスファイルが存在する場合はその内容を読み込み
        if (await this.fileExists(statusFilePath)) {
          try {
            await this.readMarkdownFile(statusFilePath);
            onStatusUpdate(statusFilePath);
          } catch (error) {
            Logger.error(`FileSystemService: ステータスファイル読み込みに失敗: ${statusFilePath}`, error as Error);
            // エラーがあっても通知だけは行う
            onStatusUpdate(statusFilePath);
          }
        } else {
          Logger.warn(`FileSystemService: ステータスファイルが存在しません: ${statusFilePath}`);
        }
      });
      
      return listener;
    } catch (error) {
      Logger.error(`FileSystemService: イベントリスナーの設定に失敗: ${projectPath}`, error as Error);
      // 空のdisposableを返す
      return { dispose: () => {} };
    }
  }
  
  /**
   * ステータスファイルを読み込み、必要に応じて作成する
   * @param projectPath プロジェクトパス
   * @param outputCallback 出力コールバック - ファイル内容が変更された時に呼び出される
   * @returns ステータスファイルの内容
   */
  public async loadStatusFile(projectPath: string, outputCallback?: (content: string) => void): Promise<string> {
    try {
      if (!projectPath) {
        throw new Error('プロジェクトパスが指定されていません');
      }

      // ステータスファイルの存在確認とパス生成
      const docsDir = path.join(projectPath, 'docs');
      const statusFilePath = path.join(docsDir, 'CURRENT_STATUS.md');
      
      // ディレクトリを確保
      await this.ensureDirectoryExists(docsDir);

      // ファイルの存在確認
      const fileExists = await this.fileExists(statusFilePath);

      // ステータスファイルが存在しない場合はテンプレートを作成
      if (!fileExists) {
        const projectName = path.basename(projectPath);
        await this.createDefaultStatusFile(projectPath, projectName);
        Logger.info(`ステータスファイルを作成しました: ${statusFilePath}`);
      }

      // ファイルを読み込む
      const content = await this.readMarkdownFile(statusFilePath);
      
      // コールバックがあれば呼び出す
      if (outputCallback) {
        outputCallback(content);
      }
      
      return content;
    } catch (error) {
      Logger.error('ステータスファイルの読み込み中にエラーが発生しました', error as Error);
      throw error;
    }
  }

  /**
   * プロジェクトのディレクトリ構造を更新
   * @param projectPath プロジェクトパス
   * @returns ディレクトリ構造を表す文字列
   */
  public async updateDirectoryStructure(projectPath: string): Promise<string> {
    if (!projectPath) {
      return '';
    }
    
    try {
      // 既存のgetDirectoryStructureメソッドを使用
      const structure = await this.getDirectoryStructure(projectPath);
      
      // イベントを発火
      this._onDirectoryStructureUpdated.fire(structure);
      
      return structure;
    } catch (error) {
      Logger.error('ディレクトリ構造の更新中にエラーが発生しました', error as Error);
      return 'ディレクトリ構造の取得に失敗しました。';
    }
  }

  /**
   * プロジェクト用のファイル監視設定
   * docs/CURRENT_STATUS.mdファイルの変更を監視し、イベントとコールバックで通知
   * @param projectPath プロジェクトのルートパス
   * @param outputCallback ファイル変更時のコールバック
   * @returns Disposable - 監視を停止するためのオブジェクト
   */
  public setupProjectFileWatcher(projectPath: string, outputCallback: (filePath: string) => void): vscode.Disposable {
    try {
      if (!projectPath) {
        throw new Error('プロジェクトパスが指定されていません');
      }
      
      // ステータスファイルのパスを構築
      const docsDir = path.join(projectPath, 'docs');
      const statusFilePath = path.join(docsDir, 'CURRENT_STATUS.md');
      
      // ディレクトリを確保
      this.ensureDirectoryExists(docsDir);
      
      // 拡張ファイル監視を設定（遅延読み込みオプション付き）
      const watcher = this.setupEnhancedFileWatcher(
        statusFilePath,
        async (filePath) => {
          // ファイル変更を検出したらコールバックを呼び出す
          Logger.info(`FileSystemService: ファイル変更を検出: ${filePath}`);
          outputCallback(filePath);
        },
        { delayedReadTime: 100 } // 100ms後に2回目の読み込みを実行
      );
      
      // イベントリスナーも設定
      const eventListener = this.setupStatusFileEventListener(
        projectPath,
        statusFilePath,
        async (filePath) => {
          // イベントバス経由の通知を受けた場合もコールバックを呼び出す
          Logger.info(`FileSystemService: イベントバス経由でファイル更新を検出: ${filePath}`);
          outputCallback(filePath);
        }
      );
      
      // 複合Disposableを返す
      return {
        dispose: () => {
          watcher.dispose();
          eventListener.dispose();
        }
      };
    } catch (error) {
      Logger.error('ファイル監視の設定中にエラーが発生しました', error as Error);
      throw error;
    }
  }

  /**
   * リソースを解放
   */
  public dispose(): void {
    // イベントエミッターを解放
    this._onStatusFileChanged.dispose();
    this._onDirectoryStructureUpdated.dispose();
    
    // ファイルウォッチャーを破棄
    if (this._fileWatcher) {
      this._fileWatcher.dispose();
      this._fileWatcher = null;
    }
    
    // Node.jsのファイルシステムウォッチャーも破棄
    if (this._docsDirWatcher) {
      this._docsDirWatcher.close();
      this._docsDirWatcher = null;
    }
    
    // disposable なオブジェクトを破棄
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}