interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Civic Accountability</h1>
          <p className="text-blue-200 mt-1 text-sm">Philadelphia Government Transparency Platform</p>
        </div>
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
          {subtitle && <p className="text-gray-500 text-sm mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
