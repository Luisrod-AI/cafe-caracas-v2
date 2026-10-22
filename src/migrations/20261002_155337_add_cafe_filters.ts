import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`cafes\` RENAME COLUMN "amenities_coworking" TO "amenities_work";`)
  await db.run(sql`ALTER TABLE \`cafes\` ADD \`amenities_specialty_coffee\` text DEFAULT 'unknown';`)
  await db.run(sql`ALTER TABLE \`cafes\` ADD \`amenities_outdoor\` text DEFAULT 'unknown';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`cafes\` RENAME COLUMN "amenities_work" TO "amenities_coworking";`,
  )

  await db.run(
    sql`ALTER TABLE \`cafes\` DROP COLUMN \`amenities_specialty_coffee\`;`,
  )

  await db.run(
    sql`ALTER TABLE \`cafes\` DROP COLUMN \`amenities_outdoor\`;`,
  )
}