import { useState, useEffect } from 'react';

interface DescriptionEnhancementModalProps {
  original: string;
  improved: string;
  summary: string;
  onAccept: (description: string) => void;
  isLoading?: boolean;
}

export default function DescriptionEnhancementModal({
  original,
  improved,
  summary,
  onAccept,
  isLoading,
}: DescriptionEnhancementModalProps) {
  const [editedVersion, setEditedVersion] = useState(improved);

  useEffect(() => {
    setEditedVersion(improved);
  }, [improved]);

  // Show character-level differences
  const getDiffView = () => {
    const originalLines = original.split('\n');
    const improvedLines = improved.split('\n');
    const maxLines = Math.max(originalLines.length, improvedLines.length);
    const diffs: React.ReactNode[] = [];

    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i] || '';
      const improvedLine = improvedLines[i] || '';
      const isChanged = origLine !== improvedLine;

      diffs.push(
        <div key={i} className={`p-2 rounded text-sm mb-1 ${isChanged ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
          {isChanged ? (
            <>
              <div className="text-gray-500 line-through text-xs mb-0.5">{origLine || '(empty)'}</div>
              <div className="text-green-700 font-medium">{improvedLine || '(empty)'}</div>
            </>
          ) : (
            <div className="text-gray-600">{origLine || '(empty)'}</div>
          )}
        </div>,
      );
    }

    return diffs;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 space-y-2">
          <h3 className="font-bold text-lg text-gray-900">AI Description Enhancement</h3>
          <p className="text-sm text-gray-600">Your description has been reviewed and improved.</p>
          <p className="text-xs text-blue-600 font-medium">{summary}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Side-by-side comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Original</p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-200 min-h-32 whitespace-pre-wrap break-words">
                {original}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Improved</p>
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-gray-900 border border-blue-200 min-h-32 whitespace-pre-wrap break-words">
                {improved}
              </div>
            </div>
          </div>

          {/* Detailed diff view */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Changes made:</p>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-48 overflow-y-auto">
              {getDiffView()}
            </div>
          </div>

          {/* Edit area - user can fine-tune */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Edit (optional)</p>
            <textarea
              value={editedVersion}
              onChange={(e) => setEditedVersion(e.target.value)}
              rows={5}
              className="w-full input-field"
              placeholder="You can edit the improved version here..."
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => onAccept(editedVersion)}
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Submitting…' : 'Submit with Enhanced Description'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
