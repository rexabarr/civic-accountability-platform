import { clsx } from 'clsx';
import { STATUS_COLORS, STATUS_LABELS, SEVERITY_COLORS, SEVERITY_LABELS, type Severity } from '../types/complaint';

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800')}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', SEVERITY_COLORS[severity as Severity] ?? 'bg-gray-100 text-gray-800')}>
      {SEVERITY_LABELS[severity as Severity] ?? severity}
    </span>
  );
}
