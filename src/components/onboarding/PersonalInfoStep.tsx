import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalInfoSchema } from '../../schemas/onboardingSchemas';
import useOnboardingStore from '../../store/onboardingStore';

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const errorClass = "mt-1 block text-xs font-medium text-rose-600";

export default function PersonalInfoStep() {
  const {
    personalInfo,
    updatePersonalInfo,
    nextStep,
    markStepComplete,
    termsAccepted,
    setTermsAccepted,
  } = useOnboardingStore();

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Personal Information</h3>
        <p className="mt-1 text-sm text-slate-500">
          Let's start with your basic information to create your driver profile.
        </p>
      </div>

      {/* First Name */}
      <div>
        <label className={labelClass}>
          First Name <span className="text-rose-600">*</span>
        </label>
        <input
          type="text"
          {...register('firstName')}
          className={inputClass}
          placeholder="John"
        />
        {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
      </div>

      {/* Last Name */}
      <div>
        <label className={labelClass}>
          Last Name <span className="text-rose-600">*</span>
        </label>
        <input
          type="text"
          {...register('lastName')}
          className={inputClass}
          placeholder="Doe"
        />
        {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label className={labelClass}>
          Email Address <span className="text-rose-600">*</span>
        </label>
        <input
          type="email"
          {...register('email')}
          className={inputClass}
          placeholder="john@example.com"
        />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      {/* Language Preference */}
      <div>
        <label className={labelClass}>
          Language Preference <span className="text-rose-600">*</span>
        </label>
        <select {...register('languagePreference')} className={inputClass}>
          <option value="en">English</option>
          <option value="sw">Swahili</option>
        </select>
        {errors.languagePreference && <p className={errorClass}>{errors.languagePreference.message}</p>}
      </div>

      {/* Terms & Conditions */}
      <div className="border-t border-slate-200 pt-5">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-xs text-slate-600">
            I agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline hover:text-brand-800">
              Terms & Conditions
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline hover:text-brand-800">
              Privacy Policy
            </a>
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-5">
        <p className="text-xs font-medium text-slate-500">Step 1 of 4</p>
        <button
          type="submit"
          disabled={isSubmitting || !termsAccepted}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </form>
  );
}
