import { forwardRef } from 'react';

interface TanzaniaPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const TanzaniaPhoneInput = forwardRef<HTMLInputElement, TanzaniaPhoneInputProps>(
  ({ value, onChange, className, placeholder = '712 345 678', disabled }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value;

      // Remove all non-digits
      input = input.replace(/\D/g, '');

      // Remove leading 0 if present
      if (input.startsWith('0')) {
        input = input.substring(1);
      }

      // Limit to 9 digits (Tanzania mobile without country code)
      input = input.substring(0, 9);

      onChange(input);
    };

    // Format display value with spaces for readability
    const formatDisplay = (val: string) => {
      const digits = val.replace(/\D/g, '');
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    };

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-300 rounded-l-lg">
          <span className="text-sm font-medium text-slate-700">🇹🇿</span>
          <span className="text-sm font-medium text-slate-700">+255</span>
        </div>
        <input
          ref={ref}
          type="tel"
          value={formatDisplay(value)}
          onChange={handleChange}
          className={className}
          placeholder={placeholder}
          disabled={disabled}
          style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
        />
      </div>
    );
  }
);

TanzaniaPhoneInput.displayName = 'TanzaniaPhoneInput';

export default TanzaniaPhoneInput;
