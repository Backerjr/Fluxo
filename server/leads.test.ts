import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("leads API", () => {
  it("should list leads for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const leads = await caller.leads.list();

    expect(Array.isArray(leads)).toBe(true);
    expect(leads.length).toBeGreaterThan(0);
    
    // Verify lead structure
    const firstLead = leads[0];
    expect(firstLead).toHaveProperty("id");
    expect(firstLead).toHaveProperty("name");
    expect(firstLead).toHaveProperty("company");
    expect(firstLead).toHaveProperty("status");
    expect(firstLead).toHaveProperty("confidence");
  });

  it("should get a specific lead by ID", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First get all leads to find a valid ID
    const leads = await caller.leads.list();
    const firstLeadId = leads[0]?.id;

    if (!firstLeadId) {
      throw new Error("No leads found in database");
    }

    const lead = await caller.leads.getById({ id: firstLeadId });

    expect(lead).toBeDefined();
    expect(lead?.id).toBe(firstLeadId);
    expect(lead?.name).toBeDefined();
  });

  it("should create a new lead", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newLead = {
      name: "Test Lead",
      company: "Test Company",
      title: "Test Title",
      status: "pending" as const,
      confidence: 0,
    };

    const result = await caller.leads.create(newLead);

    expect(result).toBeDefined();
    
    // Verify the lead was created
    const leads = await caller.leads.list();
    const createdLead = leads.find(l => l.name === "Test Lead");
    expect(createdLead).toBeDefined();
    expect(createdLead?.company).toBe("Test Company");
  });

  it("should update an existing lead", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get a lead to update
    const leads = await caller.leads.list();
    const leadToUpdate = leads[0];

    if (!leadToUpdate) {
      throw new Error("No leads found in database");
    }

    const updatedLead = await caller.leads.update({
      id: leadToUpdate.id,
      confidence: 99,
      status: "enriched",
    });

    expect(updatedLead).toBeDefined();
    expect(updatedLead?.confidence).toBe(99);
    expect(updatedLead?.status).toBe("enriched");
  });

  it("should delete a lead", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a lead to delete
    await caller.leads.create({
      name: "Lead To Delete",
      company: "Delete Company",
    });

    // Find the created lead
    const leads = await caller.leads.list();
    const leadToDelete = leads.find(l => l.name === "Lead To Delete");

    if (!leadToDelete) {
      throw new Error("Could not find lead to delete");
    }

    const result = await caller.leads.delete({ id: leadToDelete.id });

    expect(result.success).toBe(true);

    // Verify it was deleted
    const remainingLeads = await caller.leads.list();
    const deletedLead = remainingLeads.find(l => l.id === leadToDelete.id);
    expect(deletedLead).toBeUndefined();
  });
});
