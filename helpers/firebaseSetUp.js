import 'expo-firestore-offline-persistence'
import * as firebase from 'firebase'

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
// firebase.firestore().enablePersistence()
  // firebase.firestore().useEmulator("localhost", 8080)

exports.db = firebase.firestore();
exports.firebase = firebase;