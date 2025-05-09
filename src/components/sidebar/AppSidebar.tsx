
import React from "react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { Settings, Home, FileText, CheckCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const mainMenuItems = [
    { title: "Dashboard", icon: Home, path: "/" },
    { title: "Projects", icon: FileText, path: "/projects" },
    { title: "Issues", icon: CheckCheck, path: "/issues" },
  ];
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-md bg-backlog-blue flex items-center justify-center text-white font-bold mr-2">
            B
          </div>
          <h1 className="text-white font-semibold text-lg">Backlog AI</h1>
        </div>
        <Badge variant="outline" className="bg-white/10 text-white border-0 text-xs">
          Beta
        </Badge>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.path)}
                    className={cn(
                      isActive(item.path) && "bg-sidebar-accent"
                    )}
                  >
                    <item.icon size={20} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate("/settings")}
                  className={cn(
                    isActive("/settings") && "bg-sidebar-accent"
                  )}
                >
                  <Settings size={20} />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 text-xs text-white/70">
        <div>Backlog AI Action Bot</div>
        <div className="mt-1">v1.0.0</div>
      </SidebarFooter>
    </Sidebar>
  );
}
