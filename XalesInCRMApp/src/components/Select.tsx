import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Props untuk komponen Select
export interface SelectProps {
  options: SelectOption[];
  value?: string | string[];
  defaultValue?: string | string[];
  placeholder?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isSearchable?: boolean;
  isMulti?: boolean;
  isRequired?: boolean;
  isLoading?: boolean;
  onChange?: (value: string | string[]) => void;
  onOpen?: () => void;
  onClose?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled' | 'unstyled';
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  maxHeight?: number;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  menuStyle?: StyleProp<ViewStyle>;
  optionStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  placeholderStyle?: StyleProp<TextStyle>;
  textStyle?: StyleProp<TextStyle>;
  helperTextStyle?: StyleProp<TextStyle>;
  errorTextStyle?: StyleProp<TextStyle>;
}

// Interface untuk opsi Select
export interface SelectOption {
  label: string;
  value: string;
  isDisabled?: boolean;
  icon?: React.ReactNode;
}

// Komponen Select
export const Select: React.FC<SelectProps> = ({
  options,
  value: controlledValue,
  defaultValue,
  placeholder = 'Select option',
  isDisabled = false,
  isInvalid = false,
  isSearchable = false,
  isMulti = false,
  isRequired = false,
  isLoading = false,
  onChange,
  onOpen,
  onClose,
  size = 'md',
  variant = 'outline',
  icon,
  rightIcon,
  label,
  helperText,
  errorMessage,
  maxHeight = 200,
  containerStyle,
  inputStyle,
  menuStyle,
  optionStyle,
  labelStyle,
  placeholderStyle,
  textStyle,
  helperTextStyle,
  errorTextStyle,
}) => {
  // State untuk nilai yang dipilih
  const [value, setValue] = useState<string | string[]>(
    controlledValue !== undefined ? controlledValue : defaultValue || (isMulti ? [] : '')
  );
  
  // State untuk menu terbuka/tertutup
  const [isOpen, setIsOpen] = useState(false);
  
  // State untuk animasi
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;
  
  // State untuk pencarian
  const [searchValue, setSearchValue] = useState('');
  
  // Refs untuk pengukuran posisi
  const inputRef = useRef<View>(null);
  const [inputPosition, setInputPosition] = useState<{ x: number; y: number; width: number; height: number }>(
    { x: 0, y: 0, width: 0, height: 0 }
  );
  
  // Menggunakan nilai dari props jika disediakan (controlled component)
  useEffect(() => {
    if (controlledValue !== undefined) {
      setValue(controlledValue);
    }
  }, [controlledValue]);
  
  // Menangani animasi saat menu dibuka atau ditutup
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      onOpen && onOpen();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -10,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false);
        onClose && onClose();
      });
    }
  }, [isOpen]);
  
  // Mengukur posisi dan ukuran input
  const measureInput = () => {
    if (inputRef.current) {
      if (Platform.OS === 'web') {
        inputRef.current.measureInWindow((x, y, width, height) => {
          setInputPosition({ x, y, width, height });
        });
      } else {
        setTimeout(() => {
          inputRef.current?.measureInWindow((x, y, width, height) => {
            setInputPosition({ x, y, width, height });
          });
        }, 100);
      }
    }
  };

  // Menangani toggle menu
  const handleToggle = () => {
    if (isDisabled) return;
    
    if (!isOpen) {
      measureInput();
      setSearchValue('');
    }
    
    setIsOpen(!isOpen);
  };
  
  // Menangani pemilihan opsi
  const handleSelect = (option: SelectOption) => {
    if (option.isDisabled) return;
    
    if (isMulti) {
      // Untuk multi-select
      const values = value as string[];
      const newValue = values.includes(option.value)
        ? values.filter(v => v !== option.value)
        : [...values, option.value];
      
      setValue(newValue);
      onChange && onChange(newValue);
    } else {
      // Untuk single-select
      setValue(option.value);
      onChange && onChange(option.value);
      setIsOpen(false);
    }
  };
  
  // Menangani klik pada overlay
  const handleOverlayPress = () => {
    setIsOpen(false);
  };
  
  // Menangani perubahan input pencarian
  const handleSearchChange = (text: string) => {
    setSearchValue(text);
  };
  
  // Filter opsi berdasarkan pencarian
  const filteredOptions = isSearchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchValue.toLowerCase())
      )
    : options;
  
  // Mendapatkan label untuk opsi yang dipilih
  const getSelectedLabel = () => {
    if (isMulti) {
      const selectedValues = value as string[];
      if (selectedValues.length === 0) return '';
      
      if (selectedValues.length === 1) {
        const option = options.find(opt => opt.value === selectedValues[0]);
        return option ? option.label : '';
      }
      
      return `${selectedValues.length} selected`;
    } else {
      const selectedValue = value as string;
      if (!selectedValue) return '';
      
      const option = options.find(opt => opt.value === selectedValue);
      return option ? option.label : '';
    }
  };
  
  // Memeriksa apakah opsi dipilih
  const isOptionSelected = (optionValue: string) => {
    if (isMulti) {
      return (value as string[]).includes(optionValue);
    } else {
      return value === optionValue;
    }
  };
  
  // Mendapatkan style berdasarkan size
  const getInputHeight = () => {
    switch (size) {
      case 'sm': return 32;
      case 'lg': return 48;
      default: return 40;
    }
  };
  
  // Mendapatkan style berdasarkan variant
  const getInputStyle = () => {
    const baseStyle: ViewStyle = {
      height: getInputHeight(),
      borderRadius: 4,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    };
    
    switch (variant) {
      case 'outline':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: isInvalid ? '#E53E3E' : isDisabled ? '#E2E8F0' : '#CBD5E0',
          backgroundColor: isDisabled ? '#F7FAFC' : 'transparent',
        };
      case 'filled':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: 'transparent',
          backgroundColor: isDisabled ? '#F7FAFC' : isInvalid ? '#FED7D7' : '#EDF2F7',
        };
      case 'unstyled':
        return {
          ...baseStyle,
          borderWidth: 0,
          paddingHorizontal: 0,
        };
      default:
        return baseStyle;
    }
  };

  // Render komponen
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {isRequired && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        ref={inputRef}
        style={[getInputStyle(), inputStyle]}
        onPress={handleToggle}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <Text 
          style={[{
            flex: 1,
            color: getSelectedLabel() ? '#1A202C' : '#A0AEC0',
            opacity: isDisabled ? 0.4 : 1,
          }, textStyle]}
          numberOfLines={1}
        >
          {getSelectedLabel() || placeholder}
        </Text>
        
        <View style={styles.iconContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#4A5568" />
          ) : (
            <Ionicons 
              name={isOpen ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color="#4A5568" 
              style={{ opacity: isDisabled ? 0.4 : 1 }}
            />
          )}
        </View>
      </TouchableOpacity>
      
      {isInvalid && errorMessage && (
        <Text style={[styles.errorText, errorTextStyle]}>{errorMessage}</Text>
      )}
      
      {helperText && !isInvalid && (
        <Text style={[styles.helperText, helperTextStyle]}>{helperText}</Text>
      )}
      
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={handleOverlayPress}>
          <View style={styles.overlay}>
            <Animated.View 
              style={[
                styles.menuContainer,
                {
                  top: inputPosition.y + inputPosition.height + 4,
                  left: inputPosition.x,
                  width: inputPosition.width,
                  maxHeight: maxHeight,
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
                menuStyle
              ]}
            >
              {isSearchable && (
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search..."
                    value={searchValue}
                    onChangeText={handleSearchChange}
                    autoFocus
                  />
                </View>
              )}
              
              <ScrollView style={styles.optionsContainer}>
                {filteredOptions.length === 0 ? (
                  <Text style={styles.noOptions}>No options found</Text>
                ) : (
                  filteredOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.option,
                        isOptionSelected(option.value) && styles.selectedOption,
                        option.isDisabled && styles.disabledOption,
                        optionStyle,
                      ]}
                      onPress={() => handleSelect(option)}
                      disabled={option.isDisabled}
                      activeOpacity={0.7}
                    >
                      <Text 
                        style={[
                          styles.optionText,
                          isOptionSelected(option.value) && styles.selectedOptionText,
                          option.isDisabled && styles.disabledOptionText,
                        ]}
                        numberOfLines={1}
                      >
                        {option.label}
                      </Text>
                      
                      {isMulti && isOptionSelected(option.value) && (
                        <Ionicons name="checkmark" size={16} color="#3182CE" />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#2D3748',
  },
  required: {
    color: '#E53E3E',
  },
  iconContainer: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#E53E3E',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  searchContainer: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInput: {
    height: 36,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 4,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  optionsContainer: {
    maxHeight: 200,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  selectedOption: {
    backgroundColor: '#EBF8FF',
  },
  disabledOption: {
    opacity: 0.4,
  },
  optionText: {
    fontSize: 14,
    color: '#2D3748',
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '500',
    color: '#3182CE',
  },
  disabledOptionText: {
    color: '#A0AEC0',
  },
  noOptions: {
    padding: 12,
    textAlign: 'center',
    color: '#A0AEC0',
    fontSize: 14,
  },
});