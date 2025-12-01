/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

/**
 * Lead type with techStack parsed as array (as returned by API)
 */
export interface Lead {
  id: number;
  name: string;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  company: string;
  companyLogo: string | null;
  avatar: string | null;
  status: "enriched" | "processing" | "failed" | "pending";
  confidence: number;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  location: string | null;
  techStack: string[] | null; // Parsed from JSON
  aiInsight: string | null;
  mutualConnection: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
}
