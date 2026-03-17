import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListPendingResourceCategories, useApproveResourceCategory, useDeleteResourceCategory, getListPendingResourceCategoriesQueryKey } from "@workspace/api-client-react";
import { CheckCircle2, Trash2, FolderSearch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function AdminCategories() {
  const { data: categories = [], isLoading } = useListPendingResourceCategories();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const approveMutation = useApproveResourceCategory({
    mutation: {
      onSuccess: () => {
        toast({ title: "Category approved" });
        queryClient.invalidateQueries({ queryKey: getListPendingResourceCategoriesQueryKey() });
      }
    }
  });

  const deleteMutation = useDeleteResourceCategory({
    mutation: {
      onSuccess: () => {
        toast({ title: "Category deleted" });
        queryClient.invalidateQueries({ queryKey: getListPendingResourceCategoriesQueryKey() });
      }
    }
  });

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Category Requests</h1>
        <p className="text-muted-foreground mt-1">Review resource category suggestions from staff.</p>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        {categories.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-border text-sm font-semibold text-muted-foreground tracking-wide">
                <th className="p-4">Name</th>
                <th className="p-4">Suggested Date</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {categories.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="p-4 font-semibold text-foreground">{c.name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{format(new Date(c.created_at), 'MMM d, yyyy')}</td>
                  <td className="p-4 flex items-center gap-2">
                    <button 
                      onClick={() => approveMutation.mutate({ id: c.id })}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button 
                      onClick={() => deleteMutation.mutate({ id: c.id })}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <FolderSearch className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No pending requests</h3>
            <p className="text-muted-foreground max-w-sm mt-1">When staff suggest new resource categories, they will appear here for review.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
