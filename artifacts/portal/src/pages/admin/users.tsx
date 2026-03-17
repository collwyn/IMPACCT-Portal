import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListUsers, useCreateUser, useDeleteUser, useListDepartments, getListUsersQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { CreateUserBodyRole } from "@workspace/api-client-react";

export default function AdminUsers() {
  const { data: users = [] } = useListUsers();
  const { data: departments = [] } = useListDepartments();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: "staff" as CreateUserBodyRole, department_id: ""
  });

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "User created" });
        setIsModalOpen(false);
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setFormData({ name: "", email: "", password: "", role: "staff", department_id: "" });
      },
      onError: (err: any) => toast({ title: "Error", description: err.error, variant: "destructive" })
    }
  });

  const deleteMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "User deleted" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        ...formData,
        department_id: formData.department_id ? parseInt(formData.department_id) : null
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">Manage system access and roles.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl font-semibold shadow-md"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-border text-sm font-semibold text-muted-foreground tracking-wide">
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/80">
                <td className="p-4 font-medium text-foreground">{u.name}</td>
                <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                      u.role === 'department_head' ? 'bg-blue-100 text-blue-700' : 
                      'bg-slate-100 text-slate-700'}`}
                  >
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if(confirm("Are you sure you want to delete this user?")) {
                        deleteMutation.mutate({ id: u.id });
                      }
                    }}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
              <h2 className="text-xl font-display font-bold">Create User</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Role</label>
                  <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full px-3 py-2 rounded-lg border border-border">
                    <option value="staff">Staff</option>
                    <option value="department_head">Dept Head</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Department</label>
                  <select value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border">
                    <option value="">None</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
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
