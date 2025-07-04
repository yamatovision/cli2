/**
 * CLI プロンプト取得コントローラー
 * P-007: 認証付きプロンプト取得API
 */
const Prompt = require('../models/prompt.model');

const cliPromptController = {
  
  /**
   * 認証付きプロンプト取得
   * GET /api/cli/prompts/:id
   * @param {Object} req - リクエストオブジェクト
   * @param {Object} res - レスポンスオブジェクト
   */
  async getPrompt(req, res) {
    try {
      const { id } = req.params;
      
      console.log('CLI プロンプト取得リクエスト:', {
        promptId: id,
        userId: req.user._id,
        userEmail: req.user.email,
        isHoneypot: req.isHoneypot || false
      });
      
      // ハニーポットモードの場合
      if (req.isHoneypot) {
        const HoneypotService = require('../services/honeypot.service');
        const trapPrompt = await HoneypotService.getTrapPrompt(id, req);
        
        if (!trapPrompt) {
          // トラッププロンプトが見つからない場合も404を返す（本物と同じ挙動）
          return res.status(404).json({
            success: false,
            error: 'NOT_FOUND',
            message: 'プロンプトが見つかりません'
          });
        }
        
        console.log('🍯 トラッププロンプト返却:', {
          promptId: id,
          title: trapPrompt.title,
          trapKey: req.trapKey
        });
        
        // 本物と同じ形式でレスポンス
        return res.json({
          success: true,
          data: {
            prompt: trapPrompt,
            access: {
              canEdit: false,
              canDelete: false,
              expiresAt: req.tokenData.expiresAt
            }
          }
        });
      }
      
      // 通常モード：プロンプト取得（公開プロンプトのみ）
      const prompt = await Prompt.findOne({
        _id: id,
        isPublic: true,
        isArchived: false
      });
      
      if (!prompt) {
        console.log('プロンプトが見つかりません:', { promptId: id });
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'プロンプトが見つかりません'
        });
      }
      
      // 使用回数を増やす
      await Prompt.findByIdAndUpdate(id, { 
        $inc: { usageCount: 1 } 
      });
      
      console.log('プロンプト取得成功:', {
        promptId: prompt._id,
        title: prompt.title,
        userId: req.user._id,
        usageCount: prompt.usageCount + 1
      });
      
      // レスポンス
      res.json({
        success: true,
        data: {
          prompt: {
            id: prompt._id,
            title: prompt.title,
            content: prompt.content,
            version: "1.0",
            tags: prompt.tags,
            metadata: {
              description: prompt.description,
              usageCount: prompt.usageCount + 1,
              isPublic: prompt.isPublic,
              createdAt: prompt.createdAt,
              updatedAt: prompt.updatedAt
            }
          },
          access: {
            canEdit: false,    // CLIからは編集不可
            canDelete: false,  // CLIからは削除不可
            expiresAt: req.tokenData.expiresAt
          }
        }
      });
      
    } catch (error) {
      console.error('CLI プロンプト取得エラー:', error);
      
      // MongoDBのObjectId形式エラーをチェック
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({
          success: false,
          error: 'INVALID_ID',
          message: '無効なプロンプトIDです'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'プロンプトの取得中にエラーが発生しました'
      });
    }
  },
  
  /**
   * 公開プロンプト一覧取得（CLI用）
   * GET /api/cli/prompts
   * @param {Object} req - リクエストオブジェクト
   * @param {Object} res - レスポンスオブジェクト
   */
  async getPublicPrompts(req, res) {
    try {
      console.log('CLI 公開プロンプト一覧取得:', {
        userId: req.user._id,
        userEmail: req.user.email,
        isHoneypot: req.isHoneypot || false
      });
      
      // ハニーポットモードの場合
      if (req.isHoneypot) {
        const HoneypotService = require('../services/honeypot.service');
        const trapPrompts = await HoneypotService.getTrapPromptList(req);
        
        console.log('🍯 トラッププロンプト一覧返却:', {
          count: trapPrompts.length,
          trapKey: req.trapKey
        });
        
        // 本物と同じ形式でレスポンス
        return res.json({
          success: true,
          data: {
            prompts: trapPrompts,
            total: trapPrompts.length,
            access: {
              expiresAt: req.tokenData.expiresAt
            }
          }
        });
      }
      
      // 通常モード：公開プロンプト一覧を取得
      const prompts = await Prompt.find({
        isPublic: true,
        isArchived: false
      })
      .select('_id title description tags usageCount createdAt updatedAt')
      .sort({ usageCount: -1, updatedAt: -1 })
      .limit(100); // 最大100件
      
      console.log('公開プロンプト一覧取得成功:', {
        count: prompts.length,
        userId: req.user._id
      });
      
      res.json({
        success: true,
        data: {
          prompts: prompts.map(prompt => ({
            id: prompt._id,
            title: prompt.title,
            description: prompt.description,
            tags: prompt.tags,
            metadata: {
              usageCount: prompt.usageCount,
              createdAt: prompt.createdAt,
              updatedAt: prompt.updatedAt
            }
          })),
          total: prompts.length,
          access: {
            expiresAt: req.tokenData.expiresAt
          }
        }
      });
      
    } catch (error) {
      console.error('CLI 公開プロンプト一覧取得エラー:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'プロンプト一覧の取得中にエラーが発生しました'
      });
    }
  }
};

module.exports = cliPromptController;