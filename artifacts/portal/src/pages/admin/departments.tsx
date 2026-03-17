import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListDepartments, useCreateDepartment, getListDepartmentsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminDepartments() {
  const { data: departments = [] } = useListDepartments();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", contact_email: "", active: true });

  const createMutation = useCreateDepartment({
    mutation: {
      onSuccess: () => {
        toast({ title: "Department created" });
        setIsModalOpen(false);
        queryClient.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
        setFormData({ name: "", contact_email: "", active: true });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        name: formData.name,
        contact_email: formData.contact_email || null,
        active: formData.active
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Departments</h1>
          <p className="text-muted-foreground mt-1">Manage organizational units.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl font-semibold shadow-md"
        >
          <Plus className="w-5 h-5" />
          Add Dept
        </button>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-border text-sm font-semibold text-muted-foreground tracking-wide">
              <th className="p-4">Name</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {departments.map(d => (
              <tr key={d.id} className="hover:bg-slate-50/80">
                <td className="p-4 font-medium text-foreground">{d.name}</td>
                <td className="p-4 text-sm text-muted-foreground">{d.contact_email || '-'}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${d.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}
                  >
                    {d.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xl font-display font-bold">Create Department</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Contact Email (Optional)</label>
                <input type="email" value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
