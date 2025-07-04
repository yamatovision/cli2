/**
 * ハニーポット管理サービス
 * トラップキーの管理と検知を行うサービス
 */

const SimpleUser = require('../models/simpleUser.model');
const CliTokenService = require('./cli-token.service');
const TrapPrompt = require('../models/trapPrompt.model');
const TrapAccessLog = require('../models/trapAccessLog.model');

class HoneypotService {
    
    /**
     * トラップキーのリスト
     * これらのキーが使用されたら即座にアカウントを停止
     */
    static TRAP_KEYS = [
        // 本物らしいセッション内トラップ
        'sk-proj-vX8mN3kP9qR2sT5wY7zB1cD4',
        'sk-proj-aB2cD4eF6gH8iJ0kL2mN4oP6',
        'sk-proj-qR9sT7uV5wX3yZ1aB9cD7eF5',
        'sk-proj-mN6oP8qR0sT2uV4wX6yZ8aB0',
        'sk-proj-eF3gH5iJ7kL9mN1oP3qR5sT7',
        'sk-proj-uV2wX4yZ6aB8cD0eF2gH4iJ6',
        'sk-proj-kL8mN0oP2qR4sT6uV8wX0yZ2',
        'sk-proj-aB4cD6eF8gH0iJ2kL4mN6oP8',
        'sk-proj-qR1sT3uV5wX7yZ9aB1cD3eF5',
        'sk-proj-mN7oP9qR1sT3uV5wX7yZ9aB1',
        'sk-proj-eF4gH6iJ8kL0mN2oP4qR6sT8',
        'sk-proj-uV0wX2yZ4aB6cD8eF0gH2iJ4',
        'sk-proj-kL5mN7oP9qR1sT3uV5wX7yZ9',
        'sk-proj-aB3cD5eF7gH9iJ1kL3mN5oP7',
        'sk-proj-qR9sT1uV3wX5yZ7aB9cD1eF3',
        'sk-proj-mN5oP7qR9sT1uV3wX5yZ7aB9',
        'sk-proj-eF1gH3iJ5kL7mN9oP1qR3sT5',
        'sk-proj-uV7wX9yZ1aB3cD5eF7gH9iJ1',
        'sk-proj-kL3mN5oP7qR9sT1uV3wX5yZ7',
        'sk-proj-aB9cD1eF3gH5iJ7kL9mN1oP3',
        
        // デコイディレクトリトラップ（本物らしい形式）
        'sk-proj-xY7zB9cD1eF3gH5iJ7kL9mN1',  // これが当たり！
        'sk-proj-pQ2rS4tU6vW8xY0zA2bC4dE6',
        'sk-proj-fG8hI0jK2lM4nO6pQ8rS0tU2',
        
        // リアルに見せかけたトラップ（改善版）
        'sk-proj-wX3yZ5aB7cD9eF1gH3iJ5kL7',
        'sk-proj-mN9oP1qR3sT5uV7wX9yZ1aB3',
        'cli_mk8n3p_a302ae96bc54d1789ef23456',
        'bluelamp_api_2025_prod_7f8e9d0c1b2a',
        'bluelamp_cli_token_x9y8z7w6v5u4t3s2'
    ];
    
    /**
     * 「当たり」のトラップキー（偽プロンプトを返す）
     * 最も見つかりにくいキーを「当たり」に設定
     * bluelamp_cli_token_x9y8z7w6v5u4t3s2 - CLIトークン風で最も怪しまれにくい
     */
    static WINNING_TRAP_KEY = 'bluelamp_cli_token_x9y8z7w6v5u4t3s2';
    
    /**
     * トラップキーかどうかを判定
     * @param {string} apiKey - チェックするAPIキー
     * @returns {boolean} トラップキーの場合true
     */
    static isTrapKey(apiKey) {
        if (!apiKey) return false;
        
        // 完全一致チェック
        if (this.TRAP_KEYS.includes(apiKey)) {
            return true;
        }
        
        // パターンマッチングは削除（本物らしいキーを使用するため）
        // 将来的に特定のパターンを追加する場合はここに記述
        
        return false;
    }
    
    /**
     * トラップキーが「当たり」かどうかを判定
     * @param {string} apiKey - チェックするAPIキー
     * @returns {boolean} 当たりの場合true
     */
    static isWinningTrapKey(apiKey) {
        return apiKey === this.WINNING_TRAP_KEY;
    }
    
    /**
     * トラップ発動時の処理
     * @param {Object} req - リクエストオブジェクト
     * @param {string} trapKey - 使用されたトラップキー
     * @returns {Promise<Object>} 処理結果
     */
    static async handleTrapTriggered(req, trapKey) {
        console.log('🚨 ハニーポットトラップ発動！');
        console.log('使用されたトラップキー:', trapKey);
        console.log('IPアドレス:', req.ip);
        console.log('User-Agent:', req.headers['user-agent']);
        
        try {
            // ユーザーの特定
            const user = await this.identifyUser(req);
            
            if (user) {
                // セキュリティステータスの初期化
                if (!user.securityStatus) {
                    user.securityStatus = {
                        violations: [],
                        isBlocked: false
                    };
                }
                
                // 違反記録を追加
                user.securityStatus.violations.push({
                    type: 'honeypot_access',
                    detectedAt: new Date(),
                    details: {
                        honeypotKey: trapKey,
                        ipAddress: req.ip,
                        userAgent: req.headers['user-agent'],
                        endpoint: req.originalUrl,
                        method: req.method
                    }
                });
                
                // アカウントを即座にブロック
                user.securityStatus.isBlocked = true;
                user.securityStatus.blockedAt = new Date();
                user.securityStatus.blockReason = 'セキュリティ違反：ハニーポットトラップが発動しました。不正なAPIキーの使用が検出されました。';
                user.securityStatus.canAppeal = true;
                
                await user.save();
                
                // 全てのCLIトークンを無効化
                await CliTokenService.revokeAllUserTokens(user._id, 'security_violation');
                
                console.log(`ユーザー ${user.email} のアカウントをブロックしました`);
                
                // 管理者への通知（将来的に実装）
                // await this.notifyAdmins({
                //     event: 'HONEYPOT_TRIGGERED',
                //     user: user.email,
                //     trapKey: trapKey,
                //     timestamp: new Date()
                // });
                
                return {
                    success: true,
                    userBlocked: true,
                    userId: user._id,
                    userEmail: user.email
                };
            } else {
                // ユーザーが特定できない場合でも記録
                console.log('警告: ユーザーを特定できませんでしたが、トラップが発動しました');
                
                return {
                    success: true,
                    userBlocked: false,
                    message: 'User not identified'
                };
            }
            
        } catch (error) {
            console.error('ハニーポット処理中のエラー:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * リクエストからユーザーを特定
     * @param {Object} req - リクエストオブジェクト
     * @returns {Promise<Object|null>} ユーザーオブジェクトまたはnull
     */
    static async identifyUser(req) {
        try {
            // CLIトークンから特定
            const cliToken = req.headers['x-cli-token'];
            if (cliToken) {
                const tokenData = await CliTokenService.verifyToken(cliToken);
                if (tokenData && tokenData.userId) {
                    return await SimpleUser.findById(tokenData.userId);
                }
            }
            
            // セッションから特定（Web UIの場合）
            if (req.session && req.session.userId) {
                return await SimpleUser.findById(req.session.userId);
            }
            
            // JWTトークンから特定（将来的な実装用）
            // const authHeader = req.headers.authorization;
            // if (authHeader && authHeader.startsWith('Bearer ')) {
            //     // JWT検証ロジック
            // }
            
            return null;
            
        } catch (error) {
            console.error('ユーザー特定エラー:', error);
            return null;
        }
    }
    
    /**
     * トラッププロンプトを取得
     * @param {string} promptId - プロンプトID
     * @param {Object} req - リクエストオブジェクト（ログ用）
     * @returns {Promise<Object>} トラッププロンプト
     */
    static async getTrapPrompt(promptId, req = null) {
        try {
            // HONEYPOT_DBからトラッププロンプトを取得
            const trapPrompt = await TrapPrompt.findOne({
                originalPromptId: promptId,
                isActive: true
            });
            
            if (!trapPrompt) {
                console.warn(`トラッププロンプトが見つかりません: ${promptId}`);
                return null;
            }
            
            // アクセスカウントを増やす
            await trapPrompt.incrementAccess();
            
            // アクセスログを記録
            if (req) {
                await TrapAccessLog.logAccess({
                    trapKey: req.trapKey || 'unknown',
                    promptId: promptId,
                    userId: req.user?._id,
                    userEmail: req.user?.email,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                    endpoint: req.originalUrl,
                    method: req.method,
                    headers: req.headers,
                    trackingId: trapPrompt.generateTrackingId(),
                    responseStatus: 200,
                    responseType: 'trap_prompt'
                });
            }
            
            // 追跡ID埋め込み済みのコンテンツを生成
            const trackedContent = trapPrompt.getContentWithTracking({
                userId: req?.user?._id,
                timestamp: Date.now()
            });
            
            // 本物のプロンプトと同じ形式で返却
            return {
                id: trapPrompt.originalPromptId,  // 本物のIDを返す
                title: trapPrompt.title,
                content: trackedContent,
                version: "1.0",
                tags: trapPrompt.tags,
                metadata: {
                    description: trapPrompt.description,
                    usageCount: trapPrompt.metadata.usageCount + trapPrompt.accessCount,
                    isPublic: true,
                    createdAt: trapPrompt.metadata.createdAt,
                    updatedAt: trapPrompt.metadata.updatedAt
                }
            };
            
        } catch (error) {
            console.error('トラッププロンプト取得エラー:', error);
            return null;
        }
    }
    
    /**
     * トラッププロンプトの一覧を取得
     * @param {Object} req - リクエストオブジェクト（ログ用）
     * @returns {Promise<Array>} トラッププロンプトのリスト
     */
    static async getTrapPromptList(req = null) {
        try {
            // アクティブなトラッププロンプトを全て取得
            const trapPrompts = await TrapPrompt.find({ isActive: true })
                .select('originalPromptId title description tags metadata accessCount')
                .sort({ 'metadata.usageCount': -1, 'metadata.updatedAt': -1 });
            
            // アクセスログを記録（一覧取得）
            if (req) {
                await TrapAccessLog.logAccess({
                    trapKey: req.trapKey || 'unknown',
                    promptId: 'list',
                    userId: req.user?._id,
                    userEmail: req.user?.email,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                    endpoint: req.originalUrl,
                    method: req.method,
                    headers: req.headers,
                    responseStatus: 200,
                    responseType: 'trap_prompt'
                });
            }
            
            // 本物と同じ形式にフォーマット
            return trapPrompts.map(prompt => ({
                id: prompt.originalPromptId,
                title: prompt.title,
                description: prompt.description,
                tags: prompt.tags,
                metadata: {
                    usageCount: prompt.metadata.usageCount + prompt.accessCount,
                    createdAt: prompt.metadata.createdAt,
                    updatedAt: prompt.metadata.updatedAt
                }
            }));
            
        } catch (error) {
            console.error('トラッププロンプト一覧取得エラー:', error);
            return [];
        }
    }
    
    /**
     * トラップキーの統計情報を取得
     * @returns {Promise<Object>} 統計情報
     */
    static async getTrapStatistics() {
        try {
            const users = await SimpleUser.find({
                'securityStatus.violations.type': 'honeypot_access'
            });
            
            const stats = {
                totalTriggers: 0,
                uniqueUsers: users.length,
                trapKeyUsage: {},
                recentTriggers: []
            };
            
            // 統計を集計
            users.forEach(user => {
                user.securityStatus.violations.forEach(violation => {
                    if (violation.type === 'honeypot_access') {
                        stats.totalTriggers++;
                        
                        const trapKey = violation.details.honeypotKey;
                        stats.trapKeyUsage[trapKey] = (stats.trapKeyUsage[trapKey] || 0) + 1;
                        
                        // 最近のトリガー
                        if (new Date() - violation.detectedAt < 7 * 24 * 60 * 60 * 1000) {
                            stats.recentTriggers.push({
                                user: user.email,
                                trapKey: trapKey,
                                timestamp: violation.detectedAt
                            });
                        }
                    }
                });
            });
            
            // 最も使用されたトラップキー
            stats.mostTriggered = Object.entries(stats.trapKeyUsage)
                .sort((a, b) => b[1] - a[1])[0];
            
            return stats;
            
        } catch (error) {
            console.error('統計取得エラー:', error);
            throw error;
        }
    }
}

module.exports = HoneypotService;