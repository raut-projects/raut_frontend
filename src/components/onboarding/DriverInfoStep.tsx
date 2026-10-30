import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { driverInfoSchema } from '../../schemas/onboardingSchemas';
import useOnboardingStore from '../../store/onboardingStore';

export default function DriverInfoStep() {
  const { driverInfo, updateDriverInfo, nextStep, markStepComplete } =
    useOnboardingStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(driverInfoSchema),
    defaultValues: driverInfo,
  });

  const onSubmit = async (data) => {
    updateDriverInfo(data);
    markStepComplete(2);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Driver Information</h2>
        <p className="text-gray-600">
          Tell us about your driving experience and license details.
        </p>
      </div>

      {/* License Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Driver's License Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('licenseNumber')}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
            errors.licenseNumber ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="ABC1234567"
        />
        {errors.licenseNumber && (
          <p className="mt-1 text-sm text-red-600">{errors.licenseNumber.message}</p>
        )}
      </div>

      {/* License Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Issue Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register('licenseIssueDate')}
            max={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
              errors.licenseIssueDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.licenseIssueDate && (
            <p className="mt-1 text-sm text-red-600">{errors.licenseIssueDate.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiry Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register('licenseExpiryDate')}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
              errors.licenseExpiryDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.licenseExpiryDate && (
            <p className="mt-1 text-sm text-red-600">{errors.licenseExpiryDate.message}</p>
          )}
        </div>
      </div>

      {/* Years of Experience */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Years of Driving Experience <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          {...register('yearsOfExperience')}
          min="0"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
            errors.yearsOfExperience ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="5"
        />
        {errors.yearsOfExperience && (
          <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience.message}</p>
        )}
      </div>

      {/* Previous Employer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Previous Employer (Optional)
        </label>
        <input
          type="text"
          {...register('previousEmployer')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
          placeholder="Uber, Bolt, etc."
        />
      </div>

      {/* Emergency Contact */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('emergencyContactName')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
                errors.emergencyContactName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Jane Doe"
            />
            {errors.emergencyContactName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.emergencyContactName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              {...register('emergencyContactPhone')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
                errors.emergencyContactPhone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+255 712 345 678"
            />
            {errors.emergencyContactPhone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.emergencyContactPhone.message}
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
