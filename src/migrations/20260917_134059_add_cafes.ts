import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`cafes_zones\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`cafes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`cafes_zones_order_idx\` ON \`cafes_zones\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`cafes_zones_parent_idx\` ON \`cafes_zones\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`cafes_other_locations\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`cafes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`cafes_other_locations_order_idx\` ON \`cafes_other_locations\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`cafes_other_locations_parent_id_idx\` ON \`cafes_other_locations\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`cafes_research_sources\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`type\` text,
  	\`url\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`cafes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`cafes_research_sources_order_idx\` ON \`cafes_research_sources\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`cafes_research_sources_parent_id_idx\` ON \`cafes_research_sources\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`cafes\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`generate_slug\` integer DEFAULT true,
  	\`slug\` text NOT NULL,
  	\`rate\` numeric,
  	\`cost\` text,
  	\`status\` text,
  	\`category\` text,
  	\`notes\` text,
  	\`brand\` text,
  	\`branch\` text,
  	\`zone\` text,
  	\`municipality\` text,
  	\`neighborhood\` text,
  	\`latitude\` numeric,
  	\`longitude\` numeric,
  	\`coordinate_accuracy\` text,
  	\`coordinate_source\` text,
  	\`image_id\` integer,
  	\`image_url\` text,
  	\`image_type\` text,
  	\`image_verified\` integer,
  	\`hours_monday_open\` text,
  	\`hours_monday_close\` text,
  	\`hours_tuesday_open\` text,
  	\`hours_tuesday_close\` text,
  	\`hours_wednesday_open\` text,
  	\`hours_wednesday_close\` text,
  	\`hours_thursday_open\` text,
  	\`hours_thursday_close\` text,
  	\`hours_friday_open\` text,
  	\`hours_friday_close\` text,
  	\`hours_saturday_open\` text,
  	\`hours_saturday_close\` text,
  	\`hours_sunday_open\` text,
  	\`hours_sunday_close\` text,
  	\`hours_source\` text,
  	\`hours_verified\` text,
  	\`amenities_wifi\` text DEFAULT 'unknown',
  	\`amenities_coworking\` text DEFAULT 'unknown',
  	\`amenities_cozy\` text DEFAULT 'unknown',
  	\`amenities_terrace\` text DEFAULT 'unknown',
  	\`amenities_pet_friendly\` text DEFAULT 'unknown',
  	\`amenities_parking\` text DEFAULT 'unknown',
  	\`amenities_brunch\` text DEFAULT 'unknown',
  	\`amenities_sightseeing\` text DEFAULT 'unknown',
  	\`link\` text,
  	\`location\` text,
  	\`website\` text,
  	\`instagram\` text,
  	\`source_url\` text,
  	\`source_type\` text,
  	\`research_verified_at\` text,
  	\`research_confidence\` text,
  	\`filter_ready_zone\` integer,
  	\`filter_ready_municipality\` integer,
  	\`filter_ready_coordinates\` integer,
  	\`filter_ready_hours\` integer,
  	\`filter_ready_amenities\` integer,
  	\`filter_ready_price\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`cafes_name_idx\` ON \`cafes\` (\`name\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`cafes_slug_idx\` ON \`cafes\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`cafes_image_idx\` ON \`cafes\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`cafes_updated_at_idx\` ON \`cafes\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`cafes_created_at_idx\` ON \`cafes\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`cafes_id\` integer REFERENCES cafes(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_cafes_id_idx\` ON \`payload_locked_documents_rels\` (\`cafes_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`cafes_zones\`;`)
  await db.run(sql`DROP TABLE \`cafes_other_locations\`;`)
  await db.run(sql`DROP TABLE \`cafes_research_sources\`;`)
  await db.run(sql`DROP TABLE \`cafes\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`pages_id\` integer,
  	\`categories_id\` integer,
  	\`media_id\` integer,
  	\`forms_id\` integer,
  	\`form_submissions_id\` integer,
  	\`addresses_id\` integer,
  	\`variants_id\` integer,
  	\`variant_types_id\` integer,
  	\`variant_options_id\` integer,
  	\`products_id\` integer,
  	\`carts_id\` integer,
  	\`orders_id\` integer,
  	\`transactions_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`forms_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`addresses_id\`) REFERENCES \`addresses\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`variants_id\`) REFERENCES \`variants\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`variant_types_id\`) REFERENCES \`variant_types\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`variant_options_id\`) REFERENCES \`variant_options\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`carts_id\`) REFERENCES \`carts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`orders_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`transactions_id\`) REFERENCES \`transactions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "pages_id", "categories_id", "media_id", "forms_id", "form_submissions_id", "addresses_id", "variants_id", "variant_types_id", "variant_options_id", "products_id", "carts_id", "orders_id", "transactions_id") SELECT "id", "order", "parent_id", "path", "users_id", "pages_id", "categories_id", "media_id", "forms_id", "form_submissions_id", "addresses_id", "variants_id", "variant_types_id", "variant_options_id", "products_id", "carts_id", "orders_id", "transactions_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_forms_id_idx\` ON \`payload_locked_documents_rels\` (\`forms_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_addresses_id_idx\` ON \`payload_locked_documents_rels\` (\`addresses_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_variants_id_idx\` ON \`payload_locked_documents_rels\` (\`variants_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_variant_types_id_idx\` ON \`payload_locked_documents_rels\` (\`variant_types_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_variant_options_id_idx\` ON \`payload_locked_documents_rels\` (\`variant_options_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_products_id_idx\` ON \`payload_locked_documents_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_carts_id_idx\` ON \`payload_locked_documents_rels\` (\`carts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_orders_id_idx\` ON \`payload_locked_documents_rels\` (\`orders_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_transactions_id_idx\` ON \`payload_locked_documents_rels\` (\`transactions_id\`);`)
}
