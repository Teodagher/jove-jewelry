'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import OptionImageUpload from './OptionImageUpload';
import { supabase } from '@/lib/supabase/client';
import imageCompression from 'browser-image-compression';

interface CustomizationSetting {
  setting_id: string;
  setting_title: string;
  setting_display_order: number;
  setting_description: string | null;
  required: boolean;
  options: any[];
}

interface NewStepModalProps {
  onClose: () => void;
  onCreate: (stepData: {
    setting_id: string;
    setting_title: string;
    setting_description: string;
    required: boolean;
    options: Array<{
      option_id: string;
      option_name: string;
      price: number;
      price_lab_grown?: number;
      image_url?: string | null;
    }>;
  }) => void;
  existingSettings: CustomizationSetting[];
}

export default function NewStepModal({ 
  onClose, 
  onCreate, 
  existingSettings 
}: NewStepModalProps) {
  const [formData, setFormData] = useState({
    setting_id: '',
    setting_title: '',
    setting_description: '',
    required: true,
    options: [{
      option_id: '',
      option_name: '',
      price: 0,
      price_lab_grown: 0,
      image_url: null as string | null,
      image_file: null as File | null
    }]
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Generate setting ID from title
  const generateSettingId = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  };

  // Update setting ID when title changes
  const handleTitleChange = (title: string) => {
    const settingId = generateSettingId(title);
    setFormData(prev => ({
      ...prev,
      setting_title: title,
      setting_id: settingId
    }));
  };

  // Generate option ID from name with setting context for uniqueness
  const generateOptionId = (name: string) => {
    const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    
    // Get setting context from the form data
    const settingContext = formData.setting_id.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    
    // Create context-aware base ID: setting_option (e.g., first_stone_ruby, second_stone_ruby)
    const contextualBaseId = settingContext ? `${settingContext}_${baseName}` : baseName;
    
    // Collect all existing option IDs across all settings
    const existingIds = new Set<string>();
    existingSettings.forEach(setting => {
      setting.options.forEach(option => {
        existingIds.add(option.id || option.option_id);
      });
    });
    
    // Also check current form options to avoid duplicates within the same form
    formData.options.forEach(option => {
      if (option.option_id) {
        existingIds.add(option.option_id);
      }
    });
    
    // If contextual ID is available, use it
    if (!existingIds.has(contextualBaseId)) {
      console.log(`🎯 Generated contextual option ID: "${contextualBaseId}" for "${name}" in setting "${formData.setting_title}"`);
      return contextualBaseId;
    }
    
    // If contextual ID exists, try simple base ID as fallback
    if (!existingIds.has(baseName)) {
      console.log(`📝 Using simple option ID: "${baseName}" for "${name}"`);
      return baseName;
    }
    
    // If both exist, try variants with incrementing numbers
    let counter = 2;
    let candidateId = `${baseName}_${counter}`;
    
    while (existingIds.has(candidateId)) {
      counter++;
      candidateId = `${baseName}_${counter}`;
    }
    
    console.log(`⚠️ ID collision detected in NewStepModal! Using fallback ID "${candidateId}" for "${name}"`);
    return candidateId;
  };

  // Update option ID when name changes
  const handleOptionNameChange = (index: number, name: string) => {
    const optionId = generateOptionId(name);
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index 
          ? { ...option, option_name: name, option_id: optionId }
          : option
      )
    }));
  };

  // Add new option
  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, {
        option_id: '',
        option_name: '',
        price: 0,
        price_lab_grown: 0,
        image_url: null as string | null,
        image_file: null as File | null
      }]
    }));
  };

  // Remove option
  const removeOption = (index: number) => {
    if (formData.options.length > 1) {
      // Clean up any blob URLs before removing
      const option = formData.options[index];
      if (option.image_url && option.image_url.startsWith('blob:')) {
        URL.revokeObjectURL(option.image_url);
      }
      
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  // Update option field
  const updateOption = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index 
          ? { ...option, [field]: value }
          : option
      )
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.setting_title.trim()) {
      newErrors.setting_title = 'Step title is required';
    }

    if (!formData.setting_id.trim()) {
      newErrors.setting_id = 'Setting ID is required';
    }

    // Check if setting ID already exists
    if (existingSettings.some(s => s.setting_id === formData.setting_id)) {
      newErrors.setting_id = 'This setting ID already exists';
    }

    // Validate each option
    formData.options.forEach((option, index) => {
      if (!option.option_name.trim()) {
        newErrors[`option_${index}_name`] = 'Option name is required';
      }

      if (!option.option_id.trim()) {
        newErrors[`option_${index}_id`] = 'Option ID is required';
      }

      if (option.price < 0) {
        newErrors[`option_${index}_price`] = 'Price cannot be negative';
      }

      // Check for duplicate option IDs within this step
      const duplicateIndex = formData.options.findIndex((opt, i) => 
        i !== index && opt.option_id === option.option_id && option.option_id.trim() !== ''
      );
      if (duplicateIndex !== -1) {
        newErrors[`option_${index}_id`] = 'Option ID must be unique within this step';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload image helper with 30KB target compression using browser-image-compression
  const uploadImageFile = async (file: File): Promise<string> => {
    try {
      console.log(`🔄 Compressing image to ~30KB: ${file.name} (${(file.size / 1024).toFixed(1)}KB original)`);
      
      // Compression settings to target 30KB
      const options = {
        maxSizeMB: 0.03, // 30KB target
        maxWidthOrHeight: 1000, // Higher max dimension for 30KB target
        useWebWorker: true, // Use web worker for performance
        fileType: 'image/webp', // Convert to WebP
        initialQuality: 0.75, // Start with better quality for 30KB target
        alwaysKeepResolution: false // Allow resolution reduction if needed
      };

      // Compress the image
      const compressedFile = await imageCompression(file, options);
      
      console.log(`✅ Compressed to ${(compressedFile.size / 1024).toFixed(1)}KB (${((1 - compressedFile.size / file.size) * 100).toFixed(1)}% reduction)`);

      // Generate filename
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('customization_options')
        .upload(fileName, compressedFile, {
          contentType: 'image/webp',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('customization_options')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      throw new Error(`Failed to upload image: ${error}`);
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Upload any pending images first
      const processedOptions = await Promise.all(
        formData.options.map(async (option) => {
          if (option.image_file) {
            try {
              const uploadedUrl = await uploadImageFile(option.image_file);
              // Clean up the blob URL
              if (option.image_url && option.image_url.startsWith('blob:')) {
                URL.revokeObjectURL(option.image_url);
              }
              return {
                ...option,
                image_url: uploadedUrl,
                image_file: null
              };
            } catch (error) {
              console.error('Failed to upload image for option:', option.option_name, error);
              // Keep the option but without image
              return {
                ...option,
                image_url: null,
                image_file: null
              };
            }
          }
          return option;
        })
      );

      // Create the step data without image_file properties
      const stepData = {
        ...formData,
        options: processedOptions.map(({ image_file, ...option }) => option)
      };

      onCreate(stepData);
    } catch (error) {
      console.error('Error creating step:', error);
      alert('Failed to create step. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => {
        // Clean up any blob URLs when closing
        formData.options.forEach(option => {
          if (option.image_url && option.image_url.startsWith('blob:')) {
            URL.revokeObjectURL(option.image_url);
          }
        });
        onClose();
      }} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900">
            Add New Customization Step
          </h3>
          <button
            onClick={() => {
              // Clean up any blob URLs when closing
              formData.options.forEach(option => {
                if (option.image_url && option.image_url.startsWith('blob:')) {
                  URL.revokeObjectURL(option.image_url);
                }
              });
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Step Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Step Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Step Title *
                </label>
                <input
                  type="text"
                  value={formData.setting_title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Choose Your Stone"
                />
                {errors.setting_title && (
                  <p className="text-red-500 text-xs mt-1">{errors.setting_title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Setting ID *
                </label>
                <input
                  type="text"
                  value={formData.setting_id}
                  onChange={(e) => setFormData(prev => ({...prev, setting_id: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="choose_your_stone"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique identifier for this step (auto-generated from title)
                </p>
                {errors.setting_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.setting_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.setting_description}
                  onChange={(e) => setFormData(prev => ({...prev, setting_description: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Help text for customers about this step"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={formData.required}
                  onChange={(e) => setFormData(prev => ({...prev, required: e.target.checked}))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="required" className="ml-2 text-sm text-gray-700">
                  This step is required (customers must make a selection)
                </label>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Options</h4>
                  <p className="text-sm text-gray-600">
                    Add one or more options for this customization step.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.options.map((option, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">Option {index + 1}</h5>
                      {formData.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Option Name *
                        </label>
                        <input
                          type="text"
                          value={option.option_name}
                          onChange={(e) => handleOptionNameChange(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Diamond"
                        />
                        {errors[`option_${index}_name`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`option_${index}_name`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Option ID *
                        </label>
                        <input
                          type="text"
                          value={option.option_id}
                          onChange={(e) => updateOption(index, 'option_id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                          placeholder="diamond"
                        />
                        {errors[`option_${index}_id`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`option_${index}_id`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={option.price}
                          onChange={(e) => updateOption(index, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors[`option_${index}_price`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`option_${index}_price`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lab Grown Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={option.price_lab_grown}
                          onChange={(e) => updateOption(index, 'price_lab_grown', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Image Upload */}
                    <div className="pt-4 border-t border-gray-200 mt-4">
                      <OptionImageUpload
                        currentImageUrl={option.image_url}
                        onImageChange={(imageUrl, file) => {
                          updateOption(index, 'image_url', imageUrl);
                          updateOption(index, 'image_file', file || null);
                        }}
                        optionName={option.option_name || `Option ${index + 1}`}
                        mode="deferred"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions - Fixed at bottom */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 bg-white sticky bottom-0">
              <button
                type="button"
                onClick={() => {
                  // Clean up any blob URLs when cancelling
                  formData.options.forEach(option => {
                    if (option.image_url && option.image_url.startsWith('blob:')) {
                      URL.revokeObjectURL(option.image_url);
                    }
                  });
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Step
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
