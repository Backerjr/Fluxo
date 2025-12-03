import { integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const leadStatusEnum = pgEnum("status", ["enriched", "processing", "failed", "pending"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").notNull().default("user"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  firstName: varchar("firstName", { length: 128 }),
  lastName: varchar("lastName", { length: 128 }),
  title: varchar("title", { length: 255 }),
  company: varchar("company", { length: 255 }).notNull(),
  companyLogo: text("companyLogo"),
  avatar: text("avatar"),
  status: leadStatusEnum("status").notNull().default("pending"),
  confidence: integer("confidence").notNull().default(0),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  linkedin: text("linkedin"),
  location: varchar("location", { length: 255 }),
  techStack: text("techStack"),
  aiInsight: text("aiInsight"),
  mutualConnection: varchar("mutualConnection", { length: 255 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
