import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListSubmissions } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Plus, Search, Filter } from "lucide-react";
import { useState } from "react";

export default function SubmissionsList() {
  const { data: submissions = [], isLoading } = useListSubmissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = submissions.filter(sub => {
    const matchesSearch = sub.headline.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Submissions</h1>
          <p className="text-muted-foreground mt-1">Review and manage content requests.</p>
        </div>
        <Link 
          href="/submissions/new"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all"
        >
          <Plus className="w-5 h-5" />
          New Submission
        </Link>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search headlines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="published">Published</option>
              <option value="needs_revision">Needs Revision</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-border text-sm font-semibold text-muted-foreground tracking-wide">
                <th className="p-4">Headline</th>
                <th className="p-4">Department</th>
                <th className="p-4">Type</th>
                <th className="p-4">Submitted</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No submissions found.</td>
                </tr>
              ) : (
                filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4">
                      <Link href={`/submissions/${sub.id}`} className="font-semibold text-foreground group-hover:text-primary block">
                        {sub.headline}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{sub.department_name}</td>
                    <td className="p-4 text-sm text-muted-foreground capitalize">{sub.content_type.replace('_', ' ')}</td>
                    <td className="p-4 text-sm text-muted-foreground">{format(new Date(sub.submitted_at), 'MMM d, yyyy')}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex
                        ${sub.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                          sub.status === 'published' ? 'bg-green-100 text-green-700' : 
                          'bg-red-100 text-red-700'}`}
                      >
                        {sub.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
