import { supabase } from '@/lib/supabase/client';

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
  id: string;
  title: string;
  description?: string;
  type: 'single' | 'multiple';
  required: boolean;
  options: CustomizationOption[];
}

interface AppliedRule {
  rule: LogicRule;
  applied: boolean;
  reason?: string;
}

export interface RulesEngineResult {
  filteredSettings: CustomizationSetting[];
  appliedRules: AppliedRule[];
  priceMultipliers: Record<string, number>;
  autoSelections: Record<string, string>; // settingId -> optionId to auto-select
  proposedSelections: Record<string, string>; // settingId -> optionId to propose-select
}

export class LogicRulesEngine {
  private supabaseClient = supabase;
  private rules: LogicRule[] = [];
  private productId: string;

  constructor(productId: string) {
    this.productId = productId;
  }

  /**
   * Load all active rules for the product
   */
  async loadRules(): Promise<void> {
    try {
      console.log('🔍 Loading rules for product ID:', this.productId);
      
      const { data, error } = await this.supabaseClient
        .from('customization_logic_rules')
        .select('*')
        .eq('jewelry_item_id', this.productId)
        .eq('is_active', true)
        .order('created_at');

      if (error) {
        console.error('Error loading logic rules:', {
          error,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          productId: this.productId
        });
        return;
      }

      this.rules = data || [];
      console.log(`🔧 Loaded ${this.rules.length} active logic rules for product ${this.productId}`);
    } catch (error) {
      console.error('Error loading logic rules:', error);
    }
  }

  /**
   * Apply all applicable rules based on current customization state
   */
  applyRules(
    settings: CustomizationSetting[], 
    customizationState: Record<string, string>
  ): RulesEngineResult {
    const appliedRules: AppliedRule[] = [];
    const priceMultipliers: Record<string, number> = {};
    const autoSelections: Record<string, string> = {};
    const proposedSelections: Record<string, string> = {};
    
    // Start with a deep copy of the original settings
    let filteredSettings = JSON.parse(JSON.stringify(settings)) as CustomizationSetting[];

    console.log(`🔍 Applying ${this.rules.length} rules to current state:`, customizationState);

    for (const rule of this.rules) {
      const conditionMet = this.checkCondition(rule, customizationState);
      
      if (conditionMet) {
        console.log(`✅ Rule "${rule.rule_name}" condition met, applying action...`);
        
        const result = this.applyRuleAction(rule, filteredSettings, priceMultipliers, autoSelections, proposedSelections);
        filteredSettings = result.settings;
        
        appliedRules.push({
          rule,
          applied: true,
          reason: 'Condition met'
        });

        if (result.priceMultiplier) {
          priceMultipliers[rule.target_setting_id] = result.priceMultiplier;
        }
      } else {
        appliedRules.push({
          rule,
          applied: false,
          reason: 'Condition not met'
        });
      }
    }

    console.log(`🎯 Applied ${appliedRules.filter(r => r.applied).length} rules`);
    if (Object.keys(priceMultipliers).length > 0) {
      console.log(`💰 Price multipliers:`, priceMultipliers);
    }

    return {
      filteredSettings,
      appliedRules,
      priceMultipliers,
      autoSelections,
      proposedSelections
    };
  }

  /**
   * Check if a rule's condition is met
   */
  private checkCondition(rule: LogicRule, customizationState: Record<string, string>): boolean {
    const selectedValue = customizationState[rule.condition_setting_id];
    const conditionMet = selectedValue === rule.condition_option_id;
    
    console.log(`🔍 Checking rule "${rule.rule_name}": ${rule.condition_setting_id} = "${selectedValue}" (expecting "${rule.condition_option_id}") → ${conditionMet}`);
    
    return conditionMet;
  }

  /**
   * Apply a specific rule action
   */
  private applyRuleAction(
    rule: LogicRule, 
    settings: CustomizationSetting[], 
    priceMultipliers: Record<string, number>,
    autoSelections: Record<string, string>,
    proposedSelections: Record<string, string>
  ): { settings: CustomizationSetting[]; priceMultiplier?: number } {
    const targetSettingIndex = settings.findIndex(s => s.id === rule.target_setting_id);
    
    if (targetSettingIndex === -1) {
      console.warn(`⚠️ Target setting "${rule.target_setting_id}" not found for rule "${rule.rule_name}"`);
      return { settings };
    }

    const targetSetting = settings[targetSettingIndex];

    switch (rule.action_type) {
      case 'exclude_options':
        console.log(`🚫 Excluding options [${rule.target_option_ids.join(', ')}] from "${targetSetting.title}"`);
        targetSetting.options = targetSetting.options.filter(
          option => !rule.target_option_ids.includes(option.option_id)
        );
        break;

      case 'include_only':
        console.log(`✅ Showing only options [${rule.target_option_ids.join(', ')}] in "${targetSetting.title}"`);
        targetSetting.options = targetSetting.options.filter(
          option => rule.target_option_ids.includes(option.option_id)
        );
        break;

      case 'set_required':
        console.log(`📋 Making "${targetSetting.title}" required`);
        targetSetting.required = true;
        break;

      case 'set_optional':
        console.log(`📝 Making "${targetSetting.title}" optional`);
        targetSetting.required = false;
        break;

      case 'set_price_multiplier':
        console.log(`💰 Setting price multiplier ${rule.price_multiplier}x for "${targetSetting.title}"`);
        return { 
          settings, 
          priceMultiplier: rule.price_multiplier || 1 
        };

      case 'exclude_setting':
        console.log(`🙈 Excluding entire setting "${targetSetting.title}"`);
        // Remove the entire setting from the list
        settings.splice(targetSettingIndex, 1);
        break;

      case 'auto_select':
        if (rule.target_option_ids.length > 0) {
          const optionToSelect = rule.target_option_ids[0]; // Use first option for auto-select
          console.log(`🎯 Auto-selecting option "${optionToSelect}" in "${targetSetting.title}"`);
          autoSelections[rule.target_setting_id] = optionToSelect;
        }
        break;

      case 'propose_selection':
        if (rule.target_option_ids.length > 0) {
          const optionToPropose = rule.target_option_ids[0]; // Use first option for propose-select
          console.log(`💡 Proposing option "${optionToPropose}" in "${targetSetting.title}" (setting: ${rule.target_setting_id})`);
          console.log(`💡 Current proposedSelections:`, proposedSelections);
          proposedSelections[rule.target_setting_id] = optionToPropose;
          console.log(`💡 Updated proposedSelections:`, proposedSelections);
        }
        break;

      default:
        console.warn(`⚠️ Unknown action type: ${rule.action_type}`);
    }

    return { settings };
  }

  /**
   * Get a summary of active rules for debugging
   */
  getRulesSummary(): string[] {
    return this.rules.map(rule => {
      const condition = `${rule.condition_setting_id} = ${rule.condition_option_id}`;
      const action = this.formatActionDescription(rule);
      return `"${rule.rule_name}": When ${condition}, ${action}`;
    });
  }

  /**
   * Format rule action for display
   */
  private formatActionDescription(rule: LogicRule): string {
    const targetOptions = rule.target_option_ids.join(', ');

    switch (rule.action_type) {
      case 'exclude_options':
        return `hide [${targetOptions}] from ${rule.target_setting_id}`;
      case 'include_only':
        return `show only [${targetOptions}] in ${rule.target_setting_id}`;
      case 'set_required':
        return `make ${rule.target_setting_id} required`;
      case 'set_optional':
        return `make ${rule.target_setting_id} optional`;
      case 'set_price_multiplier':
        return `apply ${rule.price_multiplier}x price multiplier to ${rule.target_setting_id}`;
      case 'exclude_setting':
        return `hide entire setting ${rule.target_setting_id}`;
      case 'auto_select':
        return `auto-select [${targetOptions}] in ${rule.target_setting_id}`;
      case 'propose_selection':
        return `propose [${targetOptions}] in ${rule.target_setting_id}`;
      default:
        return 'unknown action';
    }
  }

  /**
   * Static method to create and initialize a rules engine
   */
  static async create(productId: string): Promise<LogicRulesEngine> {
    const engine = new LogicRulesEngine(productId);
    await engine.loadRules();
    return engine;
  }
}

export default LogicRulesEngine;
