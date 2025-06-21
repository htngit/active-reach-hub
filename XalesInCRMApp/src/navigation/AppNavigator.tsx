import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@components';
import {
  LoginScreen,
  DashboardScreen,
  LeadsScreen,
  ContactsScreen,
  DealsScreen,
  ActivitiesScreen,
  ReportsScreen,
  SettingsScreen,
} from '@screens';

// Stack Navigator Types
export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  LeadDetails: { leadId: string };
  ContactDetails: { contactId: string };
  DealDetails: { dealId: string };
  ActivityDetails: { activityId: string };
  AddLead: { duplicateFrom?: string };
  EditLead: { leadId: string };
  AddContact: { duplicateFrom?: string };
  EditContact: { contactId: string };
  AddDeal: { duplicateFrom?: string };
  EditDeal: { dealId: string };
  AddActivity: { duplicateFrom?: string };
  EditActivity: { activityId: string };
  CustomReport: undefined;
  ScheduleReport: undefined;
  DetailedAnalysis: { reportType: string; period: string };
  EditProfile: undefined;
  ChangePassword: undefined;
  TwoFactorAuth: undefined;
  PrivacySettings: undefined;
  DataExport: undefined;
  ContactSupport: undefined;
  About: undefined;
};

// Tab Navigator Types
export type MainTabParamList = {
  Dashboard: undefined;
  Leads: undefined;
  Contacts: undefined;
  Deals: undefined;
  Activities: undefined;
  Reports: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab Navigator Component
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'home';
              break;
            case 'Leads':
              iconName = 'users';
              break;
            case 'Contacts':
              iconName = 'user';
              break;
            case 'Deals':
              iconName = 'briefcase';
              break;
            case 'Activities':
              iconName = 'activity';
              break;
            case 'Reports':
              iconName = 'bar-chart-2';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Leads" 
        component={LeadsScreen}
        options={{
          tabBarLabel: 'Leads',
        }}
      />
      <Tab.Screen 
        name="Contacts" 
        component={ContactsScreen}
        options={{
          tabBarLabel: 'Contacts',
        }}
      />
      <Tab.Screen 
        name="Deals" 
        component={DealsScreen}
        options={{
          tabBarLabel: 'Deals',
        }}
      />
      <Tab.Screen 
        name="Activities" 
        component={ActivitiesScreen}
        options={{
          tabBarLabel: 'Activities',
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Reports',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

// Placeholder screens for navigation
const PlaceholderScreen = ({ route }: { route: any }) => {
  return (
    <div style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#f8fafc',
      padding: 20
    }}>
      <h2 style={{ color: '#1f2937', marginBottom: 10 }}>
        {route.name} Screen
      </h2>
      <p style={{ color: '#6b7280', textAlign: 'center' }}>
        This screen is under development.
      </p>
      {route.params && (
        <pre style={{ 
          marginTop: 20, 
          padding: 10, 
          backgroundColor: '#f3f4f6',
          borderRadius: 8,
          fontSize: 12,
          color: '#374151'
        }}>
          {JSON.stringify(route.params, null, 2)}
        </pre>
      )}
    </div>
  );
};

// Main App Navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#1f2937',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerShadowVisible: true,
        }}
      >
        {/* Authentication */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />
        
        {/* Main App */}
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator}
          options={{
            headerShown: false,
          }}
        />
        
        {/* Detail Screens */}
        <Stack.Screen 
          name="LeadDetails" 
          component={PlaceholderScreen}
          options={{
            title: 'Lead Details',
            headerBackTitle: 'Back',
          }}
        />
        
        <Stack.Screen 
          name="ContactDetails" 
          component={PlaceholderScreen}
          options={{
            title: 'Contact Details',
            headerBackTitle: 'Back',
          }}
        />
        
        <Stack.Screen 
          name="DealDetails" 
          component={PlaceholderScreen}
          options={{
            title: 'Deal Details',
            headerBackTitle: 'Back',
          }}
        />
        
        <Stack.Screen 
          name="ActivityDetails" 
          component={PlaceholderScreen}
          options={{
            title: 'Activity Details',
            headerBackTitle: 'Back',
          }}
        />
        
        {/* Add/Edit Screens */}
        <Stack.Screen 
          name="AddLead" 
          component={PlaceholderScreen}
          options={{
            title: 'Add Lead',
            headerBackTitle: 'Cancel',
          }}
        />
        
        <Stack.Screen 
          name="EditLead" 
          component={PlaceholderScreen}
          options={{
            title: 'Edit Lead',
            headerBackTitle: 'Cancel',
          }}
        />
        
        <Stack.Screen 
          name="AddContact" 
          component={PlaceholderScreen}
          options={{
            title: 'Add Contact',
            headerBackTitle: 'Cancel',
          }}
        />
        
        <Stack.Screen 
          name="EditContact" 
          component={PlaceholderScreen}
          options={{
            title: 'Edit Contact',
            headerBackTitle: 'Cancel',
          }}
        />
        
        <Stack.Screen 
          name="AddDeal" 
          component={PlaceholderScreen}
          options={{
            title: 'Add Deal',
            headerBackTitle: 'Cancel',
          }}
        />
        
        <Stack.Screen 
          name="EditDeal" 
          component={PlaceholderScreen}
          options={{
            title: 'Edit Deal',
            headerBackTitle: 'Cancel',
          }}
        />
        
        <Stack.Screen 
          name="AddActivity" 
          component={PlaceholderScreen}
          options={{
            title: 'Add Activity',
            headerBackTitle: 'Cancel',
          }}
        />
        
        <Stack.Screen 
          name="EditActivity" 
          component={PlaceholderScreen}
          options={{
            title: 'Edit Activity',
            headerBackTitle: 'Cancel',
          }}
        />
        
        {/* Report Screens */}
        <Stack.Screen 
          name="CustomReport" 
          component={PlaceholderScreen}
          options={{
            title: 'Custom Report',
            headerBackTitle: 'Back',
          }}
        />
        
        <Stack.Screen 
          name="ScheduleReport" 
          component={PlaceholderScreen}
          options={{
            title: 'Schedule Report',
            headerBackTitle: 'Back',
          }}
        />
        
        <Stack.Screen 
          name="DetailedAnalysis" 
          component={PlaceholderScreen}
          options={{
            title: 'Detailed Analysis',
            headerBackTitle: 'Back',
          }}
        />
        
        {/* Settings Screens */}
        <Stack.Screen 
          name="EditProfile" 
          component={PlaceholderScreen}
          options={{
            title: 'Edit Profile',
            headerBackTitle: 'Cancel',
          }}
        />
        
        <Stack.Screen 
          name="ChangePassword" 
          component={PlaceholderScreen}
          options={{
            title: 'Change Password',
            headerBackTitle: 'Back',
          }}
        />
        
        <Stack.Screen 
          name="TwoFactorAuth" 
          component={PlaceholderScreen}
          options={{
            title: 'Two-Factor Authentication',
            headerBackTitle: 'Back',
          }}
        />
        
        <Stack.Screen 
          name="PrivacySettings" 
          component={PlaceholderScreen}
          options={{
            title: 'Privacy Settings',
            headerBackTitle: 'Back',
          }}
        />
        
        <Stack.Screen 
          name="DataExport" 
          component={PlaceholderScreen}
          options={{
            title: 'Data Export',
            headerBackTitle: 'Back',
          }}
        />
        
        <Stack.Screen 
          name="ContactSupport" 
          component={PlaceholderScreen}
          options={{
            title: 'Contact Support',
            headerBackTitle: 'Back',
          }}
        />
        
        <Stack.Screen 
          name="About" 
          component={PlaceholderScreen}
          options={{
            title: 'About',
            headerBackTitle: 'Back',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;