import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, TouchableOpacity, Alert, KeyboardAvoidingView, ImageBackground } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
// import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from 'expo-firebase-recaptcha';
import PhoneInput from "react-native-phone-number-input";
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';

export default function Settings({ navigation }) {
    const [message, setMessage] = React.useState('');
    const [name, setName] = React.useState('');
    const user = auth().currentUser
    const db = firestore();
    const profileRef = db.collection("Users").doc(user.phoneNumber);

    useEffect(() => {
        const unsub = profileRef.onSnapshot((doc) => {
            setName(doc.data()?.name)
        }, (err) => {
            console.log("error getting name", err)
        })
        return () => unsub()
    }, [user])

    return (<LinearGradient colors={['#00ff0030', '#00ff0010']} style={{ flex: 1, resizeMode: "cover", justifyContent: "center" }}><KeyboardAvoidingView style={[styles.container]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.textContainer, { marginBottom: 30, marginTop: 30 }]}><Text style={styles.titleText}>Settings</Text></View>
        {message.text && <View style={[styles.textContainer, { margin: 10 }]}><Text
            style={{
                color: message.color || 'blue',
                fontSize: 17,
                textAlign: 'center',
                paddingTop: 5
            }}>
            {message.text}
        </Text></View>}
        {/* <View style={styles.textContainer}><Text style={styles.subtitleText}>Change your name or sign out</Text></View> */}
        <TextInput
            style={[{ marginVertical: 10, fontSize: 17 }, styles.textInput]}
            placeholder="Name"
            onChangeText={(text) => {
                console.log(text)
                setName(text)
            }}
            value={name}
            onSubmitEditing={() => {
                profileRef.update({ name })
            }}
            returnKeyType={"done"}
        />
        <View style={{ width: '95%', height: 3, backgroundColor: 'grey', borderRadius: 10 }}></View>
        <TouchableOpacity style={[styles.cancelButtonContainer]} onPress={async () => {
            console.log("Sign out")
            try{
                const token = (await Notifications.getExpoPushTokenAsync({experienceId: "@kihtrakraknas/debt-balance"})).data;
                db.collection('Users').doc(auth().currentUser.phoneNumber).update({ tokens: firestore.FieldValue.arrayRemove(token) }).then(() => {
                    auth().signOut()
                }).catch((error) => {
                    Alert.alert("Sign out failed. Try again when you have a better internet connection")
                })
            }catch(e){
                console.log(e)
            }
            
        }} >
            <Text style={styles.confirmButtonText}>Sign Out</Text>
        </TouchableOpacity>
    </KeyboardAvoidingView></LinearGradient>)
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: "transparent"
    },
    textInput: {
        fontSize: 20,
        borderRadius: 5,
        borderWidth: 1,
        width: "90%",
        marginVertical: 10,
        padding: 10,
        backgroundColor: "white",
        marginBottom: 50
    },
    titleText: {
        fontSize: 70,
        //marginTop:20,
        // marginBottom: ,
        fontWeight: "bold",
        // textDecorationLine:"underline",
        color: "white",
    },
    textContainer: {
        backgroundColor: "green",
        paddingTop: 0,
        padding: 10,
        borderRadius: 15,
    },
    subtitleText: {
        fontSize: 20,
        textAlign: 'center',
        // margin:30,
        marginTop: 5,
        color: "white",
    },
    cancelButtonContainer: {
        // marginTop: 50,
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        backgroundColor: "pink",
        marginBottom: 10,
        paddingHorizontal: 30,
        alignSelf: 'stretch',
        marginHorizontal: 50,
        marginTop: 50
    },
    confirmButtonText: {
        fontSize: 22,
        color: "white",
        textAlign: "center"
    },
    errorMessage: {
        color: "red"
    }
});