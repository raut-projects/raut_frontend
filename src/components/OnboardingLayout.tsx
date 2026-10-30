import { useNavigate } from 'react-router-dom';
import useOnboardingStore from '../store/onboardingStore';

/**
 * Onboarding Layout Component
 *
 * Wraps all onboarding steps with progress indicator and navigation
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { currentStep, prevStep, completedSteps } = useOnboardingStore();

  const steps = [
    { number: 1, label: 'Personal Info' },
    { number: 2, label: 'Driver Info' },
    { number: 3, label: 'Vehicle Info' },
    { number: 4, label: 'Documents' },
    { number: 5, label: 'Review' },
  ];

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Driver Onboarding</h1>
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between mt-4">
              {steps.map((step) => {
                const isActive = currentStep === step.number;
                const isCompleted = completedSteps[step.number];
                const isPast = step.number < currentStep;

                return (
                  <div key={step.number} className="flex flex-col items-center">
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                        transition-all duration-200
                        ${
                          isActive
                            ? 'bg-black text-white scale-110'
                            : isPast || isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }
                      `}
                    >
                      {isPast || isCompleted ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={`
                        mt-2 text-xs font-medium hidden sm:block
                        ${isActive ? 'text-black' : 'text-gray-500'}
                      `}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          {children}
        </div>
      </div>

      {/* Back Button (bottom-left) */}
      {currentStep > 1 && (
        <button
          onClick={prevStep}
          className="fixed bottom-6 left-6 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}
    </div>
  );
}
