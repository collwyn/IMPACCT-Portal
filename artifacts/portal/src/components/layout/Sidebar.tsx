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
  FolderPlus
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();
  const { user, isAdmin, isDeptHead, logout } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: true },
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
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-display font-bold text-primary">IMPACCT Portal</h1>
        <p className="text-xs text-muted-foreground mt-1 capitalize">{user?.role.replace('_', ' ')}</p>
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  location === item.href || (location.startsWith(item.href) && item.href !== '/dashboard' && item.href !== '/submissions')
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
