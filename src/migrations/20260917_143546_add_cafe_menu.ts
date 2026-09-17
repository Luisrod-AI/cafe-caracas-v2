import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`cafes_menu\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`price\` text,
  	\`currency\` text,
  	\`image_url\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`cafes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`cafes_menu_order_idx\` ON \`cafes_menu\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`cafes_menu_parent_id_idx\` ON \`cafes_menu\` (\`_parent_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`cafes_menu\`;`)
}
