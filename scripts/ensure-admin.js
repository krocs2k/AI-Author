/*
 * Startup admin bootstrap (self-hosted deployments)
 * -------------------------------------------------------------------------
 * On self-hosted deployments the runtime database is separate from the build
 * environment and starts out empty of user accounts. Without a user record,
 * nobody can log in. This script idempotently ensures an approved ADMIN user
 * exists so the owner can always sign in after a fresh deploy.
 *
 * It is SAFE and NON-DESTRUCTIVE: it only upserts (creates or re-approves) the
 * admin account. It never deletes or overwrites other data. If the admin
 * already exists, its password is refreshed to the configured value and it is
 * (re-)marked approved.
 *
 * Credentials can be overridden via environment variables:
 *   ADMIN_EMAIL    (default: admin@aiauthor.com)
 *   ADMIN_PASSWORD (default: Admin123!)
 *   ADMIN_NAME     (default: Admin User)
 * -------------------------------------------------------------------------
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@aiauthor.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const name = process.env.ADMIN_NAME || 'Admin User';

  const prisma = new PrismaClient();
  try {
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: { isApproved: true, role: 'ADMIN', password: hashed },
      create: {
        email,
        name,
        password: hashed,
        role: 'ADMIN',
        isApproved: true,
      },
    });
    console.log(`[ensure-admin] Admin account ready: ${user.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[ensure-admin] Failed to ensure admin account:', err && err.message ? err.message : err);
  // Non-fatal: the server should still start even if bootstrap fails.
  process.exit(0);
});
