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

export default function GroupListScreen({ navigation }) {
    const [groups, setGroups] = React.useState([]);
    const [add, setAdd] = React.useState(false)
    const [contacts, setContacts] = React.useState([])
    const db = firebase.firestore();

    React.useEffect(() => {
        (async () => {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const { data } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
                });
                if (data.length > 0) {
                    let array = []
                    data.forEach((el, ind) => {
                        array.push(el)
                    })
                    setContacts(array)
                    if (ind == 0)
                        console.log(person)
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
            visible={add}
            onRequestClose={() => {
                setAdd(false)
            }}
        >
            <TouchableOpacity style={[styles.centeredView]} onPressOut={() => { setAdd(false) }} activeOpacity={1} >
                <View style={styles.modalView}>
                    <CustomMultiPicker
                        options={contacts.map(el => {
                            return el.name
                        })}
                        search={true} // should show search bar?
                        multiple={true} //
                        placeholder={"Search"}
                        placeholderTextColor={'#757575'}
                        returnValue={"label"} // label or value
                        callback={(res) => { console.log(res) }} // callback, array of selected items
                        rowBackgroundColor={"#eee"}
                        rowRadius={5}
                        searchIconName="ios-checkmark"
                        searchIconColor="red"
                        searchIconSize={30}
                        iconColor={"#00a2dd"}
                        iconSize={30}
                        selectedIconName={"ios-checkmark-circle-outline"}
                        unselectedIconName={"ios-radio-button-off-outline"}
                    />
                </View>
            </TouchableOpacity>
        </Modal>

        <FlatList style={styles.flatList}
            data={groups}
            keyExtractor={(item, index) => "" + index}
            renderItem={({ item, index }) => {
                const memberUIDs = Object.keys(item.members).sort();
                let title = ''
                let lastIndexUsed = 0
                for (let index in memberUIDs) {
                    const member = memberUIDs[index]
                    const name = item.members[member]?.name
                    if (title.length + name.length > 30)
                        break;
                    title += name + ', '
                    lastIndexUsed = index
                }
                title = title.substring(0, title.length - 2)
                const unusedMembers = (memberUIDs.length - 1) - lastIndexUsed

                const balance = item.members[firebase.auth().currentUser.uid]?.balance

                const faces = memberUIDs.map(number => {
                    const digits = number.substring(number.length - 10, number.length)
                    console.log("digits: " + digits)
                    const contact = contacts.find(el => {
                        if (!el)
                            return false
                        return el?.phoneNumbers?.some(el => {
                            const elDigits = el?.digits
                            return elDigits?.substring(elDigits.length - 10, elDigits.length) == digits
                        })
                    })
                    const image = contact?.image?.uri?contact.image?.uri:require('../assets/icon.png')
                    console.log(image)
                    return ({
                        id: number,
                        imageUrl: image
                    })
                })

                return (
                    <ListItem style={{ borderRadius: 20, marginVertical: 5 }} bottomDivider topDivider onPress={() => {
                        // navigation.closeDrawer()
                        // navigation.navigate("Project", { title: item.title })
                    }}
                        linearGradientProps={{
                            colors: ['#00ff0010', '#00ff0020'],
                            start: { x: 0, y: 0 },
                            end: { x: 1, y: 0 },
                        }}
                        ViewComponent={LinearGradient}
                        containerStyle={{ borderRadius: 20 }}
                    >
                        {faces.length==1 && <Avatar size="medium" rounded title={title.substring(0, 2)} source={{uri:faces[0].imageUrl}}/>}
                        {faces.length>1 && <View style={{marginRight:20}}><FacePile numFaces={3} faces={faces}/></View>}
                        <ListItem.Content>
                            <ListItem.Title style={styles.listItemTitle}>{title}</ListItem.Title>
                            {unusedMembers != 0 ?
                                <ListItem.Subtitle style={styles.listItemSubtitle}>and {unusedMembers} more...</ListItem.Subtitle> :
                                <ListItem.Subtitle style={styles.listItemSubtitle}>{item.transactionsLength} transactions so far!</ListItem.Subtitle>}
                        </ListItem.Content>
                        <View style={[styles.textContainer, { backgroundColor: balance < 0 ? 'red' : 'green' }]}><Text>${Math.abs(balance)}</Text></View>
                        <ListItem.Chevron />
                    </ListItem>
                )
            }}
        />
        <FAB
            style={styles.fab}
            animated
            visible={!add}
            large
            icon="plus"
            onPress={() => setAdd(true)}
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