import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('Seeding database...');

  // Complaint types from JSON
  const dataPath = join(__dirname, '../../data/philadelphia-officials.json');
  const seedData = JSON.parse(readFileSync(dataPath, 'utf-8')) as {
    complaint_types: Array<{
      name: string;
      description: string;
      category: string;
      icon_emoji: string;
      primary_department: string;
      department_email: string;
      avg_resolution_days: number;
    }>;
  };

  for (const ct of seedData.complaint_types) {
    await prisma.complaintType.upsert({
      where: { name: ct.name },
      update: {},
      create: {
        name: ct.name,
        description: ct.description,
        category: ct.category,
        icon_emoji: ct.icon_emoji,
        primary_department: ct.primary_department,
        department_email: ct.department_email,
        avg_resolution_days: ct.avg_resolution_days,
      },
    });
  }
  console.log(`Seeded ${seedData.complaint_types.length} complaint types`);

  // Philadelphia elected officials
  const officials = [
    { name: 'Rue Landau', title: 'city_council' as const, district: 1, party: 'Democrat' },
    { name: 'Kenyatta Johnson', title: 'city_council' as const, district: 2, party: 'Democrat' },
    { name: 'Jamie Gauthier', title: 'city_council' as const, district: 3, party: 'Democrat' },
    { name: 'Curtis Jones Jr.', title: 'city_council' as const, district: 4, party: 'Democrat' },
    { name: 'Isaiah Thomas', title: 'city_council' as const, district: 5, party: 'Democrat' },
    { name: 'Quetcy Lozada', title: 'city_council' as const, district: 6, party: 'Democrat' },
    { name: 'Maria Quiñones Sánchez', title: 'city_council' as const, district: 7, party: 'Democrat' },
    { name: 'Cindy Bass', title: 'city_council' as const, district: 8, party: 'Democrat' },
    { name: 'Cherelle Parker', title: 'city_council' as const, district: 9, party: 'Democrat' },
    { name: 'Brian O\'Neill', title: 'city_council' as const, district: 10, party: 'Republican' },
    // State House Representatives
    { name: 'Gina Curry', title: 'state_house' as const, district: 164, party: 'Democrat' },
    { name: 'Mary Isaacson', title: 'state_house' as const, district: 175, party: 'Democrat' },
    { name: 'Malcolm Kenyatta', title: 'state_house' as const, district: 181, party: 'Democrat' },
    { name: 'Chris Rabb', title: 'state_house' as const, district: 200, party: 'Democrat' },
    { name: 'Ben Waxman', title: 'state_house' as const, district: 182, party: 'Democrat' },
    { name: 'Rick Krajewski', title: 'state_house' as const, district: 188, party: 'Democrat' },
    { name: 'Morgan Cephas', title: 'state_house' as const, district: 184, party: 'Democrat' },
    { name: 'Jordan Harris', title: 'state_house' as const, district: 186, party: 'Democrat' },
    { name: 'Donna Bullock', title: 'state_house' as const, district: 195, party: 'Democrat' },
    { name: 'Stephen Kinsey', title: 'state_house' as const, district: 201, party: 'Democrat' },
    { name: 'Darisha Parker', title: 'state_house' as const, district: 198, party: 'Democrat' },
    { name: 'Amen Brown', title: 'state_house' as const, district: 190, party: 'Democrat' },
    { name: 'Tarik Khan', title: 'state_house' as const, district: 170, party: 'Democrat' },
    { name: 'Napoleon Nelson', title: 'state_house' as const, district: 197, party: 'Democrat' },
    // State Senators
    { name: 'Nikil Saval', title: 'state_senate' as const, district: 1, party: 'Democrat' },
    { name: 'Amanda Cappelletti', title: 'state_senate' as const, district: 17, party: 'Democrat' },
    { name: 'Vincent Hughes', title: 'state_senate' as const, district: 7, party: 'Democrat' },
    { name: 'Anthony Williams', title: 'state_senate' as const, district: 8, party: 'Democrat' },
    { name: 'Sharif Street', title: 'state_senate' as const, district: 3, party: 'Democrat' },
    { name: 'Christine Tartaglione', title: 'state_senate' as const, district: 2, party: 'Democrat' },
    { name: 'Tina Tartaglione', title: 'state_senate' as const, district: 4, party: 'Democrat' },
    { name: 'Art Haywood', title: 'state_senate' as const, district: 4, party: 'Democrat' },
    { name: 'Larry Farnese', title: 'state_senate' as const, district: 1, party: 'Democrat' },
    { name: 'John Sabatina Jr.', title: 'state_senate' as const, district: 5, party: 'Democrat' },
  ];

  for (const o of officials) {
    await prisma.electedOfficial.upsert({
      where: { id: `${o.title}-${o.district}-phila` },
      update: { name: o.name, party: o.party },
      create: {
        id: `${o.title}-${o.district}-phila`,
        name: o.name,
        title: o.title,
        district: o.district,
        city: 'Philadelphia',
        state: 'PA',
        party: o.party,
      },
    });
  }
  console.log(`Seeded ${officials.length} elected officials`);

  // Admin user
  const adminHash = await bcrypt.hash('admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@civicaccountability.com' },
    update: {},
    create: {
      email: 'admin@civicaccountability.com',
      password_hash: adminHash,
      name: 'Admin',
      user_type: 'admin',
      is_verified: true,
    },
  });
  console.log('Seeded admin user: admin@civicaccountability.com');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
