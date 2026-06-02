import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge, SeverityBadge } from './StatusBadge';
import type { Complaint } from '../types/complaint';

export default function ComplaintCard({ complaint }: { complaint: Complaint }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">
            {complaint.complaint_type.icon_emoji ?? '📋'}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{complaint.title}</p>
            <p className="text-sm text-gray-500 truncate">
              {complaint.address.street_address}, {complaint.address.city}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <StatusBadge status={complaint.status} />
          <SeverityBadge severity={complaint.severity} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
        </span>
        <Link
          to={`/track/${complaint.case_number}`}
          className="text-blue-600 font-mono text-xs hover:underline"
        >
          {complaint.case_number}
        </Link>
      </div>
    </div>
  );
}
