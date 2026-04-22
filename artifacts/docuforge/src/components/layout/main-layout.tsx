import { Link, useLocation } from "wouter";
import { FileText, LayoutTemplate, LayoutDashboard } from "lucide-react";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-primary">
            <FileText className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tight text-sidebar-foreground">DocuForge</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location === "/" ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}>
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          
          <Link href="/documents" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location.startsWith("/documents") ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}>
            <FileText className="w-4 h-4" />
            Documents
          </Link>

          <Link href="/templates" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location.startsWith("/templates") ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}>
            <LayoutTemplate className="w-4 h-4" />
            Templates
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
