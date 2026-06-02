import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

function caseNum() {
  return `CAP-2026-${randomBytes(3).toString('hex').toUpperCase()}`;
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000);
}

async function main() {
  console.log('Seeding demo complaints for leaderboard...');

  const types = await prisma.complaintType.findMany();
  const pothole = types.find((t) => t.name === 'Pothole')!;
  const graffiti = types.find((t) => t.name === 'Graffiti')!;
  const dumping = types.find((t) => t.name === 'Illegal Dumping')!;
  const vehicle = types.find((t) => t.name === 'Abandoned Vehicle')!;
  const building = types.find((t) => t.name === 'Building Code Violation')!;

  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@civicaccountability.com' },
  });
  if (!adminUser) throw new Error('Run main seed first');

  // Demo addresses covering different City Council districts
  const addresses = [
    // District 2 (lat ~39.95, lng ~-75.17)
    { street: '200 South St', city: 'Philadelphia', state: 'PA', zip: '19147', lat: 39.942, lng: -75.161, cc: 2, sh: 197, ss: 8 },
    { street: '301 South St', city: 'Philadelphia', state: 'PA', zip: '19147', lat: 39.943, lng: -75.155, cc: 2, sh: 197, ss: 8 },
    // District 3 (lat ~39.97, lng ~-75.16)
    { street: '4001 Baltimore Ave', city: 'Philadelphia', state: 'PA', zip: '19104', lat: 39.947, lng: -75.21, cc: 3, sh: 186, ss: 5 },
    { street: '4500 Chester Ave', city: 'Philadelphia', state: 'PA', zip: '19143', lat: 39.942, lng: -75.213, cc: 3, sh: 189, ss: 7 },
    // District 5 (lat ~39.98, lng ~-75.15)
    { street: '1500 Spring Garden St', city: 'Philadelphia', state: 'PA', zip: '19130', lat: 39.965, lng: -75.168, cc: 5, sh: 182, ss: 5 },
    { street: '1200 Fairmount Ave', city: 'Philadelphia', state: 'PA', zip: '19130', lat: 39.966, lng: -75.162, cc: 5, sh: 182, ss: 5 },
    // District 6 (lat ~40.0, lng ~-75.1)
    { street: '6200 Frankford Ave', city: 'Philadelphia', state: 'PA', zip: '19135', lat: 40.013, lng: -75.063, cc: 6, sh: 175, ss: 5 },
    { street: '5800 Torresdale Ave', city: 'Philadelphia', state: 'PA', zip: '19135', lat: 40.01, lng: -75.06, cc: 6, sh: 175, ss: 5 },
    // District 8 (lat ~40.0, lng ~-75.1)
    { street: '7200 Germantown Ave', city: 'Philadelphia', state: 'PA', zip: '19119', lat: 40.055, lng: -75.185, cc: 8, sh: 200, ss: 4 },
    { street: '6800 Germantown Ave', city: 'Philadelphia', state: 'PA', zip: '19119', lat: 40.049, lng: -75.182, cc: 8, sh: 200, ss: 4 },
  ];

  // Upsert addresses
  const addrRecords = await Promise.all(
    addresses.map((a) =>
      prisma.address.upsert({
        where: {
          street_address_city_state_zip_code: {
            street_address: a.street,
            city: a.city,
            state: a.state,
            zip_code: a.zip,
          },
        },
        update: {},
        create: {
          street_address: a.street,
          city: a.city,
          state: a.state,
          zip_code: a.zip,
          latitude: a.lat,
          longitude: a.lng,
          city_council_district: a.cc,
          state_house_district: a.sh,
          state_senate_district: a.ss,
        },
      }),
    ),
  );

  // Helper: create complaint + optional update + optional resolve
  async function makeComplaint(opts: {
    addrIdx: number;
    typeId: string;
    typeName: string;
    title: string;
    desc: string;
    severity: string;
    status: string;
    createdDaysAgo: number;
    resolvedDaysAgo?: number;
  }) {
    const existing = await prisma.complaint.findFirst({
      where: { title: opts.title, address_id: addrRecords[opts.addrIdx].id },
    });
    if (existing) return existing;

    const createdAt = daysAgo(opts.createdDaysAgo);
    const resolvedAt = opts.resolvedDaysAgo ? daysAgo(opts.resolvedDaysAgo) : null;

    const c = await prisma.complaint.create({
      data: {
        user_id: adminUser!.id,
        complaint_type_id: opts.typeId,
        address_id: addrRecords[opts.addrIdx].id,
        title: opts.title,
        description: opts.desc,
        severity: opts.severity,
        status: opts.status,
        assigned_department: opts.typeName,
        case_number: caseNum(),
        public_tracking_url: `http://localhost:5173/track/${caseNum()}`,
        is_public: true,
        dept_notified_at: createdAt,
        reps_notified_at: createdAt,
        created_at: createdAt,
        resolved_at: resolvedAt,
      },
    });

    await prisma.complaintUpdate.create({
      data: {
        complaint_id: c.id,
        user_id: adminUser!.id,
        update_type: 'submitted',
        message: `Complaint submitted and routed to ${opts.typeName}.`,
        created_at: createdAt,
      },
    });

    if (resolvedAt) {
      await prisma.complaintUpdate.create({
        data: {
          complaint_id: c.id,
          user_id: adminUser!.id,
          update_type: 'resolved',
          message: 'Issue has been resolved. Thank you for your report.',
          created_at: resolvedAt,
        },
      });
    }

    return c;
  }

  // District 2 — good performance (A): 4 resolved quickly, 1 open
  await makeComplaint({ addrIdx: 0, typeId: pothole.id, typeName: pothole.primary_department, title: 'Pothole on South St near 2nd', desc: 'Deep pothole', severity: 'high', status: 'resolved', createdDaysAgo: 40, resolvedDaysAgo: 33 });
  await makeComplaint({ addrIdx: 0, typeId: graffiti.id, typeName: graffiti.primary_department, title: 'Graffiti on mailbox South St', desc: 'Graffiti on federal mailbox', severity: 'low', status: 'resolved', createdDaysAgo: 35, resolvedDaysAgo: 26 });
  await makeComplaint({ addrIdx: 1, typeId: dumping.id, typeName: dumping.primary_department, title: 'Dumped furniture on 301 South', desc: 'Old couch and boxes', severity: 'moderate', status: 'resolved', createdDaysAgo: 25, resolvedDaysAgo: 20 });
  await makeComplaint({ addrIdx: 1, typeId: pothole.id, typeName: pothole.primary_department, title: 'Pothole near crosswalk 301 South', desc: 'Trip hazard near crosswalk', severity: 'high', status: 'resolved', createdDaysAgo: 15, resolvedDaysAgo: 8 });
  await makeComplaint({ addrIdx: 0, typeId: vehicle.id, typeName: vehicle.primary_department, title: 'Abandoned van South St', desc: 'No plates, flat tires', severity: 'moderate', status: 'submitted', createdDaysAgo: 3 });

  // District 3 — average (C): 2 resolved slowly, 2 open
  await makeComplaint({ addrIdx: 2, typeId: pothole.id, typeName: pothole.primary_department, title: 'Large pothole Baltimore Ave', desc: 'Dangerous pothole', severity: 'high', status: 'resolved', createdDaysAgo: 50, resolvedDaysAgo: 26 });
  await makeComplaint({ addrIdx: 3, typeId: graffiti.id, typeName: graffiti.primary_department, title: 'Graffiti on Chester Ave store', desc: 'Graffiti on storefront', severity: 'low', status: 'resolved', createdDaysAgo: 30, resolvedDaysAgo: 10 });
  await makeComplaint({ addrIdx: 2, typeId: dumping.id, typeName: dumping.primary_department, title: 'Illegal dump pile Baltimore Ave', desc: 'Construction debris', severity: 'moderate', status: 'in_progress', createdDaysAgo: 20 });
  await makeComplaint({ addrIdx: 3, typeId: building.id, typeName: building.primary_department, title: 'Unsafe facade Chester Ave', desc: 'Crumbling building exterior', severity: 'critical', status: 'submitted', createdDaysAgo: 10 });

  // District 5 — excellent (A): 3 resolved fast, 1 open
  await makeComplaint({ addrIdx: 4, typeId: pothole.id, typeName: pothole.primary_department, title: 'Pothole Spring Garden near 15th', desc: 'Pothole after winter', severity: 'moderate', status: 'resolved', createdDaysAgo: 20, resolvedDaysAgo: 16 });
  await makeComplaint({ addrIdx: 5, typeId: graffiti.id, typeName: graffiti.primary_department, title: 'Graffiti on Fairmount Ave wall', desc: 'Large tag on brick wall', severity: 'low', status: 'resolved', createdDaysAgo: 18, resolvedDaysAgo: 10 });
  await makeComplaint({ addrIdx: 4, typeId: dumping.id, typeName: dumping.primary_department, title: 'Trash pile Spring Garden alley', desc: 'Bags of trash', severity: 'moderate', status: 'resolved', createdDaysAgo: 10, resolvedDaysAgo: 6 });
  await makeComplaint({ addrIdx: 5, typeId: pothole.id, typeName: pothole.primary_department, title: 'Sinkhole near Fairmount Ave', desc: 'Growing sinkhole concern', severity: 'high', status: 'in_progress', createdDaysAgo: 5 });

  // District 6 — poor (D/F): 1 resolved late, 3 open/overdue
  await makeComplaint({ addrIdx: 6, typeId: pothole.id, typeName: pothole.primary_department, title: 'Pothole Frankford Ave near 62nd', desc: 'Large pothole', severity: 'high', status: 'resolved', createdDaysAgo: 60, resolvedDaysAgo: 15 });
  await makeComplaint({ addrIdx: 7, typeId: dumping.id, typeName: dumping.primary_department, title: 'Illegal dumping Torresdale Ave', desc: 'Tires and appliances', severity: 'moderate', status: 'submitted', createdDaysAgo: 45 });
  await makeComplaint({ addrIdx: 6, typeId: building.id, typeName: building.primary_department, title: 'Collapsed porch Frankford Ave', desc: 'Porch collapse hazard', severity: 'critical', status: 'submitted', createdDaysAgo: 35 });
  await makeComplaint({ addrIdx: 7, typeId: vehicle.id, typeName: vehicle.primary_department, title: 'Abandoned truck Torresdale', desc: 'Box truck, no plates, 6 weeks', severity: 'moderate', status: 'submitted', createdDaysAgo: 28 });

  // District 8 — mixed (B): 2 resolved, 1 open
  await makeComplaint({ addrIdx: 8, typeId: graffiti.id, typeName: graffiti.primary_department, title: 'Graffiti on Germantown Ave bus stop', desc: 'Tags on shelter', severity: 'low', status: 'resolved', createdDaysAgo: 22, resolvedDaysAgo: 13 });
  await makeComplaint({ addrIdx: 9, typeId: pothole.id, typeName: pothole.primary_department, title: 'Pothole on Germantown Ave', desc: 'Pothole causing car damage', severity: 'high', status: 'resolved', createdDaysAgo: 14, resolvedDaysAgo: 7 });
  await makeComplaint({ addrIdx: 8, typeId: dumping.id, typeName: dumping.primary_department, title: 'Mattress dumped Germantown Ave alley', desc: 'Old mattress blocking alley', severity: 'moderate', status: 'in_progress', createdDaysAgo: 6 });

  const total = await prisma.complaint.count();
  console.log(`Demo seeding complete. Total complaints in DB: ${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
