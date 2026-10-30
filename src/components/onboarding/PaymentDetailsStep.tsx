import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentDetailsSchema } from '../../schemas/onboardingSchemas';
import useOnboardingStore from '../../store/onboardingStore';
import { AppColors } from '../../styles/theme';

declare global {
  interface Window {
    FlutterOnboarding?: {
      onComplete: (result: unknown) => void;
    };
  }
}

const MOBILE_NETWORKS = [
  { value: 'vodacom', label: 'VODACOM (M-Pesa)', logo: null },
  { value: 'airtel', label: 'AIRTEL (Airtel Money)', logo: '/assets/images/airtel.png' },
  { value: 'halotel', label: 'HALOTEL (HaloPesa)', logo: '/assets/images/halopesa.png' },
  { value: 'mixx', label: 'MIXX BY YASS', logo: '/assets/images/yas.png' },
];

export default function PaymentDetailsStep() {
  const { paymentDetails, updatePaymentDetails } = useOnboardingStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(paymentDetailsSchema),
    defaultValues: paymentDetails,
  });

  const onSubmit = async (data: typeof paymentDetails) => {
    updatePaymentDetails(data);

    // This is the final step - submit to backend
    try {
      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalInfo: useOnboardingStore.getState().personalInfo,
          driverInfo: useOnboardingStore.getState().driverInfo,
          vehicleInfo: useOnboardingStore.getState().vehicleInfo,
          paymentDetails: data,
        }),
      });

      if (response.ok) {
        // Notify Flutter
        if (window.FlutterOnboarding?.onComplete) {
          window.FlutterOnboarding.onComplete({ success: true });
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  const inputClass = `w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:outline-none transition-colors`;
  const errorInputClass = `border-red-500 focus:ring-red-200`;
  const normalInputClass = `border-gray-300 focus:border-black focus:ring-gray-200`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="mb-6">
        <img src="/assets/images/app_icon.png" alt="RAUT" className="w-16 h-16 rounded-2xl mb-4" />
        <h2 className="text-3xl font-bold mb-2" style={{ color: AppColors.textPrimary }}>
          Payment Details
        </h2>
        <p style={{ color: AppColors.textTertiary }}>
          Where should we send your earnings?
        </p>
      </div>

      {/* Account Name */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: AppColors.textPrimary }}>
          Account Name <span style={{ color: AppColors.error }}>*</span>
        </label>
        <input
          type="text"
          {...register('accountName')}
          className={`${inputClass} ${errors.accountName ? errorInputClass : normalInputClass}`}
          placeholder="John Doe"
        />
        {errors.accountName && <p className="mt-1 text-sm" style={{ color: AppColors.error }}>{errors.accountName.message}</p>}
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: AppColors.textPrimary }}>
          Address <span style={{ color: AppColors.error }}>*</span>
        </label>
        <textarea
          {...register('address')}
          rows={3}
          className={`${inputClass} ${errors.address ? errorInputClass : normalInputClass}`}
          placeholder="Street, district, ward..."
        />
        {errors.address && <p className="mt-1 text-sm" style={{ color: AppColors.error }}>{errors.address.message}</p>}
      </div>

      {/* Mobile Money Number */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: AppColors.textPrimary }}>
          Mobile Money Number <span style={{ color: AppColors.error }}>*</span>
        </label>
        <input
          type="tel"
          {...register('mobileMoneyNumber')}
          className={`${inputClass} ${errors.mobileMoneyNumber ? errorInputClass : normalInputClass}`}
          placeholder="+255 712 345 678"
        />
        {errors.mobileMoneyNumber && (
          <p className="mt-1 text-sm" style={{ color: AppColors.error }}>{errors.mobileMoneyNumber.message}</p>
        )}
      </div>

      {/* Mobile Network */}
      <div>
        <label className="block text-sm font-semibold mb-3" style={{ color: AppColors.textPrimary }}>
          Mobile Network <span style={{ color: AppColors.error }}>*</span>
        </label>
        <div className="space-y-3">
          {MOBILE_NETWORKS.map((network) => (
            <label
              key={network.value}
              className="flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-colors hover:border-gray-400"
              style={{
                borderColor: AppColors.cardBorder,
                backgroundColor: AppColors.inputFill,
              }}
            >
              <input
                type="radio"
                value={network.value}
                {...register('mobileNetwork')}
                className="w-5 h-5"
              />
              {network.logo && (
                <img
                  src={network.logo}
                  alt={network.label}
                  className="h-8 w-auto object-contain"
                />
              )}
              <span className="font-medium" style={{ color: AppColors.textPrimary }}>
                {network.label}
              </span>
            </label>
          ))}
        </div>
        {errors.mobileNetwork && (
          <p className="mt-1 text-sm" style={{ color: AppColors.error }}>{errors.mobileNetwork.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-between items-center pt-6 border-t" style={{ borderColor: AppColors.divider }}>
        <p className="text-sm font-semibold" style={{ color: AppColors.textSecondary }}>
          Step 4 of 4
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 rounded-2xl font-semibold transition-opacity disabled:opacity-50"
          style={{
            backgroundColor: AppColors.primary,
            color: AppColors.textOnPrimary,
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Complete Onboarding'}
        </button>
      </div>
    </form>
  );
}
