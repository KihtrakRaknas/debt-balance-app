import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View, TextInput, Button, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import * as firebase from 'firebase';
import Image from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import * as ImagePicker from 'expo-image-picker';


export default ProfilePicPicker = forwardRef(({ originalImage: imageFromProp }, ref) => {
    const [image, setImage] = useState(imageFromProp);
    const [imageNeedsUpload, setImageNeedsUpload] = useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);

    useImperativeHandle(ref, () => ({
        uploadImage: ()=>new Promise(async (resolve, reject) => {
            if(!imageNeedsUpload)
                return resolve(null);

            const user = firebase.auth().currentUser
            const pathReference = firebase.storage().ref(`profile_pics/${user.uid}.JPG`)
            const response = await fetch(image);
            const blob = await response.blob();
            const uploadTask = pathReference.put(blob)

            uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
                (snapshot) => {
                    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                    var progress = (snapshot.bytesTransferred / snapshot.totalBytes);
                    setUploadProgress(progress)
                    console.log('Upload is ' + progress + '% done');
                    switch (snapshot.state) {
                        case firebase.storage.TaskState.PAUSED: // or 'paused'
                            console.log('Upload is paused');
                            break;
                        case firebase.storage.TaskState.RUNNING: // or 'running'
                            console.log('Upload is running');
                            break;
                    }
                },
                (error) => {
                    reject(error)
                    // A full list of error codes is available at
                    // https://firebase.google.com/docs/storage/web/handle-errors
                    switch (error.code) {
                        case 'storage/unauthorized':
                            // User doesn't have permission to access the object
                            break;
                        case 'storage/canceled':
                            // User canceled the upload
                            break;

                        // ...

                        case 'storage/unknown':
                            // Unknown error occurred, inspect error.serverResponse
                            break;
                    }
                },
                () => {
                    // Upload completed successfully, now we can get the download URL
                    uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                        console.log('File available at', downloadURL);
                        resolve(downloadURL)
                    });
                }
            );
        })
    }));

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        console.log(result);

        if (!result.cancelled) {
            setImageNeedsUpload(true)
            setImage(result.uri);
        }
    };

    return (
        <View style={{ flexShrink: 1, padding: 0, margin: 0, flexDirection: "column", alignItems: 'center', justifyContent: 'center' }}>
            {image && <Image source={{ uri: image ? image : require("../assets/placeholder.jpg") }}
                style={{ width: 150, height: 150, resizeMode: "contain" }}
                threshold={0}
            />}
            {uploadProgress != 1 && uploadProgress != 0 && <Progress.Bar progress={uploadProgress} indeterminate={!image} />}
            <Button title={image ? "Change Image" : "Pick a profile pic from camera roll"} onPress={pickImage} />
        </View>
    )
})