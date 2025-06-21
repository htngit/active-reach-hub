import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
  GestureResponderEvent,
  Platform,
} from 'react-native';
import { Icon } from './Icon'; // Mengasumsikan komponen Icon sudah dibuat sebelumnya

// Interface untuk props Button
interface ButtonProps {
  // Konten dan tampilan
  children?: React.ReactNode;
  leftIcon?: string;
  rightIcon?: string;
  iconSize?: number;
  iconSpacing?: number;
  spinner?: React.ReactNode;
  spinnerPlacement?: 'start' | 'end';
  isLoading?: boolean;
  loadingText?: string;
  
  // Ukuran dan variasi
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost' | 'link';
  colorScheme?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  isFullWidth?: boolean;
  isRounded?: boolean;
  
  // State
  isDisabled?: boolean;
  isActive?: boolean;
  
  // Event handlers
  onPress?: (event: GestureResponderEvent) => void;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  
  // Styling
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeStyle?: StyleProp<ViewStyle>;
  activeTextStyle?: StyleProp<TextStyle>;
  _hover?: StyleProp<ViewStyle>; // Untuk web
  _pressed?: StyleProp<ViewStyle>;
  _focus?: StyleProp<ViewStyle>; // Untuk web
  _disabled?: StyleProp<ViewStyle>;
}

// Komponen Button
export const Button: React.FC<ButtonProps> = ({
  // Konten dan tampilan
  children,
  leftIcon,
  rightIcon,
  iconSize = 16,
  iconSpacing = 8,
  spinner,
  spinnerPlacement = 'start',
  isLoading = false,
  loadingText,
  
  // Ukuran dan variasi
  size = 'md',
  variant = 'solid',
  colorScheme = 'primary',
  isFullWidth = false,
  isRounded = false,
  
  // State
  isDisabled = false,
  isActive = false,
  
  // Event handlers
  onPress,
  onPressIn,
  onPressOut,
  onLongPress,
  
  // Styling
  style,
  textStyle,
  activeStyle,
  activeTextStyle,
  _pressed,
  _disabled,
}) => {
  // Menentukan apakah button disabled
  const disabled = isDisabled || isLoading;
  
  // Mendapatkan style berdasarkan size
  const getButtonSize = () => {
    switch (size) {
      case 'xs':
        return {
          height: 24,
          paddingHorizontal: 10,
          borderRadius: isRounded ? 12 : 2,
          fontSize: 12,
        };
      case 'sm':
        return {
          height: 32,
          paddingHorizontal: 12,
          borderRadius: isRounded ? 16 : 4,
          fontSize: 14,
        };
      case 'lg':
        return {
          height: 48,
          paddingHorizontal: 24,
          borderRadius: isRounded ? 24 : 6,
          fontSize: 18,
        };
      default: // 'md'
        return {
          height: 40,
          paddingHorizontal: 16,
          borderRadius: isRounded ? 20 : 4,
          fontSize: 16,
        };
    }
  };

  // Mendapatkan warna berdasarkan colorScheme
  const getColorScheme = () => {
    switch (colorScheme) {
      case 'primary':
        return {
          bg: '#3182CE',
          bgHover: '#2B6CB0',
          bgActive: '#2C5282',
          text: '#FFFFFF',
          border: '#3182CE',
        };
      case 'secondary':
        return {
          bg: '#718096',
          bgHover: '#4A5568',
          bgActive: '#2D3748',
          text: '#FFFFFF',
          border: '#718096',
        };
      case 'success':
        return {
          bg: '#38A169',
          bgHover: '#2F855A',
          bgActive: '#276749',
          text: '#FFFFFF',
          border: '#38A169',
        };
      case 'danger':
        return {
          bg: '#E53E3E',
          bgHover: '#C53030',
          bgActive: '#9B2C2C',
          text: '#FFFFFF',
          border: '#E53E3E',
        };
      case 'warning':
        return {
          bg: '#DD6B20',
          bgHover: '#C05621',
          bgActive: '#9C4221',
          text: '#FFFFFF',
          border: '#DD6B20',
        };
      case 'info':
        return {
          bg: '#00B5D8',
          bgHover: '#0987A0',
          bgActive: '#086F83',
          text: '#FFFFFF',
          border: '#00B5D8',
        };
      default:
        return {
          bg: '#3182CE',
          bgHover: '#2B6CB0',
          bgActive: '#2C5282',
          text: '#FFFFFF',
          border: '#3182CE',
        };
    }
  };

  // Mendapatkan style berdasarkan variant dan colorScheme
  const getButtonStyle = () => {
    const colors = getColorScheme();
    const sizeStyle = getButtonSize();
    
    // Base style untuk semua variant
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: sizeStyle.height,
      paddingHorizontal: sizeStyle.paddingHorizontal,
      borderRadius: sizeStyle.borderRadius,
      width: isFullWidth ? '100%' : 'auto',
    };
    
    // Style berdasarkan variant
    switch (variant) {
      case 'solid':
        return {
          ...baseStyle,
          backgroundColor: colors.bg,
          borderWidth: 0,
          ...(isActive && { backgroundColor: colors.bgActive }),
          ...(disabled && { backgroundColor: colors.bg, opacity: 0.4 }),
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
          ...(isActive && { backgroundColor: `${colors.bg}20` }),
          ...(disabled && { borderColor: colors.border, opacity: 0.4 }),
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 0,
          ...(isActive && { backgroundColor: `${colors.bg}20` }),
          ...(disabled && { opacity: 0.4 }),
        };
      case 'link':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 0,
          paddingHorizontal: 0,
          height: 'auto',
          ...(disabled && { opacity: 0.4 }),
        };
      default:
        return baseStyle;
    }
  };

  // Mendapatkan text style berdasarkan variant dan colorScheme
  const getTextStyle = () => {
    const colors = getColorScheme();
    const sizeStyle = getButtonSize();
    
    // Base style untuk text
    const baseStyle: TextStyle = {
      fontSize: sizeStyle.fontSize,
      fontWeight: '600',
      textAlign: 'center',
    };
    
    // Style berdasarkan variant
    switch (variant) {
      case 'solid':
        return {
          ...baseStyle,
          color: colors.text,
        };
      case 'outline':
      case 'ghost':
        return {
          ...baseStyle,
          color: colors.bg,
        };
      case 'link':
        return {
          ...baseStyle,
          color: colors.bg,
          textDecorationLine: 'underline',
        };
      default:
        return baseStyle;
    }
  };

  // Render komponen
  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        style,
        isActive && [styles.active, activeStyle],
        disabled && [styles.disabled, _disabled],
      ]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onLongPress={onLongPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* Loading spinner di awal */}
      {isLoading && spinnerPlacement === 'start' && (
        <View style={styles.spinnerContainer}>
          {spinner || <ActivityIndicator size="small" color={variant === 'solid' ? '#FFFFFF' : getColorScheme().bg} />}
        </View>
      )}
      
      {/* Icon kiri */}
      {!isLoading && leftIcon && (
        <Icon 
          name={leftIcon} 
          size={iconSize} 
          color={variant === 'solid' ? '#FFFFFF' : getColorScheme().bg} 
          style={{ marginRight: iconSpacing }} 
        />
      )}
      
      {/* Text */}
      {typeof children === 'string' ? (
        <Text 
          style={[
            getTextStyle(), 
            textStyle,
            isActive && activeTextStyle,
            leftIcon && styles.textWithLeftIcon,
            rightIcon && styles.textWithRightIcon,
          ]}
          numberOfLines={1}
        >
          {isLoading && loadingText ? loadingText : children}
        </Text>
      ) : (
        children
      )}
      
      {/* Icon kanan */}
      {!isLoading && rightIcon && (
        <Icon 
          name={rightIcon} 
          size={iconSize} 
          color={variant === 'solid' ? '#FFFFFF' : getColorScheme().bg} 
          style={{ marginLeft: iconSpacing }} 
        />
      )}
      
      {/* Loading spinner di akhir */}
      {isLoading && spinnerPlacement === 'end' && (
        <View style={styles.spinnerContainer}>
          {spinner || <ActivityIndicator size="small" color={variant === 'solid' ? '#FFFFFF' : getColorScheme().bg} />}
        </View>
      )}
    </TouchableOpacity>
  );
};

// Styles
const styles = StyleSheet.create({
  active: {
    // Style tambahan untuk state active
  },
  disabled: {
    // Style tambahan untuk state disabled
  },
  spinnerContainer: {
    marginRight: 8,
  },
  textWithLeftIcon: {
    marginLeft: 0,
  },
  textWithRightIcon: {
    marginRight: 0,
  },
});

export default Button;