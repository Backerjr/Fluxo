import { cn } from "@/lib/utils";
import { Lead } from "@shared/types";
import {
  Briefcase,
  Building2,
  Copy,
  ExternalLink,
  Github,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Twitter,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

interface LeadDetailPanelProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

function CopyButton({ text, label }: { text?: string | null; label: string }) {
  if (!text) return null;
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={() => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard`);
      }}
    >
      <Copy className="h-3 w-3 text-muted-foreground" />
    </Button>
  );
}

export default function LeadDetailPanel({ lead, isOpen, onClose }: LeadDetailPanelProps) {
  if (!lead) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 w-full lg:w-[480px] bg-card border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 lg:p-6 border-b border-border/50">
          <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
            <Avatar className="h-12 w-12 lg:h-16 lg:w-16 border-2 border-border shadow-sm flex-shrink-0">
              <AvatarImage src={lead.avatar ?? undefined} />
              <AvatarFallback className="text-base lg:text-lg">{lead.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg lg:text-xl font-semibold text-foreground truncate">{lead.name}</h2>
              <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm">
                <Briefcase className="h-3 w-3 lg:h-3.5 lg:w-3.5 flex-shrink-0" />
                <span className="text-sm">{lead.title}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                <Building2 className="h-3.5 w-3.5" />
                <span className="text-sm">{lead.company}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full flex-shrink-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 lg:p-6 space-y-6 lg:space-y-8">
            {/* AI Insights Block - The "Hero" Feature */}
            <div className="relative overflow-hidden rounded-xl border border-chart-1/20 bg-gradient-to-br from-chart-1/5 to-transparent p-4 lg:p-5">
              <div className="absolute top-0 right-0 p-3 opacity-20">
                <Sparkles className="h-24 w-24 text-chart-1" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-chart-1" />
                  <span className="text-xs font-bold uppercase tracking-wider text-chart-1">Gemini Intelligence</span>
                </div>
                
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {lead.aiInsight || "AI is analyzing this profile to generate insights..."}
                </p>
                
                {lead.mutualConnection && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-background/50 p-2 rounded-lg border border-border/50 w-fit">
                    <UsersIcon className="h-3.5 w-3.5" />
                    <span>Mutual Connection: <span className="font-medium text-foreground">{lead.mutualConnection}</span></span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contact Details</h3>
              <div className="grid gap-3">
                <div className="group flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Email Address</span>
                      <span className="text-sm font-medium">{lead.email ?? "Not available"}</span>
                    </div>
                  </div>
                  <CopyButton text={lead.email} label="email" />
                </div>

                <div className="group flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-green-500/10 flex items-center justify-center text-green-500">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Phone Number</span>
                      <span className="text-sm font-medium">{lead.phone ?? "Not available"}</span>
                    </div>
                  </div>
                  <CopyButton text={lead.phone} label="phone" />
                </div>

                <div className="group flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Location</span>
                      <span className="text-sm font-medium">{lead.location ?? "Unknown"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Profiles */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Digital Footprint</h3>
              <div className="flex gap-3">
                {lead.linkedin && (
                  <Button variant="outline" className="flex-1 gap-2 h-10">
                    <Linkedin className="h-4 w-4 text-[#0077b5]" />
                    LinkedIn
                  </Button>
                )}
                <Button variant="outline" className="flex-1 gap-2 h-10">
                  <Twitter className="h-4 w-4 text-[#1da1f2]" />
                  Twitter
                </Button>
                <Button variant="outline" className="flex-1 gap-2 h-10">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Website
                </Button>
              </div>
            </div>

            {/* Tech Stack */}
            {lead.techStack && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {lead.techStack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="px-3 py-1 text-xs font-medium bg-secondary/50 hover:bg-secondary border-border/50">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border/50 bg-muted/10">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full">
              Archive Lead
            </Button>
            <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Mail className="h-4 w-4" />
              Draft Outreach
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
