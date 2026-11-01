import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vehicleInfoSchema } from '../schemas/onboardingSchemas';
import useOnboardingStore from '../store/onboardingStore';
import TanzaniaPhoneInput from '../components/TanzaniaPhoneInput';
import { useTranslation } from '../lib/i18n';
import { uploadDocument } from '../services/uploads';
import { apiPost } from '../services/api';

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";
const labelClass = "mb-1 block text-xs font-medium text-slate-700";
const errorClass = "mt-1 text-xs text-rose-600";

const VEHICLE_TYPES = [
  { value: 'boda', labelKey: 'bodaboda', image: '/assets/images/boda.png', seats: 1 },
  { value: 'car', labelKey: 'car', image: '/assets/images/car-pr.png', seats: 4 },
  { value: 'bajaji', labelKey: 'bajaji', image: '/assets/images/bajaji-pr.png', seats: 3 },
] as const;

const COLOR_OPTIONS = [
  { labelKey: 'white', value: 'White', color: '#F5F5F5' },
  { labelKey: 'black', value: 'Black', color: '#212121' },
  { labelKey: 'silver', value: 'Silver', color: '#BDBDBD' },
  { labelKey: 'grey', value: 'Grey', color: '#9E9E9E' },
  { labelKey: 'red', value: 'Red', color: '#E53935' },
  { labelKey: 'blue', value: 'Blue', color: '#1E88E5' },
  { labelKey: 'green', value: 'Green', color: '#43A047' },
  { labelKey: 'brown', value: 'Brown', color: '#8D6E63' },
  { labelKey: 'yellow', value: 'Yellow', color: '#FFD54F' },
  { labelKey: 'orange', value: 'Orange', color: '#FF9800' },
];

const OWNERSHIP_TYPES = [
  { value: 'fully_paid', labelKey: 'ownerFullyPaid' },
  { value: 'financed', labelKey: 'ownerFinanced' },
  { value: 'lease_individual', labelKey: 'leaseIndividual' },
  { value: 'lease_company', labelKey: 'leaseCompany' },
  { value: 'work_to_own', labelKey: 'workToOwn' },
];

const YEARS = Array.from({ length: 17 }, (_, i) => 2026 - i);

interface VehicleData {
  categories: Array<{
    category: string;
    manufacturers: Array<{
      name: string;
      models: string[];
    }>;
  }>;
}

export default function VehicleInfoStep() {
  const { vehicleInfo, updateVehicleInfo, nextStep, markStepComplete, language } = useOnboardingStore();
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const t = useTranslation(language);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(vehicleInfoSchema),
    defaultValues: vehicleInfo,
  });

  const vehicleType = watch('vehicleType');
  const selectedManufacturer = watch('manufacturer');
  const selectedColor = watch('color');

  // Load vehicle data
  useEffect(() => {
    fetch('/data/vehicle.json')
      .then((res) => res.json())
      .then((data) => setVehicleData(data))
      .catch((err) => console.error('Failed to load vehicle data:', err));
  }, []);

  // Update manufacturers when vehicle type changes
  useEffect(() => {
    if (!vehicleData || !vehicleType) return;

    const categoryMap: Record<string, string> = {
      boda: 'Motorcycles (Boda Boda)',
      car: 'Passenger Cars & Light Vehicles',
      bajaji: 'Bajaji',
    };

    const category = vehicleData.categories.find(
      (c) => c.category === categoryMap[vehicleType]
    );

    if (category) {
      const manufacturerNames = category.manufacturers.map((m) => m.name);
      setManufacturers(manufacturerNames);
    } else {
      setManufacturers([]);
    }

    // Reset manufacturer and model when type changes
    setValue('manufacturer', '');
    setValue('model', '');
    setModels([]);
  }, [vehicleType, vehicleData, setValue]);

  // Update models when manufacturer changes
  useEffect(() => {
    if (!vehicleData || !vehicleType || !selectedManufacturer) {
      setModels([]);
      return;
    }

    const categoryMap: Record<string, string> = {
      boda: 'Motorcycles (Boda Boda)',
      car: 'Passenger Cars & Light Vehicles',
      bajaji: 'Bajaji',
    };

    const category = vehicleData.categories.find(
      (c) => c.category === categoryMap[vehicleType]
    );

    const manufacturer = category?.manufacturers.find(
      (m) => m.name === selectedManufacturer
    );

    if (manufacturer) {
      setModels(manufacturer.models);
    } else {
      setModels([]);
    }

    // Reset model when manufacturer changes
    setValue('model', '');
  }, [selectedManufacturer, vehicleType, vehicleData, setValue]);

  const handleVehicleTypeChange = (type: 'boda' | 'car' | 'bajaji') => {
    const typeData = VEHICLE_TYPES.find((t) => t.value === type);
    setValue('vehicleType', type);
    if (typeData) setValue('availableSeats', typeData.seats);
  };

  // Map form fields to backend doc_type
  const getDocType = (field: string): string => {
    const mapping: Record<string, string> = {
      frontPhotoUrl: 'vehicle_photo',
      rearPhotoUrl: 'vehicle_photo',
      insuranceDocUrl: 'insurance',
      vehicleCardDocUrl: 'registration',
      latraStickerDocUrl: 'sticker_photo',
    };
    return mapping[field] || 'vehicle_photo';
  };

  const handleFileUpload = async (
    field: 'frontPhotoUrl' | 'rearPhotoUrl' | 'insuranceDocUrl' | 'vehicleCardDocUrl' | 'latraStickerDocUrl',
    file: File
  ) => {
    const docType = getDocType(field);

    setUploading((prev) => ({ ...prev, [field]: true }));
    setUploadErrors((prev) => ({ ...prev, [field]: '' }));

    try {
      const result = await uploadDocument(file, docType);

      setValue(field, result.file_url);
      updateVehicleInfo({ [field]: result.file_url });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      setUploadErrors((prev) => ({ ...prev, [field]: message }));
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleFileChange = (
    field: 'frontPhotoUrl' | 'rearPhotoUrl' | 'insuranceDocUrl' | 'vehicleCardDocUrl' | 'latraStickerDocUrl',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadErrors((prev) => ({ ...prev, [field]: 'File too large (max 5MB)' }));
      return;
    }

    handleFileUpload(field, file);
  };

  const handleReplaceFile = (field: string) => {
    document.getElementById(field)?.click();
  };

  const onSubmit = async (data: typeof vehicleInfo) => {
    try {
      // Create vehicle with photo URLs
      const response = await apiPost('/drivers/vehicles', {
        make: data.manufacturer,
        vehicle_type: data.vehicleType,
        model: data.model,
        year: data.year,
        color: data.color,
        plate_number: data.plateNumber.toUpperCase(),
        available_seats: data.availableSeats,
        owner_name: data.ownerName,
        owner_email: data.ownerEmail,
        owner_phone: data.ownerPhone,
        ownership_type: data.ownershipType,
        front_photo_url: data.frontPhotoUrl,
        rear_photo_url: data.rearPhotoUrl,
      });

      // Backend auto-links documents with vehicle_id
      const vehicle = response.data;

      updateVehicleInfo({ ...data, vehicleId: vehicle.id });
      markStepComplete(3);
      nextStep();
    } catch (error) {
      console.error('Error creating vehicle:', error);
      alert('Failed to save vehicle information. Please try again.');
    }
  };

  const renderFileUpload = (
    field: 'frontPhotoUrl' | 'rearPhotoUrl' | 'insuranceDocUrl' | 'vehicleCardDocUrl' | 'latraStickerDocUrl',
    label: string
  ) => {
    const url = watch(field);
    const isUploading = uploading[field];
    const uploadError = uploadErrors[field] || (errors[field]?.message as string);

    return (
      <div>
        <label className={labelClass}>
          {label} <span className="text-rose-600">*</span>
        </label>

        {url ? (
          // Show uploaded file with replace button
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
                  onClick={() => handleReplaceFile(field)}
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
                <svg
                  className="w-8 h-8 mx-auto mb-2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-xs text-slate-600">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t('jpgPngMax')}</p>
            </div>
          )}
        </label>
        )}

        <input
          type="file"
          accept="image/*,application/pdf"
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
        <h2 className="text-base font-semibold text-slate-900">{t('vehicleInformation')}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{t('vehicleInfoDesc')}</p>
      </div>

      {/* Vehicle Type */}
      <div>
        <label className={labelClass}>
          {t('vehicleType')} <span className="text-rose-600">*</span>
        </label>
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide">
          {VEHICLE_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleVehicleTypeChange(type.value)}
              className={`flex-shrink-0 w-32 p-4 border-2 rounded-xl transition-all ${
                vehicleType === type.value
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <img
                src={type.image}
                alt={type.label}
                className="w-20 h-20 mx-auto mb-2 object-contain"
                style={{ opacity: vehicleType === type.value ? 1 : 0.6 }}
              />
              <div className="text-xs font-semibold text-slate-700">{t(type.labelKey as any)}</div>
            </button>
          ))}
        </div>
        {errors.vehicleType && <p className={errorClass}>{errors.vehicleType.message}</p>}
      </div>

      {/* Plate Number */}
      <div>
        <label className={labelClass}>
          {t('licensePlateNumber')} <span className="text-rose-600">*</span>
        </label>
        <input
          type="text"
          {...register('plateNumber')}
          className={`${inputClass} uppercase`}
          placeholder="T123 ABC"
        />
        {errors.plateNumber && <p className={errorClass}>{errors.plateNumber.message}</p>}
      </div>

      {/* Manufacturer & Model */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            {t('manufacturer')} <span className="text-rose-600">*</span>
          </label>
          <select {...register('manufacturer')} className={inputClass} disabled={!vehicleType}>
            <option value="">{t('selectManufacturer')}</option>
            {manufacturers.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
          {errors.manufacturer && <p className={errorClass}>{errors.manufacturer.message}</p>}
        </div>

        <div>
          <label className={labelClass}>
            {t('model')} <span className="text-rose-600">*</span>
          </label>
          <select {...register('model')} className={inputClass} disabled={!selectedManufacturer}>
            <option value="">{t('selectModel')}</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          {errors.model && <p className={errorClass}>{errors.model.message}</p>}
        </div>
      </div>

      {/* Year */}
      <div>
        <label className={labelClass}>
          {t('year')} <span className="text-rose-600">*</span>
        </label>
        <select {...register('year', { valueAsNumber: true })} className={inputClass}>
          <option value="">{t('selectYear')}</option>
          {YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        {errors.year && <p className={errorClass}>{errors.year.message}</p>}
      </div>

      {/* Color Selector */}
      <div>
        <label className={labelClass}>
          {t('color')} <span className="text-rose-600">*</span>
        </label>
        <button
          type="button"
          onClick={() => setShowColorPicker(true)}
          className={`${inputClass} flex items-center justify-between`}
        >
          <div className="flex items-center gap-2">
            {selectedColor && (
              <div
                className="w-6 h-6 rounded-full border border-slate-300"
                style={{
                  backgroundColor: COLOR_OPTIONS.find(c => c.value === selectedColor)?.color
                }}
              />
            )}
            <span className={selectedColor ? 'text-slate-900' : 'text-slate-400'}>
              {selectedColor ? t(COLOR_OPTIONS.find(c => c.value === selectedColor)?.labelKey as any) : t('selectColor')}
            </span>
          </div>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {errors.color && <p className={errorClass}>{errors.color.message}</p>}
      </div>

      {/* Color Picker Modal */}
      {showColorPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowColorPicker(false)}>
          <div
            className="bg-white rounded-t-3xl w-full p-6 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">{t('selectColor')}</h3>
              <button
                type="button"
                onClick={() => setShowColorPicker(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => {
                    setValue('color', color.value);
                    setShowColorPicker(false);
                  }}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className={`w-12 h-12 rounded-full border-2 transition-all ${
                      selectedColor === color.value
                        ? 'border-brand-600 scale-110'
                        : 'border-slate-300'
                    }`}
                    style={{ backgroundColor: color.color }}
                  />
                  <span className="text-xs text-slate-600 text-center">{t(color.labelKey as any)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ownership Type */}
      <div>
        <label className={labelClass}>
          {t('ownershipType')} <span className="text-rose-600">*</span>
        </label>
        <select {...register('ownershipType')} className={inputClass}>
          <option value="">{t('selectOwnershipType')}</option>
          {OWNERSHIP_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {t(type.labelKey as any)}
            </option>
          ))}
        </select>
        {errors.ownershipType && <p className={errorClass}>{errors.ownershipType.message}</p>}
      </div>

      {/* Owner Details */}
      <div className="space-y-4 border-t border-slate-200 pt-4 mt-4">
        <h3 className="text-sm font-semibold text-slate-900">{t('ownerDetails')}</h3>

        <div>
          <label className={labelClass}>
            {t('ownerName')} <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            {...register('ownerName')}
            className={inputClass}
            placeholder="Full name"
          />
          {errors.ownerName && <p className={errorClass}>{errors.ownerName.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              {t('ownerEmail')} <span className="text-rose-600">*</span>
            </label>
            <input
              type="email"
              {...register('ownerEmail')}
              className={inputClass}
              placeholder="owner@example.com"
            />
            {errors.ownerEmail && <p className={errorClass}>{errors.ownerEmail.message}</p>}
          </div>

          <div>
            <label className={labelClass}>
              {t('ownerPhone')} <span className="text-rose-600">*</span>
            </label>
            <Controller
              name="ownerPhone"
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
            {errors.ownerPhone && <p className={errorClass}>{errors.ownerPhone.message}</p>}
          </div>
        </div>
      </div>

      {/* Vehicle Photos & Documents */}
      <div className="space-y-4 border-t border-slate-200 pt-4 mt-4">
        <h3 className="text-sm font-semibold text-slate-900">{t('photosAndDocuments')}</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {renderFileUpload('frontPhotoUrl', t('frontPhoto'))}
          {renderFileUpload('rearPhotoUrl', t('rearPhoto'))}
          {renderFileUpload('insuranceDocUrl', t('insuranceDocument'))}
          {renderFileUpload('vehicleCardDocUrl', t('vehicleCard'))}
        </div>

        <div>{renderFileUpload('latraStickerDocUrl', t('latraStickerPhoto'))}</div>
      </div>

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
