import { useState, useCallback } from 'react';
import { z } from 'zod';

type FieldSchema = z.ZodType<string>;

interface UseFormValidationOptions<T extends Record<string, string>> {
  initialValues: T;
  schemas: Partial<Record<keyof T, FieldSchema>>;
  formatters?: Partial<Record<keyof T, (value: string) => string>>;
}

interface UseFormValidationReturn<T extends Record<string, string>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  setValue: (field: keyof T, value: string) => void;
  setValues: (values: T) => void;
  validateField: (field: keyof T) => string | undefined;
  validateAll: () => boolean;
  handleBlur: (field: keyof T) => void;
  clearErrors: () => void;
  getFieldProps: (field: keyof T) => {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur: () => void;
  };
  hasError: (field: keyof T) => boolean;
  getError: (field: keyof T) => string | undefined;
}

export function useFormValidation<T extends Record<string, string>>({
  initialValues,
  schemas,
  formatters = {},
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validateField = useCallback(
    (field: keyof T): string | undefined => {
      const schema = schemas[field];
      if (!schema) return undefined;

      const result = schema.safeParse(values[field]);
      return result.success ? undefined : result.error.errors[0].message;
    },
    [schemas, values]
  );

  const handleBlur = useCallback(
    (field: keyof T) => {
      const error = validateField(field);
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [validateField]
  );

  const setValue = useCallback(
    (field: keyof T, value: string) => {
      // Apply formatter if one exists for this field
      const formatter = formatters[field];
      const processedValue = formatter ? formatter(value) : value;

      setValuesState((prev) => ({ ...prev, [field]: processedValue }));
      
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [formatters, errors]
  );

  const setValues = useCallback((newValues: T) => {
    setValuesState(newValues);
  }, []);

  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    (Object.keys(schemas) as Array<keyof T>).forEach((field) => {
      const schema = schemas[field];
      if (schema) {
        const result = schema.safeParse(values[field]);
        if (!result.success) {
          newErrors[field] = result.error.errors[0].message;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [schemas, values]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const getFieldProps = useCallback(
    (field: keyof T) => ({
      value: values[field],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setValue(field, e.target.value);
      },
      onBlur: () => handleBlur(field),
    }),
    [values, setValue, handleBlur]
  );

  const hasError = useCallback(
    (field: keyof T): boolean => !!errors[field],
    [errors]
  );

  const getError = useCallback(
    (field: keyof T): string | undefined => errors[field],
    [errors]
  );

  return {
    values,
    errors,
    setValue,
    setValues,
    validateField,
    validateAll,
    handleBlur,
    clearErrors,
    getFieldProps,
    hasError,
    getError,
  };
}

// Common formatters
export const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 3) {
    return digits.length > 0 ? `(${digits}` : '';
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
};

// Common schemas
export const commonSchemas = {
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),
  
  firstName: z.string()
    .min(3, 'First name must be at least 3 characters')
    .max(50, 'First name is too long'),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long'),
  
  phone: z.string()
    .min(1, 'Phone number is required')
    .refine(
      (val) => {
        const digits = val.replace(/\D/g, '');
        return digits.length === 10;
      },
      { message: 'Please enter a valid 10-digit phone number' }
    ),
  
  required: (message = 'This field is required') => z.string().min(1, message),
};
