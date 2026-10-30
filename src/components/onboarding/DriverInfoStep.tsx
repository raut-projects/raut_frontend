import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { driverInfoSchema } from '../../schemas/onboardingSchemas';
import useOnboardingStore from '../../store/onboardingStore';

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const errorClass = "mt-1 block text-xs font-medium text-rose-600";

export default function DriverInfoStep() {
  const { driverInfo, updateDriverInfo, nextStep, markStepComplete } = useOnboardingStore();
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(driverInfoSchema),
    defaultValues: driverInfo,
  });

  const handleFileChange = (field: 'profilePhoto' | 'licensePhoto', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large (max 5MB)');
      return;
    }

    setValue(field, file);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (field === 'profilePhoto') setProfilePreview(reader.result as string);
      else setLicensePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: typeof driverInfo) => {
    updateDriverInfo(data);
    markStepComplete(2);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Driver Information</h3>
        <p className="mt-1 text-sm text-slate-500">
          Provide your identification and license details.
        </p>
      </div>

      {/* National ID Number */}
      <div>
        <label className={labelClass}>
          National ID Number <span className="text-rose-600">*</span>
        </label>
        <input
          type="text"
          {...register('nationalIdNumber')}
          className={inputClass}
          placeholder="At least 10 characters"
        />
        {errors.nationalIdNumber && <p className={errorClass}>{errors.nationalIdNumber.message}</p>}
      </div>

      {/* License Number */}
      <div>
        <label className={labelClass}>
          Driver's License Number <span className="text-rose-600">*</span>
        </label>
        <input
          type="text"
          {...register('licenseNumber')}
          className={inputClass}
          placeholder="At least 8 characters"
        />
        {errors.licenseNumber && <p className={errorClass}>{errors.licenseNumber.message}</p>}
      </div>

      {/* Profile Photo */}
      <div>
        <label className={labelClass}>
          Profile Photo <span className="text-rose-600">*</span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange('profilePhoto', e)}
          className="hidden"
          id="profilePhoto"
        />
        <label
          htmlFor="profilePhoto"
          className={`flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            errors.profilePhoto ? 'border-rose-300 bg-rose-50' : profilePreview ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
          }`}
        >
          {profilePreview ? (
            <div className="text-center">
              <img src={profilePreview} alt="Profile" className="w-20 h-20 object-cover rounded-full mx-auto mb-2 border-2 border-slate-200" />
              <p className="text-xs font-medium text-emerald-700">Uploaded</p>
            </div>
          ) : (
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-xs text-slate-600">Upload Profile Photo</p>
              <p className="text-xs text-slate-400 mt-0.5">JPG, PNG (max 5MB)</p>
            </div>
          )}
        </label>
        {errors.profilePhoto && <p className={errorClass}>{errors.profilePhoto.message as string}</p>}
      </div>

      {/* License Photo (Optional) */}
      <div>
        <label className={labelClass}>
          Driver's License Photo (Optional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange('licensePhoto', e)}
          className="hidden"
          id="licensePhoto"
        />
        <label
          htmlFor="licensePhoto"
          className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-slate-200 bg-slate-50 hover:border-slate-300"
        >
          {licensePreview ? (
            <div className="text-center">
              <img src={licensePreview} alt="License" className="max-h-24 mx-auto mb-2 rounded border border-slate-200" />
              <p className="text-xs font-medium text-emerald-700">Uploaded</p>
            </div>
          ) : (
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-xs text-slate-600">Upload License Photo</p>
              <p className="text-xs text-slate-400 mt-0.5">JPG, PNG (max 5MB)</p>
            </div>
          )}
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-5">
        <p className="text-xs font-medium text-slate-500">Step 2 of 4</p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </form>
  );
}
