import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["student", "admin", "security"]);
export const exeatStatusEnum = pgEnum("exeat_status", [
  "pending",
  "approved",
  "rejected",
  "departed",
  "returned",
]);
export const exeatTypeEnum = pgEnum("exeat_type", [
  "regular",
  "emergency",
  "medical",
  "academic",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  role: roleEnum("role").notNull().default("student"),
  matric: varchar("matric", { length: 50 }),
  hostel: varchar("hostel", { length: 120 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const exeatRequests = pgTable(
  "exeat_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 20 }).notNull().unique(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    destination: text("destination").notNull(),
    reason: text("reason").notNull(),
    type: exeatTypeEnum("type").notNull().default("regular"),
    departDate: varchar("depart_date", { length: 20 }).notNull(),
    returnDate: varchar("return_date", { length: 20 }).notNull(),
    status: exeatStatusEnum("status").notNull().default("pending"),
    rejectReason: text("reject_reason"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_exeat_student").on(t.studentId),
    index("idx_exeat_status").on(t.status),
  ],
);

export type User = typeof users.$inferSelect;
export type ExeatRequest = typeof exeatRequests.$inferSelect;
