import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalInfoSchema } from '../schemas/onboardingSchemas';
import useOnboardingStore from '../store/onboardingStore';
import { useTranslation } from '../lib/i18n';

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";
const labelClass = "mb-1 block text-xs font-medium text-slate-700";
const errorClass = "mt-1 text-xs text-rose-600";

export default function PersonalInfoStep() {
  const {
    personalInfo,
    updatePersonalInfo,
    nextStep,
    markStepComplete,
    termsAccepted,
    setTermsAccepted,
    language,
  } = useOnboardingStore();

  const t = useTranslation(language);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: personalInfo,
  });

  const onSubmit = async (data: typeof personalInfo) => {
    updatePersonalInfo(data);
    markStepComplete(1);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{t('personalInformation')}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{t('personalInfoDesc')}</p>
      </div>

      {/* First Name */}
      <div>
        <label className={labelClass}>
          {t('firstName')} <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          {...register('firstName')}
          className={inputClass}
          placeholder={t('firstName')}
        />
        {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
      </div>

      {/* Last Name */}
      <div>
        <label className={labelClass}>
          {t('lastName')} <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          {...register('lastName')}
          className={inputClass}
          placeholder={t('lastName')}
        />
        {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label className={labelClass}>
          {t('emailAddress')} <span className="text-rose-500">*</span>
        </label>
        <input
          type="email"
          {...register('email')}
          className={inputClass}
          placeholder="your.email@example.com"
        />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      {/* Language Preference */}
      <div>
        <label className={labelClass}>
          {t('preferredLanguage')} <span className="text-rose-500">*</span>
        </label>
        <select {...register('languagePreference')} className={inputClass}>
          <option value="en">{t('english')}</option>
          <option value="sw">{t('swahili')}</option>
        </select>
        {errors.languagePreference && <p className={errorClass}>{errors.languagePreference.message}</p>}
      </div>

      {/* Terms & Conditions */}
      <div className="mt-5 pt-4 border-t border-slate-200">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
          />
          <span className="text-xs text-slate-600 leading-relaxed">
            {t('termsText')}{' '}
            <a href="https://raut.africa/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 underline">
              {t('termsAndConditions')}
            </a>{' '}
            {t('and')}{' '}
            <a href="https://raut.africa/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 underline">
              {t('privacyPolicy')}
            </a>
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !termsAccepted}
        className="w-full mt-5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? t('saving') : t('continue')}
      </button>
    </form>
  );
}
