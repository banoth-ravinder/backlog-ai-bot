import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import backlogApi, { BacklogIssue, BacklogProject } from "@/lib/api/backlog";
import {
  commandProcessor,
  AICommand,
  CommandResult,
} from "@/lib/ai/command-processor";
import openAIService from "@/lib/ai/openai-service";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  content: string | React.ReactNode;
  sender: "user" | "ai";
  timestamp: Date;
  isTyping?: boolean;
  command?: AICommand | null;
  result?: CommandResult;
}

const Dashboard: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Add initial greeting message
    setMessages([
      {
        id: "welcome",
        content:
          "👋 Welcome to Backlog AI Action Bot! I can help you manage your Backlog projects and issues using natural language commands. Try asking me to list projects or create an issue.",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    // Check if APIs are configured
    const backlogConfigured = backlogApi.isConfigured();
    const openAIConfigured = openAIService.isConfigured();

    if (!backlogConfigured || !openAIConfigured) {
      let message = "";

      if (!backlogConfigured && !openAIConfigured) {
        message =
          "⚠️ You need to set up both your Backlog API credentials and OpenAI API key first.";
      } else if (!backlogConfigured) {
        message = "⚠️ You need to set up your Backlog API credentials first.";
      } else {
        message = "⚠️ You need to set up your OpenAI API key first.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: message + " Go to Settings to configure them.",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate thinking with typing indicator
    setIsProcessing(true);
    const typingIndicator: Message = {
      id: `typing-${Date.now()}`,
      content: (
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      ),
      sender: "ai",
      timestamp: new Date(),
      isTyping: true,
    };

    setMessages((prev) => [...prev, typingIndicator]);

    try {
      if (!backlogApi.isConfigured() || !openAIService.isConfigured()) {
        removeTypingIndicator();
        const missingConfig =
          !backlogApi.isConfigured() && !openAIService.isConfigured()
            ? "Backlog API and OpenAI"
            : !backlogApi.isConfigured()
            ? "Backlog API"
            : "OpenAI";

        setMessages((prev) => [
          ...prev.filter((m) => !m.isTyping),
          {
            id: Date.now().toString(),
            content: (
              <div>
                <p>⚠️ {missingConfig} is not configured yet.</p>
                <Button
                  className="mt-2"
                  variant="outline"
                  onClick={() => navigate("/settings")}
                >
                  Go to Settings
                </Button>
              </div>
            ),
            sender: "ai",
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // Process the command
      const command = await commandProcessor.parseCommand(input);

      // Wait for a short delay to simulate processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let aiResponse: Message;

      if (!command) {
        aiResponse = {
          id: Date.now().toString(),
          content:
            "I'm sorry, but I don't understand that command. Try asking for projects, issues, or creating an issue.",
          sender: "ai",
          timestamp: new Date(),
        };
      } else {
        const result = await commandProcessor.executeCommand(command);

        let content: string | React.ReactNode = result.message;

        // Format the result data
        if (result.success && result.data) {
          if (
            command.type === "projects" &&
            command.action === "list" &&
            result.data.projects
          ) {
            content = (
              <div>
                <p>{result.message}</p>
                <div className="mt-2 space-y-2">
                  {result.data.projects.map((project: BacklogProject) => (
                    <Card key={project.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="font-semibold">{project.name}</div>
                        <div className="text-sm text-gray-600">
                          Key: {project.projectKey}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          } else if (
            command.type === "issues" &&
            command.action === "list" &&
            result.data.issues
          ) {
            content = (
              <div>
                <p>{result.message}</p>
                <div className="mt-2 space-y-2">
                  {result.data.issues.map((issue: BacklogIssue) => (
                    <Card key={issue.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="font-semibold">{issue.summary}</div>
                        <div className="text-sm text-gray-600">
                          Key: {issue.issueKey} | Status:{" "}
                          {issue.status?.name || "Unknown"}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          } else {
            content = (
              <div>
                <p>{result.message}</p>
                <pre className="mt-2 bg-gray-100 p-2 rounded">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            );
          }
        }

        aiResponse = {
          id: Date.now().toString(),
          content,
          sender: "ai",
          timestamp: new Date(),
          command,
          result,
        };
      }

      removeTypingIndicator();
      setMessages((prev) => [...prev.filter((m) => !m.isTyping), aiResponse]);
    } catch (error) {
      console.error("Error processing message:", error);
      removeTypingIndicator();
      setMessages((prev) => [
        ...prev.filter((m) => !m.isTyping),
        {
          id: Date.now().toString(),
          content: `Sorry, an error occurred: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      toast.error("Failed to process command");
    } finally {
      setIsProcessing(false);
    }
  };

  const removeTypingIndicator = () => {
    setMessages((prev) => prev.filter((message) => !message.isTyping));
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Backlog Action Bot</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Ask me to perform actions on your Backlog projects using
                  natural language.
                </p>
                <p className="mt-2">
                  Try: "list all projects" or "create issue in project XYZ with
                  title 'Fix login bug'"
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="h-[60vh] overflow-y-auto border border-gray-200 rounded-md mb-4 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 p-3 rounded-lg ${
                  message.sender === "user"
                    ? "bg-primary text-white ml-10"
                    : "chat-message-ai mr-10"
                }`}
              >
                <div className="mb-1 text-sm opacity-70 flex justify-between">
                  <span>
                    {message.sender === "user" ? "You" : "Backlog Bot"}
                  </span>
                  {!message.isTyping && (
                    <span>{formatTimestamp(message.timestamp)}</span>
                  )}
                </div>
                <div>{message.content}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a command or ask a question..."
              className="flex-1"
              disabled={isProcessing}
            />
            <Button type="submit" disabled={isProcessing || !input.trim()}>
              <Send size={18} className="mr-2" />
              Send
            </Button>
          </form>

          <div className="mt-3 text-xs text-gray-500">
            <p>
              Tip: Try "list projects" or "create issue in project KEY with
              title 'Task name'"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
