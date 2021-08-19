import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { StyleSheet, Text, View, LogBox, Platform, Alert } from 'react-native';
import {Button} from 'react-native-elements'
import LoginScreen from './screens/LoginScreen'
import * as firebase from 'firebase'
import GroupListScreen from './screens/GroupListScreen'
import SetUpScreen from './screens/SetUpScreen'
import Settings from './screens/Settings'
import GroupSummary from './screens/GroupSummary'
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Contacts from 'expo-contacts';
import { Icon } from 'react-native-elements'
import * as Notifications from 'expo-notifications';
import { MainStackLoadedContext } from './helpers/contexts'
import * as SplashScreen from 'expo-splash-screen';
import FlashMessage from "react-native-flash-message";
import { showMessage, hideMessage } from "react-native-flash-message";
LogBox.ignoreLogs([""]);

global.firebaseConfig = {
  apiKey: "AIzaSyDJjgKiG9ffxnbhOEfCHQgwmtFAMtlvpF8",
  authDomain: "debt-balance.firebaseapp.com",
  projectId: "debt-balance",
  storageBucket: "debt-balance.appspot.com",
  messagingSenderId: "135371147288",
  appId: "1:135371147288:web:79ed47303c29cd37851b6d",
  measurementId: "G-WDLNYZ77G5"
}

try {
  firebase.initializeApp(firebaseConfig);
} catch (err) {
  // ignore app already initialized error in stack
}


export default function App() {
  const [signedIn, setSignedIn] = useState(null);
  const [userAccountSetUp, setUserAccountSetUp] = useState(null);
  const [contacts, setContacts] = useState([])
  const responseListener = useRef();
  const notificationListener = useRef();
  const mainStackLoadedRef = useRef({
    mainStackLoaded: () => {
      setTimeout(() => SplashScreen.hideAsync().catch(), 500)
      mainStackLoadedRef.current.loaded = true
      console.log("loaded")
    },
    loaded: false,
    groupID: null
  });
  const db = firebase.firestore();
  const navigatorRef = useRef();

  useLayoutEffect(() => {
    SplashScreen.preventAutoHideAsync();

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => { // Called when a notification is clicked
      const groupID = response.notification.request.content.data?.groupID
      console.log("res received")
      console.log(groupID);
      console.log(!mainStackLoadedRef.current.loaded)
      console.log(!!navigatorRef.current)
      if(!mainStackLoadedRef.current.loaded)
        mainStackLoadedRef.current.groupID = groupID
      else if(navigatorRef.current)
        navigatorRef.current.navigate('Summary',{groupUid: groupID})
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => { // Called when a notification is received while the app is open
      console.log(notification);
      const {title, body, data} = notification.request.content
      const groupID = data?.groupID
      showMessage({
        message: title,
        description: body,
        type: "info",
        onPress: () => {
          if(navigatorRef.current)
            navigatorRef.current.navigate('Summary',{groupUid: groupID})
        }
      })
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [true])

  useEffect(() => {
    //Check if user is singed in
    firebase.auth().onAuthStateChanged((user) => {
      setSignedIn(!!user)
      if (user) {
        console.log(",user is signed in")
        // User is signed in.
        const profileRef = db.collection("Users").doc(user.phoneNumber);
        const profileSubscription = profileRef.onSnapshot({
          // Listen for document metadata changes
          includeMetadataChanges: true
        }, (doc) => {
          console.log("profileSubscription fired")
          setTimeout(() => SplashScreen.hideAsync().catch(), 500)
          if (!doc.exists) {
            console.log("No profile found")
            return setUserAccountSetUp(false)
          }
          if (!doc.metadata.hasPendingWrites) {
            profileSubscription(); // Unsubscribe listener
            console.log("Profile found")
            setUserAccountSetUp(true)
          }
        });
      } else {
        setTimeout(() => SplashScreen.hideAsync().catch(), 500)
        // No user is signed in.
      }
    });
  }, [true]);

  console.log({ signedIn, userAccountSetUp })
  const Stack = createStackNavigator();


  return (
    <NavigationContainer screenOptions={{ headerShown: true }}>
      <MainStackLoadedContext.Provider value={mainStackLoadedRef}>
        {!signedIn ? (
          <Stack.Navigator>
            <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        ) : userAccountSetUp ? (
          <Stack.Navigator screenOptions={({ navigation: nav }) => {
            navigatorRef.current = nav
            return {
              headerStyle: {
                backgroundColor: 'green'
              },
              headerTitleStyle: {
                color: "white",
                fontWeight: 'bold',
              }
            }
          }}>
            <Stack.Screen name="Dashboard" component={GroupListScreen} options={({ navigation, route }) => ({
              headerShown: true, headerLeft: () => (<Button icon={{name:'settings', type:'feather', color:'green'}} type="clear"/*style={styles.leftHeaderIcon}*/ onPress={() => navigation.navigate('Settings')} />), headerStyle: {
                borderBottomColor: 'transparent',
                shadowColor: 'transparent'
              }, headerTitleStyle: {
                color: "green",
                fontWeight: 'bold',
              }
            })} />
            <Stack.Screen name="Settings" component={Settings} options={{
              headerShown: true, headerTitle: '', headerStyle: {
                backgroundColor: "#50ff5060", borderBottomColor: 'transparent',
                shadowColor: 'transparent'
              }
            }} />
            <Stack.Screen name="Summary" component={GroupSummary} options={{
              headerShown: true, headerStyle: {
                backgroundColor: '#00ff0090', borderBottomColor: 'transparent',
                shadowColor: 'transparent',
              },
            }} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator>
            <Stack.Screen name="SetUpScreen" component={SetUpScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        )}
        <StatusBar style="auto" />
      </MainStackLoadedContext.Provider>
      <FlashMessage position="top" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftHeaderIcon: {
    marginLeft: 10
  },  rightHeaderIcon: {
    paddingRight: 10
  }
});
