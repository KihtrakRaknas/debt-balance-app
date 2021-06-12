import React from 'react';
import { StyleSheet, Text, View, TextInput, Button, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import ProfilePicPicker from '../components/ProfilePicPicker'
var dayjs = require('dayjs')
import * as firebase from 'firebase';
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from 'expo-firebase-recaptcha';

export default function SetUpScreen({ navigation }) {
    const db = firebase.firestore();
    const [date, setDate] = React.useState(new Date());
    const [username, setUsername] = React.useState('');
    const [showDatePicker, setShowDatePicker] = React.useState(false)
    const [message, setMessage] = React.useState('');
    const profilePicPicker = React.useRef();
    

    let updateProfile = async () => {
        if (new Date() - date < 1000 * 60 * 60 * 24 * 365 * 13)
            return Alert.alert("Sorry, you must be 13+ to create an account")
        if (!username)
            return Alert.alert("You must enter a username")

        updateProf(await profilePicPicker.current.uploadImage().catch(()=>Alert.alert("Something went wrong with uploading your profile image")));
    }

    const updateProf = async (downloadURL) => {
        const user = firebase.auth().currentUser
        await user.updateProfile(downloadURL?{
                displayName: username,
                photoURL: downloadURL
            }:{displayName: username}).then(function () {
                // Update successful.
            }).catch(function (error) {
                // An error happened.
                Alert.alert(error)
            });
        const profileRef = db.collection("Users").doc(user.uid);
        profileRef.set({ dateOfBirth: date, accountCreationTimestamp: firebase.firestore.FieldValue.serverTimestamp(), rooms: [], topics: [], color: `#${Math.floor(Math.random()*16777215).toString(16)}`}, { merge: true })
    }

    return (<ScrollView style={{backgroundColor:"white"}}><KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Text style={styles.titleText}>Finish Sign Up</Text>
        <Text
            style={{
                color: message.color || 'blue',
                fontSize: 17,
                textAlign: 'center',
                margin: 10,
            }}>
            {message.text}
        </Text>
        <ProfilePicPicker ref={profilePicPicker}/>
        <TextInput
            placeholder={"Username"}
            style={styles.textInput}
            onChangeText={username => setUsername(username)}
            value={username}
        />
        <View style={{ flexDirection: "row", paddingLeft: 20, paddingRight: 20 }}>
            <View style={{ flex: 1, justifyContent: "space-between", flexDirection: "row" }}>
                <Text style={{ fontSize: 25 }}>Birthday:</Text>
                <Button onPress={() => setShowDatePicker(!showDatePicker)} title={!showDatePicker ? "" + dayjs(date).format("MM-DD-YYYY") : "close"} />
            </View>
        </View>
        {showDatePicker && (
            // <Text>DateTimePicker goes here</Text>
            <DateTimePicker
                style={{ width: 320 }}
                value={date}
                mode='date'
                display="default"
                onChange={(event, newDate) => {
                    //showDatePicker()
                    setDate(newDate)
                }}
            />
        )}
        <TouchableOpacity style={styles.confirmButtonContainer} onPress={updateProfile} >
            <Text style={styles.confirmButtonText}>Sign Up</Text>
        </TouchableOpacity>
    </KeyboardAvoidingView></ScrollView>)
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textInput: {
        fontSize: 20,
        borderRadius: 5,
        borderWidth: 1,
        width: "90%",
        marginVertical: 10,
        padding: 10
    },
    titleText: {
        fontSize: 60,
        marginTop: 15,
        marginBottom: 10,
    },
    confirmButtonContainer: {
        marginTop: 50,
        borderWidth: 1,
        borderRadius: 20,
        padding: 10,
        backgroundColor: "blue",
        marginBottom: 10,
        paddingHorizontal: 30
    },
    confirmButtonText: {
        fontSize: 20,
        color: "white",

    },
    errorMessage: {
        color: "red"
    }
});
