import { randomBytes } from 'crypto';

export function generateCaseNumber(): string {
  const year = new Date().getFullYear();
  const random = randomBytes(3).toString('hex').toUpperCase(); // 6 hex chars
  return `CAP-${year}-${random}`;
}
