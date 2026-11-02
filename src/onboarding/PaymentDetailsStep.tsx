import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentDetailsSchema } from '../schemas/onboardingSchemas';
import useOnboardingStore from '../store/onboardingStore';
import TanzaniaPhoneInput from '../components/TanzaniaPhoneInput';
import { useTranslation } from '../lib/i18n';
import { apiPost } from '../services/api';

declare global {
  interface Window {
    FlutterOnboarding?: {
      onComplete: (result: unknown) => void;
    };
  }
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";
const labelClass = "mb-1 block text-xs font-medium text-slate-700";
const errorClass = "mt-1 text-xs text-rose-600";

const MOBILE_NETWORKS = [
  { value: 'vodacom', label: 'VODACOM (M-Pesa)', logo: '/assets/images/mpesa.png' },
  { value: 'airtel', label: 'AIRTEL (Airtel Money)', logo: '/assets/images/airtel.png' },
  { value: 'halotel', label: 'HALOTEL (HaloPesa)', logo: '/assets/images/halopesa.png' },
  { value: 'mixx', label: 'MIXX BY YASS', logo: '/assets/images/yas.png' },
];

export default function PaymentDetailsStep() {
  const { paymentDetails, updatePaymentDetails, language, token } = useOnboardingStore();

  const t = useTranslation(language);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(paymentDetailsSchema),
    defaultValues: paymentDetails,
  });

  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (data: typeof paymentDetails) => {
    try {
      // Format phone number: "712345678" → "+255712345678"
      const formattedPhone = data.mobileMoneyNumber.startsWith('255')
        ? `+${data.mobileMoneyNumber}`
        : data.mobileMoneyNumber.startsWith('0')
        ? `+255${data.mobileMoneyNumber.substring(1)}`
        : `+255${data.mobileMoneyNumber}`;

      await apiPost('/drivers/payment-details', {
        account_name: data.accountName,
        address: data.address,
        mobile_money_number: formattedPhone,
        mobile_network: data.mobileNetwork,
      });

      updatePaymentDetails(data);

      // If in Flutter WebView, notify immediately (no success screen)
      if (window.FlutterOnboarding?.onComplete) {
        window.FlutterOnboarding.onComplete({
          success: true,
          message: 'Onboarding completed successfully'
        });
      } else {
        // Show success screen for standalone web only
        setSubmitted(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save payment details. Please try again.';
      alert(message);
    }
  };

  // Show success screen after submission
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-slate-900">
          {t('onboardingComplete') || 'Onboarding Complete!'}
        </h2>
        <p className="mb-6 text-sm text-slate-600">
          {t('onboardingCompleteDesc') || 'Your application has been submitted and is under review. You will be notified once verified.'}
        </p>
        <button
          onClick={() => {
            if (window.FlutterOnboarding?.onComplete) {
              window.FlutterOnboarding.onComplete({
                success: true,
                message: 'Onboarding completed'
              });
            } else if (window.FlutterOnboarding?.onCancel) {
              window.FlutterOnboarding.onCancel();
            }
          }}
          className="w-full max-w-xs rounded-lg bg-brand-600 px-6 py-4 text-base font-semibold text-white hover:bg-brand-700 shadow-md"
        >
          {t('close') || 'Close'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{t('paymentDetails')}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{t('paymentDetailsDesc')}</p>
      </div>

      {/* Account Name */}
      <div>
        <label className={labelClass}>
          {t('accountName')} <span className="text-rose-600">*</span>
        </label>
        <input
          type="text"
          {...register('accountName')}
          className={inputClass}
          placeholder="John Doe"
        />
        {errors.accountName && <p className={errorClass}>{errors.accountName.message}</p>}
      </div>

      <hr className="border-t border-slate-200" />

      {/* Address */}
      <div>
        <label className={labelClass}>
          {t('address')} <span className="text-rose-600">*</span>
        </label>
        <textarea
          {...register('address')}
          rows={3}
          className={inputClass}
          placeholder="Street, district, ward..."
        />
        {errors.address && <p className={errorClass}>{errors.address.message}</p>}
      </div>

      <hr className="border-t border-slate-200" />

      {/* Mobile Money Number */}
      <div>
        <label className={labelClass}>
          {t('mobileMoneyNumber')} <span className="text-rose-600">*</span>
        </label>
        <Controller
          name="mobileMoneyNumber"
          control={control}
          render={({ field }) => (
            <TanzaniaPhoneInput
              value={field.value || ''}
              onChange={field.onChange}
              className={inputClass}
              placeholder="712 345 678"
            />
          )}
        />
        {errors.mobileMoneyNumber && (
          <p className={errorClass}>{errors.mobileMoneyNumber.message}</p>
        )}
      </div>

      <hr className="border-t border-slate-200" />

      {/* Mobile Network */}
      <div>
        <label className={labelClass}>
          {t('mobileNetwork')} <span className="text-rose-600">*</span>
        </label>
        <div className="space-y-3">
          {MOBILE_NETWORKS.map((network) => (
            <label
              key={network.value}
              className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg cursor-pointer transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <input
                type="radio"
                value={network.value}
                {...register('mobileNetwork')}
                className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              {network.logo && (
                <img
                  src={network.logo}
                  alt={network.label}
                  className="h-8 w-auto object-contain"
                />
              )}
              <span className="text-sm font-medium text-slate-700">{network.label}</span>
            </label>
          ))}
        </div>
        {errors.mobileNetwork && <p className={errorClass}>{errors.mobileNetwork.message}</p>}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-6 mb-8 rounded-lg bg-brand-600 px-4 py-4 text-base font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
      >
        {isSubmitting ? t('submitting') : t('completeOnboarding')}
      </button>
    </form>
  );
}
