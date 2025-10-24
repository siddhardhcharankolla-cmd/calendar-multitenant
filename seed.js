const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid"); // Import the UUID generator

// Hardcoded connection string
const DATABASE_URL = "postgres://postgres:StrongNewPassword!234@localhost:5432/calendar_db";
const pool = new Pool({ connectionString: DATABASE_URL });

// These are the new credentials we will create
const NEW_ORG_EMAIL = "admin@acme.com";
const NEW_USER_EMAIL = "user@acme.com";
const NEW_SYSTEM_ADMIN_EMAIL = "admin@system.com";
const NEW_PASSWORD = "password123";

async function main() {
  const client = await pool.connect();
  try {
    console.log("Starting database seeding...");
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

    // 1. Create Organization
    const ORG_ID = uuidv4();
    console.log(`Creating organization ACME Corp with ID: ${ORG_ID}`);
    await client.query(
      `INSERT INTO Organizations (id, name, slug) 
       VALUES ($1, 'ACME Corp', 'acme-corp') ON CONFLICT (id) DO NOTHING`,
      [ORG_ID]
    );

    // 2. Create Users
    console.log("Creating users...");
    // org_admin
    await client.query(
      `INSERT INTO Users (id, org_id, email, password_hash, role) 
       VALUES (gen_random_uuid(), $1, $2, $3, 'org_admin') 
       ON CONFLICT (email) DO NOTHING`,
      [ORG_ID, NEW_ORG_EMAIL, hashedPassword]
    );
    // org_user
    await client.query(
      `INSERT INTO Users (id, org_id, email, password_hash, role) 
       VALUES (gen_random_uuid(), $1, $2, $3, 'org_user') 
       ON CONFLICT (email) DO NOTHING`,
      [ORG_ID, NEW_USER_EMAIL, hashedPassword]
    );
    // system_admin
    await client.query(
      `INSERT INTO Users (id, email, password_hash, role) 
       VALUES (gen_random_uuid(), $1, $2, 'system_admin') 
       ON CONFLICT (email) DO NOTHING`,
      [NEW_SYSTEM_ADMIN_EMAIL, hashedPassword]
    );
    console.log("--> Users created successfully.");

    // 3. Create Global Events
    console.log("Creating global events...");
    const newYear = await client.query(`INSERT INTO GlobalEvents (name, event_date, catalog, country) VALUES ('New Year''s Day', '2025-01-01', 'National Holidays', 'USA') ON CONFLICT (name, event_date) DO NOTHING RETURNING id`);
    const newYearId = newYear.rows[0]?.id || (await client.query("SELECT id FROM GlobalEvents WHERE name = 'New Year''s Day'")).rows[0].id;
    console.log("--> Global events created.");

    // 4. Create Org-Specific Event in 'events' table
    console.log("Creating Org-specific event...");
    await client.query(
      `INSERT INTO events (organization_id, title, description, start_date) 
       VALUES ($1, 'ACME Corp Q4 All-Hands', 'Quarterly meeting for all staff.', '2025-10-25 10:00:00-05')`,
      [ORG_ID]
    );
    console.log("--> Org event created.");

    // 5. Create Subscription
    console.log("Subscribing org to New Year's Day...");
    await client.query(`INSERT INTO EventSubscriptions (organization_id, global_event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [ORG_ID, newYearId]);
    console.log("--> Subscription created.");

    console.log("\nDatabase seeding complete! ✅");
    console.log("You can now log in with these credentials:");
    console.log(`- Org Admin:   ${NEW_ORG_EMAIL} / ${NEW_PASSWORD}`);
    console.log(`- Org User:    ${NEW_USER_EMAIL} / ${NEW_PASSWORD}`);
    console.log(`- System Admin: ${NEW_SYSTEM_ADMIN_EMAIL} / ${NEW_PASSWORD}`);

  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    await client.release();
    await pool.end();
  }
}
main();