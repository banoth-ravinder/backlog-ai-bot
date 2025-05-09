
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import backlogApi, { BacklogIssue, BacklogProject } from "@/lib/api/backlog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const IssuesPage: React.FC = () => {
  const [issues, setIssues] = useState<BacklogIssue[]>([]);
  const [projects, setProjects] = useState<BacklogProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadProjects();
  }, []);
  
  useEffect(() => {
    loadIssues();
  }, [selectedProjectId]);
  
  const loadProjects = async () => {
    try {
      if (!backlogApi.isConfigured()) {
        setError("Backlog API is not configured. Please set up your API credentials in the Settings page.");
        return;
      }
      
      const data = await backlogApi.getProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
      toast.error("Failed to load projects");
    }
  };
  
  const loadIssues = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!backlogApi.isConfigured()) {
        setError("Backlog API is not configured. Please set up your API credentials in the Settings page.");
        return;
      }
      
      let params = {};
      if (selectedProjectId !== "all") {
        params = { projectId: [parseInt(selectedProjectId)] };
      }
      
      const data = await backlogApi.getIssues(params);
      setIssues(data);
    } catch (err) {
      console.error("Failed to load issues:", err);
      setError("Failed to load issues. Please check your API credentials and try again.");
      toast.error("Failed to load issues");
    } finally {
      setIsLoading(false);
    }
  };
  
  const getStatusColor = (statusId?: number) => {
    // Example status colors, adjust based on your Backlog instance's status IDs
    switch(statusId) {
      case 1: return "bg-gray-500"; // Open
      case 2: return "bg-blue-500"; // In Progress
      case 3: return "bg-yellow-500"; // Resolved
      case 4: return "bg-green-500"; // Closed
      default: return "bg-gray-400";
    }
  };

  if (!backlogApi.isConfigured()) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">API Not Configured</h3>
              <p className="text-gray-500 mb-4">
                You need to set up your Backlog API credentials before accessing issues.
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/settings"}
              >
                Go to Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Issues</h1>
        <Button onClick={loadIssues} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Filter Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium mb-1">Project</label>
              <Select
                value={selectedProjectId}
                onValueChange={(value) => setSelectedProjectId(value)}
              >
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <p className="text-red-500">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-gray-500">Loading issues...</p>
        </div>
      ) : issues.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No Issues Found</h3>
              <p className="text-gray-500">
                {selectedProjectId === "all"
                  ? "No issues were found in any project."
                  : "No issues were found in the selected project."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assignee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell className="font-medium">{issue.issueKey}</TableCell>
                    <TableCell>{issue.summary}</TableCell>
                    <TableCell>
                      <Badge
                        className={`${getStatusColor(issue.status?.id)} text-white`}
                      >
                        {issue.status?.name || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="w-2 h-2 inline-block rounded-full mr-1" 
                        style={{ backgroundColor: issue.issueType?.color || '#999' }}
                      ></div>
                      {issue.issueType?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>{issue.priority?.name || 'Unknown'}</TableCell>
                    <TableCell>{issue.assignee?.name || 'Unassigned'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default IssuesPage;
