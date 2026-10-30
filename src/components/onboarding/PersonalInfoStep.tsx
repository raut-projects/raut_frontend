import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalInfoSchema } from '../../schemas/onboardingSchemas';
import useOnboardingStore from '../../store/onboardingStore';

export default function PersonalInfoStep() {
  const { personalInfo, updatePersonalInfo, nextStep, markStepComplete } =
    useOnboardingStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: personalInfo,
  });

  const onSubmit = async (data) => {
    updatePersonalInfo(data);
    markStepComplete(1);
    nextStep();
  };

  const regions = [
    'Dar es Salaam',
    'Arusha',
    'Dodoma',
    'Geita',
    'Iringa',
    'Kagera',
    'Katavi',
    'Kigoma',
    'Kilimanjaro',
    'Lindi',
    'Manyara',
    'Mara',
    'Mbeya',
    'Morogoro',
    'Mtwara',
    'Mwanza',
    'Njombe',
    'Pemba North',
    'Pemba South',
    'Pwani',
    'Rukwa',
    'Ruvuma',
    'Shinyanga',
    'Simiyu',
    'Singida',
    'Tabora',
    'Tanga',
    'Zanzibar North',
    'Zanzibar South',
    'Zanzibar West',
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600">
          Let's start with your basic information. All fields are required.
        </p>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('fullName')}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
            errors.fullName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="John Doe"
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          {...register('phone')}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="+255 712 345 678"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address (Optional)
        </label>
        <input
          type="email"
          {...register('email')}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="john@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Date of Birth */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date of Birth <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          {...register('dateOfBirth')}
          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18))
            .toISOString()
            .split('T')[0]}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
            errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.dateOfBirth && (
          <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
        )}
      </div>

      {/* NIN */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          National ID Number (NIN)
        </label>
        <input
          type="text"
          {...register('nin')}
          maxLength={20}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
            errors.nin ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="20 digits"
        />
        {errors.nin && (
          <p className="mt-1 text-sm text-red-600">{errors.nin.message}</p>
        )}
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('address')}
          rows={3}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
            errors.address ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Street, district, ward..."
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
        )}
      </div>

      {/* City & Region */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('city')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Dar es Salaam"
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Region <span className="text-red-500">*</span>
          </label>
          <select
            {...register('region')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors ${
              errors.region ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select region</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          {errors.region && (
            <p className="mt-1 text-sm text-red-600">{errors.region.message}</p>
          )}
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
