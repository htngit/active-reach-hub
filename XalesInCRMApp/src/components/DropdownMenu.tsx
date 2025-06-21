import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Platform,
  ViewStyle,
  TextStyle,
  ScrollView,
} from 'react-native';
import { Icon } from './Icon'; // Mengasumsikan komponen Icon sudah dibuat sebelumnya

// Interface untuk props DropdownMenu
interface DropdownMenuProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

// Interface untuk props DropdownMenuTrigger
interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

// Interface untuk props DropdownMenuContent
interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  style?: ViewStyle;
}

// Interface untuk props DropdownMenuItem
interface DropdownMenuItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  iconColor?: string;
}

// Interface untuk props DropdownMenuSeparator
interface DropdownMenuSeparatorProps {
  style?: ViewStyle;
}

// Context untuk DropdownMenu
interface DropdownMenuContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  triggerRef: React.RefObject<View>;
  triggerLayout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  setTriggerLayout: (layout: { x: number; y: number; width: number; height: number }) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | undefined>(undefined);

const useDropdownMenuContext = () => {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used within a DropdownMenu');
  }
  return context;
};

// Komponen utama DropdownMenu
export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<View>(null);
  const [triggerLayout, setTriggerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Menyediakan context untuk komponen anak
  const contextValue: DropdownMenuContextType = {
    isOpen,
    setIsOpen,
    triggerRef,
    triggerLayout,
    setTriggerLayout,
  };

  return (
    <DropdownMenuContext.Provider value={contextValue}>
      <View style={[styles.container, style]}>{children}</View>
    </DropdownMenuContext.Provider>
  );
};

// Komponen DropdownMenuTrigger
export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ 
  children, 
  asChild = false 
}) => {
  const { setIsOpen, triggerRef, setTriggerLayout } = useDropdownMenuContext();

  // Mengukur posisi dan ukuran trigger untuk penempatan dropdown
  const measureTrigger = () => {
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        setTriggerLayout({ x, y, width, height });
      });
    }
  };

  // Menangani klik pada trigger
  const handlePress = () => {
    measureTrigger();
    setIsOpen(prev => !prev);
  };

  // Jika asChild true, kita hanya menambahkan props ke children
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: triggerRef,
      onPress: handlePress,
    });
  }

  // Jika tidak, kita bungkus children dengan TouchableOpacity
  return (
    <TouchableOpacity
      ref={triggerRef}
      onPress={handlePress}
      activeOpacity={0.7}
      style={styles.trigger}
    >
      {children}
    </TouchableOpacity>
  );
};

// Komponen DropdownMenuContent
export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ 
  children, 
  align = 'start', 
  sideOffset = 4,
  style 
}) => {
  const { isOpen, setIsOpen, triggerLayout } = useDropdownMenuContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  // Animasi saat dropdown dibuka/ditutup
  useEffect(() => {
    if (isOpen) {
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
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, fadeAnim, slideAnim]);

  // Menghitung posisi dropdown berdasarkan alignment
  const getHorizontalPosition = () => {
    const { x, width } = triggerLayout;
    const windowWidth = Dimensions.get('window').width;

    switch (align) {
      case 'start':
        return { left: x };
      case 'center':
        return { left: x + (width / 2) - 100 }; // Mengasumsikan lebar dropdown 200
      case 'end':
        return { right: windowWidth - (x + width) };
      default:
        return { left: x };
    }
  };

  // Menangani klik di luar dropdown untuk menutupnya
  const handleOverlayPress = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={() => setIsOpen(false)}
    >
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <View style={styles.overlay}>
          <Animated.View 
            style={[
              styles.content,
              getHorizontalPosition(),
              { top: triggerLayout.y + triggerLayout.height + sideOffset },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              style
            ]}
          >
            <ScrollView style={styles.scrollContent} bounces={false}>
              {children}
            </ScrollView>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Komponen DropdownMenuItem
export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  children, 
  onSelect, 
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  iconSize = 16,
  iconColor = '#4A5568',
}) => {
  const { setIsOpen } = useDropdownMenuContext();

  // Menangani klik pada item
  const handlePress = () => {
    if (disabled) return;
    
    if (onSelect) {
      onSelect();
    }
    
    setIsOpen(false);
  };

  return (
    <TouchableOpacity
      style={[styles.item, disabled && styles.itemDisabled, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && iconPosition === 'left' && (
        <Icon 
          name={icon} 
          size={iconSize} 
          color={disabled ? '#A0AEC0' : iconColor} 
          style={styles.leftIcon} 
        />
      )}
      
      {typeof children === 'string' ? (
        <Text style={[styles.itemText, disabled && styles.itemTextDisabled, textStyle]}>
          {children}
        </Text>
      ) : (
        children
      )}
      
      {icon && iconPosition === 'right' && (
        <Icon 
          name={icon} 
          size={iconSize} 
          color={disabled ? '#A0AEC0' : iconColor} 
          style={styles.rightIcon} 
        />
      )}
    </TouchableOpacity>
  );
};

// Komponen DropdownMenuSeparator
export const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({ style }) => {
  return <View style={[styles.separator, style]} />;
};

// Styles
const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  trigger: {
    // Styling untuk trigger jika diperlukan
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    position: 'absolute',
    minWidth: 200,
    maxWidth: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  scrollContent: {
    maxHeight: 300,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  itemDisabled: {
    opacity: 0.4,
  },
  itemText: {
    fontSize: 14,
    color: '#2D3748',
    flex: 1,
  },
  itemTextDisabled: {
    color: '#A0AEC0',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
});

export default DropdownMenu;