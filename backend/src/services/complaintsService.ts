import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateCaseNumber } from '../utils/caseNumber.js';
import { geocodeAndGetDistricts } from './geocodingService.js';
import { sendComplaintNotifications } from './emailService.js';
import { env } from '../utils/env.js';

interface SubmitComplaintInput {
  userId: string;
  complaintTypeId: string;
  address: string;
  title: string;
  description: string;
  severity: string;
  isPublic: boolean;
}

export async function submitComplaint(input: SubmitComplaintInput) {
  const { userId, complaintTypeId, address, title, description, severity, isPublic } = input;

  // Validate complaint type exists
  const complaintType = await prisma.complaintType.findUnique({ where: { id: complaintTypeId } });
  if (!complaintType) throw new AppError(400, 'Invalid complaint type');

  // Geocode address and look up districts/officials
  const { address: geo, districts } = await geocodeAndGetDistricts(address);

  // Find or create the Address record
  let addressRecord = await prisma.address.findUnique({
    where: {
      street_address_city_state_zip_code: {
        street_address: geo.street_address,
        city: geo.city,
        state: geo.state,
        zip_code: geo.zip_code,
      },
    },
  });

  if (!addressRecord) {
    addressRecord = await prisma.address.create({
      data: {
        street_address: geo.street_address,
        city: geo.city,
        state: geo.state,
        zip_code: geo.zip_code,
        latitude: geo.latitude,
        longitude: geo.longitude,
        city_council_district: districts.city_council_district,
        state_house_district: districts.state_house_district,
        state_senate_district: districts.state_senate_district,
      },
    });
  }

  // Generate unique case number with retry on collision
  let caseNumber: string;
  let attempts = 0;
  do {
    caseNumber = generateCaseNumber();
    const exists = await prisma.complaint.findUnique({ where: { case_number: caseNumber } });
    if (!exists) break;
    attempts++;
  } while (attempts < 5);

  const trackingUrl = `${env.FRONTEND_URL}/track/${caseNumber}`;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  // Create the complaint
  const complaint = await prisma.complaint.create({
    data: {
      user_id: userId,
      complaint_type_id: complaintTypeId,
      address_id: addressRecord.id,
      title,
      description,
      severity,
      status: 'submitted',
      assigned_department: complaintType.primary_department,
      case_number: caseNumber!,
      public_tracking_url: trackingUrl,
      is_public: isPublic,
      dept_notified_at: new Date(),
      reps_notified_at: new Date(),
    },
    include: {
      complaint_type: true,
      address: true,
    },
  });

  // Create initial status update
  await prisma.complaintUpdate.create({
    data: {
      complaint_id: complaint.id,
      user_id: userId,
      update_type: 'submitted',
      message: `Complaint submitted and routed to ${complaintType.primary_department}. Elected officials have been notified.`,
      visibility: 'public',
    },
  });

  // Fire notifications
  const fullAddress = `${geo.street_address}, ${geo.city}, ${geo.state} ${geo.zip_code}`;
  sendComplaintNotifications({
    caseNumber: caseNumber!,
    complaintTitle: title,
    complaintType: complaintType.name,
    description,
    address: fullAddress,
    severity,
    submittedBy: user.email,
    trackingUrl,
    department: complaintType.primary_department,
    departmentEmail: complaintType.department_email,
    officials: districts.officials,
  });

  return {
    id: complaint.id,
    case_number: complaint.case_number,
    status: complaint.status,
    title: complaint.title,
    tracking_url: trackingUrl,
    assigned_department: complaint.assigned_department,
    officials_notified: districts.officials.length,
    created_at: complaint.created_at,
  };
}

export async function getComplaintByCase(caseNumber: string) {
  const complaint = await prisma.complaint.findUnique({
    where: { case_number: caseNumber },
    include: {
      complaint_type: true,
      address: true,
      updates: { orderBy: { created_at: 'asc' } },
      user: { select: { name: true } },
    },
  });

  if (!complaint) throw new AppError(404, `No complaint found with case number ${caseNumber}`);
  if (!complaint.is_public) throw new AppError(403, 'This complaint is private');

  return complaint;
}

export async function getUserComplaints(userId: string) {
  return prisma.complaint.findMany({
    where: { user_id: userId },
    include: {
      complaint_type: { select: { name: true, icon_emoji: true } },
      address: { select: { street_address: true, city: true } },
      updates: { orderBy: { created_at: 'desc' }, take: 1 },
    },
    orderBy: { created_at: 'desc' },
  });
}

export async function getComplaintTypes() {
  return prisma.complaintType.findMany({ orderBy: { name: 'asc' } });
}
