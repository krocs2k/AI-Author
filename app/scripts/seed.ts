import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user (required for testing) - approved by default
  const testPassword = await bcrypt.hash('johndoe123', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: { isApproved: true },
    create: {
      email: 'john@doe.com',
      name: 'John Doe',
      password: testPassword,
      role: 'ADMIN',
      isApproved: true
    }
  });
  console.log('Test admin user created:', testUser.email);

  // Create test user for automated testing - approved for testing purposes
  const testUserPassword = await bcrypt.hash('Test123!', 12);
  const automatedTestUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: { isApproved: true },
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: testUserPassword,
      role: 'USER',
      isApproved: true
    }
  });
  console.log('Automated test user created:', automatedTestUser.email);

  // Create additional admin user as requested - approved by default
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@aiauthor.com' },
    update: { isApproved: true },
    create: {
      email: 'admin@aiauthor.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      isApproved: true
    }
  });
  console.log('Admin user created:', adminUser.email);

  // Create placeholder Google SSO config
  const existingConfig = await prisma.googleSSOConfig.findFirst();
  if (!existingConfig) {
    const googleConfig = await prisma.googleSSOConfig.create({
      data: {
        clientId: process.env.GOOGLE_CLIENT_ID || 'PLACEHOLDER_CLIENT_ID',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'PLACEHOLDER_CLIENT_SECRET',
        enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
                   process.env.GOOGLE_CLIENT_ID !== 'PLACEHOLDER_CLIENT_ID')
      }
    });
    console.log('Google SSO config created, enabled:', googleConfig.enabled);
  } else {
    console.log('Google SSO config already exists');
  }

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
