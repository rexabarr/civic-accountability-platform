import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { clsx } from 'clsx';
import { useComplaintTypes, useSubmitComplaint } from '../hooks/useComplaints';
import { useGeocode } from '../hooks/useGeocode';
import OfficialCard from '../components/OfficialCard';
import type { ComplaintType } from '../types/complaint';

const STEPS = ['Issue Type', 'Location & Details', 'Review'];

const detailsSchema = z.object({
  address: z.string().min(5, 'Enter a full address'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Please describe the problem in at least 10 characters').max(2000),
  severity: z.enum(['low', 'moderate', 'high', 'critical']),
  isPublic: z.boolean(),
});

type DetailsForm = z.infer<typeof detailsSchema>;

export default function SubmitComplaintPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<ComplaintType | null>(null);

  const { data: complaintTypes, isLoading: typesLoading } = useComplaintTypes();
  const geocode = useGeocode();
  const submit = useSubmitComplaint();

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { severity: 'moderate', isPublic: true },
  });

  const addressValue = watch('address');

  function handleTypeSelect(type: ComplaintType) {
    setSelectedType(type);
    setStep(1);
  }

  function handleAddressLookup() {
    const addr = getValues('address');
    if (addr?.trim().length >= 5) {
      geocode.mutate(addr.trim());
    }
  }

  const onSubmit = (data: DetailsForm) => {
    if (!selectedType) return;

    submit.mutate(
      {
        complaintTypeId: selectedType.id,
        address: data.address,
        title: data.title,
        description: data.description,
        severity: data.severity,
        isPublic: data.isPublic,
      },
      {
        onSuccess: (result) => {
          navigate(`/track/${result.case_number}?new=1`);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <Link to="/dashboard" className="text-blue-300 text-sm hover:text-white">
              ← Dashboard
            </Link>
            <h1 className="text-xl font-bold mt-1">Submit a Complaint</h1>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-6 py-3 flex gap-0">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
                    i < step
                      ? 'bg-green-500 text-white'
                      : i === step
                        ? 'bg-blue-700 text-white'
                        : 'bg-gray-200 text-gray-500',
                  )}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span
                  className={clsx(
                    'text-sm font-medium hidden sm:block',
                    i === step ? 'text-blue-700' : 'text-gray-400',
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={clsx('flex-1 h-0.5 mx-3', i < step ? 'bg-green-400' : 'bg-gray-200')} />
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto p-6">
        {/* STEP 0 — Select issue type */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">What issue are you reporting?</h2>
            {typesLoading ? (
              <div className="text-center py-12 text-gray-400">Loading issue types…</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {complaintTypes?.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type)}
                    className="card hover:border-blue-400 hover:shadow-md transition-all text-left cursor-pointer border-2 border-transparent"
                  >
                    <div className="text-3xl mb-2">{type.icon_emoji ?? '📋'}</div>
                    <p className="font-semibold text-gray-900 text-sm">{type.name}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{type.description}</p>
                    <p className="text-xs text-blue-600 mt-2 font-medium">→ {type.primary_department}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 1 — Location & Details */}
        {step === 1 && selectedType && (
          <form onSubmit={handleSubmit(() => setStep(2))} className="space-y-5">
            <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3 border border-blue-100">
              <span className="text-2xl">{selectedType.icon_emoji}</span>
              <div>
                <p className="font-semibold text-gray-800">{selectedType.name}</p>
                <p className="text-xs text-blue-600">→ {selectedType.primary_department}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="ml-auto text-xs text-gray-400 hover:text-gray-600"
              >
                Change
              </button>
            </div>

            {/* Address */}
            <div>
              <label className="form-label">Address of the issue</label>
              <div className="flex gap-2">
                <input
                  {...register('address')}
                  className="input-field flex-1"
                  placeholder="e.g. 456 Market St, Philadelphia, PA"
                />
                <button
                  type="button"
                  onClick={handleAddressLookup}
                  disabled={geocode.isPending || (addressValue?.length ?? 0) < 5}
                  className="btn-secondary whitespace-nowrap text-sm"
                >
                  {geocode.isPending ? '…' : 'Look up'}
                </button>
              </div>
              {errors.address && <p className="form-error">{errors.address.message}</p>}

              {geocode.data && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
                  <p className="font-medium text-green-800">
                    ✓ {geocode.data.address.street_address}, {geocode.data.address.city}
                  </p>
                  <p className="text-green-600 text-xs mt-1">
                    Notifying {geocode.data.districts.officials.length} elected official{geocode.data.districts.officials.length !== 1 ? 's' : ''}
                  </p>
                  <div className="mt-2 space-y-1">
                    {geocode.data.districts.officials.map((o) => (
                      <p key={o.id} className="text-xs text-gray-600">
                        • {o.name} ({o.title.replace('_', ' ')}, Dist. {o.district})
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="form-label">Brief title</label>
              <input
                {...register('title')}
                className="input-field"
                placeholder={`e.g. Large ${selectedType.name.toLowerCase()} blocking sidewalk`}
              />
              {errors.title && <p className="form-error">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="form-label">Description</label>
              <textarea
                {...register('description')}
                rows={4}
                className="input-field resize-none"
                placeholder="Describe the problem in detail — size, location, hazard level, how long it's been there…"
              />
              {errors.description && <p className="form-error">{errors.description.message}</p>}
            </div>

            {/* Severity */}
            <div>
              <label className="form-label">Severity</label>
              <div className="grid grid-cols-4 gap-2">
                {(['low', 'moderate', 'high', 'critical'] as const).map((sev) => {
                  const colors = {
                    low: 'border-green-300 bg-green-50 text-green-800',
                    moderate: 'border-yellow-300 bg-yellow-50 text-yellow-800',
                    high: 'border-orange-300 bg-orange-50 text-orange-800',
                    critical: 'border-red-300 bg-red-50 text-red-800',
                  };
                  const selected = watch('severity') === sev;
                  return (
                    <label
                      key={sev}
                      className={clsx(
                        'border-2 rounded-lg p-2 text-center text-sm font-medium cursor-pointer transition-all',
                        selected ? colors[sev] + ' border-current' : 'border-gray-200 bg-white text-gray-500',
                      )}
                    >
                      <input {...register('severity')} type="radio" value={sev} className="sr-only" />
                      {sev.charAt(0).toUpperCase() + sev.slice(1)}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Public toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input {...register('isPublic')} type="checkbox" className="w-4 h-4 rounded" />
              <span className="text-sm text-gray-700">
                Make this complaint public (anyone can track it by case number)
              </span>
            </label>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(0)} className="btn-secondary flex-1">
                Back
              </button>
              <button type="submit" className="btn-primary flex-1">
                Review →
              </button>
            </div>
          </form>
        )}

        {/* STEP 2 — Review */}
        {step === 2 && selectedType && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Review your complaint</h2>

            <div className="card space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b">
                <span className="text-3xl">{selectedType.icon_emoji}</span>
                <div>
                  <p className="font-bold text-gray-900">{selectedType.name}</p>
                  <p className="text-sm text-blue-600">{selectedType.primary_department}</p>
                </div>
              </div>

              {[
                { label: 'Address', value: getValues('address') },
                { label: 'Title', value: getValues('title') },
                { label: 'Severity', value: getValues('severity').charAt(0).toUpperCase() + getValues('severity').slice(1) },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3 text-sm">
                  <span className="text-gray-500 w-20 flex-shrink-0">{label}</span>
                  <span className="text-gray-900 font-medium">{value}</span>
                </div>
              ))}

              <div className="text-sm">
                <span className="text-gray-500 block mb-1">Description</span>
                <p className="text-gray-900 bg-gray-50 rounded p-2 text-sm">{getValues('description')}</p>
              </div>
            </div>

            <div className="card bg-blue-50 border-blue-200">
              <p className="font-semibold text-blue-900 mb-2">Who will be notified:</p>
              <div className="space-y-1 text-sm text-blue-700">
                <p>📧 {selectedType.primary_department}</p>
                {geocode.data?.districts.officials.map((o) => (
                  <p key={o.id}>📧 {o.name} ({o.title.replace(/_/g, ' ')})</p>
                ))}
                {!geocode.data && <p className="text-blue-500 text-xs">Look up address in step 2 to see elected officials</p>}
              </div>
            </div>

            {submit.error && (
              <div className="alert-error">
                {(submit.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Submission failed. Please try again.'}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                Back
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={submit.isPending}
                className="btn-primary flex-1"
              >
                {submit.isPending ? 'Submitting…' : 'Submit Complaint'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
