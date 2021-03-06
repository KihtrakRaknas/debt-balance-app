import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, TouchableOpacity, Alert, KeyboardAvoidingView, ImageBackground } from 'react-native';
import * as firebase from 'firebase';
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from 'expo-firebase-recaptcha';
import PhoneInput from "react-native-phone-number-input";
import { LinearGradient } from 'expo-linear-gradient';

export default function Settings({ navigation }) {
    const [message, setMessage] = React.useState('');
    const [name, setName] = React.useState('');
    const user = firebase.auth().currentUser
    const db = firebase.firestore();
    const profileRef = db.collection("Users").doc(user.phoneNumber);

    useEffect(() => {
        profileRef.onSnapshot((doc) => {
            setName(doc.data()?.name)
        })
    }, [true])

    const submit = () => {
        console.log('sumbit')
        console.log({ 
            name,
            groups:[]
        })
        profileRef.set({ 
            name,
            groups:[]
        })
    }

    return (<ImageBackground source={require("../assets/debt-balance-splash.png")} style={{ flex: 1, resizeMode: "cover", justifyContent: "center" }} blurRadius={2}><KeyboardAvoidingView style={[styles.container]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.textContainer, { marginBottom: 30, marginTop: 30 }]}><Text style={styles.titleText}>Set Up</Text></View>
        {message.text && <View style={[styles.textContainer, { margin: 10 }]}><Text
            style={{
                color: message.color || 'blue',
                fontSize: 17,
                textAlign: 'center',
                paddingTop: 5
            }}>
            {message.text}
        </Text></View>}
        <View style={styles.textContainer}><Text style={styles.subtitleText}>We could not find an account connected to that number. Enter your name to create an account.</Text></View>
        <TextInput
            style={{ marginVertical: 10, fontSize: 17 }}
            placeholder="Name"
            style={styles.textInput}
            onChangeText={(text) => {
                console.log(text)
                setName(text)
            }}
            value={name}
            onSubmitEditing={submit}
            returnKeyType={"done"}
        />
        <TouchableOpacity style={[styles.confirmButtonContainer]} onPress={submit} >
            <Text style={styles.confirmButtonText}>Create Account</Text>
        </TouchableOpacity>
    </KeyboardAvoidingView></ImageBackground>)
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
        // marginBottom:50
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
        marginHorizontal: 20
    },
    subtitleText: {
        fontSize: 20,
        textAlign: 'center',
        // margin:30,
        marginTop: 5,
        color: "white",
    },
    confirmButtonContainer: {
        // marginTop: 50,
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        backgroundColor: "blue",
        marginBottom: 10,
        paddingHorizontal: 30,
        alignSelf: 'stretch',
        marginHorizontal: 50,
        marginTop: 30
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