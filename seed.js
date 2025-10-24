const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid"); 

// --- FIX: Import dotenv and remove hardcoded URL ---
require("dotenv").config({ path: ".env.local" }); 
const DATABASE_URL = process.env.DATABASE_URL; // Read from environment
// --- END FIX ---

if (!DATABASE_URL) {
    console.error("FATAL: DATABASE_URL is not set. Cannot run seed script.");
    process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  // Add SSL settings for Render
  ssl: { rejectUnauthorized: false }, 
});

// These are the new credentials we will create
const NEW_ORG_EMAIL = "admin@acme.com";
const NEW_USER_EMAIL = "user@acme.com";
const NEW_SYSTEM_ADMIN_EMAIL = "admin@system.com";
const NEW_PASSWORD = "password123";

async function main() {
  const client = await pool.connect();
  try {
    console.log("Starting database seeding on DEPLOYED DATABASE...");
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    const ORG_ID = uuidv4();
    
    // Ensure all users/data are created correctly

    // 1. Create Organization
    await client.query(
      `INSERT INTO Organizations (id, name, slug) 
       VALUES ($1, 'ACME Corp', 'acme-corp') ON CONFLICT (id) DO NOTHING`,
      [ORG_ID]
    );

    // 2. Create/Update Users 
    await client.query(`INSERT INTO Users (id, org_id, email, password_hash, role) VALUES (gen_random_uuid(), $1, $2, $3, 'org_admin') ON CONFLICT (email) DO UPDATE SET org_id = $1, password_hash = $3`, [ORG_ID, NEW_ORG_EMAIL, hashedPassword]);
    await client.query(`INSERT INTO Users (id, email, password_hash, role) VALUES (gen_random_uuid(), $1, $2, 'system_admin') ON CONFLICT (email) DO NOTHING`, [NEW_SYSTEM_ADMIN_EMAIL, hashedPassword]);
    await client.query(`INSERT INTO Users (id, org_id, email, password_hash, role) VALUES (gen_random_uuid(), $1, $2, $3, 'org_user') ON CONFLICT (email) DO NOTHING`, [ORG_ID, NEW_USER_EMAIL, hashedPassword]);
    console.log("--> Users created/updated.");

    // 3. Create Global Events
    const newYear = await client.query(`INSERT INTO GlobalEvents (name, event_date, catalog, country) VALUES ('New Year''s Day', '2025-01-01', 'National Holidays', 'USA') ON CONFLICT (name, event_date) DO NOTHING RETURNING id`);
    const newYearId = newYear.rows[0]?.id || (await client.query("SELECT id FROM GlobalEvents WHERE name = 'New Year''s Day'")).rows[0].id;
    console.log("--> Global events created.");

    // 4. Create Org-Specific Event in 'events' table
    await client.query(
      `INSERT INTO events (organization_id, title, description, start_date) 
       VALUES ($1, 'ACME Corp Q4 All-Hands', 'Quarterly meeting for all staff.', '2025-10-25 10:00:00-05')`,
      [ORG_ID]
    );

    // 5. Create Subscription
    await client.query(`INSERT INTO EventSubscriptions (organization_id, global_event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [ORG_ID, newYearId]);

    console.log("\nDatabase seeding complete! ✅");
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  } finally {
    await client.release();
    await pool.end();
  }
}

main();