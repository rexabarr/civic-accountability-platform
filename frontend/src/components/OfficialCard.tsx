const TITLE_LABELS: Record<string, string> = {
  city_council: 'City Council',
  state_house: 'State House',
  state_senate: 'State Senate',
};

interface Official {
  id: string;
  name: string;
  title: string;
  district: number;
  email: string | null;
  party: string | null;
}

export default function OfficialCard({ official }: { official: Official }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
      <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
        {official.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{official.name}</p>
        <p className="text-sm text-blue-700">
          {TITLE_LABELS[official.title] ?? official.title} — District {official.district}
        </p>
        {official.party && (
          <p className="text-xs text-gray-500">{official.party}</p>
        )}
        {official.email && (
          <a
            href={`mailto:${official.email}`}
            className="text-xs text-blue-600 hover:underline mt-1 block"
          >
            {official.email}
          </a>
        )}
      </div>
    </div>
  );
}
