/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CommandProcessor, AICommand } from "./command-processor";
import backlogApi from "../api/backlog";
import openAIService from "./openai-service";

// Mock dependencies
vi.mock("../api/backlog", () => ({
  default: {
    isConfigured: vi.fn(),
    getProjects: vi.fn(),
    getProject: vi.fn(),
    getSpace: vi.fn(),
    getSpaceNotification: vi.fn(),
    getIssues: vi.fn(),
    getIssue: vi.fn(),
  },
}));

vi.mock("./openai-service", () => ({
  default: {
    isConfigured: vi.fn(),
    processUserMessage: vi.fn(),
  },
}));

vi.mock("@/components/ui/use-toast", () => ({
  toast: vi.fn(),
}));

describe("CommandProcessor", () => {
  let commandProcessor: CommandProcessor;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    commandProcessor = new CommandProcessor();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("parseCommand", () => {
    it("should return null if OpenAI is not configured", async () => {
      vi.mocked(openAIService.isConfigured).mockReturnValue(false);

      const result = await commandProcessor.parseCommand("show me projects");

      expect(result).toBeNull();
      expect(openAIService.isConfigured).toHaveBeenCalled();
      expect(openAIService.processUserMessage).not.toHaveBeenCalled();
    });

    it("should parse command successfully", async () => {
      vi.mocked(openAIService.isConfigured).mockReturnValue(true);
      vi.mocked(openAIService.processUserMessage).mockResolvedValue({
        type: "projects",
        action: "list",
        params: {},
      });

      const result = await commandProcessor.parseCommand("show me projects");

      expect(result).toEqual({
        type: "projects",
        action: "list",
        params: {},
        rawCommand: "show me projects",
      });
      expect(openAIService.processUserMessage).toHaveBeenCalledWith(
        "show me projects"
      );
    });

    it("should return null if OpenAI returns an error", async () => {
      vi.mocked(openAIService.isConfigured).mockReturnValue(true);
      vi.mocked(openAIService.processUserMessage).mockResolvedValue({
        error: "Could not understand the command",
      });

      const result = await commandProcessor.parseCommand("invalid command");

      expect(result).toBeNull();
    });

    it("should return null if an error occurs", async () => {
      vi.mocked(openAIService.isConfigured).mockReturnValue(true);
      vi.mocked(openAIService.processUserMessage).mockRejectedValue(
        new Error("API error")
      );

      const result = await commandProcessor.parseCommand("show me projects");

      expect(result).toBeNull();
    });
  });

  describe("executeCommand", () => {
    it("should return null if Backlog API is not configured", async () => {
      vi.mocked(backlogApi.isConfigured).mockReturnValue(false);

      const command: AICommand = {
        type: "projects",
        action: "list",
        params: {},
        rawCommand: "show me projects",
      };

      const result = await commandProcessor.executeCommand(command);

      expect(result).toEqual({
        message:
          "⚠️ Backlog API is not configured. Please set up your API credentials in the Settings page.",
        success: false,
      });
      expect(backlogApi.isConfigured).toHaveBeenCalled();
    });

    it("should execute project list command", async () => {
      vi.mocked(backlogApi.isConfigured).mockReturnValue(true);
      const projectsSpy = vi
        .mocked(backlogApi.getProjects)
        .mockResolvedValue([]);

      const command: AICommand = {
        type: "projects",
        action: "list",
        params: {},
        rawCommand: "show me projects",
      };

      await commandProcessor.executeCommand(command);

      expect(projectsSpy).toHaveBeenCalled();
    });

    it("should execute project get command", async () => {
      vi.mocked(backlogApi.isConfigured).mockReturnValue(true);
      const projectSpy = vi
        .mocked(backlogApi.getProject)
        .mockResolvedValue({} as any);

      const command: AICommand = {
        type: "projects",
        action: "get",
        params: { projectIdOrKey: "TEST" },
        rawCommand: "show project TEST",
      };

      await commandProcessor.executeCommand(command);

      expect(projectSpy).toHaveBeenCalledWith("TEST");
    });

    it("should throw an error for unknown command type", async () => {
      vi.mocked(backlogApi.isConfigured).mockReturnValue(true);

      const command: AICommand = {
        type: "unknown",
        action: "list",
        params: {},
        rawCommand: "show me unknown",
      } as AICommand;

      const result = await commandProcessor.executeCommand(command);

      expect(result).toEqual({
          message: "I don't know how to handle 'unknown' commands.",
          success: false,
        });
    });

    it("should throw an error for unknown action", async () => {
      vi.mocked(backlogApi.isConfigured).mockReturnValue(true);

      const command: AICommand = {
        type: "projects",
        action: "unknown",
        params: {},
        rawCommand: "do unknown action on projects",
      };

      const result = await commandProcessor.executeCommand(command);

      expect(result).toEqual({
          message: "I don't know how to unknown projects.",
          success: false,
        });
    });

    it("should catch and propagate errors", async () => {
      vi.mocked(backlogApi.isConfigured).mockReturnValue(true);
      vi.mocked(backlogApi.getProjects).mockRejectedValue(
        new Error("API error")
      );

      const command: AICommand = {
        type: "projects",
        action: "list",
        params: {},
        rawCommand: "show me projects",
      };

      const result = await commandProcessor.executeCommand(command);

      expect(result).toEqual({
        message: "Error executing command: API error",
        success: false,
      });
    });
  });

  describe("handleSpaceCommand", () => {
    it("should execute space get command", async () => {
      vi.mocked(backlogApi.isConfigured).mockReturnValue(true);
      const spaceSpy = vi
        .mocked(backlogApi.getSpace)
        .mockResolvedValue({} as any);

      const command: AICommand = {
        type: "space",
        action: "get",
        params: {},
        rawCommand: "show space info",
      };

      await commandProcessor.executeCommand(command);

      expect(spaceSpy).toHaveBeenCalled();
    });

    it("should execute space notification command", async () => {
      vi.mocked(backlogApi.isConfigured).mockReturnValue(true);
      const notificationSpy = vi
        .mocked(backlogApi.getSpaceNotification)
        .mockResolvedValue({} as any);

      const command: AICommand = {
        type: "space",
        action: "notification",
        params: {},
        rawCommand: "show space notification",
      };

      await commandProcessor.executeCommand(command);

      expect(notificationSpy).toHaveBeenCalled();
    });
  });

  describe("handleIssuesCommand", () => {
    it("should execute issues list command", async () => {
      vi.mocked(backlogApi.isConfigured).mockReturnValue(true);
      const issuesSpy = vi.mocked(backlogApi.getIssues).mockResolvedValue([]);

      const command: AICommand = {
        type: "issues",
        action: "list",
        params: {},
        rawCommand: "show me issues",
      };

      await commandProcessor.executeCommand(command);

      expect(issuesSpy).toHaveBeenCalled();
    });

    it("should execute issues get command", async () => {
      vi.mocked(backlogApi.isConfigured).mockReturnValue(true);
      const issueSpy = vi
        .mocked(backlogApi.getIssue)
        .mockResolvedValue({} as any);

      const command: AICommand = {
        type: "issues",
        action: "get",
        params: { issueIdOrKey: "TEST-1" },
        rawCommand: "show issue TEST-1",
      };

      await commandProcessor.executeCommand(command);

      expect(issueSpy).toHaveBeenCalledWith("TEST-1");
    });
  });
});
