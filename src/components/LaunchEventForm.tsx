'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | undefined;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  general?: string;
}

export default function LaunchEventForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: undefined,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);


  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number validation
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing/selecting
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const source = `${window.location.origin}/launch-event-form`;
      
      const { error } = await supabase
        .from('leads')
        .insert({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone_number: formData.phoneNumber || '',
          source: source
        } as any);

      if (error) {
        console.error('Supabase error:', error);
        setErrors({ general: 'Failed to submit form. Please try again.' });
      } else {
        setIsSubmitted(true);
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: undefined,
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewEntry = () => {
    setIsSubmitted(false);
    setErrors({});
  };

  if (isSubmitted) {
    return (
      <div className="jove-bg-card rounded-lg shadow-sm border jove-border p-6 sm:p-8 md:p-10 text-center">
        <div className="mb-8 sm:mb-10">
          <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 jove-bg-accent rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 border jove-border">
            <svg className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light text-zinc-900 tracking-wider mb-3 sm:mb-4">
            Thank You
          </h2>
          <div className="w-16 sm:w-18 md:w-20 h-px jove-gradient-accent mx-auto mb-4 sm:mb-6"></div>
          <p className="text-lg sm:text-xl font-light text-zinc-700 leading-relaxed max-w-2xl mx-auto px-2">
            Your information has been successfully recorded for the Jové launch event. 
            We look forward to sharing this special moment with you.
          </p>
        </div>
        
        <Button 
          onClick={handleNewEntry}
          className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white font-light tracking-wider px-8 sm:px-12 py-4 sm:py-5 text-base sm:text-lg rounded-md transition-all duration-300 min-h-[50px] sm:min-h-[60px] sm:min-w-[280px]"
        >
          ADD ANOTHER GUEST
        </Button>
      </div>
    );
  }

  return (
    <div className="jove-bg-card rounded-lg shadow-sm border jove-border p-6 sm:p-8 md:p-10">
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light text-zinc-900 tracking-wider mb-3 sm:mb-4">
          Guest Information
        </h2>
        <div className="w-16 sm:w-18 md:w-20 h-px jove-gradient-accent mx-auto mb-4 sm:mb-6"></div>
        <p className="text-zinc-600 font-light text-base sm:text-lg tracking-wide px-2">
          Please provide the following details for our guest registry
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {errors.general && (
          <div className="jove-bg-accent border border-red-200 rounded-md p-4 sm:p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 mt-0.5 sm:mt-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm sm:text-base text-red-700 font-light">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* First Name */}
          <div className="space-y-2 sm:space-y-3">
            <label htmlFor="firstName" className="block text-sm sm:text-base font-light text-zinc-700 tracking-wide">
              FIRST NAME
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={`w-full px-4 sm:px-6 py-4 sm:py-5 text-base sm:text-lg border rounded-md shadow-sm bg-stone-50 font-light tracking-wide placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400 transition-all duration-300 min-h-[50px] sm:min-h-[60px] ${
                errors.firstName ? 'border-red-300 focus:ring-red-400 focus:border-red-400' : 'jove-border hover:border-zinc-300'
              }`}
              placeholder="Enter first name"
              autoComplete="given-name"
            />
            {errors.firstName && (
              <p className="text-xs sm:text-sm text-red-600 font-light tracking-wide">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2 sm:space-y-3">
            <label htmlFor="lastName" className="block text-sm sm:text-base font-light text-zinc-700 tracking-wide">
              LAST NAME
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={`w-full px-4 sm:px-6 py-4 sm:py-5 text-base sm:text-lg border rounded-md shadow-sm bg-stone-50 font-light tracking-wide placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400 transition-all duration-300 min-h-[50px] sm:min-h-[60px] ${
                errors.lastName ? 'border-red-300 focus:ring-red-400 focus:border-red-400' : 'jove-border hover:border-zinc-300'
              }`}
              placeholder="Enter last name"
              autoComplete="family-name"
            />
            {errors.lastName && (
              <p className="text-xs sm:text-sm text-red-600 font-light tracking-wide">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2 sm:space-y-3">
          <label htmlFor="email" className="block text-sm sm:text-base font-light text-zinc-700 tracking-wide">
            EMAIL ADDRESS
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-4 sm:px-6 py-4 sm:py-5 text-base sm:text-lg border rounded-md shadow-sm bg-stone-50 font-light tracking-wide placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400 transition-all duration-300 min-h-[50px] sm:min-h-[60px] ${
              errors.email ? 'border-red-300 focus:ring-red-400 focus:border-red-400' : 'jove-border hover:border-zinc-300'
            }`}
            placeholder="Enter email address"
            autoComplete="email"
            inputMode="email"
          />
          {errors.email && (
            <p className="text-xs sm:text-sm text-red-600 font-light tracking-wide">{errors.email}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-2 sm:space-y-3">
          <label className="block text-sm sm:text-base font-light text-zinc-700 tracking-wide">
            PHONE NUMBER
          </label>
          <PhoneInput
            international
            defaultCountry="LB"
            value={formData.phoneNumber}
            onChange={(value) => handleInputChange('phoneNumber', value)}
            className={`phone-input-container ${
              errors.phoneNumber ? 'phone-input-error' : ''
            }`}
            placeholder="Enter phone number"
          />
          {errors.phoneNumber && (
            <p className="text-xs sm:text-sm text-red-600 font-light tracking-wide">{errors.phoneNumber}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-6 sm:pt-8">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-light tracking-wider py-4 sm:py-6 px-6 sm:px-8 text-lg sm:text-xl rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[55px] sm:min-h-[70px]"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 sm:mr-4 h-5 w-5 sm:h-6 sm:w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                SUBMITTING...
              </div>
            ) : (
              'REGISTER GUEST'
            )}
          </Button>
        </div>

        <div className="text-center pt-3 sm:pt-4">
          <p className="text-xs sm:text-sm text-zinc-500 font-light tracking-wide">
            All fields are required for event registration
          </p>
        </div>
      </form>
    </div>
  );
}