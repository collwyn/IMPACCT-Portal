import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetSubmission, useUpdateSubmissionStatus, getGetSubmissionQueryKey, getListSubmissionsQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, AlertCircle, Clock, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { UpdateSubmissionStatusBodyStatus } from "@workspace/api-client-react";

export default function SubmissionDetail() {
  const { id } = useParams();
  const subId = parseInt(id || "0");
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: submission, isLoading } = useGetSubmission(subId, {
    query: { enabled: subId > 0 }
  });

  const [status, setStatus] = useState<UpdateSubmissionStatusBodyStatus>("pending");
  const [adminNotes, setAdminNotes] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (submission) {
      setStatus(submission.status);
      setAdminNotes(submission.admin_notes || "");
    }
  }, [submission]);

  const updateMutation = useUpdateSubmissionStatus({
    mutation: {
      onSuccess: () => {
        toast({ title: "Status Updated" });
        queryClient.invalidateQueries({ queryKey: getGetSubmissionQueryKey(subId) });
        queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
        setNote(""); // clear public history note after save
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" })
    }
  });

  const handleUpdate = () => {
    updateMutation.mutate({
      id: subId,
      data: { status, admin_notes: adminNotes, note: note || null }
    });
  };

  if (isLoading || !submission) return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/submissions" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2 w-max mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Submissions
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-display font-bold text-foreground">{submission.headline}</h1>
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wider w-max
            ${submission.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
              submission.status === 'published' ? 'bg-green-100 text-green-700' : 
              'bg-red-100 text-red-700'}`}
          >
            {submission.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
            <div className="flex flex-wrap gap-x-6 gap-y-4 mb-6 pb-6 border-b border-border/50 text-sm">
              <div>
                <p className="text-muted-foreground font-medium mb-1">Submitted By</p>
                <p className="font-semibold text-foreground">{submission.submitter_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium mb-1">Department</p>
                <p className="font-semibold text-foreground">{submission.department_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium mb-1">Type</p>
                <p className="font-semibold text-foreground capitalize">{submission.content_type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium mb-1">Submitted At</p>
                <p className="font-semibold text-foreground">{format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')}</p>
              </div>
            </div>

            <div className="prose max-w-none text-foreground">
              <p className="whitespace-pre-wrap">{submission.body}</p>
            </div>

            {(submission.link || submission.attachment_url) && (
              <div className="mt-8 pt-6 border-t border-border/50 flex flex-wrap gap-4">
                {submission.link && (
                  <a href={submission.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors">
                    <LinkIcon className="w-4 h-4" />
                    External Link
                  </a>
                )}
                {submission.attachment_url && (
                  <a href={submission.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors">
                    <LinkIcon className="w-4 h-4" />
                    Attachment
                  </a>
                )}
              </div>
            )}
          </div>

          {/* History Timeline */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
            <h3 className="text-lg font-display font-bold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              History Log
            </h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {submission.history.map((item, i) => (
                <div key={item.id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-card bg-primary/10 text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border/50 bg-slate-50/50 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-foreground">{item.changed_by_name}</span>
                      <time className="text-xs text-muted-foreground">{format(new Date(item.changed_at), 'MMM d, h:mm a')}</time>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Changed status from <span className="font-medium">{item.old_status || 'initial'}</span> to <span className="font-medium text-primary">{item.new_status}</span>
                    </p>
                    {item.note && (
                      <p className="text-sm bg-white p-3 rounded-lg border border-border/50 text-foreground italic">"{item.note}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Admin Actions */}
        <div>
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 sticky top-8">
            <h3 className="text-lg font-display font-bold mb-4">Administration</h3>
            
            {isAdmin ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Update Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="pending">Pending</option>
                    <option value="published">Published</option>
                    <option value="needs_revision">Needs Revision</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Note for History (Public)
                  </label>
                  <input 
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Approved and posted on site"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Private Admin Notes</label>
                  <textarea 
                    rows={4}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Only visible to admins..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
                  />
                </div>

                <button 
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                  className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-border/50">
                  <p className="text-sm font-medium text-foreground mb-1">Admin Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {submission.admin_notes || <span className="italic">No notes added.</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
