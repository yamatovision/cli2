import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// プロジェクトルートの.envファイルを読み込む
const projectRoot = path.resolve(__dirname, '../../');
config({ path: path.join(projectRoot, '.env') });

export class ClaudeClient {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY or ANTHROPIC_API_KEY environment variable is required');
    }

    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  async complete(prompt: string, maxTokens: number = 4000): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      if (response.content[0].type === 'text') {
        return response.content[0].text;
      }

      throw new Error('Unexpected response format from Claude API');
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new Error(`Claude API request failed: ${error}`);
    }
  }

  async isConfigured(): Promise<boolean> {
    return !!(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY);
  }
}
