
import React from "react";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children?: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <div className="h-14 border-b flex items-center px-4 bg-white">
            {isMobile && <SidebarTrigger />}
            <h2 className="text-xl font-semibold ml-2">Backlog AI Action Bot <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Powered by AI</span></h2>
          </div>
          <main className="flex-1 p-6">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
