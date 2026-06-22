const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@quizapp.com';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'admin',
      isApproved: true,
      isActive: true,
    },
    create: {
      doctorName: 'Admin',
      designation: 'Administrator',
      specialty: 'Administration',
      hospitalName: 'HQ',
      pmdcNumber: 'ADMIN-001',
      city: 'System',
      phoneNumber: '0000000000',
      email: email,
      password: hashedPassword,
      role: 'admin',
      isApproved: true,
      isActive: true,
    },
  });

  console.log('Admin user seeded/updated:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
