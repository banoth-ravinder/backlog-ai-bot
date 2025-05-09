
import OpenAI from 'openai';

export interface OpenAIServiceConfig {
  apiKey: string;
}

class OpenAIService {
  private client: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    // Try to load from environment variables
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      this.initClient();
    }
  }

  public isConfigured(): boolean {
    return !!this.apiKey;
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.initClient();
  }

  public getApiKey(): string | null {
    return this.apiKey;
  }

  public clearApiKey(): void {
    this.apiKey = null;
    this.client = null;
  }

  private initClient(): void {
    if (this.apiKey) {
      this.client = new OpenAI({ 
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true // For client-side usage
      });
    }
  }

  public async processUserMessage(message: string): Promise<unknown> {
    if (!this.client) {
      throw new Error('OpenAI client is not configured');
    }

    try {
      const systemPrompt = `
        You are an AI assistant that helps users interact with the Backlog API.
        Extract structured commands from user messages and respond with a JSON object.
        
        Available command types:
        1. space - Space related commands
           - space:get - Get space information
           - space:activities - Get space activities (params: activityTypeId, minId, maxId, count, order)
           - space:notification - Get space notification
           - space:updateNotification - Update space notification (requires content)
        
        2. projects - Project related commands
           - projects:list - List all projects
           - projects:get - Get details of a specific project (requires projectIdOrKey)
           - projects:create - Create a project (requires name, key)
           - projects:update - Update a project (requires projectIdOrKey)
           - projects:delete - Delete a project (requires projectIdOrKey)
        
        3. issues - Issue related commands
           - issues:list - List issues (optional: projectIdOrKey)
           - issues:get - Get issue details (requires issueIdOrKey)
           - issues:create - Create issue (requires projectIdOrKey, summary)
           - issues:update - Update issue (requires issueIdOrKey)
           - issues:delete - Delete issue (requires issueIdOrKey)
           - issues:comments - Get issue comments (requires issueIdOrKey)
           - issues:addComment - Add comment to issue (requires issueIdOrKey, content)
        
        4. users - User related commands
           - users:list - List all users
           - users:get - Get user details (requires userId)
           - users:activities - Get user activities (requires userId)
        
        5. wikis - Wiki related commands
           - wikis:list - List wikis (requires projectIdOrKey)
           - wikis:get - Get wiki details (requires wikiId)
           - wikis:create - Create wiki (requires projectId, name, content)
           - wikis:update - Update wiki (requires wikiId)
           - wikis:delete - Delete wiki (requires wikiId)
           - wikis:tags - Get wiki tags (requires projectIdOrKey)
        
        6. milestones - Milestone/Version related commands
           - milestones:list - List milestones (requires projectIdOrKey)
           - milestones:create - Create milestone (requires projectIdOrKey, name)
           - milestones:update - Update milestone (requires projectIdOrKey, versionId)
           - milestones:delete - Delete milestone (requires projectIdOrKey, versionId)
        
        7. categories - Category related commands
           - categories:list - List categories (requires projectIdOrKey)
           - categories:create - Create category (requires projectIdOrKey, name)
           - categories:update - Update category (requires projectIdOrKey, categoryId, name)
           - categories:delete - Delete category (requires projectIdOrKey, categoryId)
        
        8. issueTypes - Issue type related commands
           - issueTypes:list - List issue types (requires projectIdOrKey)
           - issueTypes:create - Create issue type (requires projectIdOrKey, name, color)
           - issueTypes:update - Update issue type (requires projectIdOrKey, issueTypeId)
           - issueTypes:delete - Delete issue type (requires projectIdOrKey, issueTypeId, substituteIssueTypeId)
        
        9. customFields - Custom field related commands
           - customFields:list - List custom fields (requires projectIdOrKey)
           - customFields:create - Create custom field (requires projectIdOrKey, typeId, name)
           - customFields:update - Update custom field (requires projectIdOrKey, customFieldId)
           - customFields:delete - Delete custom field (requires projectIdOrKey, customFieldId)
           
        For example, if the user says "show me all projects", respond with:
        { "type": "projects", "action": "list", "params": {}, "rawCommand": "show me all projects" }
        
        If the user says "show project ABC", respond with:
        { "type": "projects", "action": "get", "params": { "projectIdOrKey": "ABC" }, "rawCommand": "show project ABC" }
        
        If the user says "create issue in project DEF with title 'Fix login bug' and description 'The login button doesn't work'", respond with:
        { "type": "issues", "action": "create", "params": { "projectIdOrKey": "DEF", "summary": "Fix login bug", "description": "The login button doesn't work" }, "rawCommand": "create issue in project DEF with title 'Fix login bug' and description 'The login button doesn't work'" }
        
        If the user says "show wiki page with ID 123", respond with:
        { "type": "wikis", "action": "get", "params": { "wikiId": "123" }, "rawCommand": "show wiki page with ID 123" }
        
        If you cannot extract a valid command, respond with:
        { "error": "Could not understand the command" }
        
        Make sure to extract all relevant parameters from the user's message.
      `;

      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI processing error:', error);
      throw error;
    }
  }
}

export const openAIService = new OpenAIService();
export default openAIService;