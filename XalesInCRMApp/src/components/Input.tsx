import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TextInputProps as RNTextInputProps,
  Platform,
  Animated,
} from 'react-native';
import { Icon } from './Icon'; // Mengimpor komponen Icon yang telah dibuat sebelumnya

// Interface untuk props Input
interface InputProps extends Omit<RNTextInputProps, 'style'> {
  // Properti dasar
  value?: string;
  defaultValue?: string;
  onChange?: (text: string) => void;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
  
  // Styling dan tampilan
  variant?: 'outline' | 'filled' | 'unstyled' | 'underlined';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  colorScheme?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  
  // Label dan teks bantuan
  label?: string;
  labelStyle?: TextStyle;
  helperText?: string;
  helperTextStyle?: TextStyle;
  errorText?: string;
  errorTextStyle?: TextStyle;
  
  // Icon dan elemen tambahan
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  leftIcon?: string;
  rightIcon?: string;
  iconSize?: number;
  iconColor?: string;
  
  // Interaksi
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  autoFocus?: boolean;
  
  // Validasi
  isValid?: boolean;
  validate?: (value: string) => boolean | string;
  
  // Masking dan formatting
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
  mask?: string;
  formatter?: (value: string) => string;
  parser?: (value: string) => string;
}

// Komponen Input
export const Input: React.FC<InputProps> = ({
  // Properti dasar
  value,
  defaultValue,
  onChange,
  onChangeText,
  placeholder = '',
  isDisabled = false,
  isReadOnly = false,
  isInvalid = false,
  isRequired = false,
  
  // Styling dan tampilan
  variant = 'outline',
  size = 'md',
  colorScheme = 'blue',
  style,
  inputStyle,
  
  // Label dan teks bantuan
  label,
  labelStyle,
  helperText,
  helperTextStyle,
  errorText,
  errorTextStyle,
  
  // Icon dan elemen tambahan
  leftElement,
  rightElement,
  leftIcon,
  rightIcon,
  iconSize = 20,
  iconColor = '#718096',
  
  // Interaksi
  onFocus,
  onBlur,
  autoFocus = false,
  
  // Validasi
  isValid = false,
  validate,
  
  // Masking dan formatting
  type = 'text',
  mask,
  formatter,
  parser,
  
  // Props lainnya dari TextInput
  ...rest
}) => {
  // State untuk mengelola nilai input, fokus, dan validasi
  const [inputValue, setInputValue] = useState(value || defaultValue || '');
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [secureTextEntry, setSecureTextEntry] = useState(type === 'password');
  
  // Ref untuk TextInput
  const inputRef = useRef<TextInput>(null);
  
  // Animasi untuk efek fokus
  const focusAnim = useRef(new Animated.Value(0)).current;
  
  // Effect untuk memperbarui nilai input saat prop value berubah
  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);
  
  // Effect untuk animasi fokus
  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);
  
  // Handler untuk perubahan teks
  const handleChangeText = (text: string) => {
    let processedText = text;
    
    // Menerapkan parser jika ada
    if (parser) {
      processedText = parser(text);
    }
    
    // Menerapkan masking jika ada
    if (mask) {
      // Implementasi sederhana untuk masking
      // Untuk implementasi yang lebih kompleks, gunakan library seperti react-native-mask-text
      let maskedText = '';
      let unmaskedIndex = 0;
      
      for (let i = 0; i < mask.length; i++) {
        if (unmaskedIndex >= processedText.length) break;
        
        if (mask[i] === '#') {
          maskedText += processedText[unmaskedIndex];
          unmaskedIndex++;
        } else {
          maskedText += mask[i];
          if (processedText[unmaskedIndex] === mask[i]) {
            unmaskedIndex++;
          }
        }
      }
      
      processedText = maskedText;
    }
    
    // Menerapkan formatter jika ada
    if (formatter) {
      processedText = formatter(processedText);
    }
    
    // Memperbarui state
    setInputValue(processedText);
    
    // Memanggil callback
    if (onChangeText) {
      onChangeText(processedText);
    }
    if (onChange) {
      onChange(processedText);
    }
    
    // Validasi
    if (validate) {
      const validationResult = validate(processedText);
      if (typeof validationResult === 'string') {
        setValidationError(validationResult);
      } else if (!validationResult) {
        setValidationError('Invalid input');
      } else {
        setValidationError(null);
      }
    }
  };
  
  // Handler untuk fokus
  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };
  
  // Handler untuk blur
  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };
  
  // Toggle untuk password visibility
  const togglePasswordVisibility = () => {
    setSecureTextEntry(!secureTextEntry);
  };
  
  // Mendapatkan style berdasarkan size
  const getInputSizeStyle = () => {
    switch (size) {
      case 'xs':
        return {
          height: 32,
          fontSize: 12,
          paddingHorizontal: 8,
        };
      case 'sm':
        return {
          height: 36,
          fontSize: 14,
          paddingHorizontal: 10,
        };
      case 'lg':
        return {
          height: 48,
          fontSize: 18,
          paddingHorizontal: 16,
        };
      case 'md':
      default:
        return {
          height: 40,
          fontSize: 16,
          paddingHorizontal: 12,
        };
    }
  };
  
  // Mendapatkan style berdasarkan variant
  const getInputVariantStyle = () => {
    const baseStyle: ViewStyle = {
      borderWidth: 1,
      borderRadius: 4,
      backgroundColor: 'transparent',
    };
    
    const focusedBorderColor = `#${colorScheme}500`;
    const errorBorderColor = '#E53E3E';
    const validBorderColor = '#38A169';
    
    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: isFocused ? '#F7FAFC' : '#EDF2F7',
          borderColor: isInvalid
            ? errorBorderColor
            : isValid
            ? validBorderColor
            : isFocused
            ? focusedBorderColor
            : '#E2E8F0',
        };
      case 'unstyled':
        return {
          borderWidth: 0,
          backgroundColor: 'transparent',
        };
      case 'underlined':
        return {
          borderWidth: 0,
          borderBottomWidth: 1,
          borderRadius: 0,
          backgroundColor: 'transparent',
          borderColor: isInvalid
            ? errorBorderColor
            : isValid
            ? validBorderColor
            : isFocused
            ? focusedBorderColor
            : '#E2E8F0',
        };
      case 'outline':
      default:
        return {
          ...baseStyle,
          borderColor: isInvalid
            ? errorBorderColor
            : isValid
            ? validBorderColor
            : isFocused
            ? focusedBorderColor
            : '#E2E8F0',
        };
    }
  };
  
  // Mendapatkan style untuk label
  const getLabelStyle = () => {
    const baseLabelStyle: TextStyle = {
      marginBottom: 4,
      fontWeight: '500',
    };
    
    switch (size) {
      case 'xs':
        return {
          ...baseLabelStyle,
          fontSize: 12,
        };
      case 'sm':
        return {
          ...baseLabelStyle,
          fontSize: 14,
        };
      case 'lg':
        return {
          ...baseLabelStyle,
          fontSize: 16,
        };
      case 'md':
      default:
        return {
          ...baseLabelStyle,
          fontSize: 14,
        };
    }
  };
  
  // Mendapatkan style untuk helper text
  const getHelperTextStyle = () => {
    return {
      fontSize: size === 'xs' ? 10 : size === 'sm' ? 12 : size === 'lg' ? 14 : 12,
      color: '#718096',
      marginTop: 2,
    };
  };
  
  // Mendapatkan style untuk error text
  const getErrorTextStyle = () => {
    return {
      fontSize: size === 'xs' ? 10 : size === 'sm' ? 12 : size === 'lg' ? 14 : 12,
      color: '#E53E3E',
      marginTop: 2,
    };
  };
  
  // Render
  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[getLabelStyle(), labelStyle]}>
            {label}
            {isRequired && <Text style={{ color: '#E53E3E' }}> *</Text>}
          </Text>
        </View>
      )}
      
      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          getInputVariantStyle(),
          getInputSizeStyle(),
          isDisabled && styles.disabledInput,
        ]}
      >
        {/* Left Element or Icon */}
        {leftElement ? (
          <View style={styles.leftElement}>{leftElement}</View>
        ) : leftIcon ? (
          <View style={styles.leftElement}>
            <Icon name={leftIcon} size={iconSize} color={iconColor} />
          </View>
        ) : null}
        
        {/* TextInput */}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              fontSize: getInputSizeStyle().fontSize,
              paddingLeft: leftElement || leftIcon ? 0 : getInputSizeStyle().paddingHorizontal,
              paddingRight: rightElement || rightIcon || type === 'password' ? 0 : getInputSizeStyle().paddingHorizontal,
            },
            inputStyle,
          ]}
          value={inputValue}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A0AEC0"
          editable={!isDisabled && !isReadOnly}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          secureTextEntry={secureTextEntry}
          keyboardType={type === 'number' ? 'numeric' : type === 'email' ? 'email-address' : type === 'tel' ? 'phone-pad' : type === 'url' ? 'url' : 'default'}
          {...rest}
        />
        
        {/* Right Element or Icon */}
        {rightElement ? (
          <View style={styles.rightElement}>{rightElement}</View>
        ) : type === 'password' ? (
          <TouchableOpacity style={styles.rightElement} onPress={togglePasswordVisibility}>
            <Icon name={secureTextEntry ? 'eye' : 'eye-off'} size={iconSize} color={iconColor} />
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightElement}>
            <Icon name={rightIcon} size={iconSize} color={iconColor} />
          </View>
        ) : null}
      </View>
      
      {/* Error Text or Helper Text */}
      {isInvalid && errorText ? (
        <Text style={[getErrorTextStyle(), errorTextStyle]}>{errorText}</Text>
      ) : validationError ? (
        <Text style={[getErrorTextStyle(), errorTextStyle]}>{validationError}</Text>
      ) : helperText ? (
        <Text style={[getHelperTextStyle(), helperTextStyle]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    color: '#1A202C',
    paddingVertical: 0, // Menghilangkan padding vertikal default di Android
  },
  leftElement: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  rightElement: {
    paddingRight: 12,
    paddingLeft: 8,
  },
  disabledInput: {
    opacity: 0.4,
    backgroundColor: '#EDF2F7',
  },
});

export default Input;