import React, { useEffect, useContext, useLayoutEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Image, Modal, Alert, Platform } from 'react-native';
import { ListItem, Badge, Button } from 'react-native-elements';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { FAB } from 'react-native-paper';
import CustomMultiPicker from "react-native-multiple-select-list";
import * as Contacts from 'expo-contacts';
import { LinearGradient } from 'expo-linear-gradient';
import FacePile from 'react-native-face-pile'
import displayMoney from '../helpers/displayMoney'
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import {MainStackLoadedContext} from '../helpers/contexts'
import { Avatar } from "@rneui/themed";

export default function GroupListScreen({ navigation }) {
    const [groups, setGroups] = React.useState([]);
    const [add, setAdd] = React.useState(false)
    const [contacts, setContacts] = React.useState([])
    const [membersToAdd, setMembers] = React.useState([])
    const mainStackLoadedRef = useContext(MainStackLoadedContext)
    const db = firestore();
    const countryTelData = require('country-telephone-data')

    const nameOfNumberInContacts = Platform.OS == "ios" ? "digits" : "number"

    const cleanNumber = (number) => {
        if(number.replace(/[^0-9]/g, '').length>10)
            return "+"+number.replace(/[^0-9]/g, '')
        return "+1"+number.replace(/[^0-9]/g, '')
    }

    useLayoutEffect(()=>{
        mainStackLoadedRef.current.mainStackLoaded()
        if(mainStackLoadedRef.current.groupID)
            navigation.navigate('Summary',{groupUid: mainStackLoadedRef.current.groupID})
    }, [true])


    useEffect(()=>{
        (async()=>{
        console.log("running notif code")
          if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
              name: 'default',
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#FF231F7C',
            });
          }
          if (Constants.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
              const { status } = await Notifications.requestPermissionsAsync();
              finalStatus = status;
            }
            if (finalStatus !== 'granted') {
            //   alert('Failed to get push token for push notification!');
              return;
            }
            console.log("got notif perms")
            const token = (await Notifications.getExpoPushTokenAsync({experienceId: "@kihtrakraknas/debt-balance"})).data;
            console.log("token ",token);
            db.collection('Users').doc(auth().currentUser.phoneNumber).update({ tokens: firestore.FieldValue.arrayUnion(token) });
          } else {
            alert('Must use physical device for Push Notifications');
          }
        })();
    },[true])
    
    React.useEffect(() => {
        (async () => {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const { data } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image, Contacts.Fields.Name],
                });
                if (data.length > 0) {
                    setContacts(data)
                    let array = []
                    let promises=[]
                    let seen = []
                    data.forEach((contact, ind) => {
                        if(contact.phoneNumbers){
                            for(let phoneNumberIndex in contact.phoneNumbers){
                                let number=cleanNumber(contact.phoneNumbers[phoneNumberIndex][nameOfNumberInContacts])
                                if(number==auth().currentUser.phoneNumber)
                                    continue;
                                promises.push(fetch(`https://cashbalancerapi.kihtrak.com/check?number=${number}`,).then(res=>res.text()).then(text => { 
                                    if(text == "true"&&!seen.includes(number)){
                                        console.log("Exists "+number)
                                        // console.log(contact)
                                        // console.log({...contact, phoneNumbers:[contact.phoneNumbers[phoneNumberIndex]] })
                                        array.push({...contact, phoneNumbers:[contact.phoneNumbers[phoneNumberIndex]] })
                                        seen.push(number)
                                    }
                                }))                  
                            }
                        }
                    })
                    Promise.all(promises).then(()=>{
                        setContacts(array)
                    })
                    let contactsPromises = []
                    for (let contact in array) {
                        //console.log(contact)
                        // countryTelData.iso2Lookup[contact.phoneNumber]
                        // const doc = firestore().collection('Users').doc(contact).get().then(doc => { doc.exists });
                        // contactsPromises.push(doc)
                    }
                    //await Promise.all(contactsPromises)
                }
            }
        })();
        // props.contacts.forEach((el)=>{
        //     setContacts([...contacts, el.firstName])
        // })

        const user = auth().currentUser
        const profileRef = db.collection("Users").doc(user.phoneNumber);
        let listeners = []
        const profileListener = profileRef.onSnapshot((doc) => {
            setGroups([])
            doc.data().groups.forEach(groupID => {
                const docRef = db.collection("Groups").doc(groupID);
                const listener = docRef.onSnapshot((doc) => {
                    if (doc.exists) {
                        const { members, transactions } = doc.data()
                        setGroups((groups) => {
                            const indToDel = groups.findIndex(el=>el.groupID == groupID)
                            if(indToDel != -1)
                                groups.splice(indToDel,1)
                            return([...groups, { members, transactionsLength: transactions.length, groupID }].sort((a, b) => b?.transactionsLength - a?.transactionsLength))
                        })
                    } else {
                        // doc.data() will be undefined in this case
                        console.log("No such document!");
                    }
                }, (err) => {
                    console.log("Error getting group document:", err);   
                })
                listeners.push(listener)
            })
        }, (err) => {
            console.log("Error getting profile document:", err);   
        })
        listeners.push(profileListener)
        return ()=>{
            for(let listenerIndex in listeners){
                listeners[listenerIndex]()
            }
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
                        callback={(res) => {
                            let membersTemp = []
                            res.forEach(name=>{
                                let contact=contacts.find(el=>el.name==name)
                                if(contact&&contact.phoneNumbers){
                                    membersTemp.push(cleanNumber(contact.phoneNumbers[0][nameOfNumberInContacts]))
                                }
                            })
                            setMembers(membersTemp)
                            console.log("members"+membersTemp)
                        }} // callback, array of selected items
                        rowBackgroundColor={"#eee"}
                        rowRadius={5}
                        searchIconName="ios-checkmark"
                        searchIconColor="red"
                        searchIconSize={30}
                        iconColor={"#00a2dd"}
                        iconSize={30}
                        selectedIconName={"ios-checkmark-circle-outline"}
                        unselectedIconName={"ios-radio-button-off-outline"}
                        scrollViewHeight={"80%"}
                    />
                    <Button
                        onPress={()=>{
                            const body = { numbers: [...membersToAdd,auth().currentUser.phoneNumber] };
                            fetch('https://cashbalancerapi.kihtrak.com/', {
                                    method: 'post',
                                    body:    JSON.stringify(body),
                                    headers: { 'Content-Type': 'application/json' },
                                })
                                .then(res => res.json())
                                .then(json => {
                                    console.log(json)
                                    if(json?.error)
                                        Alert.alert(json?.error,null,[{ text: "OK", onPress: () => setAdd(false) }])
                                    else
                                    setAdd(false)
                                });
                        }}
                        title="Create Group"
                        color="#841584"
                    />
                </View>
            </TouchableOpacity>
        </Modal>

        <FlatList style={styles.flatList}
            data={groups}
            keyExtractor={(item, index) => "" + index}
            ListEmptyComponent={() => <View style={{flex:1, justifyContent: 'center', alignItems: 'center', marginTop: 50, padding: 50}}><Text style={{textAlign:"center", color:"green", fontSize:30}}>{`Create a group to get started!\n\nFriends who have the app will automatically populate the modal!`}</Text></View>}
            renderItem={({ item, index }) => {
                const memberUIDs = Object.keys(item.members).sort();
                let title = ''
                let lastIndexUsed = 0
                for (let index in memberUIDs) {
                    const member = memberUIDs[index]
                    if(member == auth().currentUser.phoneNumber)
                        continue;
                    const name = item.members[member]?.name
                    if (title.length + name.length > 30)
                        break;
                    title += name + ', '
                    lastIndexUsed++
                }
                title = title.substring(0, title.length - 2)
                const unusedMembers = (memberUIDs.length - 1) - lastIndexUsed

                const balance = item.members[auth().currentUser.phoneNumber]?.balance

                let faces = memberUIDs.filter(el=>el!=auth().currentUser.phoneNumber).map(number => {
                    const digits = number.substring(number.length - 10, number.length)
                    const contact = contacts.find(el => {
                        if (!el)
                            return false
                        return el?.phoneNumbers?.some(el => {
                            const elDigits = "" + el?.[nameOfNumberInContacts].replace(/-/g, '')
                            return elDigits.substring(elDigits.length - 10, elDigits.length) == digits
                        })
                    })
                    const image = contact?.image?.uri // contact?.image?.uri?contact.image?.uri:require('../assets/icon.png')
                    return ({
                        id: number,
                        // name: item.members[number]?.name,
                        imageUrl: image,
                    })
                })

                allNull = faces.length > 1
                for(let face of faces){
                    if(face.imageUrl != null){
                        allNull = false
                        break
                    }
                }
                if(allNull){
                    console.log(title)
                    faces = [{id:Math.random(), imageUrl:Image.resolveAssetSource(require('../assets/group.jpg')).uri}]
                }
                console.log(title, faces)

                // console.log(`faces: ${JSON.stringify(faces)}`)

                return (
                    <ListItem style={{ borderRadius: 20, marginVertical: 5, marginHorizontal: 5 }} bottomDivider topDivider onPress={() => {
                        // navigation.closeDrawer()
                        navigation.navigate('Summary',{groupUid: item.groupID, faces})
                    }}
                        linearGradientProps={{
                            colors: ['#00ff0010', '#00ff0040'],
                            start: { x: .1, y: 0 },
                            end: { x: .9, y: 0 },
                        }}
                        ViewComponent={LinearGradient}
                        containerStyle={{ borderRadius: 20 }}
                    >
                        {faces.length == 1 && <Avatar size="medium" rounded title={title.substring(0, 2)} source={{ uri: faces[0].imageUrl?faces[0].imageUrl:"a" }} />}
                        {faces.length > 1 && <View style={{ marginRight: 20 }}><FacePile numFaces={2} faces={faces} /></View>}
                        <ListItem.Content>
                            <ListItem.Title style={styles.listItemTitle}>{title}</ListItem.Title>
                            {unusedMembers != 0 ?
                                <ListItem.Subtitle style={styles.listItemSubtitle}>and {unusedMembers} more...</ListItem.Subtitle> :
                                <ListItem.Subtitle style={styles.listItemSubtitle}>{item.transactionsLength} transactions so far!</ListItem.Subtitle>}
                        </ListItem.Content>
                        <View style={[styles.textContainer, { backgroundColor: balance < 0 ? 'red' : 'green' }]}><Text>{displayMoney(balance)}</Text></View>
                        {/* <ListItem.Chevron /> */}
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