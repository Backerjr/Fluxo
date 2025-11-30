/**
 * Seed script to populate the database with sample lead data
 * Run with: tsx server/seed-leads.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import { leads } from "../drizzle/schema.js";

const mockLeadsData = [
  {
    name: "Elena Fisher",
    firstName: "Elena",
    lastName: "Fisher",
    title: "VP of Product",
    company: "Stripe",
    companyLogo: "https://logo.clearbit.com/stripe.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    status: "enriched",
    confidence: 98,
    email: "elena.fisher@stripe.com",
    phone: "+1 (415) 555-0123",
    linkedin: "linkedin.com/in/elenafisher",
    location: "San Francisco, CA",
    techStack: JSON.stringify(["React", "Ruby on Rails", "AWS", "Linear"]),
    aiInsight: "Elena recently posted about API infrastructure scaling. She is actively hiring for product roles.",
    mutualConnection: "Sarah Jenkins",
    userId: 1
  },
  {
    name: "David Chen",
    firstName: "David",
    lastName: "Chen",
    title: "Head of Engineering",
    company: "Vercel",
    companyLogo: "https://logo.clearbit.com/vercel.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    status: "enriched",
    confidence: 94,
    email: "david@vercel.com",
    linkedin: "linkedin.com/in/davidchen",
    location: "Remote",
    techStack: JSON.stringify(["Next.js", "Turbo", "Edge Functions"]),
    aiInsight: "Frequent speaker at Next.js Conf. Recently published a blog post on edge computing performance.",
    mutualConnection: "Guillermo Rauch",
    userId: 1
  },
  {
    name: "Sarah Miller",
    firstName: "Sarah",
    lastName: "Miller",
    title: "Chief Revenue Officer",
    company: "Linear",
    companyLogo: "https://logo.clearbit.com/linear.app",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces",
    status: "processing",
    confidence: 45,
    location: "New York, NY",
    userId: 1
  },
  {
    name: "James Wilson",
    firstName: "James",
    lastName: "Wilson",
    title: "Founder",
    company: "Unknown Stealth",
    companyLogo: "",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces",
    status: "failed",
    confidence: 12,
    aiInsight: "Company website appears to be down or parked. No recent LinkedIn activity found.",
    userId: 1
  },
  {
    name: "Michael Chang",
    firstName: "Michael",
    lastName: "Chang",
    title: "Director of Sales",
    company: "Retool",
    companyLogo: "https://logo.clearbit.com/retool.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
    status: "enriched",
    confidence: 88,
    email: "michael@retool.com",
    linkedin: "linkedin.com/in/mchang",
    location: "San Francisco, CA",
    techStack: JSON.stringify(["Retool", "Postgres", "Salesforce"]),
    aiInsight: "Recently promoted from Senior Manager. Hiring for 3 AE roles.",
    userId: 1
  },
  {
    name: "Amanda Torres",
    firstName: "Amanda",
    lastName: "Torres",
    title: "CTO",
    company: "Supabase",
    companyLogo: "https://logo.clearbit.com/supabase.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces",
    status: "enriched",
    confidence: 96,
    email: "amanda@supabase.io",
    linkedin: "linkedin.com/in/amandatorres",
    location: "Singapore",
    techStack: JSON.stringify(["Postgres", "Elixir", "Go"]),
    aiInsight: "Active contributor to open source Postgres extensions.",
    userId: 1
  },
  {
    name: "Robert Fox",
    firstName: "Robert",
    lastName: "Fox",
    title: "VP Marketing",
    company: "Figma",
    companyLogo: "https://logo.clearbit.com/figma.com",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces",
    status: "pending",
    confidence: 0,
    userId: 1
  },
  {
    name: "Lisa Wong",
    firstName: "Lisa",
    lastName: "Wong",
    title: "Product Designer",
    company: "Airbnb",
    companyLogo: "https://logo.clearbit.com/airbnb.com",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=faces",
    status: "enriched",
    confidence: 92,
    email: "lisa.wong@airbnb.com",
    linkedin: "linkedin.com/in/lisawongdesign",
    location: "Los Angeles, CA",
    aiInsight: "Portfolio features extensive work on design systems.",
    userId: 1
  }
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  console.log("🌱 Seeding database with sample leads...");

  const db = drizzle(process.env.DATABASE_URL);

  try {
    // Insert all mock leads
    for (const lead of mockLeadsData) {
      await db.insert(leads).values(lead);
      console.log(`✓ Added lead: ${lead.name} at ${lead.company}`);
    }

    console.log("\n✅ Database seeded successfully!");
    console.log(`📊 Total leads added: ${mockLeadsData.length}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
