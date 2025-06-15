import { sql } from "drizzle-orm";
import { pgTable, serial, integer, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export async function up(db: any) {
  await db.schema.createTable("notifications")
    .addColumn("id", "serial", (col: any) => col.primaryKey())
    .addColumn("user_id", "integer", (col: any) => 
      col.notNull().references("users.id").onDelete("cascade")
    )
    .addColumn("type", "text", (col: any) => 
      col.notNull().check(sql`type IN ('payment', 'user', 'system', 'audio')`)
    )
    .addColumn("title", "text", (col: any) => col.notNull())
    .addColumn("message", "text", (col: any) => col.notNull())
    .addColumn("is_read", "boolean", (col: any) => col.notNull().default(false))
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamp", (col: any) => 
      col.notNull().default(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("updated_at", "timestamp", (col: any) => 
      col.notNull().default(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  // Create index on user_id for faster queries
  await db.schema.createIndex("notifications_user_id_idx")
    .on("notifications")
    .column("user_id")
    .execute();

  // Create index on is_read and user_id for faster unread queries
  await db.schema.createIndex("notifications_is_read_user_id_idx")
    .on("notifications")
    .columns(["is_read", "user_id"])
    .execute();
}

export async function down(db: any) {
  await db.schema.dropTable("notifications").execute();
} 