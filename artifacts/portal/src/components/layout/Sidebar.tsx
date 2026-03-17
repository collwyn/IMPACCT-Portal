import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Send, 
  FileText, 
  FolderOpen, 
  Users, 
  Building2, 
  LogOut,
  FolderPlus,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useListMessages } from "@workspace/api-client-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, isAdmin, isDeptHead, logout } = useAuth();
  
  const { data: messages = [] } = useListMessages({
    query: {
      refetchInterval: 5000,
    }
  });

  const unreadMessagesCount = messages.filter(
    m => !m.is_read && m.recipient_id === user?.id
  ).length;

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: true },
    { name: "Messages", href: "/messages", icon: MessageSquare, show: true, badge: unreadMessagesCount },
    { name: "Submissions", href: "/submissions", icon: FileText, show: isAdmin || isDeptHead },
    { name: "New Submission", href: "/submissions/new", icon: Send, show: true },
    { name: "Resources", href: "/resources", icon: FolderOpen, show: true },
  ];

  const adminItems = [
    { name: "Manage Users", href: "/admin/users", icon: Users, show: isAdmin },
    { name: "Departments", href: "/admin/departments", icon: Building2, show: isAdmin },
    { name: "Categories", href: "/admin/categories", icon: FolderPlus, show: isAdmin },
  ];

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col shadow-xl shadow-black/5 z-10 relative">
      <div className="px-5 pt-5 pb-4 border-b border-sidebar-border bg-white">
        <img
          src="/impacct-logo.jpg"
          alt="IMPACCT Brooklyn"
          className="w-full h-auto max-h-28 object-contain object-left"
        />
        <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-widest mt-3">
          Web Portal
        </p>
        <p className="text-[10px] text-muted-foreground capitalize">{user?.role.replace('_', ' ')}</p>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        <div>
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Menu
          </p>
          <nav className="space-y-1">
            {navItems.filter(item => item.show).map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  location === item.href || (location.startsWith(item.href) && item.href !== '/dashboard' && item.href !== '/submissions' && item.href !== '/messages')
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-5 h-5", location === item.href ? "text-primary" : "text-muted-foreground")} />
                  {item.name}
                </div>
                {item.badge ? (
                  <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
        </div>

        {isAdmin && (
          <div>
            <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Administration
            </p>
            <nav className="space-y-1">
              {adminItems.filter(item => item.show).map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    location === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", location === item.href ? "text-primary" : "text-muted-foreground")} />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent/50 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-onboarding-tour"))}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors mb-1"
        >
          <HelpCircle className="w-5 h-5" />
          Take the Tour
        </button>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}