import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import backlogApi, { BacklogConfig } from './backlog';
import axios from 'axios';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      request: vi.fn()
    }))
  }
}));

describe('BacklogApi', () => {
  const mockConfig: BacklogConfig = {
    apiKey: 'test-api-key',
    spaceId: 'test-space-id',
    baseUrl: 'https://test-space-id.backlog.com/api/v2',
  };

  const mockResponse = { data: { id: 1, name: 'Test' } };
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset configuration and mocks before each test
    backlogApi.clearConfig();
    mockRequest = vi.fn().mockResolvedValue(mockResponse);
    
    // @ts-expect-error - Mocking axios create
    axios.create.mockReturnValue({
      request: mockRequest
    });
    
    backlogApi.configure(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should correctly configure the API', () => {
      expect(backlogApi.isConfigured()).toBe(true);
      expect(backlogApi.getApiKey()).toBe('test-api-key');
      expect(backlogApi.getSpaceId()).toBe('test-space-id');
      expect(backlogApi.getBaseUrl()).toBe('https://test-space-id.backlog.com/api/v2');
    });

    it('should clear configuration', () => {
      backlogApi.clearConfig();
      expect(backlogApi.isConfigured()).toBe(false);
    });

    it('should clear API key', () => {
      backlogApi.clearApiKey();
      expect(backlogApi.getApiKey()).toBe(null);
    });

    it('should clear space ID', () => {
      backlogApi.clearSpaceId();
      expect(backlogApi.getSpaceId()).toBe(null);
    });

    it('should clear base URL', () => {
      backlogApi.clearBaseUrl();
      expect(backlogApi.getBaseUrl()).toBe(null);
    });
  });

  describe('API methods', () => {
    it('should get projects', async () => {
      await backlogApi.getProjects();
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/projects',
        params: {},
        data: undefined,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should get a specific project', async () => {
      await backlogApi.getProject('TEST');
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/projects/TEST',
        params: {},
        data: undefined,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should create a project', async () => {
      const projectParams = { name: 'New Project', key: 'NEW' };
      await backlogApi.createProject(projectParams);
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/projects',
        params: undefined,
        data: projectParams,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should update a project', async () => {
      const updateParams = { name: 'Updated Project' };
      await backlogApi.updateProject('TEST', updateParams);
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/projects/TEST',
        params: undefined,
        data: updateParams,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should delete a project', async () => {
      await backlogApi.deleteProject('TEST');
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/projects/TEST',
        params: undefined,
        data: {},
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should get issues', async () => {
      await backlogApi.getIssues();
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/issues',
        params: {},
        data: undefined,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should get a specific issue', async () => {
      await backlogApi.getIssue('TEST-1');
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/issues/TEST-1',
        params: {},
        data: undefined,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should throw an error when API is not configured', async () => {
      backlogApi.clearConfig();
      await expect(backlogApi.getProjects()).rejects.toThrow('Backlog API is not configured');
    });
  });
});