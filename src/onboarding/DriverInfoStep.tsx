import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { driverInfoSchema } from '../schemas/onboardingSchemas';
import useOnboardingStore from '../store/onboardingStore';
import { useTranslation } from '../lib/i18n';
import { uploadDocument } from '../services/uploads';
import { apiPut } from '../services/api';

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";
const labelClass = "mb-1 block text-xs font-medium text-slate-700";
const errorClass = "mt-1 text-xs text-rose-600";

export default function DriverInfoStep() {
  const { driverInfo, updateDriverInfo, nextStep, markStepComplete, language, personalInfo } = useOnboardingStore();
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const t = useTranslation(language);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(driverInfoSchema),
    defaultValues: driverInfo,
  });

  const profilePhotoUrl = watch('profilePhotoUrl');
  const licensePhotoUrl = watch('licensePhotoUrl');

  const handleFileUpload = async (field: 'profilePhotoUrl' | 'licensePhotoUrl', file: File) => {
    const docType = field === 'profilePhotoUrl' ? 'profile_photo' : 'license';

    setUploading((prev) => ({ ...prev, [field]: true }));
    setUploadErrors((prev) => ({ ...prev, [field]: '' }));

    try {
      const result = await uploadDocument(file, docType);

      setValue(field, result.file_url);
      updateDriverInfo({ [field]: result.file_url });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      setUploadErrors((prev) => ({ ...prev, [field]: message }));
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleFileChange = (field: 'profilePhotoUrl' | 'licensePhotoUrl', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadErrors((prev) => ({ ...prev, [field]: 'Image too large (max 5MB)' }));
      return;
    }

    handleFileUpload(field, file);
  };

  const handleReplacePhoto = (field: 'profilePhotoUrl' | 'licensePhotoUrl') => {
    // Trigger file input - new upload will replace the old one in backend
    document.getElementById(field)?.click();
  };

  const onSubmit = async (data: typeof driverInfo) => {
    try {
      // Update profile with personal + driver info
      // Profile photo URL is saved in profile, license photo is only in documents table
      await apiPut('/users/me', {
        full_name: `${personalInfo.firstName} ${personalInfo.lastName}`,
        email: personalInfo.email,
        language_preference: personalInfo.languagePreference,
        national_id_number: data.nationalIdNumber.toUpperCase(),
        driver_license_number: data.licenseNumber.toUpperCase(),
        profile_photo_url: data.profilePhotoUrl,
      });

      updateDriverInfo(data);
      markStepComplete(2);
      nextStep();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to save driver information. Please try again.');
    }
  };

  const renderPhotoUpload = (
    field: 'profilePhotoUrl' | 'licensePhotoUrl',
    label: string
  ) => {
    const url = field === 'profilePhotoUrl' ? profilePhotoUrl : licensePhotoUrl;
    const isUploading = uploading[field];
    const uploadError = uploadErrors[field] || (errors[field]?.message as string);

    return (
      <div>
        <label className={labelClass}>
          {label} <span className="text-rose-600">*</span>
        </label>

        {url ? (
          // Show uploaded photo with replace button
          <div className="relative group rounded-lg overflow-hidden border-2 border-emerald-500">
            <img
              src={url}
              alt={label}
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
              <div className="w-full p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-white">{t('uploaded')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleReplacePhoto(field)}
                  className="px-3 py-1.5 bg-white/95 hover:bg-white text-slate-900 rounded-md text-xs font-semibold transition-colors"
                >
                  Replace
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Show upload prompt
          <label
            htmlFor={field}
            className={`flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              uploadError
                ? 'border-rose-300 bg-rose-50'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
            }`}
          >
            {isUploading ? (
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs text-slate-600">Uploading...</p>
              </div>
            ) : (
              <div className="text-center">
                <svg className="w-10 h-10 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-xs text-slate-600">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t('jpgPngMax')}</p>
              </div>
            )}
          </label>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(field, e)}
          className="hidden"
          id={field}
          disabled={isUploading}
        />

        {uploadError && <p className={errorClass}>{uploadError}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{t('driverInformation')}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{t('driverInfoDesc')}</p>
      </div>

      {/* National ID Number */}
      <div>
        <label className={labelClass}>
          {t('nationalIdNumber')} <span className="text-rose-600">*</span>
        </label>
        <input
          type="text"
          {...register('nationalIdNumber')}
          className={`${inputClass} uppercase`}
          placeholder={t('nationalIdNumber')}
        />
        {errors.nationalIdNumber && <p className={errorClass}>{errors.nationalIdNumber.message}</p>}
      </div>

      {/* License Number */}
      <div>
        <label className={labelClass}>
          {t('licenseNumber')} <span className="text-rose-600">*</span>
        </label>
        <input
          type="text"
          {...register('licenseNumber')}
          className={`${inputClass} uppercase`}
          placeholder={t('licenseNumber')}
        />
        {errors.licenseNumber && <p className={errorClass}>{errors.licenseNumber.message}</p>}
      </div>

      {/* Profile Photo */}
      {renderPhotoUpload('profilePhotoUrl', t('profilePhoto'))}

      {/* License Photo */}
      {renderPhotoUpload('licensePhotoUrl', t('licensePhoto'))}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || Object.values(uploading).some(Boolean)}
        className="w-full mt-5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? t('saving') : t('continue')}
      </button>
    </form>
  );
}
