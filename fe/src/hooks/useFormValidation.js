import { useState, useEffect } from 'react';
import { validateForm } from '../utils/validation';

/**
 * Custom hook for form validation with support for field-level validation.
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationSchema - Schema defining validation rules for each field
 * @returns {Object} - Form state and handlers
 */
export const useFormValidation = (initialValues, validationSchema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Check form validity whenever values change
  useEffect(() => {
    const formErrors = validateForm(validationSchema, values);
    setIsValid(Object.keys(formErrors).length === 0);
  }, [values, validationSchema]);

  /**
   * Handle input change event
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle different input types
    const inputValue = type === 'checkbox' ? checked : value;
    
    setValues(prev => ({
      ...prev,
      [name]: inputValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  /**
   * Set a specific field value programmatically
   * @param {string} name - Field name
   * @param {any} value - New field value
   */
  const setFieldValue = (name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handle input blur event - validates field on blur
   * @param {Event} e - Input blur event
   */
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate just this field
    if (validationSchema[name]) {
      const fieldErrors = validateForm(
        { [name]: validationSchema[name] },
        values
      );
      
      setErrors(prev => ({
        ...prev,
        ...fieldErrors
      }));
    }
  };

  /**
   * Reset form to initial values
   */
  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  /**
   * Mark all fields as touched - useful before submission
   */
  const touchAll = () => {
    const touchedFields = Object.keys(validationSchema).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {});
    
    setTouched(touchedFields);
  };

  /**
   * Validate all form fields
   * @returns {boolean} - True if form is valid, false otherwise
   */
  const validateAll = () => {
    const formErrors = validateForm(validationSchema, values);
    setErrors(formErrors);
    touchAll();
    
    return Object.keys(formErrors).length === 0;
  };

  /**
   * Handle form submission with validation
   * @param {function} onSubmit - Function to call if validation succeeds
   * @returns {function} - Submit handler function
   */
  const handleSubmit = (onSubmit) => async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    
    const isFormValid = validateAll();
    
    if (isFormValid && onSubmit) {
      try {
        await onSubmit(values);
      } catch (error) {
        // If submission throws an error, set it in the errors state
        if (error.field) {
          setErrors(prev => ({
            ...prev,
            [error.field]: error.message
          }));
        } else if (error.message) {
          // Set a general form error
          setErrors(prev => ({
            ...prev,
            _form: error.message
          }));
        }
      }
    }
    
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    setFieldValue,
    resetForm,
    validateAll,
    handleSubmit,
    setValues,
    setErrors
  };
};

export default useFormValidation; 