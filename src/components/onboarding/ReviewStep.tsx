import { useState } from 'react';
import useOnboardingStore from '../../store/onboardingStore';
import { submitOnboarding } from '../../services/onboarding';

declare global {
  interface Window {
    FlutterOnboarding?: {
      onComplete: (result: unknown) => void;
    };
  }
}

export default function ReviewStep() {
  const {
    personalInfo,
    driverInfo,
    vehicleInfo,
    documents,
    setCurrentStep,
    reset,
  } = useOnboardingStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitOnboarding({
        personalInfo,
        driverInfo,
        vehicleInfo,
        documents,
      });

      // Notify Flutter app of completion
      if (window.FlutterOnboarding?.onComplete) {
        window.FlutterOnboarding.onComplete(result);
      }

      // Reset store after successful submission
      reset();

      // Redirect or show success message
      alert('Onboarding completed successfully! Your application is under review.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit onboarding. Please try again.';
      setError(errorMessage);
      console.error('Onboarding submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const InfoSection = ({ title, data, onEdit }: {
    title: string;
    data: Record<string, string | number | File | null>;
    onEdit: () => void;
  }) => (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm text-gray-600 hover:text-black font-medium"
        >
          Edit
        </button>
      </div>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => {
          if (!value || value instanceof File) return null;
          const label = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());
          const displayValue = String(value);

          return (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-600">{label}:</span>
              <span className="font-medium text-gray-900">{displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
        <p className="text-gray-600">
          Please review your information before submitting. You can edit any section by clicking the "Edit" button.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="w-5 h-5 text-red-600 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Personal Information */}
      <InfoSection
        title="Personal Information"
        data={personalInfo as unknown as Record<string, string | number | File | null>}
        onEdit={() => setCurrentStep(1)}
      />

      {/* Driver Information */}
      <InfoSection
        title="Driver Information"
        data={driverInfo as unknown as Record<string, string | number | File | null>}
        onEdit={() => setCurrentStep(2)}
      />

      {/* Vehicle Information */}
      <InfoSection
        title="Vehicle Information"
        data={vehicleInfo as unknown as Record<string, string | number | File | null>}
        onEdit={() => setCurrentStep(3)}
      />

      {/* Documents */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className="text-sm text-gray-600 hover:text-black font-medium"
          >
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(documents).map(([key, file]) => {
            if (!file) return null;
            const label = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase());

            return (
              <div key={key} className="flex items-center text-sm">
                <svg
                  className="w-4 h-4 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          Terms & Conditions
        </h4>
        <p className="text-sm text-gray-600 mb-3">
          By submitting this application, you agree to RAUT's terms of service and
          confirm that all information provided is accurate and complete.
        </p>
        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
          <li>You must maintain valid insurance and registration</li>
          <li>You agree to follow all local traffic laws and regulations</li>
          <li>RAUT reserves the right to verify all submitted information</li>
          <li>Your application will be reviewed within 2-3 business days</li>
        </ul>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-black text-white px-12 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </>
          ) : (
            'Submit Application'
          )}
        </button>
      </div>
    </div>
  );
}
