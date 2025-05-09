/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-case-declarations */
import backlogApi, { 
  BacklogProject, 
  BacklogIssue, 
  BacklogUser
} from "@/lib/api/backlog";
import openAIService from "./openai-service";

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface AICommand {
  type: string;
  action: string;
  params: Record<string, any>;
  rawCommand: string;
}

// Define proper types for the API responses and command structure
interface CommandError {
  error: string;
}

interface CommandResponse {
  type: string;
  action: string;
  params: Record<string, any>;
}

interface NamedItem {
  name: string;
}

export class CommandProcessor {
  public async parseCommand(userInput: string): Promise<AICommand | null> {
    try {
      // Use OpenAI to parse the command
      if (!openAIService.isConfigured()) {
        throw new Error("OpenAI is not configured. Please set up your API key in the Settings page.");
      }

      const result = await openAIService.processUserMessage(userInput);
      
      if ((result as CommandError).error) {
        console.log("OpenAI couldn't understand the command:", (result as CommandError).error);
        return null;
      }
      
      const { type, action, params } = result as CommandResponse;
      
      return {
        type,
        action,
        params,
        rawCommand: userInput
      };
    } catch (error) {
      console.error("Error parsing command with OpenAI:", error);
      return null;
    }
  }
  
  public async executeCommand(command: AICommand): Promise<CommandResult> {
    try {
      if (!backlogApi.isConfigured()) {
        return {
          success: false,
          message: "⚠️ Backlog API is not configured. Please set up your API credentials in the Settings page."
        };
      }
      
      // Execute the command based on type and action
      switch (command.type) {
        case 'projects':
          return await this.handleProjectCommand(command);
        case 'issues':
          return await this.handleIssueCommand(command);
        case 'users':
          return await this.handleUserCommand(command);
        case 'wikis':
          return await this.handleWikiCommand(command);
        case 'versions':
        case 'milestones':
          return await this.handleMilestoneCommand(command);
        case 'categories':
          return await this.handleCategoryCommand(command);
        case 'issueTypes':
          return await this.handleIssueTypeCommand(command);
        case 'customFields':
          return await this.handleCustomFieldCommand(command);
        case 'space':
          return await this.handleSpaceCommand(command);
        default:
          return {
            success: false,
            message: `I don't know how to handle '${command.type}' commands.`
          };
      }
      
    } catch (error) {
      console.error('Error executing command:', error);
      return {
        success: false,
        message: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  private async handleProjectCommand(command: AICommand): Promise<CommandResult> {
    switch (command.action) {
      case 'list':
        const projects = await backlogApi.getProjects();
        return {
          success: true,
          message: `I found ${projects.length} projects:`,
          data: { projects }
        };
        
      case 'get':
        const { projectIdOrKey } = command.params;
        if (!projectIdOrKey) {
          return {
            success: false,
            message: "Please specify a project ID or key"
          };
        }
        
        const project = await backlogApi.getProject(projectIdOrKey);
        return {
          success: true,
          message: `Here's information about project ${project.name}:`,
          data: { project }
        };
      
      case 'create':
        const { name, key } = command.params;
        if (!name || !key) {
          return {
            success: false,
            message: "Please provide a name and key for the project"
          };
        }
        
        const newProject = await backlogApi.createProject({
          name,
          key,
          ...command.params
        });
        
        return {
          success: true,
          message: `Successfully created project "${newProject.name}" with key ${newProject.projectKey}`,
          data: { project: newProject }
        };
      
      case 'update':
        const { projectIdOrKey: projKey, ...updateParams } = command.params;
        if (!projKey) {
          return {
            success: false,
            message: "Please specify a project ID or key"
          };
        }
        
        const updatedProject = await backlogApi.updateProject(projKey, updateParams);
        return {
          success: true,
          message: `Successfully updated project "${updatedProject.name}"`,
          data: { project: updatedProject }
        };
      
      case 'delete':
        const { projectIdOrKey: projectToDelete } = command.params;
        if (!projectToDelete) {
          return {
            success: false,
            message: "Please specify a project ID or key to delete"
          };
        }
        
        await backlogApi.deleteProject(projectToDelete);
        return {
          success: true,
          message: `Successfully deleted project ${projectToDelete}`
        };
        
      default:
        return {
          success: false,
          message: `I don't know how to ${command.action} projects.`
        };
    }
  }
  
  private async handleIssueCommand(command: AICommand): Promise<CommandResult> {
    switch (command.action) {
      case 'list':
        let issues: BacklogIssue[];
        const { projectIdOrKey } = command.params;
        
        if (projectIdOrKey) {
          const project = await backlogApi.getProject(projectIdOrKey);
          issues = await backlogApi.getIssues({ projectId: [project.id] });
          return {
            success: true,
            message: `I found ${issues.length} issues in project ${project.name}:`,
            data: { issues, projectName: project.name }
          };
        } else {
          issues = await backlogApi.getIssues();
          return {
            success: true,
            message: `I found ${issues.length} issues across all projects:`,
            data: { issues }
          };
        }
      
      case 'get':
        const { issueIdOrKey } = command.params;
        if (!issueIdOrKey) {
          return {
            success: false,
            message: "Please specify an issue ID or key"
          };
        }
        
        const issue = await backlogApi.getIssue(issueIdOrKey);
        return {
          success: true,
          message: `Here's information about issue ${issue.issueKey}:`,
          data: { issue }
        };
        
      case 'create':
        const { projectIdOrKey: projKey, summary, description } = command.params;
        
        if (!projKey) {
          return {
            success: false,
            message: "Please specify a project ID or key"
          };
        }
        
        if (!summary) {
          return {
            success: false,
            message: "Please provide a summary for the issue"
          };
        }
        
        // Get project to get issueTypeId
        const project = await backlogApi.getProject(projKey);
        
        // Get issue types for this project
        const issueTypes = await backlogApi.getIssueTypes(projKey);
        if (!issueTypes || issueTypes.length === 0) {
          return {
            success: false,
            message: "No issue types found for this project"
          };
        }
        
        const issueTypeId = issueTypes[0].id;
        
        // Use default priority (normal)
        const priorityId = 3; // 3 is "Normal" in Backlog
        
        const newIssue = await backlogApi.createIssue({
          projectId: project.id,
          summary,
          description: description || "",
          issueTypeId,
          priorityId
        });
        
        return {
          success: true,
          message: `Successfully created issue "${newIssue.summary}" with key ${newIssue.issueKey}`,
          data: { issue: newIssue }
        };
      
      case 'update':
        const { issueIdOrKey: issueToUpdate, ...updateParams } = command.params;
        if (!issueToUpdate) {
          return {
            success: false,
            message: "Please specify an issue ID or key to update"
          };
        }
        
        const updatedIssue = await backlogApi.updateIssue(issueToUpdate, updateParams);
        return {
          success: true,
          message: `Successfully updated issue ${updatedIssue.issueKey}`,
          data: { issue: updatedIssue }
        };
      
      case 'delete':
        const { issueIdOrKey: issueToDelete } = command.params;
        if (!issueToDelete) {
          return {
            success: false,
            message: "Please specify an issue ID or key to delete"
          };
        }
        
        await backlogApi.deleteIssue(issueToDelete);
        return {
          success: true,
          message: `Successfully deleted issue ${issueToDelete}`
        };
      
      case 'comments':
        const { issueIdOrKey: issueForComments } = command.params;
        if (!issueForComments) {
          return {
            success: false,
            message: "Please specify an issue ID or key to get comments"
          };
        }
        
        const comments = await backlogApi.getIssueComments(issueForComments);
        return {
          success: true,
          message: `I found ${comments.length} comments for issue ${issueForComments}:`,
          data: { comments, issueIdOrKey: issueForComments }
        };
      
      case 'addComment':
        const { issueIdOrKey: issueForComment, content } = command.params;
        if (!issueForComment) {
          return {
            success: false,
            message: "Please specify an issue ID or key to add a comment"
          };
        }
        
        if (!content) {
          return {
            success: false,
            message: "Please provide content for the comment"
          };
        }
        
        const newComment = await backlogApi.addIssueComment(issueForComment, content);
        return {
          success: true,
          message: `Successfully added comment to issue ${issueForComment}`,
          data: { comment: newComment }
        };
        
      default:
        return {
          success: false,
          message: `I don't know how to ${command.action} issues.`
        };
    }
  }
  
  private async handleUserCommand(command: AICommand): Promise<CommandResult> {
    switch (command.action) {
      case 'list':
        const users = await backlogApi.getUsers();
        return {
          success: true,
          message: `I found ${users.length} users:`,
          data: { users }
        };
      
      case 'get':
        const { userId } = command.params;
        if (!userId) {
          return {
            success: false,
            message: "Please specify a user ID"
          };
        }
        
        const user = await backlogApi.getUser(parseInt(userId));
        return {
          success: true,
          message: `Here's information about user ${user.name}:`,
          data: { user }
        };
      
      case 'activities':
        const { userId: userForActivities } = command.params;
        if (!userForActivities) {
          return {
            success: false,
            message: "Please specify a user ID to get activities"
          };
        }
        
        const activities = await backlogApi.getUserActivities(parseInt(userForActivities));
        return {
          success: true,
          message: `I found ${activities.length} activities for user ${userForActivities}:`,
          data: { activities }
        };
        
      default:
        return {
          success: false,
          message: `I don't know how to ${command.action} users.`
        };
    }
  }
  
  private async handleWikiCommand(command: AICommand): Promise<CommandResult> {
    switch (command.action) {
      case 'list':
        const { projectIdOrKey } = command.params;
        if (!projectIdOrKey) {
          return {
            success: false,
            message: "Please specify a project ID or key"
          };
        }
        
        const wikis = await backlogApi.getWikis(projectIdOrKey);
        return {
          success: true,
          message: `I found ${wikis.length} wikis in project ${projectIdOrKey}:`,
          data: { wikis }
        };
      
      case 'get':
        const { wikiId } = command.params;
        if (!wikiId) {
          return {
            success: false,
            message: "Please specify a wiki ID"
          };
        }
        
        const wiki = await backlogApi.getWiki(parseInt(wikiId));
        return {
          success: true,
          message: `Here's information about wiki ${wiki.name}:`,
          data: { wiki }
        };
      
      case 'create':
        const { projectId, name, content } = command.params;
        if (!projectId || !name || !content) {
          return {
            success: false,
            message: "Please provide projectId, name, and content for the wiki"
          };
        }
        
        const newWiki = await backlogApi.createWiki({
          projectId: parseInt(projectId),
          name,
          content,
          mailNotify: command.params.mailNotify
        });
        
        return {
          success: true,
          message: `Successfully created wiki "${newWiki.name}"`,
          data: { wiki: newWiki }
        };
      
      case 'update':
        const { wikiId: wikiToUpdate, ...updateParams } = command.params;
        if (!wikiToUpdate) {
          return {
            success: false,
            message: "Please specify a wiki ID to update"
          };
        }
        
        const updatedWiki = await backlogApi.updateWiki(parseInt(wikiToUpdate), updateParams);
        return {
          success: true,
          message: `Successfully updated wiki "${updatedWiki.name}"`,
          data: { wiki: updatedWiki }
        };
      
      case 'delete':
        const { wikiId: wikiToDelete } = command.params;
        if (!wikiToDelete) {
          return {
            success: false,
            message: "Please specify a wiki ID to delete"
          };
        }
        
        await backlogApi.deleteWiki(parseInt(wikiToDelete));
        return {
          success: true,
          message: `Successfully deleted wiki ${wikiToDelete}`
        };
      
      case 'tags':
        const { projectIdOrKey: projectForTags } = command.params;
        if (!projectForTags) {
          return {
            success: false,
            message: "Please specify a project ID or key to get wiki tags"
          };
        }
        
        const tags = await backlogApi.getWikiTags(projectForTags);
        return {
          success: true,
          message: `I found ${tags.length} wiki tags in project ${projectForTags}:`,
          data: { tags }
        };
        
      default:
        return {
          success: false,
          message: `I don't know how to ${command.action} wikis.`
        };
    }
  }
  
  private async handleMilestoneCommand(command: AICommand): Promise<CommandResult> {
    switch (command.action) {
      case 'list':
        const { projectIdOrKey } = command.params;
        if (!projectIdOrKey) {
          return {
            success: false,
            message: "Please specify a project ID or key"
          };
        }
        
        const milestones = await backlogApi.getMilestones(projectIdOrKey);
        return {
          success: true,
          message: `I found ${milestones.length} milestones in project ${projectIdOrKey}:`,
          data: { milestones }
        };
      
      case 'create':
        const { projectIdOrKey: projectForCreate, name, description, startDate, releaseDueDate } = command.params;
        if (!projectForCreate || !name) {
          return {
            success: false,
            message: "Please provide a project ID/key and name for the milestone"
          };
        }
        
        const newMilestone = await backlogApi.createMilestone(projectForCreate, {
          name,
          description,
          startDate,
          releaseDueDate
        });
        
        return {
          success: true,
          message: `Successfully created milestone "${newMilestone.name}"`,
          data: { milestone: newMilestone }
        };
      
      case 'update':
        const { projectIdOrKey: projectForUpdate, versionId, ...updateParams } = command.params;
        if (!projectForUpdate || !versionId) {
          return {
            success: false,
            message: "Please specify a project ID/key and version ID to update"
          };
        }
        
        const updatedMilestone = await backlogApi.updateMilestone(
          projectForUpdate, 
          parseInt(versionId), 
          updateParams
        );
        
        return {
          success: true,
          message: `Successfully updated milestone "${updatedMilestone.name}"`,
          data: { milestone: updatedMilestone }
        };
      
      case 'delete':
        const { projectIdOrKey: projectForDelete, versionId: versionToDelete } = command.params;
        if (!projectForDelete || !versionToDelete) {
          return {
            success: false,
            message: "Please specify a project ID/key and version ID to delete"
          };
        }
        
        await backlogApi.deleteMilestone(projectForDelete, parseInt(versionToDelete));
        return {
          success: true,
          message: `Successfully deleted milestone with ID ${versionToDelete}`
        };
        
      default:
        return {
          success: false,
          message: `I don't know how to ${command.action} milestones.`
        };
    }
  }
  
  private async handleCategoryCommand(command: AICommand): Promise<CommandResult> {
    switch (command.action) {
      case 'list':
        const { projectIdOrKey } = command.params;
        if (!projectIdOrKey) {
          return {
            success: false,
            message: "Please specify a project ID or key"
          };
        }
        
        const categories = await backlogApi.getCategories(projectIdOrKey);
        return {
          success: true,
          message: `I found ${categories.length} categories in project ${projectIdOrKey}:`,
          data: { categories }
        };
      
      case 'create':
        const { projectIdOrKey: projectForCreate, name } = command.params;
        if (!projectForCreate || !name) {
          return {
            success: false,
            message: "Please provide a project ID/key and name for the category"
          };
        }
        
        const newCategory = await backlogApi.createCategory(projectForCreate, name);
        return {
          success: true,
          message: `Successfully created category "${newCategory.name}"`,
          data: { category: newCategory }
        };
      
      case 'update':
        const { projectIdOrKey: projectForUpdate, categoryId, name: newName } = command.params;
        if (!projectForUpdate || !categoryId || !newName) {
          return {
            success: false,
            message: "Please specify a project ID/key, category ID, and new name"
          };
        }
        
        const updatedCategory = await backlogApi.updateCategory(
          projectForUpdate, 
          parseInt(categoryId), 
          newName
        );
        
        return {
          success: true,
          message: `Successfully updated category to "${updatedCategory.name}"`,
          data: { category: updatedCategory }
        };
      
      case 'delete':
        const { projectIdOrKey: projectForDelete, categoryId: categoryToDelete } = command.params;
        if (!projectForDelete || !categoryToDelete) {
          return {
            success: false,
            message: "Please specify a project ID/key and category ID to delete"
          };
        }
        
        await backlogApi.deleteCategory(projectForDelete, parseInt(categoryToDelete));
        return {
          success: true,
          message: `Successfully deleted category with ID ${categoryToDelete}`
        };
        
      default:
        return {
          success: false,
          message: `I don't know how to ${command.action} categories.`
        };
    }
  }
  
  private async handleIssueTypeCommand(command: AICommand): Promise<CommandResult> {
    switch (command.action) {
      case 'list':
        const { projectIdOrKey } = command.params;
        if (!projectIdOrKey) {
          return {
            success: false,
            message: "Please specify a project ID or key"
          };
        }
        
        const issueTypes = await backlogApi.getIssueTypes(projectIdOrKey);
        return {
          success: true,
          message: `I found ${issueTypes.length} issue types in project ${projectIdOrKey}:`,
          data: { issueTypes }
        };
      
      case 'create':
        const { projectIdOrKey: projectForCreate, name, color } = command.params;
        if (!projectForCreate || !name || !color) {
          return {
            success: false,
            message: "Please provide a project ID/key, name, and color for the issue type"
          };
        }
        
        const newIssueType = await backlogApi.createIssueType(projectForCreate, { name, color });
        return {
          success: true,
          message: `Successfully created issue type "${newIssueType.name}"`,
          data: { issueType: newIssueType }
        };
      
      case 'update':
        const { projectIdOrKey: projectForUpdate, issueTypeId, ...updateParams } = command.params;
        if (!projectForUpdate || !issueTypeId) {
          return {
            success: false,
            message: "Please specify a project ID/key and issue type ID"
          };
        }
        
        const updatedIssueType = await backlogApi.updateIssueType(
          projectForUpdate, 
          parseInt(issueTypeId),
          updateParams
        );
        
        return {
          success: true,
          message: `Successfully updated issue type to "${updatedIssueType.name}"`,
          data: { issueType: updatedIssueType }
        };
      
      case 'delete':
        const { 
          projectIdOrKey: projectForDelete, 
          issueTypeId: issueTypeToDelete, 
          substituteIssueTypeId 
        } = command.params;
        
        if (!projectForDelete || !issueTypeToDelete || !substituteIssueTypeId) {
          return {
            success: false,
            message: "Please specify a project ID/key, issue type ID to delete, and substitute issue type ID"
          };
        }
        
        await backlogApi.deleteIssueType(
          projectForDelete, 
          parseInt(issueTypeToDelete), 
          parseInt(substituteIssueTypeId)
        );
        
        return {
          success: true,
          message: `Successfully deleted issue type with ID ${issueTypeToDelete}`
        };
        
      default:
        return {
          success: false,
          message: `I don't know how to ${command.action} issue types.`
        };
    }
  }
  
  private async handleCustomFieldCommand(command: AICommand): Promise<CommandResult> {
    switch (command.action) {
      case 'list':
        const { projectIdOrKey } = command.params;
        if (!projectIdOrKey) {
          return {
            success: false,
            message: "Please specify a project ID or key"
          };
        }
        
        const customFields = await backlogApi.getCustomFields(projectIdOrKey);
        return {
          success: true,
          message: `I found ${customFields.length} custom fields in project ${projectIdOrKey}:`,
          data: { customFields }
        };
      
      case 'create':
        const { projectIdOrKey: projectForCreate, typeId, name, ...createParams } = command.params;
        if (!projectForCreate || !typeId || !name) {
          return {
            success: false,
            message: "Please provide a project ID/key, type ID, and name for the custom field"
          };
        }
        
        const newCustomField = await backlogApi.createCustomField(projectForCreate, {
          typeId: parseInt(typeId),
          name,
          ...createParams
        });
        
        return {
          success: true,
          message: `Successfully created custom field "${newCustomField.name}"`,
          data: { customField: newCustomField }
        };
      
      case 'update':
        const { projectIdOrKey: projectForUpdate, customFieldId, ...updateParams } = command.params;
        if (!projectForUpdate || !customFieldId) {
          return {
            success: false,
            message: "Please specify a project ID/key and custom field ID"
          };
        }
        
        const updatedCustomField = await backlogApi.updateCustomField(
          projectForUpdate, 
          parseInt(customFieldId),
          updateParams
        );
        
        return {
          success: true,
          message: `Successfully updated custom field "${updatedCustomField.name}"`,
          data: { customField: updatedCustomField }
        };
      
      case 'delete':
        const { projectIdOrKey: projectForDelete, customFieldId: customFieldToDelete } = command.params;
        if (!projectForDelete || !customFieldToDelete) {
          return {
            success: false,
            message: "Please specify a project ID/key and custom field ID to delete"
          };
        }
        
        await backlogApi.deleteCustomField(projectForDelete, parseInt(customFieldToDelete));
        return {
          success: true,
          message: `Successfully deleted custom field with ID ${customFieldToDelete}`
        };
        
      default:
        return {
          success: false,
          message: `I don't know how to ${command.action} custom fields.`
        };
    }
  }
  
  private async handleSpaceCommand(command: AICommand): Promise<CommandResult> {
    switch (command.action) {
      case 'get':
        const space = await backlogApi.getSpace();
        return {
          success: true,
          message: `Here's information about your Backlog space:`,
          data: { space }
        };
      
      case 'activities':
        const activities = await backlogApi.getSpaceActivities(command.params);
        return {
          success: true,
          message: `I found ${activities.length} activities in your Backlog space:`,
          data: { activities }
        };
      
      case 'notification':
        const notification = await backlogApi.getSpaceNotification();
        return {
          success: true,
          message: `Here's the current space notification:`,
          data: { notification }
        };
      
      case 'updateNotification':
        const { content } = command.params;
        if (!content) {
          return {
            success: false,
            message: "Please provide content for the notification"
          };
        }
        
        const updatedNotification = await backlogApi.updateSpaceNotification(content);
        return {
          success: true,
          message: `Successfully updated space notification`,
          data: { notification: updatedNotification }
        };
        
      default:
        return {
          success: false,
          message: `I don't know how to ${command.action} in the space.`
        };
    }
  }
}

export const commandProcessor = new CommandProcessor();
export default commandProcessor;