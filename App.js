import { StatusBar } from 'expo-status-bar';
import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, View, LogBox } from 'react-native';
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
LogBox.ignoreLogs([""]);

global.firebaseConfig = {
  apiKey: "AIzaSyBSslkNH9yDudtoPRQsRk8zK1bDYiXj70E",
  authDomain: "debtbalance-fe09f.firebaseapp.com",
  projectId: "debtbalance-fe09f",
  storageBucket: "debtbalance-fe09f.appspot.com",
  messagingSenderId: "330777264179",
  appId: "1:330777264179:web:b44fbdedabdfc8735a2346",
  measurementId: "G-TQWBP7ETL1"
};

try {
  firebase.initializeApp(firebaseConfig);
} catch (err) {
    // ignore app already initialized error in stack
}


export default function App() {
  const [signedIn, setSignedIn] = useState(null);
  const [userAccountSetUp, setUserAccountSetUp] = useState(null);
  const [contacts, setContacts] = useState([])
  const db = firebase.firestore();

  useEffect(() => {
    //Check if user is singed in
    firebase.auth().onAuthStateChanged((user)=>{
      setSignedIn(!!user)
      if (user) {
        console.log(",user is signed in")
        // User is signed in.
        const profileRef = db.collection("Users").doc(user.phoneNumber);
        const profileSubscription = profileRef.onSnapshot((doc) => {
          if(!doc.exists){
            console.log("No profile found")
            return setUserAccountSetUp(false)
          }
          if(!doc.metadata.hasPendingWrites){
            profileSubscription(); // Unsubscribe listener
            console.log("Profile found")
            setUserAccountSetUp(true)
          }
        });
      } else {
        // No user is signed in.
      }
    });    
  }, [true]);

  console.log({signedIn,userAccountSetUp})
  const Stack = createStackNavigator();
  // return (<GroupSummary/>)
  return (
    <NavigationContainer screenOptions={{headerShown:true}}>
        {!signedIn? (
          <Stack.Navigator>
            <Stack.Screen name="LoginScreen" component={LoginScreen} options={{headerShown: false}} />
          </Stack.Navigator>
        ) : userAccountSetUp? (
          <Stack.Navigator screenOptions={{
            headerStyle: {
              backgroundColor: 'green',
            },
            headerTitleStyle: {
              color:"white",
              fontWeight: 'bold',
            }
            }}>
            <Stack.Screen name="Dashboard" component={GroupListScreen} options={ ({ navigation, route }) => ({headerShown: true, headerLeft:()=>(<Icon name='settings' type='feather' color='white' style={styles.leftHeaderIcon} onPress={()=>navigation.navigate('Settings')}/>)})}/>
            <Stack.Screen name="Settings" component={Settings} options={{headerShown: false}}/>
          </Stack.Navigator>
        ):(
          <Stack.Navigator>
            <Stack.Screen name="SetUpScreen" component={SetUpScreen} options={{headerShown: false}} />
          </Stack.Navigator>
        )}
      <StatusBar style="auto" />
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
  leftHeaderIcon:{
    marginLeft:10
  }
});
