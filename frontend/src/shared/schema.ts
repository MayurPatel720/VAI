import { sql } from "drizzle-orm";
import {
	index,
	jsonb,
	pgTable,
	text,
	varchar,
	timestamp,
	boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
	"sessions",
	{
		sid: varchar("sid").primaryKey(),
		sess: jsonb("sess").notNull(),
		expire: timestamp("expire").notNull(),
	},
	(table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
	id: varchar("id")
		.primaryKey()
		.default(sql`gen_random_uuid()`),
	email: varchar("email").unique(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	profileImageUrl: varchar("profile_image_url"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const upsertUserSchema = createInsertSchema(users).pick({
	id: true,
	email: true,
	firstName: true,
	lastName: true,
	profileImageUrl: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
	id: varchar("id")
		.primaryKey()
		.default(sql`gen_random_uuid()`),
	userId: varchar("user_id")
		.notNull()
		.references(() => users.id),
	plan: varchar("plan").notNull(), // free, silver, gold, premium
	status: varchar("status").notNull().default("active"), // active, cancelled, expired
	razorpayOrderId: varchar("razorpay_order_id"),
	razorpayPaymentId: varchar("razorpay_payment_id"),
	razorpaySubscriptionId: varchar("razorpay_subscription_id"),
	startDate: timestamp("start_date").defaultNow(),
	endDate: timestamp("end_date"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
	id: varchar("id")
		.primaryKey()
		.default(sql`gen_random_uuid()`),
	userId: varchar("user_id")
		.notNull()
		.references(() => users.id),
	message: text("message").notNull(),
	isBot: boolean("is_bot").notNull(),
	timestamp: timestamp("timestamp").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
	id: true,
	timestamp: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	subscriptions: many(subscriptions),
	chatMessages: many(chatMessages),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
	user: one(users, {
		fields: [subscriptions.userId],
		references: [users.id],
	}),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
	user: one(users, {
		fields: [chatMessages.userId],
		references: [users.id],
	}),
}));
