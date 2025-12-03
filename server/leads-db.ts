import { eq } from "drizzle-orm";
import { InsertLead, leads } from "./db/schema";
import { getDb } from "./db";

type InMemoryLead = Omit<InsertLead, "id"> & {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  techStack: string | null;
};

const inMemoryLeadTemplates: Array<
  Omit<InMemoryLead, "id" | "userId" | "createdAt" | "updatedAt">
> = [
  {
    name: "Elena Fisher",
    firstName: "Elena",
    lastName: "Fisher",
    title: "VP of Product",
    company: "Stripe",
    status: "enriched",
    confidence: 98,
    techStack: JSON.stringify(["React", "TypeScript", "AWS"]),
    email: "elena.fisher@stripe.com",
    linkedin: "linkedin.com/in/elenafisher",
    aiInsight: "Product leader focused on scale",
    mutualConnection: "Sarah Jenkins",
  },
  {
    name: "David Chen",
    firstName: "David",
    lastName: "Chen",
    title: "Head of Engineering",
    company: "Vercel",
    status: "enriched",
    confidence: 94,
    techStack: JSON.stringify(["Next.js", "Edge Functions"]),
    email: "david@vercel.com",
    linkedin: "linkedin.com/in/davidchen",
    aiInsight: "Talks about edge performance",
    mutualConnection: "Guillermo Rauch",
  },
  {
    name: "Sarah Miller",
    firstName: "Sarah",
    lastName: "Miller",
    title: "Chief Revenue Officer",
    company: "Linear",
    status: "processing",
    confidence: 45,
    techStack: JSON.stringify(["Linear", "Postgres"]),
    email: "sarah@linear.app",
  },
];

let inMemoryLeads: InMemoryLead[] = [];

function parseTechStack(
  value: string | string[] | null | undefined
): string[] | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function serializeTechStack(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  return null;
}

function normalizeLead(lead: InMemoryLead) {
  return {
    ...lead,
    techStack: parseTechStack(lead.techStack),
  };
}

function nextInMemoryId() {
  return (
    inMemoryLeads.reduce((max, lead) => Math.max(max, lead.id), 0) + 1
  );
}

function seedInMemoryLeads(userId: number) {
  if (inMemoryLeads.some(lead => lead.userId === userId)) {
    return;
  }

  const now = new Date();
  const startId = nextInMemoryId();
  inMemoryLeads.push(
    ...inMemoryLeadTemplates.map((template, index) => ({
      ...template,
      id: startId + index,
      userId,
      createdAt: now,
      updatedAt: now,
    }))
  );
}

/**
 * Get all leads for a specific user
 */
export async function getUserLeads(userId: number) {
  const db = await getDb();
  if (!db) {
    seedInMemoryLeads(userId);
    return inMemoryLeads
      .filter(lead => lead.userId === userId)
      .map(normalizeLead);
  }

  const result = await db.select().from(leads).where(eq(leads.userId, userId));
  
  // Parse techStack JSON
  return result.map(lead => ({
    ...lead,
    techStack: parseTechStack(lead.techStack)
  }));
}

/**
 * Get a single lead by ID (with user ownership check)
 */
export async function getLeadById(leadId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    seedInMemoryLeads(userId);
    const lead = inMemoryLeads.find(
      item => item.id === leadId && item.userId === userId
    );
    return lead ? normalizeLead(lead) : undefined;
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
    techStack: parseTechStack(lead.techStack)
  };
}

/**
 * Create a new lead
 */
export async function createLead(lead: Omit<InsertLead, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) {
    seedInMemoryLeads(lead.userId);
    const now = new Date();
    const newLead: InMemoryLead = {
      ...lead,
      id: nextInMemoryId(),
      status: lead.status ?? "pending",
      confidence: lead.confidence ?? 0,
      techStack: serializeTechStack(lead.techStack),
      createdAt: now,
      updatedAt: now,
    };

    inMemoryLeads.push(newLead);
    return normalizeLead(newLead);
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
    seedInMemoryLeads(userId);
    const index = inMemoryLeads.findIndex(
      lead => lead.id === leadId && lead.userId === userId
    );

    if (index === -1) {
      throw new Error("Lead not found or access denied");
    }

    const now = new Date();
    const existing = inMemoryLeads[index];
    const updatedLead: InMemoryLead = {
      ...existing,
      ...updates,
      techStack:
        updates.techStack !== undefined
          ? serializeTechStack(updates.techStack)
          : existing.techStack,
      updatedAt: now,
    };

    inMemoryLeads[index] = updatedLead;
    return normalizeLead(updatedLead);
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
    seedInMemoryLeads(userId);
    const index = inMemoryLeads.findIndex(
      lead => lead.id === leadId && lead.userId === userId
    );

    if (index === -1) {
      throw new Error("Lead not found or access denied");
    }

    inMemoryLeads.splice(index, 1);
    return { success: true };
  }

  // First verify ownership
  const existing = await getLeadById(leadId, userId);
  if (!existing) {
    throw new Error("Lead not found or access denied");
  }

  await db.delete(leads).where(eq(leads.id, leadId));
  return { success: true };
}
