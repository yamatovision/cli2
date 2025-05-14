import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Logger } from './logger';

/**
 * CLAUDE.mdファイルを管理するサービス
 */
export class ClaudeMdService {
  private static instance: ClaudeMdService;
  
  private constructor() {}
  
  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): ClaudeMdService {
    if (!ClaudeMdService.instance) {
      ClaudeMdService.instance = new ClaudeMdService();
    }
    return ClaudeMdService.instance;
  }

  /**
   * CLAUDE.mdを生成 - プロジェクト情報から
   * @param projectPath プロジェクトパス
   * @param projectInfo プロジェクト情報
   * @returns CLAUDE.mdのパス、または失敗時はnull
   */
  public async generateClaudeMd(projectPath: string, projectInfo: { 
    name: string, 
    description?: string 
  }): Promise<string | null> {
    try {
      const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
      
      // 重要: すでにCLAUDE.mdが存在する場合は上書きしない
      if (fs.existsSync(claudeMdPath)) {
        Logger.info(`CLAUDE.mdはすでに存在します。上書きしません: ${claudeMdPath}`);
        return claudeMdPath;
      }
      
      // テンプレートを取得
      let template = this.getDefaultTemplate();
      
      // プロジェクト名とプロジェクト説明を置換
      template = template
        .replace(/\${PROJECT_NAME}/g, projectInfo.name || 'プロジェクト名')
        .replace(/\${PROJECT_DESCRIPTION}/g, projectInfo.description || `${projectInfo.name}プロジェクトの説明をここに記述します。`);
      
      // ファイルに書き込む
      fs.writeFileSync(claudeMdPath, template, 'utf8');
      
      Logger.info(`CLAUDE.mdを生成しました: ${claudeMdPath}`);
      return claudeMdPath;
    } catch (error) {
      Logger.error('CLAUDE.md生成エラー', error as Error);
      return null;
    }
  }
  
  /**
   * 既存のCLAUDE.mdを読み込む
   * @param projectPath プロジェクトパス
   * @returns CLAUDE.mdの内容、または失敗時はnull
   */
  public loadClaudeMd(projectPath: string): string | null {
    try {
      const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
      if (fs.existsSync(claudeMdPath)) {
        return fs.readFileSync(claudeMdPath, 'utf8');
      }
      return null;
    } catch (error) {
      Logger.error('CLAUDE.md読み込みエラー', error as Error);
      return null;
    }
  }
  
  /**
   * CLAUDE.md内の指定セクションを更新
   * @param projectPath プロジェクトパス
   * @param sectionName セクション名
   * @param content 新しい内容
   * @returns 成功したかどうか
   */
  public updateClaudeMdSection(projectPath: string, sectionName: string, content: string): boolean {
    try {
      const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
      
      // ファイルが存在するか確認
      if (!fs.existsSync(claudeMdPath)) {
        // ファイルが存在しない場合は警告して処理停止
        Logger.warn(`CLAUDE.mdが見つかりません: ${claudeMdPath}`);
        return false;
      }
      
      // ファイルを読み込む
      let claudeMdContent = fs.readFileSync(claudeMdPath, 'utf8');
      
      // セクションのパターン
      const sectionPattern = new RegExp(`## ${sectionName}[\\s\\S]*?(?=##|$)`, 'm');
      const newSection = `## ${sectionName}\n\n${content}\n\n`;
      
      // セクションの置換または追加
      if (claudeMdContent.match(sectionPattern)) {
        claudeMdContent = claudeMdContent.replace(sectionPattern, newSection);
      } else {
        claudeMdContent += `\n${newSection}`;
      }
      
      // ファイルに書き戻す
      fs.writeFileSync(claudeMdPath, claudeMdContent, 'utf8');
      
      Logger.info(`CLAUDE.mdの${sectionName}セクションを更新しました`);
      return true;
    } catch (error) {
      Logger.error(`CLAUDE.mdセクション更新エラー: ${sectionName}`, error as Error);
      return false;
    }
  }
  
  /**
   * CLAUDE.md内の指定セクションを取得
   * @param projectPath プロジェクトパス
   * @param sectionName セクション名
   * @returns セクションの内容、または失敗時はnull
   */
  public getClaudeMdSection(projectPath: string, sectionName: string): string | null {
    try {
      const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
      
      // ファイルが存在するか確認
      if (!fs.existsSync(claudeMdPath)) {
        Logger.warn(`CLAUDE.mdが見つかりません: ${claudeMdPath}`);
        return null;
      }
      
      // ファイルを読み込む
      const claudeMdContent = fs.readFileSync(claudeMdPath, 'utf8');
      
      // セクションを正規表現で抽出
      const sectionPattern = new RegExp(`## ${sectionName}([\\s\\S]*?)(?=##|$)`, 'm');
      const match = claudeMdContent.match(sectionPattern);
      
      if (match && match[1]) {
        return match[1].trim();
      }
      
      return null;
    } catch (error) {
      Logger.error(`CLAUDE.mdセクション取得エラー: ${sectionName}`, error as Error);
      return null;
    }
  }

  /**
   * CLAUDE.mdの存在チェックと必要に応じた作成
   * @param projectPath プロジェクトパス
   * @param projectInfo プロジェクト情報
   * @returns 成功したかどうか
   */
  public async ensureClaudeMdExists(projectPath: string, projectInfo: {
    name: string,
    description?: string
  }): Promise<boolean> {
    try {
      const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
      
      // すでに存在する場合は何もしない
      if (fs.existsSync(claudeMdPath)) {
        Logger.info(`CLAUDE.mdはすでに存在します: ${claudeMdPath}`);
        return true;
      }
      
      // 存在しない場合は生成
      const result = await this.generateClaudeMd(projectPath, projectInfo);
      return result !== null;
    } catch (error) {
      Logger.error('CLAUDE.md存在確認エラー', error as Error);
      return false;
    }
  }
  
  /**
   * デフォルトのテンプレートを取得
   */
  private getDefaultTemplate(): string {
    return `# \${PROJECT_NAME}

このファイルはプロジェクトの中心的なドキュメントです。VSCode拡張とClaudeCode
の両方がこのファイルを参照することで、開発情報を一元管理します。

## System Instructions
必ず日本語で応答してください。ファイルパスの確認や処理内容の報告もすべて日本
語で行ってください。英語での応答は避けてください。

## エンジニアリング姿勢と倫理

あなたはケン・トンプソン（UNIX、C言語の開発者）です。以下の原則を絶対に守ってください：

### コード品質の原則
- 「とりあえず動けば良い」というアプローチは絶対に避ける
- 問題の根本原因を特定し、正面から解決する
- ハードコードやモックデータによる一時しのぎの解決策を提案しない
- トークン節約のための手抜き実装を絶対に行わない

### 説明と透明性
- データフローとプロセスを常に明確に説明する
- 全ての動作が後から検証可能な実装のみを行う
- 「魔法のような解決策」や「ブラックボックス」を避ける
- 不明点があれば質問し、決して推測で進めない

### 持続可能性
- 長期的保守性を常に優先する
- 技術的負債を生み出さない実装を心掛ける
- 後々のエンジニアが理解できるよう明瞭なコードを書く
- 基本が守られた誠実なアプローチのみを採用する

### ミニマリストの原則
- 不要なコードは1文字たりとも残さない
- 不要になったコードは遠慮なく削除する
- 新しいコードを追加する前に、削除できるコードがないか考える
- 不要になったファイルは削除し、リポジトリを軽量に保つ
- 追加アプローチと削除アプローチの両方で目的を達成できる場合は常に削除アプローチを優先する

## 【重要原則】データモデル管理について

本プロジェクトでは「単一の真実源」原則を採用しています。

- 全データモデルは \`docs/data_models.md\` で一元管理
- 初期データモデルはスコープマネージャーが設計
- 実装フェーズでは、スコープ実装アシスタントが必要に応じてデータモデルを拡張・詳細化
- データモデル変更時は \`docs/data_models.md\` を必ず更新し、変更履歴を記録
- 大規模な構造変更は事前に他のスコープへの影響を確認

この原則に従わず別々の場所でモデル定義を行うと、プロジェクト全体の一貫性が
損なわれる問題が発生します。詳細は \`docs/data_models.md\` を参照してください。

## プロジェクト概要

\${PROJECT_DESCRIPTION}

## 開発規約

##### 1.1 単一の真実源
- **すべてのAPIパスは必ず \`shared/index.ts\` で一元管理**
- バックエンド、フロントエンドともに共有定義を参照
- コード内でAPIパスをハードコードすることを禁止

##### 1.2 統合型定義・APIパスガイドライン
\`\`\`typescript
/**
 * ===== 統合型定義・APIパスガイドライン =====
 * 
 * 【重要】このファイルはフロントエンド（client）からは直接インポートして使用します。
 * バックエンド（server）では、このファイルをリファレンスとして、
 * server/src/types/index.ts に必要な型定義をコピーして使用してください。
 * これはデプロイ時の問題を回避するためのアプローチです。
 * 
 * 【絶対に守るべき原則】
 * 1. フロントエンドとバックエンドで異なる型を作らない
 * 2. 同じデータ構造に対して複数の型を作らない
 * 3. 新しいプロパティは必ずオプショナルとして追加
 * 4. データの形はこのファイルで一元的に定義し、バックエンドはこれをコピーして使用
 * 5. APIパスは必ずこのファイルで一元管理する
 * 6. コード内でAPIパスをハードコードしない
 * 7. パスパラメータを含むエンドポイントは関数として提供する
 */
\`\`\`

##### 1.3 開発フロー
1. **共有定義を更新**: shared/index.ts にAPIパスと型定義を追加
2. **バックエンド用の定義をコピー**: server/src/types/index.ts にも同様の更新を手動で反映
3. **バックエンド実装**: ルートとコントローラーを設計書に準拠して実装
4. **実認証テスト**: モックではなく実際の認証情報を使った統合テストを実施
5. **フロントエンド実装**: 共有定義を参照したAPI連携コードを実装

## プロジェクト情報
- 作成日: ${new Date().toISOString().split('T')[0]}
- 状態: 計画中
`;
  }
}