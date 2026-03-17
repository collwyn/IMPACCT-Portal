import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListResources, useListResourceCategories } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, Search, ExternalLink, Filter } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

const NAME_LOGO_OVERRIDES: Record<string, string> = {
  "canva for nonprofits": "/logos/canva.png",
  "mailchimp": "/logos/mailchimp.png",
  "google workspace (admin console)": "/logos/google.png",
  "fluxx grantee portal": "/logos/fluxx.png",
  "nyc hpd affordable housing connect": "/logos/nyc.png",
  "nyc small business services — business toolbox": "/logos/nyc.png",
};

function getRootDomain(url: string): string {
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  const parts = hostname.split(".");
  return parts.length > 2 ? parts.slice(-2).join(".") : hostname;
}

function getLogoUrl(url?: string | null, name?: string): string {
  const nameKey = (name || "").toLowerCase();
  if (NAME_LOGO_OVERRIDES[nameKey]) return NAME_LOGO_OVERRIDES[nameKey];

  if (url) {
    try {
      const rootDomain = getRootDomain(url);
      return `https://www.google.com/s2/favicons?domain=${rootDomain}&sz=256`;
    } catch {}
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name?.slice(0, 2) || "R")}&background=2E7D4F&color=ffffff&size=200&bold=true&font-size=0.45`;
}

export default function ResourcesList() {
  const { data: resources = [], isLoading: loadingRes } = useListResources();
  const { data: categories = [] } = useListResourceCategories();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = resources.filter(res => {
    const matchesSearch = res.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (res.description && res.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || res.category_id.toString() === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Resource Directory</h1>
          <p className="text-muted-foreground mt-1">Shared tools, links, and documents.</p>
        </div>
        <Link 
          href="/resources/new"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all w-max"
        >
          <Plus className="w-5 h-5" />
          Add Resource
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border/50 shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 bg-card border border-border/50 shadow-sm rounded-xl px-2">
          <Filter className="w-5 h-5 text-muted-foreground ml-2" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-transparent border-none py-3 pr-4 focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loadingRes ? (
        <div className="text-center py-12 text-muted-foreground">Loading resources...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(resource => (
            <div key={resource.id} className="bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all group flex flex-col overflow-hidden">
              {/* Logo — fills top half */}
              <div className="h-44 w-full bg-slate-50 flex items-center justify-center overflow-hidden border-b border-border/40 relative">
                <img
                  src={getLogoUrl(resource.url, resource.name)}
                  alt={`${resource.name} logo`}
                  className="w-full h-full object-contain p-6"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const initials = `https://ui-avatars.com/api/?name=${encodeURIComponent(resource.name.slice(0, 2))}&background=2E7D4F&color=ffffff&size=200&bold=true&font-size=0.45`;
                    if (resource.url && !target.src.includes("google.com/s2") && !target.src.includes("ui-avatars")) {
                      try {
                        const rootDomain = getRootDomain(resource.url);
                        target.src = `https://www.google.com/s2/favicons?domain=${rootDomain}&sz=256`;
                      } catch { target.src = initials; }
                    } else {
                      target.src = initials;
                    }
                  }}
                />
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                    {resource.category_name}
                  </span>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border
                    ${resource.access_level === 'everyone' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      resource.access_level === 'department' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-orange-50 text-orange-700 border-orange-200'}`}
                  >
                    {resource.access_level}
                  </span>
                </div>

                <h3 className="text-lg font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {resource.name}
                </h3>

                <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">
                  {resource.description || "No description provided."}
                </p>

                <div className="pt-4 border-t border-border/50 mt-auto flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {resource.cost && <span className="block font-medium text-foreground">Cost: {resource.cost}</span>}
                    {resource.renewal_date && <span>Renews: {format(new Date(resource.renewal_date), 'MMM yyyy')}</span>}
                  </div>
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Open
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card border border-border/50 rounded-2xl border-dashed">
              No resources match your search.
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
