import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MoreHorizontal,
  Trash2,
  Zap
} from "lucide-react";
import { useState } from "react";
import { Lead } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Progress } from "./ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface LeadTableProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

function StatusPill({ status }: { status: Lead["status"] }) {
  switch (status) {
    case "enriched":
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-chart-3/10 text-chart-3 text-xs font-medium border border-chart-3/20">
          <CheckCircle2 className="h-3 w-3" />
          <span>Enriched</span>
        </div>
      );
    case "processing":
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-chart-1/10 text-chart-1 text-xs font-medium border border-chart-1/20">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Processing</span>
        </div>
      );
    case "failed":
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
          <AlertCircle className="h-3 w-3" />
          <span>Failed</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
          <Clock className="h-3 w-3" />
          <span>Pending</span>
        </div>
      );
  }
}

function ConfidenceRing({ score }: { score: number }) {
  // Calculate color based on score
  let colorClass = "text-muted-foreground";
  if (score >= 90) colorClass = "text-chart-3"; // Green
  else if (score >= 70) colorClass = "text-chart-2"; // Amber
  else if (score > 0) colorClass = "text-chart-4"; // Red

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-8 w-8 flex items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
          {/* Background Ring */}
          <path
            className="text-muted/20"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          {/* Progress Ring */}
          <path
            className={cn("transition-all duration-1000 ease-out", colorClass)}
            strokeDasharray={`${score}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[10px] font-medium">{score}</span>
      </div>
    </div>
  );
}

export default function LeadTable({ leads, onLeadClick }: LeadTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      {/* Table Header */}
      <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_1fr_50px] gap-4 px-6 py-3 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <div>Name</div>
        <div>Company</div>
        <div>Title</div>
        <div>Status</div>
        <div>Confidence</div>
        <div>Updated</div>
        <div></div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border/50">
        {leads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => onLeadClick(lead)}
            className="group grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_1fr_50px] gap-4 px-6 py-3 items-center hover:bg-muted/50 cursor-pointer transition-all duration-200 relative"
          >
            {/* Hover Lift Effect */}
            <div className="absolute inset-0 border-l-2 border-transparent group-hover:border-primary transition-colors" />

            {/* Name Column */}
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border border-border/50">
                <AvatarImage src={lead.avatar ?? undefined} />
                <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {lead.name}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {lead.email || "No email found"}
                </span>
              </div>
            </div>

            {/* Company Column */}
            <div className="flex items-center gap-2">
              {lead.companyLogo ? (
                <img
                  src={lead.companyLogo}
                  alt={lead.company}
                  className="h-5 w-5 rounded-sm object-contain opacity-80"
                />
              ) : (
                <div className="h-5 w-5 rounded-sm bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                  {lead.company.charAt(0)}
                </div>
              )}
              <span className="text-sm text-foreground/90 truncate">
                {lead.company}
              </span>
            </div>

            {/* Title Column */}
            <div className="text-sm text-muted-foreground truncate">
              {lead.title}
            </div>

            {/* Status Column */}
            <div>
              <StatusPill status={lead.status} />
            </div>

            {/* Confidence Column */}
            <div>
              <ConfidenceRing score={lead.confidence} />
            </div>

            {/* Updated Column */}
            <div className="text-xs text-muted-foreground">
              {lead.lastUpdated}
            </div>

            {/* Actions Column */}
            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    <Zap className="mr-2 h-4 w-4" /> Enrich Now
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
