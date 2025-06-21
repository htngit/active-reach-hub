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
  LayoutChangeEvent,
  LayoutRectangle,
  ScrollView,
} from 'react-native';

// Props untuk komponen Menu
export interface MenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode | ((props: { onOpen: () => void; isOpen: boolean }) => React.ReactNode);
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  offset?: number;
  closeOnSelect?: boolean;
  closeOnBlur?: boolean;
  autoSelect?: boolean;
  minWidth?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
  backgroundColor?: string;
  menuStyle?: StyleProp<ViewStyle>;
}

// Props untuk komponen MenuItem
export interface MenuItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  isDisabled?: boolean;
  isFocused?: boolean;
  icon?: React.ReactNode;
  command?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

// Props untuk komponen MenuGroup
export interface MenuGroupProps {
  children: React.ReactNode;
  title?: string;
  titleStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}

// Props untuk komponen MenuDivider
export interface MenuDividerProps {
  style?: StyleProp<ViewStyle>;
}

// Context untuk Menu
const MenuContext = React.createContext<{
  onSelect: (onItemPress?: () => void) => void;
  closeOnSelect: boolean;
}>({ onSelect: () => {}, closeOnSelect: true });

// Hook untuk menggunakan MenuContext
const useMenuContext = () => React.useContext(MenuContext);

// Komponen Menu
export const Menu: React.FC<MenuProps> & {
  Item: React.FC<MenuItemProps>;
  Group: React.FC<MenuGroupProps>;
  Divider: React.FC<MenuDividerProps>;
} = ({
  children,
  trigger,
  isOpen: controlledIsOpen,
  onOpen,
  onClose,
  placement = 'auto',
  offset = 8,
  closeOnSelect = true,
  closeOnBlur = true,
  autoSelect = false,
  minWidth = 200,
  maxWidth = 300,
  maxHeight = 300,
  backgroundColor = '#FFFFFF',
  menuStyle,
}) => {
  const [isOpen, setIsOpen] = useState(controlledIsOpen || false);
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [triggerLayout, setTriggerLayout] = useState<LayoutRectangle | null>(null);
  const [menuLayout, setMenuLayout] = useState<LayoutRectangle | null>(null);
  const [calculatedPlacement, setCalculatedPlacement] = useState(placement);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<View>(null);

  // Menggunakan isOpen dari props jika disediakan (controlled component)
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
    }
  }, [controlledIsOpen]);

  // Menangani animasi saat menu dibuka atau ditutup
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      onOpen && onOpen();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        onClose && onClose();
      });
    }
  }, [isOpen]);

  // Mengukur posisi dan ukuran trigger
  const measureTrigger = () => {
    if (triggerRef.current && Platform.OS === 'web') {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        setTriggerLayout({ x, y, width, height });
      });
    } else if (triggerRef.current) {
      setTimeout(() => {
        triggerRef.current?.measureInWindow((x, y, width, height) => {
          setTriggerLayout({ x, y, width, height });
        });
      }, 100);
    }
  };

  // Menghitung posisi menu berdasarkan placement
  useEffect(() => {
    if (triggerLayout && menuLayout) {
      const windowWidth = Dimensions.get('window').width;
      const windowHeight = Dimensions.get('window').height;
      const { x, y, width, height } = triggerLayout;
      const { width: menuWidth, height: menuHeight } = menuLayout;

      let finalPlacement = placement;
      let top = 0;
      let left = 0;

      // Menentukan placement terbaik jika auto
      if (placement === 'auto') {
        // Cek ruang di bawah
        if (y + height + menuHeight + offset < windowHeight) {
          finalPlacement = 'bottom';
        }
        // Cek ruang di atas
        else if (y - menuHeight - offset > 0) {
          finalPlacement = 'top';
        }
        // Cek ruang di kanan
        else if (x + width + menuWidth + offset < windowWidth) {
          finalPlacement = 'right';
        }
        // Cek ruang di kiri
        else if (x - menuWidth - offset > 0) {
          finalPlacement = 'left';
        }
        // Default ke bawah jika tidak ada yang cocok
        else {
          finalPlacement = 'bottom';
        }
      }

      // Hitung posisi berdasarkan placement
      switch (finalPlacement) {
        case 'top':
          top = y - menuHeight - offset;
          left = x;
          break;
        case 'bottom':
          top = y + height + offset;
          left = x;
          break;
        case 'left':
          top = y;
          left = x - menuWidth - offset;
          break;
        case 'right':
          top = y;
          left = x + width + offset;
          break;
      }

      // Pastikan menu tidak keluar dari layar
      if (left < 10) left = 10;
      if (left + menuWidth > windowWidth - 10) left = windowWidth - menuWidth - 10;
      if (top < 10) top = 10;
      if (top + menuHeight > windowHeight - 10) top = windowHeight - menuHeight - 10;

      setCalculatedPlacement(finalPlacement);
      setPosition({ top, left });
    }
  }, [triggerLayout, menuLayout, placement, offset]);

  // Mengukur ukuran menu
  const handleMenuLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setMenuLayout({ width, height } as LayoutRectangle);
  };

  // Menangani klik pada overlay
  const handleOverlayPress = () => {
    if (closeOnBlur) {
      setIsOpen(false);
    }
  };

  // Menangani toggle menu
  const handleToggle = () => {
    if (!isOpen) {
      measureTrigger();
    }
    setIsOpen(!isOpen);
  };

  // Menangani pemilihan item
  const handleSelect = (onItemPress?: () => void) => {
    if (onItemPress) {
      onItemPress();
    }
    if (closeOnSelect) {
      setIsOpen(false);
    }
  };

  // Render trigger dengan props
  const renderTrigger = () => {
    if (typeof trigger === 'function') {
      return trigger({ onOpen: () => setIsOpen(true), isOpen });
    }
    return (
      <TouchableWithoutFeedback onPress={handleToggle}>
        <View ref={triggerRef} onLayout={measureTrigger}>
          {trigger}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  // Menyediakan context untuk children
  const menuContext = {
    onSelect: handleSelect,
    closeOnSelect,
  };

  return (
    <>
      {renderTrigger()}

      <Modal
        transparent
        visible={visible}
        onRequestClose={() => setIsOpen(false)}
        animationType="none"
      >
        <TouchableWithoutFeedback onPress={handleOverlayPress}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <Animated.View
                style={[
                  styles.menuContainer,
                  {
                    top: position.top,
                    left: position.left,
                    opacity: fadeAnim,
                    backgroundColor,
                    minWidth,
                    maxWidth,
                    maxHeight,
                  },
                  menuStyle,
                ]}
                onLayout={handleMenuLayout}
              >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                  <MenuContext.Provider value={menuContext}>
                    {children}
                  </MenuContext.Provider>
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

// Komponen MenuItem
const MenuItem: React.FC<MenuItemProps> = ({
  children,
  onPress,
  isDisabled = false,
  isFocused = false,
  icon,
  command,
  style,
  textStyle,
}) => {
  const { onSelect } = useMenuContext();

  const handlePress = () => {
    if (!isDisabled) {
      onSelect(onPress);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        isFocused && styles.menuItemFocused,
        isDisabled && styles.menuItemDisabled,
        style,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {icon && <View style={styles.menuItemIcon}>{icon}</View>}
      <Text
        style={[
          styles.menuItemText,
          isDisabled && styles.menuItemTextDisabled,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {children}
      </Text>
      {command && (
        <Text style={[styles.menuItemCommand, isDisabled && styles.menuItemTextDisabled]}>
          {command}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Komponen MenuGroup
const MenuGroup: React.FC<MenuGroupProps> = ({ children, title, titleStyle, style }) => {
  return (
    <View style={[styles.menuGroup, style]}>
      {title && <Text style={[styles.menuGroupTitle, titleStyle]}>{title}</Text>}
      {children}
    </View>
  );
};

// Komponen MenuDivider
const MenuDivider: React.FC<MenuDividerProps> = ({ style }) => {
  return <View style={[styles.menuDivider, style]} />;
};

// Menambahkan sub-komponen ke Menu
Menu.Item = MenuItem;
Menu.Group = MenuGroup;
Menu.Divider = MenuDivider;

// Styles
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollView: {
    padding: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 4,
  },
  menuItemFocused: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuItemDisabled: {
    opacity: 0.4,
  },
  menuItemIcon: {
    marginRight: 8,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
  },
  menuItemTextDisabled: {
    color: '#999',
  },
  menuItemCommand: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  menuGroup: {
    marginBottom: 8,
  },
  menuGroupTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingTop: 4,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 4,
  },
});