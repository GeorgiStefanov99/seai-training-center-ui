import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { isValid, parse, format } from 'date-fns';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export function DateInput({ value, onChange, onBlur, ...props }: DateInputProps) {
  const [inputValue, setInputValue] = useState(value);

  // Update local state when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Format input as user types
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.replace(/[^\d/]/g, ''); // Remove non-digits and non-slashes
    
    // Auto-add slashes
    if (newValue.length === 2 && !newValue.includes('/') && inputValue.length < newValue.length) {
      newValue += '/';
    } else if (newValue.length === 5 && newValue.charAt(2) === '/' && !newValue.includes('/', 3) && inputValue.length < newValue.length) {
      newValue += '/';
    }
    
    // Limit to 10 characters (dd/MM/yyyy)
    if (newValue.length <= 10) {
      setInputValue(newValue);
      
      // Only update parent if it's a valid date or empty
      if (newValue.length === 10) {
        const parsedDate = parse(newValue, 'dd/MM/yyyy', new Date());
        if (isValid(parsedDate)) {
          onChange(newValue);
        }
      } else if (newValue === '') {
        onChange('');
      }
    }
  };

  // Validate and format on blur
  const handleBlur = () => {
    if (inputValue.length === 10) {
      const parsedDate = parse(inputValue, 'dd/MM/yyyy', new Date());
      if (isValid(parsedDate)) {
        const formattedValue = format(parsedDate, 'dd/MM/yyyy');
        setInputValue(formattedValue);
        onChange(formattedValue);
      } else {
        // Reset to previous valid value or empty
        setInputValue(value || '');
      }
    } else if (inputValue.length > 0 && inputValue.length < 10) {
      // Reset to previous valid value or empty if incomplete
      setInputValue(value || '');
    }
    
    if (onBlur) {
      onBlur();
    }
  };

  return (
    <Input
      {...props}
      type="text"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="DD/MM/YYYY"
      maxLength={10}
    />
  );
}
