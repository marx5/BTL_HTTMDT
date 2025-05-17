/**
 * Utilities for form validation
 */

/**
 * Check if a value is empty (null, undefined, or empty string)
 * @param {*} value - Value to check
 * @returns {boolean} - True if empty, false otherwise
 */
export const isEmpty = (value) => {
  return value === null || value === undefined || value === '';
};

/**
 * Validate an email address format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate a phone number format (10-11 digits)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate a password (at least 6 characters)
 * @param {string} password - Password to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Validate if passwords match
 * @param {string} password - First password
 * @param {string} confirmPassword - Second password
 * @returns {boolean} - True if match, false otherwise
 */
export const passwordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

/**
 * Basic form validator that takes a validation schema and form data
 * @param {Object} schema - Object mapping field names to validation rules
 * @param {Object} formData - The form data to validate
 * @returns {Object} - Object with field names as keys and error messages as values
 * 
 * Example usage:
 * const schema = {
 *   email: { required: true, email: true },
 *   password: { required: true, minLength: 6 },
 * }
 * const errors = validateForm(schema, formData);
 */
export const validateForm = (schema, formData) => {
  const errors = {};

  Object.keys(schema).forEach(field => {
    const rules = schema[field];
    const value = formData[field];

    // Required validation
    if (rules.required && isEmpty(value)) {
      errors[field] = `Vui lòng nhập ${rules.label || field}`;
      return; // Skip other validations if required fails
    }

    // Skip further validation if field is empty and not required
    if (isEmpty(value) && !rules.required) {
      return;
    }

    // Email validation
    if (rules.email && !isValidEmail(value)) {
      errors[field] = 'Email không hợp lệ';
    }

    // Phone validation
    if (rules.phone && !isValidPhone(value)) {
      errors[field] = 'Số điện thoại không hợp lệ (10-11 số)';
    }

    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors[field] = `${rules.label || field} phải có ít nhất ${rules.minLength} ký tự`;
    }

    // Match validation
    if (rules.match && value !== formData[rules.match]) {
      errors[field] = `${rules.label || field} không khớp`;
    }

    // Custom validation function
    if (rules.validate && typeof rules.validate === 'function') {
      const customError = rules.validate(value, formData);
      if (customError) {
        errors[field] = customError;
      }
    }
  });

  return errors;
};

/**
 * Custom hook pattern for form validation (example for documentation)
 *
 * import { useState } from 'react';
 * import { validateForm } from '../utils/validation';
 * 
 * export const useFormValidation = (initialValues, validationSchema) => {
 *   const [values, setValues] = useState(initialValues);
 *   const [errors, setErrors] = useState({});
 *   const [touched, setTouched] = useState({});
 *
 *   const handleChange = (e) => {
 *     const { name, value } = e.target;
 *     setValues({ ...values, [name]: value });
 *   };
 *
 *   const handleBlur = (e) => {
 *     const { name } = e.target;
 *     setTouched({ ...touched, [name]: true });
 *     
 *     // Validate single field
 *     const fieldErrors = validateForm(
 *       { [name]: validationSchema[name] },
 *       values
 *     );
 *     setErrors({ ...errors, ...fieldErrors });
 *   };
 *
 *   const validateAll = () => {
 *     const formErrors = validateForm(validationSchema, values);
 *     setErrors(formErrors);
 *     return Object.keys(formErrors).length === 0;
 *   };
 *
 *   return {
 *     values,
 *     errors,
 *     touched,
 *     handleChange,
 *     handleBlur,
 *     validateAll,
 *     setValues
 *   };
 * };
 */ 