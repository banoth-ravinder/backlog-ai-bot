import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import openAIService from './openai-service';
import OpenAI from 'openai';

// Mock OpenAI
vi.mock('openai', () => {
  const mockCompletionsCreate = vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            type: 'projects',
            action: 'list',
            params: {}
          })
        }
      }
    ]
  });

  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCompletionsCreate
        }
      }
    }))
  };
});

describe('OpenAIService', () => {
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    vi.resetModules();
    // Reset OpenAI service configuration
    openAIService.clearApiKey();
    
    // Reset mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('Configuration', () => {
    it('should correctly set and clear API key', () => {
      expect(openAIService.isConfigured()).toBe(false);
      
      openAIService.setApiKey('test-api-key');
      expect(openAIService.isConfigured()).toBe(true);
      expect(openAIService.getApiKey()).toBe('test-api-key');
      
      openAIService.clearApiKey();
      expect(openAIService.isConfigured()).toBe(false);
      expect(openAIService.getApiKey()).toBe(null);
    });
  });

  describe('Process user message', () => {
    it('should process user message and return structured command', async () => {
      openAIService.setApiKey('test-api-key');
      
      const result = await openAIService.processUserMessage('show me all projects');
      
      // Verify OpenAI client was initialized with correct parameters
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        dangerouslyAllowBrowser: true
      });
      
      // Verify OpenAI completion was called with correct parameters
      const openaiInstance = (OpenAI as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
      const completionsCreate = openaiInstance.chat.completions.create;
      
      expect(completionsCreate).toHaveBeenCalled();
      expect(completionsCreate.mock.calls[0][0]).toMatchObject({
        model: expect.any(String),
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ 
            role: 'user', 
            content: 'show me all projects' 
          })
        ]),
        temperature: expect.any(Number),
        response_format: { type: "json_object" }
      });
      
      // Verify result
      expect(result).toEqual({
        type: 'projects',
        action: 'list',
        params: {}
      });
    });

    it('should throw an error when OpenAI client is not configured', async () => {
      await expect(openAIService.processUserMessage('show me all projects'))
        .rejects.toThrow('OpenAI client is not configured');
    });
  });
});