import { clsx } from 'clsx';

type Grade = 'A' | 'B' | 'C' | 'D' | 'F' | 'N/A';

const GRADE_STYLES: Record<Grade, string> = {
  'A': 'bg-emerald-500 text-white',
  'B': 'bg-blue-500 text-white',
  'C': 'bg-yellow-400 text-gray-900',
  'D': 'bg-orange-500 text-white',
  'F': 'bg-red-600 text-white',
  'N/A': 'bg-gray-200 text-gray-500',
};

interface Props {
  grade: Grade | string;
  size?: 'sm' | 'md' | 'lg';
}

export default function GradeBadge({ grade, size = 'md' }: Props) {
  const g = (grade as Grade) in GRADE_STYLES ? (grade as Grade) : 'N/A';
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center font-black rounded-lg leading-none',
        GRADE_STYLES[g],
        size === 'sm' && 'w-8 h-8 text-sm',
        size === 'md' && 'w-11 h-11 text-xl',
        size === 'lg' && 'w-16 h-16 text-3xl',
      )}
    >
      {g}
    </span>
  );
}
