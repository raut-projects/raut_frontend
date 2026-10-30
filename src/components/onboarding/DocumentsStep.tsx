import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { documentsSchema, validateFile } from '../../schemas/onboardingSchemas';
import useOnboardingStore from '../../store/onboardingStore';

export default function DocumentsStep() {
  const { documents, updateDocuments, nextStep, markStepComplete } =
    useOnboardingStore();

  const [previews, setPreviews] = useState({});
  const [fileErrors, setFileErrors] = useState({});

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(documentsSchema),
    defaultValues: documents,
  });

  const handleFileChange = (fieldName, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setFileErrors((prev) => ({ ...prev, [fieldName]: validation.error }));
      return;
    }

    setFileErrors((prev) => ({ ...prev, [fieldName]: null }));
    setValue(fieldName, file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [fieldName]: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setPreviews((prev) => ({ ...prev, [fieldName]: null }));
    }
  };

  const onSubmit = async (data) => {
    updateDocuments(data);
    markStepComplete(4);
    nextStep();
  };

  const renderFileInput = (name, label, required = true) => {
    const error = errors[name] || fileErrors[name];
    const hasFile = previews[name] || documents[name];

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={(e) => handleFileChange(name, e)}
            className="hidden"
            id={name}
          />
          <label
            htmlFor={name}
            className={`
              flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
              ${error ? 'border-red-500 bg-red-50' : hasFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            {previews[name] ? (
              <div className="text-center">
                <img
                  src={previews[name]}
                  alt="Preview"
                  className="max-h-32 mx-auto mb-2 rounded"
                />
                <p className="text-sm text-gray-600">Click to change</p>
              </div>
            ) : hasFile ? (
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-sm text-gray-600">File uploaded</p>
              </div>
            ) : (
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-gray-400"
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
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, or PDF (max 5MB)</p>
              </div>
            )}
          </label>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">
            {typeof error === 'string' ? error : error.message}
          </p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
        <p className="text-gray-600">
          Please upload clear photos or scans of the required documents.
        </p>
      </div>

      {/* Personal Documents */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Personal Documents</h3>
        {renderFileInput('profilePhoto', 'Profile Photo')}
        {renderFileInput('licensePhoto', 'Driver\'s License Photo')}
        {renderFileInput('ninPhoto', 'National ID (NIN) Photo', false)}
      </div>

      {/* Vehicle Documents */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900">Vehicle Documents</h3>
        {renderFileInput('vehicleRegistration', 'Vehicle Registration')}
        {renderFileInput('insuranceCertificate', 'Insurance Certificate')}
        {renderFileInput('vehiclePhoto', 'Vehicle Photo')}
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <svg
            className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-yellow-800">
              Important Tips
            </h4>
            <ul className="mt-2 text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Ensure all text is clearly readable</li>
              <li>Photos should be well-lit with no glare</li>
              <li>Documents must be valid and not expired</li>
              <li>File size should not exceed 5MB per document</li>
            </ul>
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
