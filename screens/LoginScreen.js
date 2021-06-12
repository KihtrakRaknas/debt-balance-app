import React from 'react';
import { StyleSheet, Text, View, TextInput, Button, TouchableOpacity, Alert, KeyboardAvoidingView, ImageBackground } from 'react-native';
import * as firebase from 'firebase';
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from 'expo-firebase-recaptcha';
import PhoneInput from "react-native-phone-number-input";
import { LinearGradient } from 'expo-linear-gradient';

export default function SignUpScreen({ navigation }) {
    const recaptchaVerifier = React.useRef(null);
    const phoneInput = React.useRef(null);
    const [phoneNumber, setPhoneNumber] = React.useState("");
    const [formattedPhoneNumber, setFormattedPhoneNumber] = React.useState("");
    const [validNumber, setValidNumber] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [verificationId, setVerificationId] = React.useState();
    const [verificationCode, setVerificationCode] = React.useState('');

    let sendVerificationCode = async () => {
        console.log(validNumber)
        if(!validNumber){
            Alert.alert("Invalid Phone Number!")
            return
        }
        // The FirebaseRecaptchaVerifierModal ref implements the
        // FirebaseAuthApplicationVerifier interface and can be
        // passed directly to `verifyPhoneNumber`.
        try {
            const phoneProvider = new firebase.auth.PhoneAuthProvider();
            const verificationId = await phoneProvider.verifyPhoneNumber(
                formattedPhoneNumber,
                recaptchaVerifier.current
            );
            setVerificationId(verificationId);
            setMessage({
                text: null,
            });
        } catch (err) {
            setMessage({ text: `Error: ${err.message}`, color: 'red' });
        }
    }

    let confirmVerificationCode = async () => {
        try {
            const credential = firebase.auth.PhoneAuthProvider.credential(
                verificationId,
                verificationCode
            );
            await firebase.auth().signInWithCredential(credential).then((userCredential) => {
                db.collection("Users").doc(userCredential.user.phoneNumber).set({
                    groups: []
                })
                .then(() => {
                    console.log("Document successfully written!");
                })
                .catch((error) => {
                    console.error("Error writing document: ", error);
                });
                console.log("Sign in w/ phone success!")
            })
        } catch (err) {
            setMessage({ text: `Error: ${err.message}`, color: 'red' });
        }
    }

    const fracOfNumberTyped = phoneNumber.length/10
    const fracOfCodeTyped = verificationCode.length/6

    //{backgroundImageUrl:},
    return (<ImageBackground source={require("../assets/debt-balance-splash.png")} style={{flex: 1,resizeMode: "cover",justifyContent: "center"}}>
        <KeyboardAvoidingView style={[styles.container]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={[styles.textContainer,{marginBottom: 30,marginTop:30}]}><Text style={styles.titleText}>Welcome</Text></View>
            {message.text && <View style={[styles.textContainer,{margin:10}]}><Text
                style={{
                    color: message.color || 'blue',
                    fontSize: 17,
                    textAlign: 'center',
                    paddingTop:5
                }}>
                {message.text}
            </Text></View>}
            {!verificationId ? <>
                <View style={[styles.textContainer,{marginBottom: 30}]}><Text style={[styles.subtitleText]}>Enter a phone number to sign in or sign up!</Text></View>
                <PhoneInput
                    ref={phoneInput}
                    defaultValue={phoneNumber}
                    defaultCode="US"
                    layout="first"
                    onChangeText={(text) => {
                        setPhoneNumber(text);
                    }}
                    onChangeFormattedText={(text) => {
                        setFormattedPhoneNumber(text);
                        const checkValid = phoneInput.current?.isValidNumber(text);
                        console.log(checkValid)
                        console.log(text)
                        setValidNumber(checkValid)
                    }}
                    withShadow
                    autoFocus
                />
                <FirebaseRecaptchaVerifierModal
                    ref={recaptchaVerifier}
                    firebaseConfig={global.firebaseConfig}
                    attemptInvisibleVerification={false} // Need to show banner if doing this
                />
                <LinearGradient colors={[validNumber?'blue':"#0000aa", 'grey']} style={[styles.confirmButtonContainer]} start={[0,0]} end={[1,1]} locations={[fracOfNumberTyped,fracOfNumberTyped]}>
                    <TouchableOpacity disabled={!validNumber} onPress={sendVerificationCode} >
                        <Text style={styles.confirmButtonText}>Send Verification Code</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </> : <>
                <View style={styles.textContainer}><Text style={styles.subtitleText}>Almost there! Just enter the verification code that was texted to you</Text></View>
                <TextInput
                    style={{ marginVertical: 10, fontSize: 17 }}
                    placeholder="Verification Code"
                    style={styles.textInput}
                    onChangeText={(text)=>{
                        console.log(text)
                        setVerificationCode(text)
                    }}
                    value={verificationCode}
                    onSubmitEditing={(text)=>{
                        console.log(text)
                        confirmVerificationCode()
                    }}
                />
                <LinearGradient colors={['blue', 'grey']} style={[styles.confirmButtonContainer]} start={[0,0]} end={[1,1]} locations={[fracOfCodeTyped,fracOfCodeTyped]}>
                    <TouchableOpacity disabled={verificationCode.length != 6} onPress={confirmVerificationCode} >
                        <Text style={styles.confirmButtonText}>Verify</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </>}
        </KeyboardAvoidingView>
    </ImageBackground>)
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:"transparent"
    },
    textInput: {
        fontSize: 20,
        borderRadius: 5,
        borderWidth: 1,
        width: "90%",
        marginVertical: 10,
        padding: 10,
        backgroundColor:"white"
    },
    titleText: {
        fontSize: 70,
        //marginTop:20,
        // marginBottom: 0,
        fontWeight:"bold",
        // textDecorationLine:"underline",
        color:"white",
    },
    textContainer:{
        backgroundColor:"green",
        paddingTop:0,
        padding:10,
        borderRadius:15,
        marginHorizontal:20,
    },
    subtitleText: {
        fontSize: 20,
        textAlign: 'center',
        // margin:30,
        marginTop:5,
        color:"white",
    },
    confirmButtonContainer: {
        marginTop: 50,
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        backgroundColor: "blue",
        marginBottom: 10,
        paddingHorizontal: 30,
        alignSelf: 'stretch',
        marginHorizontal:50
    },
    confirmButtonText: {
        fontSize: 22,
        color: "white",
        textAlign:"center"
    },
    errorMessage: {
        color: "red"
    }
});