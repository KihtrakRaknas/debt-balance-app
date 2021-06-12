import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, TouchableOpacity, FlatList, Image, Modal, Alert } from 'react-native';
import { ListItem, Avatar, Badge } from 'react-native-elements';
// import { ChatItem } from 'react-chat-elements'
import * as firebase from 'firebase';
import { FAB } from 'react-native-paper';
import CustomMultiPicker from "react-native-multiple-select-list";
import * as Contacts from 'expo-contacts';
import { LinearGradient } from 'expo-linear-gradient';
import FacePile from 'react-native-face-pile'


export default function GroupSummary({ navigation }) {
    const [newTransactionVisible, setNewTransactionVisible] = React.useState(false)
    const db = firebase.firestore();

    React.useEffect(() => {
        (async () => {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const { data } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image, Contacts.Fields.Name],
                });
                if (data.length > 0) {
                    let array = []
                    data.forEach((el, ind) => {
                        array.push(el)
                    })
                    console.log(array[0])
                    setContacts(array)
                    let contactsPromises = []
                    for(let contact in array){
                        countryTelData.iso2Lookup[contact.phoneNumber]
                        const doc = firestore().collection('Users').doc(contact).get().then(doc=>{doc.exists});
                        contactsPromises.push(doc)
                    }
                    await Promise.all(contactsPromises)
                }
            }
        })();
        // props.contacts.forEach((el)=>{
        //     setContacts([...contacts, el.firstName])
        // })
        if (firebase.auth().currentUser) {
            const user = firebase.auth().currentUser
            const profileRef = db.collection("Users").doc(user.phoneNumber);
            profileRef.onSnapshot((doc) => {
                setGroups([])
                doc.data().groups.forEach(groupID => {
                    console.log(groupID)
                    const docRef = db.collection("Groups").doc(groupID);
                    docRef.get().then((doc) => {
                        if (doc.exists) {
                            const { members, transactions } = doc.data()
                            setGroups((groups) => [...groups, { members, transactionsLength: transactions.length }].sort((a, b) => a?.transactionsLength - b?.transactionsLength))
                        } else {
                            // doc.data() will be undefined in this case
                            console.log("No such document!");
                        }
                    }).catch((error) => {
                        console.log("Error getting document:", error);
                    });
                })
            })
        }
    }, []);

    return (<View style={styles.container}>
        <Modal
            animationType="slide"
            transparent={true}
            visible={newTransactionVisible}
            onRequestClose={() => {
                setNewTransactionVisible(false)
            }}
        >
            <TouchableOpacity style={[styles.centeredView]} onPressOut={() => { setNewTransactionVisible(false) }} activeOpacity={1} >
                <View style={styles.modalView}>
                   <Text>TEST</Text>
                </View>
            </TouchableOpacity>
        </Modal>
        <FAB
            style={styles.fab}
            animated
            visible={!newTransactionVisible}
            large
            icon="cash-multiple"
            onPress={() => setNewTransactionVisible(true)}
        />
    </View>)
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        margin: 16,
        right: 10,
        bottom: 10,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flatList: {
        width: "100%"
    },
    listItem: {
        paddingVertical: 10
    },
    listItemTitle: {
        fontSize: 25
    },
    listItemSubtitle: {
        fontSize: 15
    },
    textContainer: {
        padding: 7,
        borderRadius: 5,
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        // alignItems: "center",
        marginTop: 22,
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        height: "70%"
    },
});