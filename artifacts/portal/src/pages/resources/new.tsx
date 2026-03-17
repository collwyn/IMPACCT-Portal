import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useCreateResource, useListResourceCategories, useSuggestResourceCategory, getListResourceCategoriesQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, PlusCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import type { CreateResourceBodyAccessLevel } from "@workspace/api-client-react";

export default function NewResource() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useListResourceCategories();
  
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    description: "",
    url: "",
    login_info_location: "",
    access_level: "everyone" as CreateResourceBodyAccessLevel,
    cost: "",
    renewal_date: "",
    notes: ""
  });

  const [suggesting, setSuggesting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const createMutation = useCreateResource({
    mutation: {
      onSuccess: () => {
        toast({ title: "Resource Added" });
        setLocation("/resources");
      },
      onError: (err: any) => toast({ title: "Error", description: err.error, variant: "destructive" })
    }
  });

  const suggestMutation = useSuggestResourceCategory({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Category Suggested", description: "It will be available once an admin approves it." });
        setSuggesting(false);
        setNewCategoryName("");
        queryClient.invalidateQueries({ queryKey: getListResourceCategoriesQueryKey() });
      },
      onError: (err: any) => toast({ title: "Error", description: err.error, variant: "destructive" })
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        ...formData,
        category_id: parseInt(formData.category_id),
        description: formData.description || null,
        url: formData.url || null,
        login_info_location: formData.login_info_location || null,
        cost: formData.cost || null,
        renewal_date: formData.renewal_date || null,
        notes: formData.notes || null,
      }
    });
  };

  const handleSuggest = () => {
    if (!newCategoryName) return;
    suggestMutation.mutate({ data: { name: newCategoryName } });
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/resources" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2 w-max mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </Link>
        <h1 className="text-3xl font-display font-bold text-foreground">Add Resource</h1>
      </div>

      <div className="max-w-3xl bg-card rounded-2xl border border-border/50 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Resource Name *</label>
              <input 
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">Category *</label>
                <button type="button" onClick={() => setSuggesting(!suggesting)} className="text-xs text-primary font-medium hover:underline">
                  Suggest new?
                </button>
              </div>
              
              {suggesting ? (
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 px-3 py-2 rounded-lg border border-border text-sm"
                  />
                  <button type="button" onClick={handleSuggest} disabled={suggestMutation.isPending} className="bg-secondary text-secondary-foreground px-3 rounded-lg text-sm font-medium hover:bg-secondary/80">
                    {suggestMutation.isPending ? "..." : "Send"}
                  </button>
                </div>
              ) : (
                <select 
                  required
                  value={formData.category_id}
                  onChange={e => setFormData({...formData, category_id: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 bg-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Description</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">URL</label>
              <input 
                type="url"
                value={formData.url}
                onChange={e => setFormData({...formData, url: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20"
                placeholder="https://"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Login Info Location</label>
              <input 
                type="text"
                value={formData.login_info_location}
                onChange={e => setFormData({...formData, login_info_location: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. 1Password, Bitwarden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Access Level *</label>
              <select 
                required
                value={formData.access_level}
                onChange={e => setFormData({...formData, access_level: e.target.value as any})}
                className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 bg-transparent"
              >
                <option value="everyone">Everyone</option>
                <option value="department">Department</option>
                <option value="leadership">Leadership</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Cost</label>
              <input 
                type="text"
                value={formData.cost}
                onChange={e => setFormData({...formData, cost: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20"
                placeholder="$100/mo"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Renewal Date</label>
              <input 
                type="date"
                value={formData.renewal_date}
                onChange={e => setFormData({...formData, renewal_date: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border/50 flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
            >
              {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Resource
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
