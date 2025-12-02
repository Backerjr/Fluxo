import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { clearSessionCookie, getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createLead, deleteLead, getLeadById, getUserLeads, updateLead } from "./leads-db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      clearSessionCookie(ctx.res, COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  leads: router({
    list: protectedProcedure
      .input(
        z.object({
          filter: z.string().optional().default(""),
        }).default({ filter: "" })
      )
      .query(async ({ ctx, input }) => {
        const allLeads = await getUserLeads(ctx.user.id);
        const normalizedFilter = (input.filter ?? "").trim().toLowerCase();

        if (!normalizedFilter) {
          return allLeads;
        }

        return allLeads.filter(lead => {
          const haystack = `${lead.name ?? ""} ${lead.company ?? ""}`.toLowerCase();
          return haystack.includes(normalizedFilter);
        });
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getLeadById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          title: z.string().optional(),
          company: z.string(),
          companyLogo: z.string().optional(),
          avatar: z.string().optional(),
          status: z.enum(["enriched", "processing", "failed", "pending"]).optional(),
          confidence: z.number().min(0).max(100).optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          linkedin: z.string().optional(),
          location: z.string().optional(),
          techStack: z.array(z.string()).optional(),
          aiInsight: z.string().optional(),
          mutualConnection: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createLead({
          ...input,
          userId: ctx.user.id,
        } as any);
      }),
    
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          title: z.string().optional(),
          company: z.string().optional(),
          companyLogo: z.string().optional(),
          avatar: z.string().optional(),
          status: z.enum(["enriched", "processing", "failed", "pending"]).optional(),
          confidence: z.number().min(0).max(100).optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          linkedin: z.string().optional(),
          location: z.string().optional(),
          techStack: z.array(z.string()).optional(),
          aiInsight: z.string().optional(),
          mutualConnection: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        return updateLead(id, ctx.user.id, updates as any);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteLead(input.id, ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
