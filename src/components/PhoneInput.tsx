'use client';

import PhoneInputLib, { type Value } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
  placeholder?: string;
  /** Use 'maison' for the luxury styled inputs, 'standard' for regular forms */
  variant?: 'maison' | 'standard';
}

export default function PhoneInput({
  value,
  onChange,
  id,
  required,
  placeholder = 'Phone number',
  variant = 'maison',
}: PhoneInputProps) {
  const handleChange = (val: Value | undefined) => {
    onChange(val || '');
  };

  return (
    <div className={`phone-input-wrapper ${variant === 'maison' ? 'phone-input-maison' : 'phone-input-standard'}`}>
      <PhoneInputLib
        international
        defaultCountry="LB"
        value={value as Value}
        onChange={handleChange}
        id={id}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
