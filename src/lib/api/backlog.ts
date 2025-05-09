/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface BacklogConfig {
  apiKey: string;
  spaceId: string;
  baseUrl?: string;
}

export interface BacklogProject {
  id: number;
  projectKey: string;
  name: string;
  chartEnabled: boolean;
  useResolvedAsDone: boolean;
  useWiki: boolean;
  useFileSharing: boolean;
  useSubversion: boolean;
  useGit: boolean;
  projectLeaderCanEditProjectLeader: boolean;
  subtaskingEnabled: boolean;
  categoryType: number;
  notificationType: number;
  textFormattingRule: string;
  createdUser: BacklogUser;
  created: string;
  updatedUser: BacklogUser;
  updated: string;
  archived: boolean;
}

export interface BacklogIssue {
  id: number;
  projectId: number;
  issueKey: string;
  keyId: number;
  issueType: {
    id: number;
    projectId: number;
    name: string;
    color: string;
    displayOrder: number;
  };
  summary: string;
  description: string;
  resolution: any | null;
  priority: {
    id: number;
    name: string;
  };
  status: {
    id: number;
    name: string;
  };
  assignee: BacklogUser | null;
  category: any[];
  version: any[];
  milestone: any[];
  startDate: any | null;
  dueDate: any | null;
  estimatedHours: any | null;
  actualHours: any | null;
  parentIssueId: any | null;
  createdUser: BacklogUser;
  created: string;
  updatedUser: BacklogUser;
  updated: string;
  customFields: any[];
  attachments: any[];
  sharedFiles: any[];
  stars: any[];
}

export interface BacklogUser {
  id: number;
  userId: string;
  name: string;
  roleType: number;
  lang: string;
  mailAddress: string;
}

interface ListIssuesParams {
  projectId?: number[];
  [key: string]: any;
}

interface CreateIssueParams {
  projectId: number;
  summary: string;
  issueTypeId: number;
  priorityId: number;
  description?: string;
  assigneeId?: number;
  [key: string]: any;
}

interface UpdateIssueParams {
  summary?: string;
  statusId?: number;
  priorityId?: number;
  description?: string;
  assigneeId?: number;
  [key: string]: any;
}

interface AddCommentParams extends Record<string, any> {
  content: string;
}

interface CreateProjectParams {
  name: string;
  key: string;
  [key: string]: any;
}

interface UpdateProjectParams {
  name?: string;
  key?: string;
  [key: string]: any;
}

interface CreateCategoryParams extends Record<string, any> {
  name: string;
}

interface UpdateCategoryParams extends Record<string, any> {
  name: string;
}

interface CreateIssueTypeParams extends Record<string, any> {
  name: string;
  color: string;
}

interface UpdateIssueTypeParams extends Record<string, any> {
  name?: string;
  color?: string;
}

interface CreateCustomFieldParams {
  typeId: number;
  name: string;
  [key: string]: any;
}

interface UpdateCustomFieldParams {
  name?: string;
  [key: string]: any;
}

interface BacklogSpaceInfo {
  name?: string;
  [key: string]: any;
}

class BacklogApi {
  private client: AxiosInstance | null = null;
  private config: BacklogConfig | null = null;

  constructor() {
    // Try to load from environment variables
    const envApiKey = import.meta.env.VITE_BACKLOG_API_KEY;
    const envSpaceId = import.meta.env.VITE_BACKLOG_SPACE_ID;
    
    if (envApiKey && envSpaceId) {
      this.config = {
        apiKey: envApiKey,
        spaceId: envSpaceId,
      };
      this.configure(this.config);
    }
  }

  public isConfigured(): boolean {
    return !!this.config;
  }

  public getApiKey(): string | null {
    return this.config?.apiKey || null;
  }

  public getSpaceId(): string | null {
    return this.config?.spaceId || null;
  }

  public getBaseUrl(): string | null {
    return this.config?.baseUrl || null;
  }

  public clearApiKey(): void {
    if (this.config) {
      this.config.apiKey = '';
    }
  }

  public clearSpaceId(): void {
    if (this.config) {
      this.config.spaceId = '';
    }
  }

  public clearBaseUrl(): void {
    if (this.config) {
      delete this.config.baseUrl;
    }
  }

  public configure(config: BacklogConfig): void {
    this.config = config;
    this.client = axios.create({
      // baseURL: `https://${config.spaceId}.backlog.com/api/v2`,
      baseURL: `http://localhost:3001/api`,
      params: { apiKey: config.apiKey },
      headers: {
      'Access-Control-Allow-Origin': '*', // Allow all origins
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS', // Allowed methods
      'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Allowed headers
      },
    });
  }

  public clearConfig(): void {
    this.config = null;
    this.client = null;
  }

  private async apiRequest<T>(url: string, params: Record<string, any> = {}, method: AxiosRequestConfig['method'] = 'GET'): Promise<T> {
    if (!this.client) {
      throw new Error('Backlog API is not configured');
    }

    try {
      const response = await this.client.request({
        method,
        url,
        params: method === 'GET' ? params : undefined,
        data: method !== 'GET' ? params : undefined,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data as T;
    } catch (error: any) {
      const err = error as Error;
      const errorResponse = err as { response?: { data?: any } };
      console.error(`Backlog API error (${method} ${url}):`, errorResponse.response ? errorResponse.response.data : err.message);
      throw error;
    }
  }

  // Space API
  async getSpace(): Promise<BacklogSpaceInfo> {
    return this.apiRequest<BacklogSpaceInfo>('/space');
  }

  async getSpaceActivities(params: Record<string, any> = {}): Promise<any> {
    return this.apiRequest<any>('/space/activities', params);
  }

  async getSpaceNotification(): Promise<any> {
    return this.apiRequest<any>('/space/notification');
  }

  async updateSpaceNotification(content: string): Promise<any> {
    return this.apiRequest<any>('/space/notification', { content }, 'PUT');
  }

  // Project API
  async getProjects(): Promise<BacklogProject[]> {
    return this.apiRequest<BacklogProject[]>('/projects');
  }

  async getProject(projectIdOrKey: string | number): Promise<BacklogProject> {
    return this.apiRequest<BacklogProject>(`/projects/${projectIdOrKey}`);
  }

  async createProject(params: CreateProjectParams): Promise<BacklogProject> {
    return this.apiRequest<BacklogProject>('/projects', params, 'POST');
  }

  async updateProject(projectIdOrKey: string | number, params: UpdateProjectParams): Promise<BacklogProject> {
    return this.apiRequest<BacklogProject>(`/projects/${projectIdOrKey}`, params, 'PATCH');
  }

  async deleteProject(projectIdOrKey: string | number): Promise<BacklogProject> {
    return this.apiRequest<BacklogProject>(`/projects/${projectIdOrKey}`, {}, 'DELETE');
  }

  // Issue API
  async getIssues(params: ListIssuesParams = {}): Promise<BacklogIssue[]> {
    return this.apiRequest<BacklogIssue[]>('/issues', params);
  }

  async getIssue(issueIdOrKey: string | number): Promise<BacklogIssue> {
    return this.apiRequest<BacklogIssue>(`/issues/${issueIdOrKey}`);
  }

  async createIssue(params: CreateIssueParams): Promise<BacklogIssue> {
    return this.apiRequest<BacklogIssue>('/issues', params, 'POST');
  }

  async updateIssue(issueIdOrKey: string | number, params: UpdateIssueParams): Promise<BacklogIssue> {
    return this.apiRequest<BacklogIssue>(`/issues/${issueIdOrKey}`, params, 'PATCH');
  }

  async deleteIssue(issueIdOrKey: string | number): Promise<BacklogIssue> {
    return this.apiRequest<BacklogIssue>(`/issues/${issueIdOrKey}`, {}, 'DELETE');
  }

  async getIssueComments(issueIdOrKey: string | number): Promise<any> {
    return this.apiRequest<any>(`/issues/${issueIdOrKey}/comments`);
  }

  async addIssueComment(issueIdOrKey: string | number, params: AddCommentParams): Promise<any> {
    return this.apiRequest<any>(`/issues/${issueIdOrKey}/comments`, params, 'POST');
  }

  // User API
  async getUsers(): Promise<BacklogUser[]> {
    return this.apiRequest<BacklogUser[]>('/users');
  }

  async getUser(userId: string | number): Promise<BacklogUser> {
    return this.apiRequest<BacklogUser>(`/users/${userId}`);
  }

  async getUserActivities(userId: string | number): Promise<any> {
    return this.apiRequest<any>(`/users/${userId}/activities`);
  }

  // Wiki API
  async getWikis(projectIdOrKey: string | number): Promise<any> {
    return this.apiRequest<any>(`/wikis`, { projectIdOrKey });
  }

  async getWiki(wikiId: string | number): Promise<any> {
    return this.apiRequest<any>(`/wikis/${wikiId}`);
  }

  async createWiki(params: Record<string, any>): Promise<any> {
    return this.apiRequest<any>('/wikis', params, 'POST');
  }

  async updateWiki(wikiId: string | number, params: Record<string, any>): Promise<any> {
    return this.apiRequest<any>(`/wikis/${wikiId}`, params, 'PATCH');
  }

  async deleteWiki(wikiId: string | number): Promise<any> {
    return this.apiRequest<any>(`/wikis/${wikiId}`, {}, 'DELETE');
  }

  async getWikiTags(projectIdOrKey: string | number): Promise<any> {
    return this.apiRequest<any>(`/wikis/tags`, { projectIdOrKey });
  }

  // Milestone/Version API
  async getMilestones(projectIdOrKey: string | number): Promise<any> {
    return this.apiRequest<any>(`/projects/${projectIdOrKey}/versions`);
  }

  async createMilestone(projectIdOrKey: string | number, params: Record<string, any>): Promise<any> {
    return this.apiRequest<any>(`/projects/${projectIdOrKey}/versions`, params, 'POST');
  }

  async updateMilestone(projectIdOrKey: string | number, versionId: string | number, params: Record<string, any>): Promise<any> {
    return this.apiRequest<any>(`/projects/${projectIdOrKey}/versions/${versionId}`, params, 'PUT');
  }

  async deleteMilestone(projectIdOrKey: string | number, versionId: string | number): Promise<any> {
    return this.apiRequest<any>(`/projects/${projectIdOrKey}/versions/${versionId}`, {}, 'DELETE');
  }

  // Category API
  async getCategories(projectIdOrKey: string | number): Promise<any> {
    return this.apiRequest<any>(`/projects/${projectIdOrKey}/categories`);
  }

  async createCategory(projectIdOrKey: string | number, params: CreateCategoryParams): Promise<any> {
    return this.apiRequest<any>(`/projects/${projectIdOrKey}/categories`, params, 'POST');
  }

  async updateCategory(projectIdOrKey: string | number, categoryId: string | number, params: UpdateCategoryParams): Promise<any> {
    return this.apiRequest<any>(`/projects/${projectIdOrKey}/categories/${categoryId}`, params, 'PUT');
  }

  async deleteCategory(projectIdOrKey: string | number, categoryId: string | number): Promise<any> {
    return this.apiRequest<any>(`/projects/${projectIdOrKey}/categories/${categoryId}`, {}, 'DELETE');
  }

  // Issue Type API
  async getIssueTypes(projectIdOrKey: string | number): Promise<any> {
    return this.apiRequest<any>(`/projects/${projectIdOrKey}/issueTypes`);
  }

  async createIssueType(projectIdOrKey: string | number, params: CreateIssueTypeParams): Promise<any> {
    return this.apiRequest<any>(`/projects/${projectIdOrKey}/issueTypes`, params, 'POST');
  }

  async updateIssueType(projectIdOrKey: string | number, issueTypeId: string | number, params: UpdateIssueTypeParams): Promise<any> {
    return this.apiRequest<any>(`/projects/${projectIdOrKey}/issueTypes/${issueTypeId}`, params, 'PUT');
  }

  async deleteIssueType(projectIdOrKey: string | number, issueTypeId: string | number, substituteIssueTypeId: string | number): Promise<any> {
    return this.apiRequest<any>(`/projects/${projectIdOrKey}/issueTypes/${issueTypeId}`, { substituteIssueTypeId }, 'DELETE');
  }

  // Custom Field API
  async getCustomFields(projectIdOrKey: string | number): Promise<any> {
    return this.apiRequest<any>(`/projects/${projectIdOrKey}/customFields`);
  }

  async createCustomField(projectIdOrKey: string | number, params: CreateCustomFieldParams): Promise<any> {
    return this.apiRequest<any>(`/projects/${projectIdOrKey}/customFields`, params, 'POST');
  }

  // Update custom field
  async updateCustomField(
    projectIdOrKey: string | number,
    customFieldId: string | number,
    params: UpdateCustomFieldParams
  ): Promise<any> {
    return this.apiRequest<any>(
      `/projects/${projectIdOrKey}/customFields/${customFieldId}`,
      params,
      "PATCH"
    );
  }

  async deleteCustomField(projectIdOrKey: string | number, customFieldId: string | number): Promise<any> {
    return this.apiRequest<any>(`/projects/${projectIdOrKey}/customFields/${customFieldId}`, {}, 'DELETE');
  }
}

const backlogApi = new BacklogApi();
export default backlogApi;