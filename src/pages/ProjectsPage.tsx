
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import backlogApi, { BacklogProject } from "@/lib/api/backlog";

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<BacklogProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadProjects();
  }, []);
  
  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!backlogApi.isConfigured()) {
        setError("Backlog API is not configured. Please set up your API credentials in the Settings page.");
        return;
      }
      
      const data = await backlogApi.getProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError("Failed to load projects. Please check your API credentials and try again.");
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  if (!backlogApi.isConfigured()) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">API Not Configured</h3>
              <p className="text-gray-500 mb-4">
                You need to set up your Backlog API credentials before accessing projects.
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button onClick={loadProjects} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>
      
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
          <p className="mt-2 text-gray-500">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No Projects Found</h3>
              <p className="text-gray-500">
                No projects were found in your Backlog space.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <div className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All Projects</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="active" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects
                .filter((project) => !project.archived)
                .map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="archived" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects
                .filter((project) => project.archived)
                .map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

interface ProjectCardProps {
  project: BacklogProject;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{project.name}</CardTitle>
          {project.archived && (
            <Badge variant="secondary">Archived</Badge>
          )}
        </div>
        <CardDescription>Key: {project.projectKey}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm space-y-2">
          <div className="grid grid-cols-2 gap-1">
            <div>Wiki:</div>
            <div>{project.useWiki ? "Enabled" : "Disabled"}</div>
            
            <div>File Sharing:</div>
            <div>{project.useFileSharing ? "Enabled" : "Disabled"}</div>
            
            <div>Subtasking:</div>
            <div>{project.subtaskingEnabled ? "Enabled" : "Disabled"}</div>
            
            <div>Git:</div>
            <div>{project.useGit ? "Enabled" : "Disabled"}</div>
            
            <div>SVN:</div>
            <div>{project.useSubversion ? "Enabled" : "Disabled"}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => {
            // This is not implemented
            toast.info(`Viewing details for ${project.name} is not implemented in this demo`);
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectsPage;
