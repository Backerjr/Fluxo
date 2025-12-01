import { useAuth } from "@/_core/hooks/useAuth";
import LeadDetailPanel from "@/components/LeadDetailPanel";
import LeadTable from "@/components/LeadTable";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Lead } from "@shared/types";
import { Filter, Loader2, Plus, UploadCloud } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "enriched" | "processing" | "failed">("all");

  // Fetch leads from database
  const { data: allLeads, isLoading } = trpc.leads.list.useQuery();

  // Filter leads based on active tab
  const filteredLeads = ((allLeads || []) as Lead[]).filter((lead) => {
    if (activeTab === "all") return true;
    return lead.status === activeTab;
  });

  return (
    <div className="container max-w-[1600px] py-4 lg:py-8 space-y-4 lg:space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Enrichment Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor your AI-driven lead enrichment pipelines.
          </p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <Button variant="outline" className="gap-2" size="sm">
            <UploadCloud className="h-4 w-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </Button>
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" size="sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add New Lead</span>
          </Button>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center p-1 bg-muted/50 rounded-lg border border-border/50 w-full sm:w-auto overflow-x-auto">
          {(["all", "enriched", "processing", "failed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 lg:px-4 py-1.5 text-xs lg:text-sm font-medium rounded-md transition-all duration-200 capitalize whitespace-nowrap",
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <LeadTable leads={filteredLeads} onLeadClick={setSelectedLead} />

      {/* Detail Panel Overlay */}
      <LeadDetailPanel
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </div>
  );
}
