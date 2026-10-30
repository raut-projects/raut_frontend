import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vehicleInfoSchema } from '../../schemas/onboardingSchemas';
import useOnboardingStore from '../../store/onboardingStore';

export default function VehicleInfoStep() {
  const { vehicleInfo, updateVehicleInfo, nextStep, markStepComplete } =
    useOnboardingStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(vehicleInfoSchema),
    defaultValues: vehicleInfo,
  });

  const vehicleType = watch('vehicleType');

  const onSubmit = async (data) => {
    updateVehicleInfo(data);
    markStepComplete(3);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Information</h2>
        <p className="text-gray-600">
          Tell us about the vehicle you'll be driving.
        </p>
      </div>

      {/* Vehicle Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Vehicle Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-4">
          <label className={`
            relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
            ${vehicleType === 'car' ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'}
          `}>
            <input
              type="radio"
              value="car"
              {...register('vehicleType')}
              className="sr-only"
            />
            <span className="text-3xl mb-2">🚗</span>
            <span className="font-medium">Car</span>
          </label>

          <label className={`
            relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
            ${vehicleType === 'bajaj' ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'}
          `}>
            <input
              type="radio"
              value="bajaj"
              {...register('vehicleType')}
              className="sr-only"
            />
            <span className="text-3xl mb-2">🛺</span>
            <span className="font-medium">Bajaj</span>
          </label>

          <label className={`
            relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
            ${vehicleType === 'bodaboda' ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'}
          `}>
            <input
              type="radio"
              value="bodaboda"
              {...register('vehicleType')}
              className="sr-only"
            />
            <span className="text-3xl mb-2">🏍️</span>
            <span className="font-medium">Bodaboda</span>
          </label>
        </div>
        {errors.vehicleType && (
          <p className="mt-1 text-sm text-red-600">{errors.vehicleType.message}</p>
        )}
      </div>

      {/* Plate Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          License Plate Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('plateNumber')}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors uppercase ${
            errors.plateNumber ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="T123 ABC"
        />
        {errors.plateNumber && (
          <p className="mt-1 text-sm text-red-600">{errors.plateNumber.message}</p>
        )}
      </div>

      {/* Make, Model, Year */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Make <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('make')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
              errors.make ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Toyota"
          />
          {errors.make && (
            <p className="mt-1 text-sm text-red-600">{errors.make.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('model')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
              errors.model ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Corolla"
          />
          {errors.model && (
            <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('year')}
            maxLength={4}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
              errors.year ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="2020"
          />
          {errors.year && (
            <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
          )}
        </div>
      </div>

      {/* Color & Seats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('color')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
              errors.color ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="White"
          />
          {errors.color && (
            <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Seats <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            {...register('seats', { valueAsNumber: true })}
            min="1"
            max="50"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
              errors.seats ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="4"
          />
          {errors.seats && (
            <p className="mt-1 text-sm text-red-600">{errors.seats.message}</p>
          )}
        </div>
      </div>

      {/* Insurance */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Insurance Information</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Insurance Policy Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('insurancePolicyNumber')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
                errors.insurancePolicyNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="INS123456"
            />
            {errors.insurancePolicyNumber && (
              <p className="mt-1 text-sm text-red-600">
                {errors.insurancePolicyNumber.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Insurance Expiry Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('insuranceExpiryDate')}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
                errors.insuranceExpiryDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.insuranceExpiryDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.insuranceExpiryDate.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Next Step'}
        </button>
      </div>
    </form>
  );
}
