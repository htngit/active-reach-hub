import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';

// Assuming we have an Icon component from previous examples
import { Icon } from './Icon';

interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  error?: string;
  style?: StyleProp<ViewStyle>;
  checkboxStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled';
  indeterminate?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  id?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  onChange,
  label,
  disabled = false,
  error,
  style,
  checkboxStyle,
  labelStyle,
  size = 'md',
  variant = 'outline',
  indeterminate = false,
  required = false,
  name,
  value,
  id,
}) => {
  // Handle checkbox toggle
  const handleToggle = () => {
    if (disabled) return;
    onChange?.(!checked);
  };
  
  // Get checkbox size based on size prop
  const getCheckboxSize = () => {
    switch (size) {
      case 'sm':
        return styles.smallCheckbox;
      case 'lg':
        return styles.largeCheckbox;
      default:
        return styles.mediumCheckbox;
    }
  };
  
  // Get icon size based on checkbox size
  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 12;
      case 'lg':
        return 18;
      default:
        return 14;
    }
  };
  
  // Get variant style
  const getVariantStyle = () => {
    if (variant === 'filled' && (checked || indeterminate)) {
      return styles.filledCheckbox;
    }
    return {};
  };
  
  // Render checkbox icon
  const renderCheckboxIcon = () => {
    if (!checked && !indeterminate) return null;
    
    return (
      <Icon
        name={indeterminate ? 'minus' : 'check'}
        size={getIconSize()}
        color={variant === 'filled' ? '#ffffff' : '#0f172a'}
      />
    );
  };
  
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.row, disabled && styles.disabledContainer]}
        onPress={handleToggle}
        activeOpacity={0.7}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityLabel={label}
      >
        <View
          style={[
            styles.checkbox,
            getCheckboxSize(),
            getVariantStyle(),
            checkboxStyle,
            checked && styles.checkedCheckbox,
            indeterminate && styles.checkedCheckbox,
            error && styles.errorCheckbox,
            disabled && styles.disabledCheckbox,
          ]}
        >
          {renderCheckboxIcon()}
        </View>
        
        {label && (
          <Text
            style={[
              styles.label,
              labelStyle,
              disabled && styles.disabledLabel,
              error && styles.errorLabel,
            ]}
          >
            {label}
            {required && <Text style={styles.requiredAsterisk}>*</Text>}
          </Text>
        )}
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// Checkbox Group Component
interface CheckboxGroupOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface CheckboxGroupProps {
  options: CheckboxGroupOption[];
  values?: string[];
  onChange?: (values: string[]) => void;
  label?: string;
  disabled?: boolean;
  error?: string;
  style?: StyleProp<ViewStyle>;
  checkboxStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled';
  direction?: 'row' | 'column';
  required?: boolean;
  name?: string;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options,
  values = [],
  onChange,
  label,
  disabled = false,
  error,
  style,
  checkboxStyle,
  labelStyle,
  size = 'md',
  variant = 'outline',
  direction = 'column',
  required = false,
  name,
}) => {
  // Handle checkbox change
  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (!onChange) return;
    
    const newValues = checked
      ? [...values, value]
      : values.filter(v => v !== value);
    
    onChange(newValues);
  };
  
  return (
    <View style={[styles.groupContainer, style]}>
      {label && (
        <Text style={[styles.groupLabel, disabled && styles.disabledLabel]}>
          {label}
          {required && <Text style={styles.requiredAsterisk}>*</Text>}
        </Text>
      )}
      
      <View
        style={[
          styles.optionsContainer,
          direction === 'row' && styles.rowDirection,
        ]}
      >
        {options.map((option, index) => (
          <Checkbox
            key={option.value}
            checked={values.includes(option.value)}
            onChange={(checked) => handleCheckboxChange(option.value, checked)}
            label={option.label}
            disabled={disabled || option.disabled}
            checkboxStyle={checkboxStyle}
            labelStyle={labelStyle}
            size={size}
            variant={variant}
            style={[
              direction === 'row' && styles.inlineCheckbox,
              index < options.length - 1 && styles.marginRight,
            ]}
            name={name}
            value={option.value}
          />
        ))}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    borderWidth: 2,
    borderColor: '#64748b',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  smallCheckbox: {
    width: 16,
    height: 16,
  },
  mediumCheckbox: {
    width: 20,
    height: 20,
  },
  largeCheckbox: {
    width: 24,
    height: 24,
  },
  checkedCheckbox: {
    borderColor: '#0f172a',
  },
  filledCheckbox: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  disabledCheckbox: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f1f5f9',
  },
  errorCheckbox: {
    borderColor: '#ef4444',
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  disabledLabel: {
    color: '#94a3b8',
  },
  errorLabel: {
    color: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 28, // Align with label text
  },
  disabledContainer: {
    opacity: 0.6,
  },
  requiredAsterisk: {
    color: '#ef4444',
    marginLeft: 2,
  },
  // Checkbox Group styles
  groupContainer: {
    marginBottom: 16,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'column',
  },
  rowDirection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  inlineCheckbox: {
    marginRight: 16,
    marginBottom: 8,
  },
  marginRight: {
    marginRight: 16,
  },
});

export default Checkbox;