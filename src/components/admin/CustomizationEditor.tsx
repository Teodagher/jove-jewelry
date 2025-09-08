// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { supabase } from '@/lib/supabase/client';
import NewStepModal from './NewStepModal';
import OptionImageUpload from './OptionImageUpload';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Eye, 
  Edit, 
  Save,
  X,
  Settings,
  Upload,
  ImageIcon,
  Palette,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface CustomizationOption {
  id: string;
  option_id: string;
  option_name: string;
  price: number;
  price_lab_grown: number | null;
  image_url: string | null;
  color_gradient: string | null;
  display_order: number;
  is_active: boolean;
}

interface CustomizationSetting {
  setting_id: string;
  setting_title: string;
  setting_display_order: number;
  setting_description: string | null;
  required: boolean;
  affects_image_variant: boolean;
  options: CustomizationOption[];
}

interface CustomizationEditorProps {
  settings: CustomizationSetting[];
  onSettingsChange: (settings: CustomizationSetting[]) => void;
  productId: string;
  productSlug?: string;
  onOptionsChange?: () => void; // Callback when options are added/modified
}

export default function CustomizationEditor({ 
  settings, 
  onSettingsChange, 
  productId,
  productSlug,
  onOptionsChange
}: CustomizationEditorProps) {
  const [expandedSettings, setExpandedSettings] = useState<Set<string>>(new Set());
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [draggedSetting, setDraggedSetting] = useState<string | null>(null);
  const [draggedOption, setDraggedOption] = useState<{ settingId: string; optionId: string } | null>(null);
  const [showNewStepModal, setShowNewStepModal] = useState(false);

  const { addToast } = useToast();

  // Toggle setting expansion
  const toggleSetting = (settingId: string) => {
    const newExpanded = new Set(expandedSettings);
    if (newExpanded.has(settingId)) {
      newExpanded.delete(settingId);
    } else {
      newExpanded.add(settingId);
    }
    setExpandedSettings(newExpanded);
  };

  // Handle setting drag and drop
  const handleSettingDragStart = (settingId: string) => {
    setDraggedSetting(settingId);
  };

  const handleSettingDrop = async (targetSettingId: string) => {
    if (!draggedSetting || draggedSetting === targetSettingId) return;

    const newSettings = [...settings];
    const draggedIndex = newSettings.findIndex(s => s.setting_id === draggedSetting);
    const targetIndex = newSettings.findIndex(s => s.setting_id === targetSettingId);

    // Reorder settings
    const [removed] = newSettings.splice(draggedIndex, 1);
    newSettings.splice(targetIndex, 0, removed);

    // Update display orders
    newSettings.forEach((setting, index) => {
      setting.setting_display_order = index + 1;
    });

    onSettingsChange(newSettings);

    // Save to database
    await updateSettingDisplayOrders(newSettings);
    setDraggedSetting(null);
    
    addToast({
      type: 'success',
      title: 'Settings reordered',
      message: 'Customization step order updated successfully'
    });
  };

  // Handle option drag and drop within a setting
  const handleOptionDragStart = (settingId: string, optionId: string) => {
    setDraggedOption({ settingId, optionId });
  };

  const handleOptionDrop = async (targetSettingId: string, targetOptionId: string) => {
    if (!draggedOption || 
        draggedOption.settingId !== targetSettingId || 
        draggedOption.optionId === targetOptionId) return;

    const newSettings = [...settings];
    const settingIndex = newSettings.findIndex(s => s.setting_id === targetSettingId);
    const setting = newSettings[settingIndex];

    const draggedIndex = setting.options.findIndex(o => o.id === draggedOption.optionId);
    const targetIndex = setting.options.findIndex(o => o.id === targetOptionId);

    // Reorder options
    const [removed] = setting.options.splice(draggedIndex, 1);
    setting.options.splice(targetIndex, 0, removed);

    // Update display orders
    setting.options.forEach((option, index) => {
      option.display_order = index + 1;
    });

    onSettingsChange(newSettings);

    // Save to database
    await updateOptionDisplayOrders(setting.options);
    setDraggedOption(null);
    
    addToast({
      type: 'success',
      title: 'Options reordered',
      message: `${setting.setting_title} options updated successfully`
    });
  };

  // Update setting display orders in database
  const updateSettingDisplayOrders = async (settings: CustomizationSetting[]) => {
    try {
      const promises = settings.map(setting => 
        supabase
          .from('customization_options')
          .update({ setting_display_order: setting.setting_display_order })
          .eq('jewelry_item_id', productId)
          .eq('setting_id', setting.setting_id)
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error updating setting display orders:', error);
    }
  };

  // Move setting up
  const moveSettingUp = async (settingId: string) => {
    const currentIndex = settings.findIndex(setting => setting.setting_id === settingId);
    if (currentIndex <= 0) return; // Already at top

    const newSettings = [...settings];
    // Swap with previous setting
    [newSettings[currentIndex - 1], newSettings[currentIndex]] = [newSettings[currentIndex], newSettings[currentIndex - 1]];
    
    // Update display orders
    newSettings.forEach((setting, index) => {
      setting.setting_display_order = index + 1;
    });

    onSettingsChange(newSettings);

    // Save to database
    await updateSettingDisplayOrders(newSettings);
    
    const settingName = settings.find(s => s.setting_id === settingId)?.setting_title || 'Setting';
    addToast({
      type: 'success',
      title: 'Step moved',
      message: `"${settingName}" moved up`
    });
  };

  // Move setting down
  const moveSettingDown = async (settingId: string) => {
    const currentIndex = settings.findIndex(setting => setting.setting_id === settingId);
    if (currentIndex >= settings.length - 1) return; // Already at bottom

    const newSettings = [...settings];
    // Swap with next setting
    [newSettings[currentIndex], newSettings[currentIndex + 1]] = [newSettings[currentIndex + 1], newSettings[currentIndex]];
    
    // Update display orders
    newSettings.forEach((setting, index) => {
      setting.setting_display_order = index + 1;
    });

    onSettingsChange(newSettings);

    // Save to database
    await updateSettingDisplayOrders(newSettings);
    
    const settingName = settings.find(s => s.setting_id === settingId)?.setting_title || 'Setting';
    addToast({
      type: 'success',
      title: 'Step moved',
      message: `"${settingName}" moved down`
    });
  };

  // Update option display orders in database
  const updateOptionDisplayOrders = async (options: CustomizationOption[]) => {
    try {
      const promises = options.map(option =>
        supabase
          .from('customization_options')
          .update({ display_order: option.display_order })
          .eq('id', option.id)
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error updating option display orders:', error);
    }
  };

  // Toggle setting image variant status
  const toggleImageVariant = async (settingId: string) => {
    const oldSettings = [...settings];
    const newSettings = settings.map(setting => {
      if (setting.setting_id === settingId) {
        return { ...setting, affects_image_variant: !setting.affects_image_variant };
      }
      return setting;
    });

    // Update local state immediately for better UX
    onSettingsChange(newSettings);

    try {
      // Update database
      const setting = newSettings.find(s => s.setting_id === settingId);
      if (setting) {
        console.log('Updating image variant status for setting:', settingId, 'to:', setting.affects_image_variant);
        
        const { error } = await supabase
          .from('customization_options')
          .update({ affects_image_variant: setting.affects_image_variant })
          .eq('jewelry_item_id', productId)
          .eq('setting_id', settingId);

        if (error) {
          console.error('Failed to update image variant status:', error);
          // Revert local state on error
          onSettingsChange(oldSettings);
          addToast({
            type: 'error',
            title: 'Update Failed',
            message: `Could not update the image variant setting: ${error.message}`
          });
        } else {
          addToast({
            type: 'success',
            title: 'Updated',
            message: `Step ${setting.affects_image_variant ? 'now affects' : 'no longer affects'} image variants`
          });
          
          // Notify parent that variants need to be regenerated
          onOptionsChange?.();
        }
      }
    } catch (err) {
      console.error('Error updating image variant status:', err);
      // Revert local state on error
      onSettingsChange(oldSettings);
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'An unexpected error occurred. Please try again.'
      });
    }
  };

  // Delete entire customization setting
  const deleteSetting = async (settingId: string) => {
    const setting = settings.find(s => s.setting_id === settingId);
    if (!setting) return;

    if (!confirm(`Are you sure you want to delete the entire "${setting.setting_title}" step? This will delete all ${setting.options.length} options and cannot be undone.`)) {
      return;
    }

    try {
      // Delete all options for this setting
      const { error } = await supabase
        .from('customization_options')
        .delete()
        .eq('jewelry_item_id', productId)
        .eq('setting_id', settingId);

      if (error) {
        console.error('Error deleting setting:', error);
        addToast({
          type: 'error',
          title: 'Failed to delete step',
          message: 'There was an error deleting the customization step'
        });
        return;
      }

      // Update local state
      const newSettings = settings.filter(s => s.setting_id !== settingId);
      onSettingsChange(newSettings);

      // Remove from expanded settings
      const newExpanded = new Set(expandedSettings);
      newExpanded.delete(settingId);
      setExpandedSettings(newExpanded);

      addToast({
        type: 'success',
        title: 'Step deleted',
        message: `"${setting.setting_title}" and all its options have been deleted`
      });
      
      // Notify parent that variants need to be regenerated
      onOptionsChange?.();

    } catch (error) {
      console.error('Error deleting setting:', error);
      addToast({
        type: 'error',
        title: 'Failed to delete step',
        message: 'An unexpected error occurred while deleting the step'
      });
    }
  };

  // Toggle setting required status
  const toggleRequired = async (settingId: string) => {
    const oldSettings = [...settings];
    const newSettings = settings.map(setting => {
      if (setting.setting_id === settingId) {
        return { ...setting, required: !setting.required };
      }
      return setting;
    });

    // Update local state immediately for better UX
    onSettingsChange(newSettings);

    try {
      // Update database
      const setting = newSettings.find(s => s.setting_id === settingId);
      if (setting) {
        console.log('Updating required status for setting:', settingId, 'to:', setting.required);
        console.log('Product ID:', productId);
        console.log('Setting ID:', settingId);
        
        // First, let's check what records exist before updating
        const { data: existingRecords } = await supabase
          .from('customization_options')
          .select('id, setting_id, jewelry_item_id, required, option_name')
          .eq('jewelry_item_id', productId)
          .eq('setting_id', settingId);
        
        console.log('Records found before update:', existingRecords);
        
        const { data, error, count } = await supabase
          .from('customization_options')
          .update({ required: setting.required })
          .eq('jewelry_item_id', productId)
          .eq('setting_id', settingId);

        if (error) {
          console.error('Failed to update required status:', error);
          // Revert local state on error
          onSettingsChange(oldSettings);
          addToast({
            type: 'error',
            title: 'Update Failed',
            message: `Could not update the required status: ${error.message}`
          });
        } else {
          console.log('Successfully updated required status. Rows affected:', count);
          console.log('Update result:', data);
          addToast({
            type: 'success',
            title: 'Updated',
            message: `Step is now ${setting.required ? 'required' : 'optional'}`
          });
          
          // Let's also verify the update worked by querying the database
          const { data: verifyData } = await supabase
            .from('customization_options')
            .select('required, option_name')
            .eq('jewelry_item_id', productId)
            .eq('setting_id', settingId);
          console.log('Verification query result:', verifyData);
        }
      }
    } catch (err) {
      console.error('Error updating required status:', err);
      // Revert local state on error
      onSettingsChange(oldSettings);
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'An unexpected error occurred. Please try again.'
      });
    }
  };

  // Create new customization step
  const createNewStep = async (stepData: {
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
  }) => {
    try {
      const nextDisplayOrder = Math.max(...settings.map(s => s.setting_display_order), 0) + 1;

      // Create all options for this setting
      const optionsToInsert = stepData.options.map((option, index) => ({
        jewelry_item_id: productId,
        setting_id: stepData.setting_id,
        setting_title: stepData.setting_title,
        setting_description: stepData.setting_description,
        setting_display_order: nextDisplayOrder,
        required: stepData.required,
        affects_image_variant: true, // Default to true for new settings
        option_id: option.option_id,
        option_name: option.option_name,
        price: option.price,
        price_lab_grown: option.price_lab_grown || null,
        image_url: option.image_url || null,
        display_order: index + 1,
        is_active: true
      }));

      const { error: optionError } = await supabase
        .from('customization_options')
        .insert(optionsToInsert);

      if (optionError) {
        console.error('Error creating new step:', optionError);
        addToast({
          type: 'error',
          title: 'Failed to create step',
          message: 'There was an error creating the customization step'
        });
        return;
      }

      // Update local state
      const newSetting: CustomizationSetting = {
        setting_id: stepData.setting_id,
        setting_title: stepData.setting_title,
        setting_display_order: nextDisplayOrder,
        setting_description: stepData.setting_description,
        required: stepData.required,
        affects_image_variant: true, // Default to true for new settings
        options: stepData.options.map((option, index) => ({
          id: '', // This will be updated when we refetch
          option_id: option.option_id,
          option_name: option.option_name,
          price: option.price,
          price_lab_grown: option.price_lab_grown || null,
          image_url: option.image_url || null,
          color_gradient: null,
          display_order: index + 1,
          is_active: true
        }))
      };

      onSettingsChange([...settings, newSetting]);

      // Expand the new setting
      const newExpanded = new Set(expandedSettings);
      newExpanded.add(stepData.setting_id);
      setExpandedSettings(newExpanded);

      addToast({
        type: 'success',
        title: 'Step created successfully',
        message: `"${stepData.setting_title}" with ${stepData.options.length} option${stepData.options.length > 1 ? 's' : ''} has been added to your customization flow`
      });

      setShowNewStepModal(false);
      
      // Notify parent that options changed
      onOptionsChange?.();
    } catch (error) {
      console.error('Error creating new step:', error);
      addToast({
        type: 'error',
        title: 'Failed to create step',
        message: 'There was an error creating the customization step'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Preview Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Customization Settings ({settings.length})
          </h3>
          <p className="text-gray-600 text-sm">
            Drag and drop to reorder steps. Set each step as required or optional.
          </p>
        </div>
        {productSlug && (
          <button
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Customization
          </button>
        )}
      </div>

      {/* Settings List */}
      <div className="space-y-4">
        {settings.map((setting, settingIndex) => (
          <SettingCard
            key={setting.setting_id}
            setting={setting}
            settingIndex={settingIndex}
            isExpanded={expandedSettings.has(setting.setting_id)}
            onToggle={() => toggleSetting(setting.setting_id)}
            onToggleRequired={() => toggleRequired(setting.setting_id)}
            onToggleImageVariant={() => toggleImageVariant(setting.setting_id)}
            onDeleteSetting={() => deleteSetting(setting.setting_id)}
            onMoveUp={() => moveSettingUp(setting.setting_id)}
            onMoveDown={() => moveSettingDown(setting.setting_id)}
            onDragStart={() => handleSettingDragStart(setting.setting_id)}
            onDrop={() => handleSettingDrop(setting.setting_id)}
            onOptionDragStart={(optionId) => handleOptionDragStart(setting.setting_id, optionId)}
            onOptionDrop={(optionId) => handleOptionDrop(setting.setting_id, optionId)}
            editingOption={editingOption}
            onEditOption={setEditingOption}
            productId={productId}
            onSettingsChange={onSettingsChange}
            allSettings={settings}
            isFirst={settingIndex === 0}
            isLast={settingIndex === settings.length - 1}
            onOptionsChange={onOptionsChange}
          />
        ))}
      </div>

      {/* Add New Setting */}
      <button 
        onClick={() => setShowNewStepModal(true)}
        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add New Customization Step
      </button>

      {/* New Step Modal */}
      {showNewStepModal && (
        <NewStepModal 
          onClose={() => setShowNewStepModal(false)}
          onCreate={createNewStep}
          existingSettings={settings}
        />
      )}

      {/* Preview Modal */}
      {showPreview && productSlug && (
        <CustomizationPreview 
          productSlug={productSlug}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

// Setting Card Component
function SettingCard({
  setting,
  settingIndex,
  isExpanded,
  onToggle,
  onToggleRequired,
  onToggleImageVariant,
  onDeleteSetting,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDrop,
  onOptionDragStart,
  onOptionDrop,
  editingOption,
  onEditOption,
  productId,
  onSettingsChange,
  allSettings,
  isFirst,
  isLast,
  onOptionsChange
}: {
  setting: CustomizationSetting;
  settingIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleRequired: () => void;
  onToggleImageVariant: () => void;
  onDeleteSetting?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  onOptionDragStart: (optionId: string) => void;
  onOptionDrop: (optionId: string) => void;
  editingOption: string | null;
  onEditOption: (optionId: string | null) => void;
  productId: string;
  onSettingsChange: (settings: CustomizationSetting[]) => void;
  allSettings: CustomizationSetting[];
  isFirst: boolean;
  isLast: boolean;
  onOptionsChange?: () => void;
}) {
  const [showAddOption, setShowAddOption] = useState(false);
  const [newOption, setNewOption] = useState({
    option_name: '',
    option_id: '',
    price: 0,
    price_lab_grown: 0,
    image_url: null as string | null,
    image_file: null as File | null
  });
  const { addToast } = useToast();

  // Update option display orders in database (local version for SettingCard)
  const updateOptionDisplayOrders = async (options: CustomizationOption[]) => {
    try {
      const promises = options.map(option =>
        supabase
          .from('customization_options')
          .update({ display_order: option.display_order })
          .eq('id', option.id)
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error updating option display orders:', error);
    }
  };

  // Upload image helper (same as in NewStepModal)
  const uploadImageFile = async (file: File): Promise<string> => {
    const fileExt = 'webp';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const maxDimension = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          try {
            const { data, error } = await supabase.storage
              .from('customization_options')
              .upload(fileName, blob, {
                contentType: 'image/webp',
                upsert: false
              });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
              .from('customization_options')
              .getPublicUrl(data.path);

            resolve(publicUrl);
          } catch (uploadError) {
            reject(uploadError);
          }
        }, 'image/webp', 0.9);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Generate option ID from name with uniqueness check
  const generateOptionId = (name: string, allSettings: CustomizationSetting[]) => {
    const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    
    // Collect all existing option IDs across all settings
    const existingIds = new Set<string>();
    allSettings.forEach(setting => {
      setting.options.forEach(option => {
        existingIds.add(option.id);
      });
    });
    
    // If base ID is available, use it
    if (!existingIds.has(baseId)) {
      return baseId;
    }
    
    // If base ID exists, try variants with incrementing numbers
    let counter = 2;
    let candidateId = `${baseId}_${counter}`;
    
    while (existingIds.has(candidateId)) {
      counter++;
      candidateId = `${baseId}_${counter}`;
    }
    
    console.log(`⚠️ ID collision detected! "${baseId}" already exists, using "${candidateId}" instead`);
    return candidateId;
  };

  // Handle option name change and auto-generate ID
  const handleOptionNameChange = (name: string) => {
    const optionId = generateOptionId(name, allSettings);
    setNewOption(prev => ({
      ...prev,
      option_name: name,
      option_id: optionId
    }));
  };

  // Add new option to the setting
  const addNewOption = async () => {
    if (!newOption.option_name.trim()) return;

    try {
      const nextDisplayOrder = Math.max(...setting.options.map(o => o.display_order), 0) + 1;

      // Upload image if there's a file
      let finalImageUrl = newOption.image_url;
      if (newOption.image_file) {
        try {
          finalImageUrl = await uploadImageFile(newOption.image_file);
          // Clean up the blob URL
          if (newOption.image_url && newOption.image_url.startsWith('blob:')) {
            URL.revokeObjectURL(newOption.image_url);
          }
        } catch (error) {
          console.error('Failed to upload image:', error);
          finalImageUrl = null; // Continue without image
        }
      }

      // Ensure unique ID right before insertion (double-check)
      const finalOptionId = generateOptionId(newOption.option_name, allSettings);
      
      const optionToInsert = {
        jewelry_item_id: productId,
        setting_id: setting.setting_id,
        setting_title: setting.setting_title,
        setting_description: setting.setting_description,
        setting_display_order: setting.setting_display_order,
        required: setting.required,
        affects_image_variant: setting.affects_image_variant,
        option_id: finalOptionId,
        option_name: newOption.option_name,
        price: newOption.price,
        price_lab_grown: newOption.price_lab_grown || null,
        image_url: finalImageUrl,
        display_order: nextDisplayOrder,
        is_active: true
      };

      const { data, error } = await supabase
        .from('customization_options')
        .insert(optionToInsert)
        .select()
        .single();

      if (error) {
        console.error('Error adding option:', error);
        addToast({
          type: 'error',
          title: 'Failed to add option',
          message: 'There was an error adding the new option'
        });
        return;
      }

      // Update local state
      const newSettings = allSettings.map(s => {
        if (s.setting_id === setting.setting_id) {
          return {
            ...s,
            options: [...s.options, {
              id: data.id,
              option_id: newOption.option_id,
              option_name: newOption.option_name,
              price: newOption.price,
              price_lab_grown: newOption.price_lab_grown || null,
              image_url: finalImageUrl,
              color_gradient: null,
              display_order: nextDisplayOrder,
              is_active: true
            }]
          };
        }
        return s;
      });

      onSettingsChange(newSettings);

      // Reset form
      setNewOption({
        option_name: '',
        option_id: '',
        price: 0,
        price_lab_grown: 0,
        image_url: null,
        image_file: null
      });
      setShowAddOption(false);

      addToast({
        type: 'success',
        title: 'Option added',
        message: `"${newOption.option_name}" has been added to ${setting.setting_title}`
      });
      
      // Notify parent that options changed
      onOptionsChange?.();

    } catch (error) {
      console.error('Error adding option:', error);
      addToast({
        type: 'error',
        title: 'Failed to add option',
        message: 'An unexpected error occurred while adding the option'
      });
    }
  };

  // Cancel adding option
  const cancelAddOption = () => {
    // Clean up any blob URLs when cancelling
    if (newOption.image_url && newOption.image_url.startsWith('blob:')) {
      URL.revokeObjectURL(newOption.image_url);
    }
    setNewOption({
      option_name: '',
      option_id: '',
      price: 0,
      price_lab_grown: 0,
      image_url: null,
      image_file: null
    });
    setShowAddOption(false);
  };

  // Helper function to delete image from storage
  const deleteImageFromStorage = async (imageUrl: string | null) => {
    if (!imageUrl || !imageUrl.includes('supabase.co')) return;
    
    try {
      // Extract the file path from the public URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      console.log('Attempting to delete image from storage:', fileName);
      
      const { error } = await supabase.storage
        .from('customization_options')
        .remove([fileName]);
        
      if (error) {
        console.error('Error deleting image from storage:', error);
      } else {
        console.log('Successfully deleted image from storage:', fileName);
      }
    } catch (error) {
      console.error('Error parsing image URL for deletion:', error);
    }
  };

  // Delete option function
  const deleteOption = async (optionToDelete: CustomizationOption) => {
    if (!confirm(`Are you sure you want to delete "${optionToDelete.option_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete from database first
      const { error } = await supabase
        .from('customization_options')
        .delete()
        .eq('id', optionToDelete.id);

      if (error) {
        console.error('Error deleting option:', error);
        addToast({
          type: 'error',
          title: 'Failed to delete option',
          message: 'There was an error deleting the option'
        });
        return;
      }

      // Delete associated image from storage (if it exists)
      if (optionToDelete.image_url) {
        await deleteImageFromStorage(optionToDelete.image_url);
      }

      // Update local state
      const newSettings = allSettings.map(s => {
        if (s.setting_id === setting.setting_id) {
          return {
            ...s,
            options: s.options.filter(opt => opt.id !== optionToDelete.id)
          };
        }
        return s;
      });

      onSettingsChange(newSettings);

      addToast({
        type: 'success',
        title: 'Option deleted',
        message: `"${optionToDelete.option_name}" and its image have been deleted`
      });
      
      // Notify parent that options changed
      onOptionsChange?.();

    } catch (error) {
      console.error('Error deleting option:', error);
      addToast({
        type: 'error',
        title: 'Failed to delete option',
        message: 'An unexpected error occurred while deleting the option'
      });
    }
  };

  // Move option up
  const moveOptionUp = async (optionToMove: CustomizationOption) => {
    const currentIndex = setting.options.findIndex(opt => opt.id === optionToMove.id);
    if (currentIndex <= 0) return; // Already at top

    const newSettings = allSettings.map(s => {
      if (s.setting_id === setting.setting_id) {
        const newOptions = [...s.options];
        // Swap with previous option
        [newOptions[currentIndex - 1], newOptions[currentIndex]] = [newOptions[currentIndex], newOptions[currentIndex - 1]];
        
        // Update display orders
        newOptions.forEach((option, index) => {
          option.display_order = index + 1;
        });

        return { ...s, options: newOptions };
      }
      return s;
    });

    onSettingsChange(newSettings);

    // Save to database
    const updatedOptions = newSettings.find(s => s.setting_id === setting.setting_id)?.options || [];
    await updateOptionDisplayOrders(updatedOptions);
    
    addToast({
      type: 'success',
      title: 'Option moved',
      message: `"${optionToMove.option_name}" moved up`
    });
  };

  // Move option down
  const moveOptionDown = async (optionToMove: CustomizationOption) => {
    const currentIndex = setting.options.findIndex(opt => opt.id === optionToMove.id);
    if (currentIndex >= setting.options.length - 1) return; // Already at bottom

    const newSettings = allSettings.map(s => {
      if (s.setting_id === setting.setting_id) {
        const newOptions = [...s.options];
        // Swap with next option
        [newOptions[currentIndex], newOptions[currentIndex + 1]] = [newOptions[currentIndex + 1], newOptions[currentIndex]];
        
        // Update display orders
        newOptions.forEach((option, index) => {
          option.display_order = index + 1;
        });

        return { ...s, options: newOptions };
      }
      return s;
    });

    onSettingsChange(newSettings);

    // Save to database
    const updatedOptions = newSettings.find(s => s.setting_id === setting.setting_id)?.options || [];
    await updateOptionDisplayOrders(updatedOptions);
    
    addToast({
      type: 'success',
      title: 'Option moved',
      message: `"${optionToMove.option_name}" moved down`
    });
  };
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg shadow-sm"
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      {/* Setting Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                {settingIndex + 1}
              </span>
              <h4 className="font-medium text-gray-900">{setting.setting_title}</h4>
            </div>
            <div className="flex items-center space-x-2">
              {setting.required ? (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Required
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                  Optional
                </span>
              )}
              <span className="text-sm text-gray-500">
                {setting.options.length} options
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleRequired}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                setting.required 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {setting.required ? 'Make Optional' : 'Make Required'}
            </button>
            <button
              onClick={onToggleImageVariant}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                setting.affects_image_variant 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
              title={setting.affects_image_variant 
                ? 'This step affects product image variants' 
                : 'This step does not affect product image variants'
              }
            >
              {setting.affects_image_variant ? '🖼️ Affects Images' : '🚫 No Images'}
            </button>
            
            {/* Arrow buttons for reordering steps */}
            <div className="flex flex-col">
              <button
                onClick={() => onMoveUp && onMoveUp()}
                disabled={isFirst}
                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                title="Move step up"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => onMoveDown && onMoveDown()}
                disabled={isLast}
                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                title="Move step down"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>
            
            <button
              onClick={onToggle}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onDeleteSetting && onDeleteSetting()}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Delete this customization step"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {setting.setting_description && (
          <p className="text-sm text-gray-600 mt-2 ml-8">{setting.setting_description}</p>
        )}
      </div>

      {/* Setting Options */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {setting.options.map((option, optionIndex) => (
            <OptionCard
              key={`${setting.setting_id}-${option.id || option.option_id}-${optionIndex}`}
              option={option}
              optionIndex={optionIndex}
              isEditing={editingOption === option.id}
              onEdit={() => onEditOption(editingOption === option.id ? null : option.id)}
              onDelete={() => deleteOption(option)}
              onMoveUp={() => moveOptionUp(option)}
              onMoveDown={() => moveOptionDown(option)}
              onDragStart={() => onOptionDragStart(option.id)}
              onDrop={() => onOptionDrop(option.id)}
              productId={productId}
              settingId={setting.setting_id}
              onSettingsChange={onSettingsChange}
              allSettings={allSettings}
              isFirst={optionIndex === 0}
              isLast={optionIndex === setting.options.length - 1}
              onOptionsChange={onOptionsChange}
            />
          ))}
          
          {/* Add Option */}
          {showAddOption ? (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h5 className="font-medium text-gray-900 mb-3">Add New Option</h5>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Option Name *
                  </label>
                  <input
                    type="text"
                    value={newOption.option_name}
                    onChange={(e) => handleOptionNameChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g., Diamond"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Option ID *
                  </label>
                  <input
                    type="text"
                    value={newOption.option_id}
                    onChange={(e) => setNewOption(prev => ({...prev, option_id: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                    placeholder="diamond"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newOption.price}
                    onChange={(e) => setNewOption(prev => ({...prev, price: parseFloat(e.target.value) || 0}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lab Grown Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newOption.price_lab_grown}
                    onChange={(e) => setNewOption(prev => ({...prev, price_lab_grown: parseFloat(e.target.value) || 0}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              
              {/* Image Upload */}
              <div className="pt-4 border-t border-gray-200">
              <OptionImageUpload
                currentImageUrl={newOption.image_url}
                onImageChange={(imageUrl, file) => setNewOption(prev => ({
                  ...prev, 
                  image_url: imageUrl,
                  image_file: file || null
                }))}
                optionName={newOption.option_name || 'new option'}
                mode="deferred"
              />
              </div>
              
              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={cancelAddOption}
                  className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewOption}
                  disabled={!newOption.option_name.trim()}
                  className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Option
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowAddOption(true)}
              className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Option
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Option Card Component
function OptionCard({
  option,
  optionIndex,
  isEditing,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDrop,
  productId,
  settingId,
  onSettingsChange,
  allSettings,
  isFirst,
  isLast,
  onOptionsChange
}: {
  option: CustomizationOption;
  optionIndex: number;
  isEditing: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  productId: string;
  settingId: string;
  onSettingsChange: (settings: CustomizationSetting[]) => void;
  allSettings: CustomizationSetting[];
  isFirst: boolean;
  isLast: boolean;
  onOptionsChange?: () => void;
}) {
  const [editedOption, setEditedOption] = useState(option);

  const saveOption = async () => {
    try {
      await supabase
        .from('customization_options')
        .update({
          option_name: editedOption.option_name,
          price: editedOption.price,
          price_lab_grown: editedOption.price_lab_grown,
          image_url: editedOption.image_url,
          is_active: editedOption.is_active
        })
        .eq('id', option.id);

      // Update local state
      const newSettings = allSettings.map(setting => {
        if (setting.setting_id === settingId) {
          return {
            ...setting,
            options: setting.options.map(opt => 
              opt.id === option.id ? editedOption : opt
            )
          };
        }
        return setting;
      });

      onSettingsChange(newSettings);
      onEdit();
      
      // Notify parent that variants might need to be regenerated (in case option names changed)
      onOptionsChange?.();
    } catch (error) {
      console.error('Error saving option:', error);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Option Name
            </label>
            <input
              type="text"
              value={editedOption.option_name}
              onChange={(e) => setEditedOption({...editedOption, option_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={editedOption.price}
              onChange={(e) => setEditedOption({...editedOption, price: parseFloat(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lab Grown Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={editedOption.price_lab_grown || ''}
              onChange={(e) => setEditedOption({...editedOption, price_lab_grown: e.target.value ? parseFloat(e.target.value) : null})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`active-${option.id}`}
              checked={editedOption.is_active}
              onChange={(e) => setEditedOption({...editedOption, is_active: e.target.checked})}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
            />
            <label htmlFor={`active-${option.id}`} className="text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>
        
        {/* Image Upload */}
        <div className="mb-4 pt-4 border-t border-gray-200">
          <OptionImageUpload
            currentImageUrl={editedOption.image_url}
            onImageChange={(imageUrl) => setEditedOption({...editedOption, image_url: imageUrl})}
            optionName={editedOption.option_name}
          />
        </div>
        
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveOption}
            className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      <div className="flex items-center space-x-3">
        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
        <span className="text-xs text-gray-500 w-4">{optionIndex + 1}</span>
        <div className="flex items-center space-x-3">
          {option.image_url && (
            <img 
              src={option.image_url} 
              alt={option.option_name}
              className="w-8 h-8 object-cover rounded"
            />
          )}
          {option.color_gradient && (
            <div 
              className="w-8 h-8 rounded border border-gray-300"
              style={{ background: option.color_gradient }}
            />
          )}
          <div>
            <span className="font-medium text-gray-900 text-sm">{option.option_name}</span>
            <div className="text-xs text-gray-500">
              ${option.price}
              {option.price_lab_grown && ` / $${option.price_lab_grown} (lab)`}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {!option.is_active && (
          <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded">Inactive</span>
        )}
        
        {/* Arrow buttons for reordering */}
        <div className="flex flex-col">
          <button
            onClick={() => onMoveUp && onMoveUp()}
            disabled={isFirst}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
            title="Move up"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => onMoveDown && onMoveDown()}
            disabled={isLast}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
            title="Move down"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>
        
        <button
          onClick={onEdit}
          className="p-1 text-gray-400 hover:text-gray-600"
          title="Edit option"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete && onDelete()}
          className="p-1 text-gray-400 hover:text-red-600"
          title="Delete option"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Customization Preview Component
function CustomizationPreview({ productSlug, onClose }: { productSlug: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Customization Preview
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Preview Content */}
        <div className="h-full overflow-hidden">
          <iframe
            src={`/customize/${productSlug}`}
            className="w-full h-full border-0"
            title="Customization Preview"
          />
        </div>
      </div>
    </div>
  );
}
