
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import backlogApi from "@/lib/api/backlog";
import openAIService from "@/lib/ai/openai-service";

const SettingsPage: React.FC = () => {
  const [backlogApiKey, setBacklogApiKey] = useState<string>(
    backlogApi.getApiKey() || ""
  );
  const [backlogSpaceId, setBacklogSpaceId] = useState<string>(
    backlogApi.getSpaceId() || ""
  );
  const [openaiApiKey, setOpenaiApiKey] = useState<string>(
    openAIService.getApiKey() || ""
  );
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const { toast } = useToast();

  const hasEnvVars = {
    backlogApiKey: !!import.meta.env.VITE_BACKLOG_API_KEY,
    backlogSpaceId: !!import.meta.env.VITE_BACKLOG_SPACE_ID,
    openaiApiKey: !!import.meta.env.VITE_OPENAI_API_KEY
  };

  useEffect(() => {
    // Load API keys
    setBacklogApiKey(backlogApi.getApiKey() || "");
    setBacklogSpaceId(backlogApi.getSpaceId() || "");
    setOpenaiApiKey(openAIService.getApiKey() || "");
  }, []);

  // Test connection
  const testBacklogConnection = async () => {
    setTestingConnection(true);
    setTestStatus(null);

    console.log("Testing connection with Backlog API...");
    console.log("API Key:", backlogApiKey);
    console.log("Space ID:", backlogSpaceId);
    
    try {
      if (
        !backlogApiKey ||
        !backlogSpaceId
      ) {
        throw new Error("Please provide all required fields");
      }
      
      // Set API credentials temporarily
      backlogApi.configure({
        apiKey: backlogApiKey,
        spaceId: backlogSpaceId,
      });
      
      // Try to get space info to verify connection
      const spaceInfo = await backlogApi.getSpace();
      
      setTestStatus({
        success: true,
        message: `Successfully connected to ${spaceInfo.name || "Backlog"}!`,
      });
    } catch (error) {
      console.error("Connection test failed:", error);
      setTestStatus({
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleBacklogApiKeyChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setBacklogApiKey(event.target.value);
  };

  const handleBacklogSpaceIdChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setBacklogSpaceId(event.target.value);
  };

  const handleOpenaiApiKeyChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setOpenaiApiKey(event.target.value);
  };

  const handleResetSettings = () => {
    backlogApi.clearApiKey();
    backlogApi.clearSpaceId();
    backlogApi.clearBaseUrl();
    openAIService.clearApiKey();
    setBacklogApiKey("");
    setBacklogSpaceId("");
    setOpenaiApiKey("");
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to their default values.",
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          API keys are now configured using environment variables. Create a <code>.env</code> file in the project root with these variables:
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
            VITE_BACKLOG_API_KEY=your_backlog_api_key<br/>
            VITE_BACKLOG_SPACE_ID=your_backlog_space_id<br/>
            VITE_OPENAI_API_KEY=your_openai_api_key
          </pre>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            View your API configuration. For security, keys should be set in environment variables.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="backlog" className="w-full">
            <TabsList>
              <TabsTrigger value="backlog">Backlog API</TabsTrigger>
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
            </TabsList>
            <TabsContent value="backlog">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="backlog-api-key">
                    Backlog API Key {hasEnvVars.backlogApiKey && <span className="text-green-600 text-xs">(Set in .env)</span>}
                  </Label>
                  <Input
                    id="backlog-api-key"
                    type="password"
                    value={backlogApiKey}
                    onChange={handleBacklogApiKeyChange}
                    readOnly={hasEnvVars.backlogApiKey}
                    className={hasEnvVars.backlogApiKey ? "bg-gray-100" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backlog-space-id">
                    Backlog Space ID {hasEnvVars.backlogSpaceId && <span className="text-green-600 text-xs">(Set in .env)</span>}
                  </Label>
                  <Input
                    id="backlog-space-id"
                    type="text"
                    value={backlogSpaceId}
                    onChange={handleBacklogSpaceIdChange}
                    readOnly={hasEnvVars.backlogSpaceId}
                    className={hasEnvVars.backlogSpaceId ? "bg-gray-100" : ""}
                  />
                </div>
                <Button onClick={testBacklogConnection} disabled={testingConnection} variant="outline">
                  {testingConnection ? "Testing..." : "Test Connection"}
                </Button>
                {testStatus && (
                  <div
                    className={testStatus.success ? "text-green-500" : "text-red-500"}
                  >
                    {testStatus.message}
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="openai">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openai-api-key">
                    OpenAI API Key {hasEnvVars.openaiApiKey && <span className="text-green-600 text-xs">(Set in .env)</span>}
                  </Label>
                  <Input
                    id="openai-api-key"
                    type="password"
                    value={openaiApiKey}
                    onChange={handleOpenaiApiKeyChange}
                    readOnly={hasEnvVars.openaiApiKey}
                    className={hasEnvVars.openaiApiKey ? "bg-gray-100" : ""}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button variant="destructive" onClick={handleResetSettings} disabled={Object.values(hasEnvVars).some(Boolean)}>
            Reset Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SettingsPage;