import { http, HttpResponse } from 'msw';

// Mock data
const mockProjects = [
  {
    id: 1,
    projectKey: 'TEST',
    name: 'Test Project',
    chartEnabled: true,
    useResolvedAsDone: true,
    useWiki: true,
    useFileSharing: true,
    useSubversion: false,
    useGit: true,
    projectLeaderCanEditProjectLeader: true,
    subtaskingEnabled: true,
    categoryType: 1,
    notificationType: 1,
    textFormattingRule: 'markdown',
    createdUser: {
      id: 1,
      userId: 'user1',
      name: 'Test User',
      roleType: 1,
      lang: 'en',
      mailAddress: 'test@example.com',
    },
    created: '2023-01-01T00:00:00Z',
    updatedUser: {
      id: 1,
      userId: 'user1',
      name: 'Test User',
      roleType: 1,
      lang: 'en',
      mailAddress: 'test@example.com',
    },
    updated: '2023-01-01T00:00:00Z',
    archived: false,
  }
];

const mockIssues = [
  {
    id: 1,
    projectId: 1,
    issueKey: 'TEST-1',
    keyId: 1,
    issueType: {
      id: 1,
      projectId: 1,
      name: 'Bug',
      color: '#e30000',
      displayOrder: 1,
    },
    summary: 'Test Issue',
    description: 'This is a test issue',
    resolution: null as string | null,
    priority: {
      id: 2,
      name: 'Normal',
    },
    status: {
      id: 1,
      name: 'Open',
    },
    assignee: null as { id: number; userId: string; name: string; roleType: number; lang: string; mailAddress: string } | null,
    category: [] as { id: number; name: string }[],
    version: [] as { id: number; name: string }[],
    milestone: [] as { id: number; name: string }[],
    startDate: null as string | null,
    dueDate: null as string | null,
    estimatedHours: null as number | null,
    actualHours: null as number | null,
    parentIssueId: null as number | null,
    createdUser: {
      id: 1,
      userId: 'user1',
      name: 'Test User',
      roleType: 1,
      lang: 'en',
      mailAddress: 'test@example.com',
    },
    created: '2023-01-01T00:00:00Z',
    updatedUser: {
      id: 1,
      userId: 'user1',
      name: 'Test User',
      roleType: 1,
      lang: 'en',
      mailAddress: 'test@example.com',
    },
    updated: '2023-01-01T00:00:00Z',
    customFields: [] as { id: number; name: string; value: string | number | null }[],
    attachments: [] as { id: number; name: string; size: number; created: string }[],
    sharedFiles: [] as { id: number; name: string; size: number; created: string }[],
    stars: [] as { id: number; name: string }[],
  }
];

const mockSpaceInfo = {
  name: 'Test Space',
  ownerId: 1,
  lang: 'en',
  timezone: 'UTC',
  reportSendTime: '08:00:00',
  textFormattingRule: 'markdown',
  created: '2023-01-01T00:00:00Z',
  updated: '2023-01-01T00:00:00Z',
};

const mockUsers = [
  {
    id: 1,
    userId: 'user1',
    name: 'Test User',
    roleType: 1,
    lang: 'en',
    mailAddress: 'test@example.com',
  }
];

// Mock OpenAI response
const mockOpenAIResponse = {
  type: 'projects',
  action: 'list',
  params: {},
  rawCommand: 'show me all projects'
};

// Define API handlers
export const handlers = [
  // Backlog API handlers
  http.get('https://:spaceId.backlog.com/api/v2/projects', () => {
    return HttpResponse.json(mockProjects);
  }),

  http.get('https://:spaceId.backlog.com/api/v2/issues', () => {
    return HttpResponse.json(mockIssues);
  }),

  http.get('https://:spaceId.backlog.com/api/v2/space', () => {
    return HttpResponse.json(mockSpaceInfo);
  }),

  http.get('https://:spaceId.backlog.com/api/v2/users', () => {
    return HttpResponse.json(mockUsers);
  }),

  // OpenAI API handler
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      choices: [
        {
          message: {
            content: JSON.stringify(mockOpenAIResponse)
          }
        }
      ]
    });
  }),
];
