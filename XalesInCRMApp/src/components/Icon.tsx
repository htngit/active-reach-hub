import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

// Icon mapping to ensure compatibility with web version
const iconMap = {
  // User related
  'user': 'user',
  'user-plus': 'user-plus',
  'users': 'users',
  
  // Status related
  'check': 'check',
  'check-circle': 'check-circle',
  'check-square': 'check-square',
  'x': 'x',
  'x-circle': 'x-circle',
  'alert-circle': 'alert-circle',
  'alert-triangle': 'alert-triangle',
  
  // Communication
  'mail': 'mail',
  'phone': 'phone',
  'message-circle': 'message-circle',
  'message-square': 'message-square',
  
  // Actions
  'plus': 'plus',
  'plus-circle': 'plus-circle',
  'minus': 'minus',
  'minus-circle': 'minus-circle',
  'edit': 'edit',
  'edit-2': 'edit-2',
  'edit-3': 'edit-3',
  'trash': 'trash',
  'trash-2': 'trash-2',
  
  // Navigation
  'chevron-down': 'chevron-down',
  'chevron-up': 'chevron-up',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'arrow-left': 'arrow-left',
  'arrow-right': 'arrow-right',
  'arrow-up': 'arrow-up',
  'arrow-down': 'arrow-down',
  
  // UI elements
  'menu': 'menu',
  'more-horizontal': 'more-horizontal',
  'more-vertical': 'more-vertical',
  'settings': 'settings',
  'bell': 'bell',
  'search': 'search',
  'filter': 'filter',
  'calendar': 'calendar',
  'clock': 'clock',
  
  // Data visualization
  'bar-chart': 'bar-chart',
  'bar-chart-2': 'bar-chart-2',
  'pie-chart': 'pie-chart',
  'trending-up': 'trending-up',
  'trending-down': 'trending-down',
  'dollar-sign': 'dollar-sign',
  'percent': 'percent',
  
  // Password visibility
  'eye': 'eye',
  'eye-off': 'eye-off',
  
  // Fallback for any unmapped icons
  'help-circle': 'help-circle',
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
  [key: string]: any;
}

/**
 * Icon component that provides a consistent interface for using icons
 * across the application. Uses Feather icons from Expo vector icons.
 * 
 * @param {string} name - The name of the icon to display
 * @param {number} size - The size of the icon (default: 24)
 * @param {string} color - The color of the icon (default: currentColor)
 * @param {object} style - Additional styles to apply to the icon
 * @returns {React.ReactNode}
 */
export const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000', style, ...props }) => {
  // Map the icon name to the corresponding Feather icon
  // If the icon is not found in the map, use 'help-circle' as fallback
  const iconName = iconMap[name as keyof typeof iconMap] || 'help-circle';
  
  return (
    <Feather 
      name={iconName as any} 
      size={size} 
      color={color} 
      style={style} 
      {...props} 
    />
  );
};

interface IconButtonProps {
  icon: string;
  onPress?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: any;
  [key: string]: any;
}

/**
 * Button with an icon
 * 
 * @param {string} icon - The name of the icon to display
 * @param {function} onPress - Function to call when the button is pressed
 * @param {string} variant - The variant of the button (default, outline, ghost)
 * @param {string} size - The size of the button (sm, md, lg)
 * @param {boolean} disabled - Whether the button is disabled
 * @param {object} style - Additional styles to apply to the button
 * @returns {React.ReactNode}
 */
export const IconButton: React.FC<IconButtonProps> = ({ 
  icon, 
  onPress, 
  variant = 'default', 
  size = 'md', 
  disabled = false,
  style,
  ...props 
}) => {
  // Size mapping
  const sizeMap = {
    sm: { button: 32, icon: 16 },
    md: { button: 40, icon: 20 },
    lg: { button: 48, icon: 24 },
  };
  
  // Get the button and icon size based on the size prop
  const buttonSize = sizeMap[size]?.button || sizeMap.md.button;
  const iconSize = sizeMap[size]?.icon || sizeMap.md.icon;
  
  // Variant styles
  const getVariantStyle = () => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? '#E2E8F0' : '#CBD5E1',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {
          backgroundColor: disabled ? '#F1F5F9' : '#F8FAFC',
        };
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: disabled ? 0.5 : 1,
        },
        getVariantStyle(),
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      <Icon 
        name={icon} 
        size={iconSize} 
        color={disabled ? '#94A3B8' : '#64748B'} 
      />
    </TouchableOpacity>
  );
};

export default Icon;