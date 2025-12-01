export interface Lead {
  id: number;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  company: string;
  companyLogo?: string | null;
  avatar?: string | null;
  status: "enriched" | "processing" | "failed" | "pending";
  confidence: number;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  location?: string | null;
  techStack?: string[] | null;
  aiInsight?: string | null;
  mutualConnection?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  userId?: number;
  lastUpdated?: string; // Computed field for UI
}

export const mockLeads: Lead[] = [
  {
    id: 1,
    name: "Elena Fisher",
    title: "VP of Product",
    company: "Stripe",
    companyLogo: "https://logo.clearbit.com/stripe.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    status: "enriched",
    confidence: 98,
    lastUpdated: "2m ago",
    email: "elena.fisher@stripe.com",
    phone: "+1 (415) 555-0123",
    linkedin: "linkedin.com/in/elenafisher",
    location: "San Francisco, CA",
    techStack: ["React", "Ruby on Rails", "AWS", "Linear"],
    aiInsight: "Elena recently posted about API infrastructure scaling. She is actively hiring for product roles.",
    mutualConnection: "Sarah Jenkins"
  },
  {
    id: 2,
    name: "David Chen",
    title: "Head of Engineering",
    company: "Vercel",
    companyLogo: "https://logo.clearbit.com/vercel.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    status: "enriched",
    confidence: 94,
    lastUpdated: "5m ago",
    email: "david@vercel.com",
    linkedin: "linkedin.com/in/davidchen",
    location: "Remote",
    techStack: ["Next.js", "Turbo", "Edge Functions"],
    aiInsight: "Frequent speaker at Next.js Conf. Recently published a blog post on edge computing performance.",
    mutualConnection: "Guillermo Rauch"
  },
  {
    id: 3,
    name: "Sarah Miller",
    title: "Chief Revenue Officer",
    company: "Linear",
    companyLogo: "https://logo.clearbit.com/linear.app",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces",
    status: "processing",
    confidence: 45,
    lastUpdated: "Just now",
    location: "New York, NY"
  },
  {
    id: 4,
    name: "James Wilson",
    title: "Founder",
    company: "Unknown Stealth",
    companyLogo: "",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces",
    status: "failed",
    confidence: 12,
    lastUpdated: "1h ago",
    aiInsight: "Company website appears to be down or parked. No recent LinkedIn activity found."
  },
  {
    id: 5,
    name: "Michael Chang",
    title: "Director of Sales",
    company: "Retool",
    companyLogo: "https://logo.clearbit.com/retool.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
    status: "enriched",
    confidence: 88,
    lastUpdated: "15m ago",
    email: "michael@retool.com",
    linkedin: "linkedin.com/in/mchang",
    location: "San Francisco, CA",
    techStack: ["Retool", "Postgres", "Salesforce"],
    aiInsight: "Recently promoted from Senior Manager. Hiring for 3 AE roles."
  },
  {
    id: 6,
    name: "Amanda Torres",
    title: "CTO",
    company: "Supabase",
    companyLogo: "https://logo.clearbit.com/supabase.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces",
    status: "enriched",
    confidence: 96,
    lastUpdated: "22m ago",
    email: "amanda@supabase.io",
    linkedin: "linkedin.com/in/amandatorres",
    location: "Singapore",
    techStack: ["Postgres", "Elixir", "Go"],
    aiInsight: "Active contributor to open source Postgres extensions."
  },
  {
    id: 7,
    name: "Robert Fox",
    title: "VP Marketing",
    company: "Figma",
    companyLogo: "https://logo.clearbit.com/figma.com",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces",
    status: "pending",
    confidence: 0,
    lastUpdated: "Queued"
  },
  {
    id: 8,
    name: "Lisa Wong",
    title: "Product Designer",
    company: "Airbnb",
    companyLogo: "https://logo.clearbit.com/airbnb.com",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=faces",
    status: "enriched",
    confidence: 92,
    lastUpdated: "45m ago",
    email: "lisa.wong@airbnb.com",
    linkedin: "linkedin.com/in/lisawongdesign",
    location: "Los Angeles, CA",
    aiInsight: "Portfolio features extensive work on design systems."
  }
];
