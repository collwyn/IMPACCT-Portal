import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useListSubmissions, useListResources } from "@workspace/api-client-react";
import { FileText, FolderOpen, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const { user, isAdmin, isDeptHead } = useAuth();
  
  const { data: submissions = [] } = useListSubmissions();
  const { data: resources = [] } = useListResources();

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const recentSubmissions = submissions.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Hello, {user?.name.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening in the portal today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {(isAdmin || isDeptHead) && (
          <>
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-3xl font-display font-bold text-foreground">{pendingSubmissions.length}</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">Pending Review</p>
                <p className="text-sm text-muted-foreground">Submissions awaiting action</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-3xl font-display font-bold text-foreground">{submissions.length}</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">Total Submissions</p>
                <p className="text-sm text-muted-foreground">Across your access scope</p>
              </div>
            </div>
          </>
        )}

        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
              <FolderOpen className="w-6 h-6" />
            </div>
            <span className="text-3xl font-display font-bold text-foreground">{resources.length}</span>
          </div>
          <div>
            <p className="font-semibold text-foreground">Active Resources</p>
            <p className="text-sm text-muted-foreground">Available in directory</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 shadow-lg shadow-primary/20 flex flex-col justify-between text-white relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
            <FileText className="w-32 h-32" />
          </div>
          <div className="relative z-10 mb-4">
            <h3 className="text-xl font-display font-bold">Need to share something?</h3>
          </div>
          <Link href="/submissions/new" className="relative z-10 inline-flex items-center gap-2 text-sm font-semibold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors w-max">
            Create Submission
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      {(isAdmin || isDeptHead) && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold text-foreground">Recent Submissions</h2>
            <Link href="/submissions" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
            {recentSubmissions.length > 0 ? (
              <div className="divide-y divide-border/50">
                {recentSubmissions.map((sub) => (
                  <Link 
                    key={sub.id} 
                    href={`/submissions/${sub.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div>
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{sub.headline}</h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="capitalize">{sub.content_type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{format(new Date(sub.submitted_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
                        ${sub.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                          sub.status === 'published' ? 'bg-green-100 text-green-700' : 
                          'bg-red-100 text-red-700'}`}
                      >
                        {sub.status.replace('_', ' ')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <AlertCircle className="w-12 h-12 mb-3 text-muted-foreground/50" />
                <p>No recent submissions found.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
