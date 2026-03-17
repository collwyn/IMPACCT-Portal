import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useCreateSubmission, useListDepartments } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Link } from "wouter";
import type { CreateSubmissionBodyContentType } from "@workspace/api-client-react";

export default function NewSubmission() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: departments = [] } = useListDepartments();
  
  const [formData, setFormData] = useState({
    department_id: "",
    content_type: "news" as CreateSubmissionBodyContentType,
    headline: "",
    body: "",
    link: "",
    attachment_url: "",
    requested_publish_date: ""
  });

  const createMutation = useCreateSubmission({
    mutation: {
      onSuccess: () => {
        toast({ title: "Success", description: "Submission created successfully." });
        setLocation("/submissions");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.error || "Failed to create submission", variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        ...formData,
        department_id: parseInt(formData.department_id),
        link: formData.link || null,
        attachment_url: formData.attachment_url || null,
        requested_publish_date: formData.requested_publish_date || null
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2 w-max mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-3xl font-display font-bold text-foreground">Create Submission</h1>
        <p className="text-muted-foreground mt-1">Submit content for review and publication.</p>
      </div>

      <div className="max-w-3xl bg-card rounded-2xl border border-border/50 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Department *</label>
              <select 
                required
                value={formData.department_id}
                onChange={e => setFormData({...formData, department_id: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Content Type *</label>
              <select 
                required
                value={formData.content_type}
                onChange={e => setFormData({...formData, content_type: e.target.value as any})}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="news">News</option>
                <option value="event">Event</option>
                <option value="program_update">Program Update</option>
                <option value="staff_change">Staff Change</option>
                <option value="resource">Resource</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Headline *</label>
            <input 
              required
              type="text"
              value={formData.headline}
              onChange={e => setFormData({...formData, headline: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Catchy title for the submission"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Body Content *</label>
            <textarea 
              required
              rows={6}
              value={formData.body}
              onChange={e => setFormData({...formData, body: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              placeholder="Provide full details here..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">External Link (Optional)</label>
              <input 
                type="url"
                value={formData.link}
                onChange={e => setFormData({...formData, link: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Attachment URL (Optional)</label>
              <input 
                type="url"
                value={formData.attachment_url}
                onChange={e => setFormData({...formData, attachment_url: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Link to Google Drive / PDF"
              />
            </div>
          </div>

          <div className="space-y-2 sm:w-1/2">
            <label className="text-sm font-semibold text-foreground">Requested Publish Date (Optional)</label>
            <input 
              type="date"
              value={formData.requested_publish_date}
              onChange={e => setFormData({...formData, requested_publish_date: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="pt-4 border-t border-border/50 flex justify-end gap-4">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Submit Content
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
