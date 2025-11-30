import { eq } from "drizzle-orm";
import { InsertLead, leads } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Get all leads for a specific user
 */
export async function getUserLeads(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get leads: database not available");
    return [];
  }

  const result = await db.select().from(leads).where(eq(leads.userId, userId));
  
  // Parse techStack JSON
  return result.map(lead => ({
    ...lead,
    techStack: lead.techStack ? JSON.parse(lead.techStack) : null
  }));
}

/**
 * Get a single lead by ID (with user ownership check)
 */
export async function getLeadById(leadId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get lead: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  if (result.length === 0 || result[0]!.userId !== userId) {
    return undefined;
  }

  const lead = result[0]!;
  return {
    ...lead,
    techStack: lead.techStack ? JSON.parse(lead.techStack) : null
  };
}

/**
 * Create a new lead
 */
export async function createLead(lead: Omit<InsertLead, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create lead: database not available");
    throw new Error("Database not available");
  }

  // Serialize techStack if it's an array
  const leadData = {
    ...lead,
    techStack: lead.techStack ? JSON.stringify(lead.techStack) : null
  };

  const result = await db.insert(leads).values(leadData as InsertLead);
  return result;
}

/**
 * Update an existing lead
 */
export async function updateLead(
  leadId: number,
  userId: number,
  updates: Partial<Omit<InsertLead, "id" | "userId" | "createdAt">>
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update lead: database not available");
    throw new Error("Database not available");
  }

  // First verify ownership
  const existing = await getLeadById(leadId, userId);
  if (!existing) {
    throw new Error("Lead not found or access denied");
  }

  // Serialize techStack if provided
  const updateData = {
    ...updates,
    techStack: updates.techStack ? JSON.stringify(updates.techStack) : undefined
  };

  await db
    .update(leads)
    .set(updateData as any)
    .where(eq(leads.id, leadId));

  return getLeadById(leadId, userId);
}

/**
 * Delete a lead
 */
export async function deleteLead(leadId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete lead: database not available");
    throw new Error("Database not available");
  }

  // First verify ownership
  const existing = await getLeadById(leadId, userId);
  if (!existing) {
    throw new Error("Lead not found or access denied");
  }

  await db.delete(leads).where(eq(leads.id, leadId));
  return { success: true };
}
