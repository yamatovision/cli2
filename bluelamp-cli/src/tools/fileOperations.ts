import * as fs from 'fs';
import * as path from 'path';

export class FileOperations {

  /**
   * ファイルを読み取る
   */
  static readFile(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  /**
   * ファイルを書き込む
   */
  static writeFile(filePath: string, content: string): void {
    try {
      // ディレクトリが存在しない場合は作成
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error}`);
    }
  }

  /**
   * ファイルを追記する
   */
  static appendFile(filePath: string, content: string): void {
    try {
      fs.appendFileSync(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to append to file ${filePath}: ${error}`);
    }
  }

  /**
   * ファイルが存在するかチェック
   */
  static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * ディレクトリを作成
   */
  static createDirectory(dirPath: string): void {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error}`);
    }
  }

  /**
   * ファイルを削除
   */
  static deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      throw new Error(`Failed to delete file ${filePath}: ${error}`);
    }
  }

  /**
   * ディレクトリ内のファイル一覧を取得
   */
  static listFiles(dirPath: string): string[] {
    try {
      if (!fs.existsSync(dirPath)) {
        return [];
      }
      return fs.readdirSync(dirPath);
    } catch (error) {
      throw new Error(`Failed to list files in ${dirPath}: ${error}`);
    }
  }

  /**
   * ファイルをコピー
   */
  static copyFile(sourcePath: string, destPath: string): void {
    try {
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.copyFileSync(sourcePath, destPath);
    } catch (error) {
      throw new Error(`Failed to copy file from ${sourcePath} to ${destPath}: ${error}`);
    }
  }
}
