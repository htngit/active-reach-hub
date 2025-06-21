import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { Button, Icon, Input, Select } from '@components';

interface SettingsScreenProps {
  navigation: any;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  avatar?: string;
}

interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  leadAlerts: boolean;
  dealUpdates: boolean;
  taskReminders: boolean;
  weeklyReports: boolean;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  autoSync: boolean;
  offlineMode: boolean;
}

const themeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Auto', value: 'auto' },
];

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Japanese', value: 'ja' },
];

const currencyOptions = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'JPY (¥)', value: 'JPY' },
  { label: 'CAD (C$)', value: 'CAD' },
  { label: 'AUD (A$)', value: 'AUD' },
];

const timezoneOptions = [
  { label: 'UTC-8 (PST)', value: 'America/Los_Angeles' },
  { label: 'UTC-5 (EST)', value: 'America/New_York' },
  { label: 'UTC+0 (GMT)', value: 'Europe/London' },
  { label: 'UTC+1 (CET)', value: 'Europe/Paris' },
  { label: 'UTC+8 (CST)', value: 'Asia/Shanghai' },
  { label: 'UTC+9 (JST)', value: 'Asia/Tokyo' },
];

const dateFormatOptions = [
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  { label: 'DD MMM YYYY', value: 'DD MMM YYYY' },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'John Doe',
    email: 'john.doe@company.com',
    phone: '+1 (555) 123-4567',
    role: 'Sales Manager',
    department: 'Sales',
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    leadAlerts: true,
    dealUpdates: true,
    taskReminders: true,
    weeklyReports: false,
  });

  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: 'light',
    language: 'en',
    currency: 'USD',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    autoSync: true,
    offlineMode: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Handle profile update
  const updateProfile = (field: keyof UserProfile, value: string) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Handle notification setting update
  const updateNotificationSetting = (field: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Handle app setting update
  const updateAppSetting = (field: keyof AppSettings, value: any) => {
    setAppSettings(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Save settings
  const saveSettings = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to storage/API
      console.log('Saving settings:', {
        userProfile,
        notificationSettings,
        appSettings,
      });
      
      setHasUnsavedChanges(false);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset settings
  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setAppSettings({
              theme: 'light',
              language: 'en',
              currency: 'USD',
              timezone: 'America/New_York',
              dateFormat: 'MM/DD/YYYY',
              autoSync: true,
              offlineMode: false,
            });
            setNotificationSettings({
              pushNotifications: true,
              emailNotifications: true,
              smsNotifications: false,
              leadAlerts: true,
              dealUpdates: true,
              taskReminders: true,
              weeklyReports: false,
            });
            setHasUnsavedChanges(true);
          },
        },
      ]
    );
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Clear user data and navigate to login
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Type "DELETE" to confirm account deletion:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  style: 'destructive',
                  onPress: () => {
                    console.log('Account deletion confirmed');
                    // Implement account deletion logic
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // Open external links
  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => {
      console.error('Failed to open URL:', err);
      Alert.alert('Error', 'Failed to open link');
    });
  };

  // Render setting item with switch
  const renderSwitchItem = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
        thumbColor={value ? '#ffffff' : '#f3f4f6'}
      />
    </View>
  );

  // Render setting item with navigation
  const renderNavigationItem = (
    title: string,
    description: string,
    icon: string,
    onPress: () => void,
    showChevron: boolean = true
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Icon name={icon} size={20} color="#6b7280" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      {showChevron && (
        <Icon name="chevron-right" size={20} color="#d1d5db" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your preferences</Text>
        </View>
        {hasUnsavedChanges && (
          <Button
            title="Save"
            onPress={saveSettings}
            loading={isLoading}
            size="sm"
          />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Icon name="user" size={32} color="#6b7280" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile.name}</Text>
              <Text style={styles.profileRole}>{userProfile.role}</Text>
              <Text style={styles.profileEmail}>{userProfile.email}</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Icon name="edit-2" size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          <Input
            label="Full Name"
            value={userProfile.name}
            onChangeText={(value) => updateProfile('name', value)}
            style={styles.input}
          />
          
          <Input
            label="Email"
            value={userProfile.email}
            onChangeText={(value) => updateProfile('email', value)}
            keyboardType="email-address"
            style={styles.input}
          />
          
          <Input
            label="Phone"
            value={userProfile.phone}
            onChangeText={(value) => updateProfile('phone', value)}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingGroup}>
            <Text style={styles.groupTitle}>Appearance</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Theme</Text>
              <Select
                options={themeOptions}
                value={appSettings.theme}
                onValueChange={(value) => updateAppSetting('theme', value)}
                style={styles.settingSelect}
              />
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Language</Text>
              <Select
                options={languageOptions}
                value={appSettings.language}
                onValueChange={(value) => updateAppSetting('language', value)}
                style={styles.settingSelect}
              />
            </View>
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.groupTitle}>Regional</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Currency</Text>
              <Select
                options={currencyOptions}
                value={appSettings.currency}
                onValueChange={(value) => updateAppSetting('currency', value)}
                style={styles.settingSelect}
              />
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Timezone</Text>
              <Select
                options={timezoneOptions}
                value={appSettings.timezone}
                onValueChange={(value) => updateAppSetting('timezone', value)}
                style={styles.settingSelect}
              />
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Date Format</Text>
              <Select
                options={dateFormatOptions}
                value={appSettings.dateFormat}
                onValueChange={(value) => updateAppSetting('dateFormat', value)}
                style={styles.settingSelect}
              />
            </View>
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.groupTitle}>Data & Sync</Text>
            
            {renderSwitchItem(
              'Auto Sync',
              'Automatically sync data when connected',
              appSettings.autoSync,
              (value) => updateAppSetting('autoSync', value)
            )}
            
            {renderSwitchItem(
              'Offline Mode',
              'Enable offline functionality',
              appSettings.offlineMode,
              (value) => updateAppSetting('offlineMode', value)
            )}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingGroup}>
            <Text style={styles.groupTitle}>General</Text>
            
            {renderSwitchItem(
              'Push Notifications',
              'Receive push notifications on your device',
              notificationSettings.pushNotifications,
              (value) => updateNotificationSetting('pushNotifications', value)
            )}
            
            {renderSwitchItem(
              'Email Notifications',
              'Receive notifications via email',
              notificationSettings.emailNotifications,
              (value) => updateNotificationSetting('emailNotifications', value)
            )}
            
            {renderSwitchItem(
              'SMS Notifications',
              'Receive notifications via SMS',
              notificationSettings.smsNotifications,
              (value) => updateNotificationSetting('smsNotifications', value)
            )}
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.groupTitle}>CRM Alerts</Text>
            
            {renderSwitchItem(
              'Lead Alerts',
              'Get notified about new leads',
              notificationSettings.leadAlerts,
              (value) => updateNotificationSetting('leadAlerts', value)
            )}
            
            {renderSwitchItem(
              'Deal Updates',
              'Get notified about deal changes',
              notificationSettings.dealUpdates,
              (value) => updateNotificationSetting('dealUpdates', value)
            )}
            
            {renderSwitchItem(
              'Task Reminders',
              'Get reminded about upcoming tasks',
              notificationSettings.taskReminders,
              (value) => updateNotificationSetting('taskReminders', value)
            )}
            
            {renderSwitchItem(
              'Weekly Reports',
              'Receive weekly performance reports',
              notificationSettings.weeklyReports,
              (value) => updateNotificationSetting('weeklyReports', value)
            )}
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security & Privacy</Text>
          
          {renderNavigationItem(
            'Change Password',
            'Update your account password',
            'lock',
            () => navigation.navigate('ChangePassword')
          )}
          
          {renderNavigationItem(
            'Two-Factor Authentication',
            'Add an extra layer of security',
            'shield',
            () => navigation.navigate('TwoFactorAuth')
          )}
          
          {renderNavigationItem(
            'Privacy Settings',
            'Manage your privacy preferences',
            'eye-off',
            () => navigation.navigate('PrivacySettings')
          )}
          
          {renderNavigationItem(
            'Data Export',
            'Download your data',
            'download',
            () => navigation.navigate('DataExport')
          )}
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & About</Text>
          
          {renderNavigationItem(
            'Help Center',
            'Get help and support',
            'help-circle',
            () => openLink('https://help.example.com')
          )}
          
          {renderNavigationItem(
            'Contact Support',
            'Get in touch with our team',
            'message-circle',
            () => navigation.navigate('ContactSupport')
          )}
          
          {renderNavigationItem(
            'Terms of Service',
            'Read our terms and conditions',
            'file-text',
            () => openLink('https://example.com/terms')
          )}
          
          {renderNavigationItem(
            'Privacy Policy',
            'Read our privacy policy',
            'shield',
            () => openLink('https://example.com/privacy')
          )}
          
          {renderNavigationItem(
            'About',
            'App version and information',
            'info',
            () => navigation.navigate('About')
          )}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <Button
            title="Reset Settings"
            onPress={resetSettings}
            variant="outline"
            leftIcon="refresh-cw"
            style={styles.actionButton}
          />
          
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            leftIcon="log-out"
            style={styles.actionButton}
          />
          
          <Button
            title="Delete Account"
            onPress={handleDeleteAccount}
            variant="outline"
            leftIcon="trash-2"
            style={[styles.actionButton, styles.dangerButton]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: '#9ca3af',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  input: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  settingGroup: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  settingSelect: {
    flex: 1,
    marginLeft: 12,
  },
  actionButton: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  dangerButton: {
    borderColor: '#ef4444',
  },
});

export default SettingsScreen;