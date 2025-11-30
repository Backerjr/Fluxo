import { cn } from "@/lib/utils";
import {
  Activity,
  Command,
  Database,
  LayoutGrid,
  Settings,
  Users,
  Zap
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
}

function SidebarItem({ icon: Icon, label, href, isActive }: SidebarItemProps) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 px-3 py-2 h-9 font-medium transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans selection:bg-primary/20">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out z-30",
          isCollapsed ? "w-[60px]" : "w-[240px]"
        )}
      >
        {/* Brand */}
        <div className="flex h-14 items-center px-4 border-b border-sidebar-border/50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <span className="font-bold text-lg">F</span>
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-sidebar-foreground tracking-tight">
                Fluxo
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <div className="px-2 space-y-1">
            <SidebarItem
              icon={LayoutGrid}
              label="Dashboard"
              href="/"
              isActive={location === "/"}
            />
            <SidebarItem
              icon={Database}
              label="Enrichment Queues"
              href="/queues"
              isActive={location === "/queues"}
            />
            <SidebarItem
              icon={Users}
              label="Connections"
              href="/connections"
              isActive={location === "/connections"}
            />
            <SidebarItem
              icon={Zap}
              label="API Config"
              href="/api-config"
              isActive={location === "/api-config"}
            />
          </div>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="p-2 border-t border-sidebar-border/50 space-y-1">
          <SidebarItem
            icon={Settings}
            label="Settings"
            href="/settings"
            isActive={location === "/settings"}
          />
          <Separator className="my-2 bg-sidebar-border/50" />
          
          {/* User Profile */}
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-md hover:bg-sidebar-accent/50 cursor-pointer transition-colors",
            isCollapsed ? "justify-center" : ""
          )}>
            <Avatar className="h-8 w-8 border border-border/50">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate text-sidebar-foreground">
                  John Doe
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  Pro Workspace
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        {/* Global Command Bar */}
        <header className="h-14 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
          {/* Breadcrumbs / Context */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer transition-colors">Fluxo</span>
            <span className="text-border">/</span>
            <span className="text-foreground font-medium">Enrichment Queue</span>
          </div>

          {/* Command Search & Status */}
          <div className="flex items-center gap-4">
            {/* Command Search */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Command className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search or type command..."
                className="h-9 w-64 rounded-md bg-secondary/50 border border-border/50 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring/50 focus:bg-secondary transition-all"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>

            <Separator orientation="vertical" className="h-6 bg-border/50" />

            {/* Status Indicators */}
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-help">
                <Activity className="h-3.5 w-3.5 text-chart-3" />
                <span>API: 24ms</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-help">
                <div className="h-2 w-2 rounded-full bg-chart-1 shadow-[0_0_8px_rgba(var(--chart-1),0.5)]" />
                <span>4,200 Credits</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto relative">
          {children}
        </main>
      </div>
    </div>
  );
}
