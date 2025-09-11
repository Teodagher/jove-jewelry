// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { supabase } from '@/lib/supabase/client';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save,
  X,
  Settings,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Zap,
  Target,
  Filter
} from 'lucide-react';

interface CustomizationSetting {
  setting_id: string;
  setting_title: string;
  options: Array<{
    id: string;
    option_id: string;
    option_name: string;
  }>;
}

interface LogicRule {
  id: string;
  rule_name: string;
  description: string | null;
  is_active: boolean;
  condition_setting_id: string;
  condition_option_id: string;
  action_type: 'exclude_options' | 'include_only' | 'set_required' | 'set_optional' | 'set_price_multiplier' | 'exclude_setting' | 'auto_select' | 'propose_selection';
  target_setting_id: string;
  target_option_ids: string[];
  price_multiplier: number | null;
}

interface LogicRulesEditorProps {
  productId: string;
  settings: CustomizationSetting[];
}

export default function LogicRulesEditor({ productId, settings }: LogicRulesEditorProps) {
  const [rules, setRules] = useState<LogicRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);

  const { addToast } = useToast();

  // Load existing rules
  useEffect(() => {
    loadRules();
  }, [productId]);

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('customization_logic_rules')
        .select('*')
        .eq('jewelry_item_id', productId)
        .order('created_at');

      if (error) throw error;

      setRules(data || []);
    } catch (error) {
      console.error('Error loading rules:', error);
      addToast({
        type: 'error',
        title: 'Failed to load rules',
        message: 'Could not load customization logic rules'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = (ruleId: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  const toggleRuleActive = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const newIsActive = !rule.is_active;

    // Update local state immediately
    setRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, is_active: newIsActive } : r
    ));

    try {
      const { error } = await supabase
        .from('customization_logic_rules')
        .update({ is_active: newIsActive })
        .eq('id', ruleId);

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Rule updated',
        message: `Rule "${rule.rule_name}" is now ${newIsActive ? 'active' : 'inactive'}`
      });
    } catch (error) {
      console.error('Error updating rule status:', error);
      // Revert local state
      setRules(prev => prev.map(r => 
        r.id === ruleId ? { ...r, is_active: rule.is_active } : r
      ));
      addToast({
        type: 'error',
        title: 'Update failed',
        message: 'Could not update rule status'
      });
    }
  };

  const deleteRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    if (!confirm(`Are you sure you want to delete the rule "${rule.rule_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('customization_logic_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      setRules(prev => prev.filter(r => r.id !== ruleId));
      
      // Remove from expanded set
      const newExpanded = new Set(expandedRules);
      newExpanded.delete(ruleId);
      setExpandedRules(newExpanded);

      addToast({
        type: 'success',
        title: 'Rule deleted',
        message: `Rule "${rule.rule_name}" has been deleted`
      });
    } catch (error) {
      console.error('Error deleting rule:', error);
      addToast({
        type: 'error',
        title: 'Delete failed',
        message: 'Could not delete the rule'
      });
    }
  };

  // Get setting title by ID
  const getSettingTitle = (settingId: string) => {
    const setting = settings.find(s => s.setting_id === settingId);
    return setting?.setting_title || settingId;
  };

  // Get option name by setting and option ID
  const getOptionName = (settingId: string, optionId: string) => {
    const setting = settings.find(s => s.setting_id === settingId);
    const option = setting?.options.find(o => o.option_id === optionId);
    return option?.option_name || optionId;
  };

  // Format action description
  const formatActionDescription = (rule: LogicRule) => {
    const targetSetting = getSettingTitle(rule.target_setting_id);
    const targetOptions = rule.target_option_ids.map(id => 
      getOptionName(rule.target_setting_id, id)
    ).join(', ');

    switch (rule.action_type) {
      case 'exclude_options':
        return `Hide "${targetOptions}" from ${targetSetting}`;
      case 'include_only':
        return `Show only "${targetOptions}" in ${targetSetting}`;
      case 'set_required':
        return `Make ${targetSetting} required`;
      case 'set_optional':
        return `Make ${targetSetting} optional`;
      case 'set_price_multiplier':
        return `Apply ${rule.price_multiplier}x price multiplier to ${targetSetting}`;
      case 'exclude_setting':
        return `Hide entire ${targetSetting} setting`;
      case 'auto_select':
        return `Auto-select "${targetOptions}" in ${targetSetting}`;
      case 'propose_selection':
        return `Propose "${targetOptions}" in ${targetSetting}`;
      default:
        return 'Unknown action';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            Logic Rules ({rules.length})
          </h3>
          <p className="text-gray-600 text-sm">
            Create dynamic rules to control customization behavior based on user selections.
          </p>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            isExpanded={expandedRules.has(rule.id)}
            onToggle={() => toggleRule(rule.id)}
            onToggleActive={() => toggleRuleActive(rule.id)}
            onDelete={() => deleteRule(rule.id)}
            onEdit={() => setEditingRule(rule.id)}
            getSettingTitle={getSettingTitle}
            getOptionName={getOptionName}
            formatActionDescription={formatActionDescription}
            settings={settings}
            productId={productId}
            onRuleUpdated={loadRules}
          />
        ))}

        {rules.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Logic Rules Yet</h3>
            <p className="text-gray-600 mb-4">
              Create rules to dynamically control customization options based on user selections.
            </p>
            <button
              onClick={() => setShowNewRuleForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Rule
            </button>
          </div>
        )}
      </div>

      {/* Add New Rule */}
      {!showNewRuleForm && rules.length > 0 && (
        <button 
          onClick={() => setShowNewRuleForm(true)}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Logic Rule
        </button>
      )}

      {/* New Rule Form */}
      {showNewRuleForm && (
        <NewRuleForm 
          settings={settings}
          productId={productId}
          onClose={() => setShowNewRuleForm(false)}
          onSuccess={() => {
            setShowNewRuleForm(false);
            loadRules();
          }}
        />
      )}
    </div>
  );
}

// Rule Card Component
function RuleCard({
  rule,
  isExpanded,
  onToggle,
  onToggleActive,
  onDelete,
  onEdit,
  getSettingTitle,
  getOptionName,
  formatActionDescription,
  settings,
  productId,
  onRuleUpdated
}: {
  rule: LogicRule;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onEdit: () => void;
  getSettingTitle: (id: string) => string;
  getOptionName: (settingId: string, optionId: string) => string;
  formatActionDescription: (rule: LogicRule) => string;
  settings: CustomizationSetting[];
  productId: string;
  onRuleUpdated: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Rule Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Zap className={`w-4 h-4 ${rule.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
              <h4 className="font-medium text-gray-900">{rule.rule_name}</h4>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                rule.is_active 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {rule.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleActive}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                rule.is_active 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {rule.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={onToggle}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Delete rule"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Rule Summary */}
        <div className="mt-3 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <span className="font-medium">When:</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              {getSettingTitle(rule.condition_setting_id)} = {getOptionName(rule.condition_setting_id, rule.condition_option_id)}
            </span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className="font-medium">Then:</span>
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
              {formatActionDescription(rule)}
            </span>
          </div>
        </div>

        {rule.description && (
          <p className="text-sm text-gray-600 mt-2">{rule.description}</p>
        )}
      </div>

      {/* Rule Details (when expanded) */}
      {isExpanded && (
        <div className="p-4">
          <RuleEditor
            rule={rule}
            settings={settings}
            productId={productId}
            onSuccess={onRuleUpdated}
            onCancel={onToggle}
          />
        </div>
      )}
    </div>
  );
}

// New Rule Form Component
function NewRuleForm({
  settings,
  productId,
  onClose,
  onSuccess
}: {
  settings: CustomizationSetting[];
  productId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    rule_name: '',
    description: '',
    condition_setting_id: '',
    condition_option_id: '',
    action_type: 'exclude_options' as LogicRule['action_type'],
    target_setting_id: '',
    target_option_ids: [] as string[],
    price_multiplier: 1
  });

  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.rule_name || !formData.condition_setting_id || !formData.condition_option_id || 
        !formData.target_setting_id || formData.target_option_ids.length === 0) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('customization_logic_rules')
        .insert({
          jewelry_item_id: productId,
          rule_name: formData.rule_name,
          description: formData.description || null,
          condition_setting_id: formData.condition_setting_id,
          condition_option_id: formData.condition_option_id,
          action_type: formData.action_type,
          target_setting_id: formData.target_setting_id,
          target_option_ids: formData.target_option_ids,
          price_multiplier: formData.action_type === 'set_price_multiplier' ? formData.price_multiplier : null,
          is_active: true
        });

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Rule created',
        message: `Logic rule "${formData.rule_name}" has been created`
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating rule:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? (error as any).message 
        : 'Could not create the logic rule';
      
      addToast({
        type: 'error',
        title: 'Failed to create rule',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Get available options for the selected condition setting
  const conditionOptions = settings.find(s => s.setting_id === formData.condition_setting_id)?.options || [];
  
  // Get available options for the selected target setting
  const targetOptions = settings.find(s => s.setting_id === formData.target_setting_id)?.options || [];

  return (
    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
      <h5 className="font-medium text-gray-900 mb-4 flex items-center">
        <Plus className="w-4 h-4 mr-2" />
        Create New Logic Rule
      </h5>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rule Name *
            </label>
            <input
              type="text"
              value={formData.rule_name}
              onChange={(e) => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="e.g., Hide gold for white gold chain"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Optional description"
            />
          </div>
        </div>

        {/* Condition */}
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <h6 className="font-medium text-gray-900 mb-3 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            When (Condition)
          </h6>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Setting *
              </label>
              <select
                value={formData.condition_setting_id}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  condition_setting_id: e.target.value,
                  condition_option_id: '' 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Select setting</option>
                {settings.map(setting => (
                  <option key={setting.setting_id} value={setting.setting_id}>
                    {setting.setting_title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Option *
              </label>
              <select
                value={formData.condition_option_id}
                onChange={(e) => setFormData(prev => ({ ...prev, condition_option_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={!formData.condition_setting_id}
              >
                <option value="">Select option</option>
                {conditionOptions.map(option => (
                  <option key={option.option_id} value={option.option_id}>
                    {option.option_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <h6 className="font-medium text-gray-900 mb-3 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Then (Action)
          </h6>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Type *
              </label>
              <select
                value={formData.action_type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  action_type: e.target.value as LogicRule['action_type'],
                  target_option_ids: []
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="exclude_options">Hide specific options</option>
                <option value="include_only">Show only specific options</option>
                <option value="exclude_setting">Hide entire setting</option>
                <option value="auto_select">Auto-select option</option>
                <option value="propose_selection">Propose option</option>
                <option value="set_required">Make setting required</option>
                <option value="set_optional">Make setting optional</option>
                <option value="set_price_multiplier">Apply price multiplier</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Setting *
              </label>
              <select
                value={formData.target_setting_id}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  target_setting_id: e.target.value,
                  target_option_ids: []
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Select target setting</option>
                {settings.map(setting => (
                  <option key={setting.setting_id} value={setting.setting_id}>
                    {setting.setting_title}
                  </option>
                ))}
              </select>
            </div>

            {(['exclude_options', 'include_only', 'auto_select', 'propose_selection'].includes(formData.action_type)) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Options *
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {targetOptions.map(option => (
                    <label key={option.option_id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.target_option_ids.includes(option.option_id)}
                        onChange={(e) => {
                          const optionId = option.option_id;
                          setFormData(prev => ({
                            ...prev,
                            target_option_ids: e.target.checked
                              ? [...prev.target_option_ids, optionId]
                              : prev.target_option_ids.filter(id => id !== optionId)
                          }));
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                      />
                      <span className="text-sm text-gray-700">{option.option_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formData.action_type === 'set_price_multiplier' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Multiplier *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.price_multiplier}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price_multiplier: parseFloat(e.target.value) || 1 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="1.0"
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Rule'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Rule Editor Component (for editing existing rules)
function RuleEditor({
  rule,
  settings,
  productId,
  onSuccess,
  onCancel
}: {
  rule: LogicRule;
  settings: CustomizationSetting[];
  productId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    rule_name: rule.rule_name,
    description: rule.description || '',
    condition_setting_id: rule.condition_setting_id,
    condition_option_id: rule.condition_option_id,
    action_type: rule.action_type,
    target_setting_id: rule.target_setting_id,
    target_option_ids: [...rule.target_option_ids],
    price_multiplier: rule.price_multiplier || 1
  });

  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('customization_logic_rules')
        .update({
          rule_name: formData.rule_name,
          description: formData.description || null,
          condition_setting_id: formData.condition_setting_id,
          condition_option_id: formData.condition_option_id,
          action_type: formData.action_type,
          target_setting_id: formData.target_setting_id,
          target_option_ids: formData.target_option_ids,
          price_multiplier: formData.action_type === 'set_price_multiplier' ? formData.price_multiplier : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', rule.id);

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Rule updated',
        message: `Logic rule "${formData.rule_name}" has been updated`
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating rule:', error);
      addToast({
        type: 'error',
        title: 'Failed to update rule',
        message: 'Could not update the logic rule'
      });
    } finally {
      setLoading(false);
    }
  };

  // Get available options for the selected condition setting
  const conditionOptions = settings.find(s => s.setting_id === formData.condition_setting_id)?.options || [];
  
  // Get available options for the selected target setting
  const targetOptions = settings.find(s => s.setting_id === formData.target_setting_id)?.options || [];

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h5 className="font-medium text-gray-900 mb-4 flex items-center">
        <Edit className="w-4 h-4 mr-2" />
        Edit Rule
      </h5>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rule Name *
            </label>
            <input
              type="text"
              value={formData.rule_name}
              onChange={(e) => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Condition */}
        <div className="border border-gray-300 rounded-lg p-3 bg-white">
          <h6 className="font-medium text-gray-900 mb-2 text-sm">When (Condition)</h6>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Setting *
              </label>
              <select
                value={formData.condition_setting_id}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  condition_setting_id: e.target.value,
                  condition_option_id: '' 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Select setting</option>
                {settings.map(setting => (
                  <option key={setting.setting_id} value={setting.setting_id}>
                    {setting.setting_title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Option *
              </label>
              <select
                value={formData.condition_option_id}
                onChange={(e) => setFormData(prev => ({ ...prev, condition_option_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={!formData.condition_setting_id}
              >
                <option value="">Select option</option>
                {conditionOptions.map(option => (
                  <option key={option.option_id} value={option.option_id}>
                    {option.option_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="border border-gray-300 rounded-lg p-3 bg-white">
          <h6 className="font-medium text-gray-900 mb-2 text-sm">Then (Action)</h6>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Type *
              </label>
              <select
                value={formData.action_type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  action_type: e.target.value as LogicRule['action_type'],
                  target_option_ids: []
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="exclude_options">Hide specific options</option>
                <option value="include_only">Show only specific options</option>
                <option value="exclude_setting">Hide entire setting</option>
                <option value="auto_select">Auto-select option</option>
                <option value="propose_selection">Propose option</option>
                <option value="set_required">Make setting required</option>
                <option value="set_optional">Make setting optional</option>
                <option value="set_price_multiplier">Apply price multiplier</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Setting *
              </label>
              <select
                value={formData.target_setting_id}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  target_setting_id: e.target.value,
                  target_option_ids: []
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Select target setting</option>
                {settings.map(setting => (
                  <option key={setting.setting_id} value={setting.setting_id}>
                    {setting.setting_title}
                  </option>
                ))}
              </select>
            </div>

            {(['exclude_options', 'include_only', 'auto_select', 'propose_selection'].includes(formData.action_type)) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Options *
                </label>
                <div className="space-y-1 max-h-24 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {targetOptions.map(option => (
                    <label key={option.option_id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.target_option_ids.includes(option.option_id)}
                        onChange={(e) => {
                          const optionId = option.option_id;
                          setFormData(prev => ({
                            ...prev,
                            target_option_ids: e.target.checked
                              ? [...prev.target_option_ids, optionId]
                              : prev.target_option_ids.filter(id => id !== optionId)
                          }));
                        }}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                      />
                      <span className="text-xs text-gray-700">{option.option_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formData.action_type === 'set_price_multiplier' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Multiplier *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.price_multiplier}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price_multiplier: parseFloat(e.target.value) || 1 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
