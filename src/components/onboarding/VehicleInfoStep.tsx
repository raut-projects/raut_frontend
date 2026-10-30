import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vehicleInfoSchema } from '../../schemas/onboardingSchemas';
import useOnboardingStore from '../../store/onboardingStore';
import { AppColors } from '../../styles/theme';

const VEHICLE_TYPES = [
  { value: 'boda', label: 'Bodaboda', image: '/assets/images/boda.png', seats: 1 },
  { value: 'car', label: 'Car', image: '/assets/images/car-pr.png', seats: 4 },
  { value: 'bajaji', label: 'Bajaji', image: '/assets/images/bajaji-pr.png', seats: 3 },
] as const;

const COLORS = [
  { value: 'White', hex: '#F5F5F5' },
  { value: 'Black', hex: '#212121' },
  { value: 'Silver', hex: '#BDBDBD' },
  { value: 'Grey', hex: '#9E9E9E' },
  { value: 'Red', hex: '#E53935' },
  { value: 'Blue', hex: '#1E88E5' },
  { value: 'Green', hex: '#43A047' },
  { value: 'Brown', hex: '#8D6E63' },
  { value: 'Yellow', hex: '#FFD54F' },
  { value: 'Orange', hex: '#FF9800' },
];

const OWNERSHIP_TYPES = [
  { value: 'fully_paid', label: 'Fully Paid' },
  { value: 'financed', label: 'Financed' },
  { value: 'lease_individual', label: 'Lease (Individual)' },
  { value: 'lease_company', label: 'Lease (Company)' },
  { value: 'work_to_own', label: 'Work to Own' },
];

const YEARS = Array.from({ length: 17 }, (_, i) => 2026 - i);

export default function VehicleInfoStep() {
  const { vehicleInfo, updateVehicleInfo, nextStep, markStepComplete } = useOnboardingStore();
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(vehicleInfoSchema),
    defaultValues: vehicleInfo,
  });

  const vehicleType = watch('vehicleType');

  const handleVehicleTypeChange = (type: 'boda' | 'car' | 'bajaji') => {
    const typeData = VEHICLE_TYPES.find((t) => t.value === type);
    setValue('vehicleType', type);
    if (typeData) {
      setValue('availableSeats', typeData.seats);
    }
  };

  const handleFileChange = (
    field: 'frontPhoto' | 'rearPhoto' | 'insuranceDoc' | 'vehicleCardDoc' | 'latraStickerDoc',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large (max 5MB)');
      return;
    }

    setValue(field, file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: typeof vehicleInfo) => {
    updateVehicleInfo(data);
    markStepComplete(3);
    nextStep();
  };

  const inputClass = `w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:outline-none transition-colors`;
  const errorInputClass = `border-red-500 focus:ring-red-200`;
  const normalInputClass = `border-gray-300 focus:border-black focus:ring-gray-200`;

  const renderFileUpload = (
    field: 'frontPhoto' | 'rearPhoto' | 'insuranceDoc' | 'vehicleCardDoc' | 'latraStickerDoc',
    label: string
  ) => {
    const hasFile = previews[field];
    const error = errors[field];

    return (
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: AppColors.textPrimary }}>
          {label} <span style={{ color: AppColors.error }}>*</span>
        </label>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => handleFileChange(field, e)}
          className="hidden"
          id={field}
        />
        <label
          htmlFor={field}
          className={`flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
            error ? 'border-red-500 bg-red-50' : hasFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          style={!error && !hasFile ? { backgroundColor: AppColors.inputFill } : undefined}
        >
          {hasFile ? (
            <div className="text-center">
              <img src={hasFile} alt={label} className="max-h-24 mx-auto rounded mb-2" />
              <p className="text-sm font-medium" style={{ color: AppColors.success }}>
                Uploaded
              </p>
            </div>
          ) : (
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2" style={{ color: AppColors.textTertiary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm" style={{ color: AppColors.textSecondary }}>
                {label}
              </p>
              <p className="text-xs mt-1" style={{ color: AppColors.textTertiary }}>
                JPG, PNG (max 5MB)
              </p>
            </div>
          )}
        </label>
        {error && <p className="mt-1 text-sm" style={{ color: AppColors.error }}>{error.message as string}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="mb-6">
        <img src="/assets/images/app_icon.png" alt="RAUT" className="w-16 h-16 rounded-2xl mb-4" />
        <h2 className="text-3xl font-bold mb-2" style={{ color: AppColors.textPrimary }}>
          Vehicle Information
        </h2>
        <p style={{ color: AppColors.textTertiary }}>
          Tell us about the vehicle you'll be driving.
        </p>
      </div>

      {/* Vehicle Type */}
      <div>
        <label className="block text-sm font-semibold mb-3" style={{ color: AppColors.textPrimary }}>
          Vehicle Type <span style={{ color: AppColors.error }}>*</span>
        </label>
        <div className="grid grid-cols-3 gap-4">
          {VEHICLE_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleVehicleTypeChange(type.value)}
              className="p-4 border-2 rounded-2xl transition-all"
              style={{
                borderColor: vehicleType === type.value ? AppColors.primary : AppColors.cardBorder,
                backgroundColor: vehicleType === type.value ? AppColors.inputFill : AppColors.surface,
              }}
            >
              <img
                src={type.image}
                alt={type.label}
                className="w-20 h-20 mx-auto mb-2"
                style={{
                  opacity: vehicleType === type.value ? 1 : 0.5,
                }}
              />
              <div className="text-sm font-semibold" style={{ color: vehicleType === type.value ? AppColors.primary : AppColors.textSecondary }}>
                {type.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Plate Number */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: AppColors.textPrimary }}>
          License Plate Number <span style={{ color: AppColors.error }}>*</span>
        </label>
        <input
          type="text"
          {...register('plateNumber')}
          className={`${inputClass} ${errors.plateNumber ? errorInputClass : normalInputClass} uppercase`}
          placeholder="T123 ABC"
        />
        {errors.plateNumber && <p className="mt-1 text-sm" style={{ color: AppColors.error }}>{errors.plateNumber.message}</p>}
      </div>

      {/* Manufacturer & Model */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: AppColors.textPrimary }}>
            Manufacturer <span style={{ color: AppColors.error }}>*</span>
          </label>
          <input
            type="text"
            {...register('manufacturer')}
            className={`${inputClass} ${errors.manufacturer ? errorInputClass : normalInputClass}`}
            placeholder="Toyota"
          />
          {errors.manufacturer && <p className="mt-1 text-sm" style={{ color: AppColors.error }}>{errors.manufacturer.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: AppColors.textPrimary }}>
            Model <span style={{ color: AppColors.error }}>*</span>
          </label>
          <input
            type="text"
            {...register('model')}
            className={`${inputClass} ${errors.model ? errorInputClass : normalInputClass}`}
            placeholder="Corolla"
          />
          {errors.model && <p className="mt-1 text-sm" style={{ color: AppColors.error }}>{errors.model.message}</p>}
        </div>
      </div>

      {/* Year & Color */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: AppColors.textPrimary }}>
            Year <span style={{ color: AppColors.error }}>*</span>
          </label>
          <select
            {...register('year', { valueAsNumber: true })}
            className={`${inputClass} ${errors.year ? errorInputClass : normalInputClass}`}
          >
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {errors.year && <p className="mt-1 text-sm" style={{ color: AppColors.error }}>{errors.year.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: AppColors.textPrimary }}>
            Color <span style={{ color: AppColors.error }}>*</span>
          </label>
          <select
            {...register('color')}
            className={`${inputClass} ${errors.color ? errorInputClass : normalInputClass}`}
          >
            <option value="">Select color</option>
            {COLORS.map((color) => (
              <option key={color.value} value={color.value}>
                {color.value}
              </option>
            ))}
          </select>
          {errors.color && <p className="mt-1 text-sm" style={{ color: AppColors.error }}>{errors.color.message}</p>}
        </div>
      </div>

      {/* Seats & Ownership */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: AppColors.textPrimary }}>
            Available Seats <span style={{ color: AppColors.error }}>*</span>
          </label>
          <input
            type="number"
            {...register('availableSeats', { valueAsNumber: true })}
            min="1"
            max="50"
            className={`${inputClass} ${errors.availableSeats ? errorInputClass : normalInputClass}`}
          />
          {errors.availableSeats && <p className="mt-1 text-sm" style={{ color: AppColors.error }}>{errors.availableSeats.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: AppColors.textPrimary }}>
            Ownership Type <span style={{ color: AppColors.error }}>*</span>
          </label>
          <select
            {...register('ownershipType')}
            className={`${inputClass} ${errors.ownershipType ? errorInputClass : normalInputClass}`}
          >
            {OWNERSHIP_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.ownershipType && <p className="mt-1 text-sm" style={{ color: AppColors.error }}>{errors.ownershipType.message}</p>}
        </div>
      </div>

      {/* Owner Details */}
      <div className="border-t pt-6" style={{ borderColor: AppColors.divider }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: AppColors.textPrimary }}>
          Owner Details
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: AppColors.textPrimary }}>
              Owner Name <span style={{ color: AppColors.error }}>*</span>
            </label>
            <input
              type="text"
              {...register('ownerName')}
              className={`${inputClass} ${errors.ownerName ? errorInputClass : normalInputClass}`}
              placeholder="John Doe"
            />
            {errors.ownerName && <p className="mt-1 text-sm" style={{ color: AppColors.error }}>{errors.ownerName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: AppColors.textPrimary }}>
                Owner Email <span style={{ color: AppColors.error }}>*</span>
              </label>
              <input
                type="email"
                {...register('ownerEmail')}
                className={`${inputClass} ${errors.ownerEmail ? errorInputClass : normalInputClass}`}
                placeholder="owner@example.com"
              />
              {errors.ownerEmail && <p className="mt-1 text-sm" style={{ color: AppColors.error }}>{errors.ownerEmail.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: AppColors.textPrimary }}>
                Owner Phone <span style={{ color: AppColors.error }}>*</span>
              </label>
              <input
                type="tel"
                {...register('ownerPhone')}
                className={`${inputClass} ${errors.ownerPhone ? errorInputClass : normalInputClass}`}
                placeholder="+255 712 345 678"
              />
              {errors.ownerPhone && <p className="mt-1 text-sm" style={{ color: AppColors.error }}>{errors.ownerPhone.message}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Photos & Documents */}
      <div className="border-t pt-6" style={{ borderColor: AppColors.divider }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: AppColors.textPrimary }}>
          Vehicle Photos & Documents
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {renderFileUpload('frontPhoto', 'Front Photo')}
          {renderFileUpload('rearPhoto', 'Rear Photo')}
          {renderFileUpload('insuranceDoc', 'Insurance Document')}
          {renderFileUpload('vehicleCardDoc', 'Vehicle Card')}
        </div>
        <div className="mt-4">
          {renderFileUpload('latraStickerDoc', 'LATRA Sticker Photo')}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-between items-center pt-6 border-t" style={{ borderColor: AppColors.divider }}>
        <p className="text-sm font-semibold" style={{ color: AppColors.textSecondary }}>
          Step 3 of 4
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
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </form>
  );
}
