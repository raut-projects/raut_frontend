import { useNavigate } from 'react-router-dom';
import useOnboardingStore from '../store/onboardingStore';
import { useTranslation } from '../lib/i18n';

declare global {
  interface Window {
    FlutterOnboarding?: {
      onComplete: (result: unknown) => void;
      onCancel?: () => void;
    };
  }
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { currentStep, prevStep, language } = useOnboardingStore();
  const t = useTranslation(language);

  const progressPercentage = ((currentStep - 1) / 3) * 100;

  const handleCancel = () => {
    // If in WebView, notify Flutter app
    if (window.FlutterOnboarding?.onCancel) {
      window.FlutterOnboarding.onCancel();
    } else {
      // Fallback for standalone web
      if (confirm('Cancel onboarding? Your progress will be saved.')) {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Logo */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img
                src="/assets/images/app_icon.png"
                alt="RAUT"
                className="h-8 w-8"
              />
              <h1 className="text-base font-semibold text-slate-900">{t('driverOnboarding')}</h1>
            </div>
            <button
              onClick={handleCancel}
              className="text-xs text-slate-500 hover:text-slate-700 font-medium"
            >
              {t('cancel')}
            </button>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">{t('step')} {currentStep} {t('of')} 4</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-5">
        {children}
      </div>

      {/* Back Button */}
      {currentStep > 1 && (
        <button
          onClick={prevStep}
          className="fixed bottom-5 left-4 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-xl shadow-lg hover:bg-slate-50 flex items-center gap-1.5 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('back')}
        </button>
      )}
    </div>
  );
}
