const fs = require('fs');
let c = fs.readFileSync('App.js', 'utf8');

// 1. Remove reanimated import
c = c.replace(/import 'react-native-reanimated';\n/g, '');

// 2. Remove drawer imports and constants
c = c.replace(/import { createDrawerNavigator } from '@react-navigation\/drawer';\n/g, '');
c = c.replace(/const Drawer = createDrawerNavigator\(\);\n/g, '');

// 3. Add Notifications and Messages to tabs
c = c.replace(
  /<Tab\.Screen name="Profile" component={ProfileScreen} \/>/g,
  `<Tab.Screen name="Notifications" component={NotificationsScreen} />
        <Tab.Screen name="Messages" component={ChatListScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />`
);

// 4. Add tab icons for Notifications and Messages
c = c.replace(
  /} else if \(route\.name === 'Profile'\) {/g,
  `} else if (route.name === 'Notifications') {
              iconName = focused ? 'notifications' : 'notifications-outline';
            } else if (route.name === 'Messages') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            } else if (route.name === 'Profile') {`
);

// 5. Remove DrawerNavigator component completely
c = c.replace(/function DrawerNavigator\(\) {[\s\S]*?}\n\nfunction AppNavigator\(\) {/g, 'function AppNavigator() {');

// 6. Update Stack.Navigator to use MainTabs and WardActivities instead of Drawer
c = c.replace(
  /<Stack\.Screen name="Drawer" component={DrawerNavigator} \/>/g,
  `<Stack.Screen name="HomeTabs" component={MainTabs} />
            <Stack.Screen name="WardActivities" component={WardActivitiesScreen} />`
);

fs.writeFileSync('App.js', c);
console.log('App.js successfully rewritten');
