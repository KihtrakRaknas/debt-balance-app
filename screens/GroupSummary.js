import React, { useEffect, useState } from 'react';
import {ActivityIndicator, StyleSheet, Text, View, TextInput, Button, TouchableOpacity, FlatList, Image, Modal, Alert, Dimensions, ImageBackground, Keyboard} from 'react-native';
import { ListItem, Avatar, Badge, Icon } from 'react-native-elements';
// import { ChatItem } from 'react-chat-elements'
import * as firebase from 'firebase';
import { FAB } from 'react-native-paper';
import CustomMultiPicker from "react-native-multiple-select-list";
import * as Contacts from 'expo-contacts';
import { LinearGradient } from 'expo-linear-gradient';
import FacePile from 'react-native-face-pile'
import ButtonToggleGroup from 'react-native-button-toggle-group';
import DropDownPicker from 'react-native-dropdown-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import displayMoney from '../helpers/displayMoney'

export default function GroupSummary({ navigation, route }) {
    const [balanceText, onChangeBal] = useState('$');
    const { groupUid, faces } = route.params
    const [newTransactionVisible, setNewTransactionVisible] = useState(false)
    const db = firebase.firestore();
    const user = firebase.auth().currentUser
    const groupRef = db.collection("Groups").doc(groupUid);
    const [groupInfo, setGroupInfo] = useState();
    const [isIOU, setIsIOU] = useState(true);
    const [dropDownOpen, setDropDownOpen] = useState(false);
    const [transactionRecipients, setTransactionRecipients] = useState([]);
    const [transactionRecipient, setTransactionRecipient] = useState();
    const [description, setDescription] = useState('');

    React.useEffect(() => {
        return groupRef.onSnapshot((doc) => {
            setGroupInfo(doc.data())
        })
    }, [true]);

    const balance = groupInfo?.members[firebase.auth().currentUser.phoneNumber]?.balance
    const oweMoney = balance<0

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerStyle: {backgroundColor: isNaN(balance)?'#ffffff':oweMoney?'#d40000':'#007000', borderBottomColor: 'transparent', shadowColor: 'transparent',}
        });
    }, [balance,navigation]);

    let membersToDisplay = []
    for(let memberUID in groupInfo?.members){
        const member = groupInfo?.members?.[memberUID]
        if(oweMoney?member.balance>0:member.balance<0)
            membersToDisplay.push({...member, number: memberUID})
    }
    membersToDisplay.sort((a,b)=>{Math.abs(a.balance)-Math.abs(b.balance)})

    let memberDropDown = []
    for(let memberUID in groupInfo?.members){
        if(memberUID==firebase.auth().currentUser.phoneNumber)
            continue;
        const member = groupInfo?.members?.[memberUID]
        memberDropDown.push({...member, number: memberUID})
    }
    memberDropDown = memberDropDown.map(el=>({label: `${el.name} (${el.number})`, value: el.number}))

    const checkValid = ()=>{
        let recipients = transactionRecipients
        if(memberDropDown.length == 1)
            recipients=[memberDropDown[0].value]
        else if(isIOU)
            recipients=[transactionRecipient]
        if(recipients.length==0 || recipients[0]==null)
            return false
        if(!Number(balanceText.substring(1)) || Number(balanceText.substring(1))<=0)
            return false
        if(description.length>500)
            return false
        return true
    }

    const sendTransaction = ()=>{
        let recipients = transactionRecipients
        if(memberDropDown.length == 1)
            recipients=[memberDropDown[0].value]
        else if(isIOU)
            recipients=[transactionRecipient]
        const transaction = {
            description,
            recipients,
            timestamp: new Date().getTime(),
            isIOU,
            active:true,
            sender: firebase.auth().currentUser.phoneNumber,
            amount:Number(balanceText.substring(1))
        }
        console.log(transaction)
        groupRef.update({transactions:firebase.firestore.FieldValue.arrayUnion(transaction)}).then(()=>setNewTransactionVisible(false))
    }

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
                <TouchableOpacity style={styles.modalView} activeOpacity={1} onPress={()=>Keyboard.dismiss()}>
                    <ButtonToggleGroup
                        highlightBackgroundColor={'teal'}
                        highlightTextColor={'white'}
                        inactiveBackgroundColor={'#00000020'}
                        inactiveTextColor={'black'}
                        values={['I O U', 'U O Me']}
                        value={isIOU?'I O U':'U O Me'}
                        onSelect={val => setIsIOU(val=='I O U')}
                        style={{marginBottom:10,backgroundColor:'#03DAC3'}}
                    />
                    <KeyboardAwareScrollView>
                        <Text style={{textAlign:'center', fontSize:30, color:"black", marginVertical:10, textDecorationLine:'underline'}}>{isIOU?'Send an IOU':'Request Money'}</Text>
                        <TextInput
                            style={{ marginVertical: 10, fontSize: 17 }}
                            placeholder={isIOU?"Amount Owed 💸":'Amount Requested 💸'}
                            style={styles.textInput}
                            onChangeText={(text) => {
                                var regex = /^\$\d*(((,\d{3}){1})?(\.\d{0,2})?)$/;
                                console.log(text)
                                if (regex.test(text))
                                    onChangeBal(text)
                            }}
                            numberOfLines={1}
                            value={balanceText}
                            placeholderTextColor = "gray"
                            keyboardType="numeric"
                        />
                        {memberDropDown?.length>1?(isIOU?
                        <DropDownPicker
                            style={{ marginVertical: 10 }}
                            open={dropDownOpen}
                            value={transactionRecipient}
                            items={memberDropDown}
                            setOpen={setDropDownOpen}
                            setValue={setTransactionRecipient}
                        />:<DropDownPicker
                            multiple={true}
                            style={{ marginVertical: 10 }}
                            open={dropDownOpen}
                            value={transactionRecipients}
                            items={memberDropDown}
                            setOpen={setDropDownOpen}
                            setValue={setTransactionRecipients}
                            min={1}
                        />):null}
                        <TextInput
                            style={{ marginVertical: 10, fontSize: 17 }}
                            placeholder={'Description (500 char limit)'}
                            maxLength={500}
                            style={[styles.textInput,{height:100}]}
                            onChangeText={(text) => {
                                setDescription(text)
                            }}
                            value={description}
                            placeholderTextColor = "gray"
                            multiline = {true}
                        />
                        <TouchableOpacity disabled={!checkValid()} onPress={sendTransaction} style={[styles.confirmButtonContainer,{backgroundColor:checkValid()?'blue':'grey'}]}>
                            <Text style={styles.confirmButtonText}>Send 📤</Text>
                        </TouchableOpacity>
                    </KeyboardAwareScrollView>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>


        <View style={styles.containerStyle} >
            <View style={styles.sliderContainerStyle} >
                <ImageBackground style={styles.slider} source={isNaN(displayMoney(balance).substring(1))?null:oweMoney?require("../assets/debt-balance-splash-red.png"):require("../assets/debt-balance-splash.png")} blurRadius={6}>
                    <Text style={styles.largeText} adjustsFontSizeToFit>{isNaN(displayMoney(balance).substring(1))? <ActivityIndicator size="large" color="#00ff00" />:displayMoney(balance)}</Text>
                </ImageBackground>
            </View>
        </View>
        <View style={styles.peopleBox}>
            {membersToDisplay.length>0 && <Text style={{textAlign:'center',padding:10}}>{oweMoney?`Maybe buy someone here a lunch?`:`Here are friends who owe you lunch 😉`}</Text>}
            <FlatList
                horizontal={true}
                data={membersToDisplay}
                keyExtractor={(el, index)=>""+index}
                renderItem={({ item, index }) => {
                    let image = faces.find(el=>el.id == item?.number)?.imageUrl
                    if(!image)
                        image = 'err'
                    const {name, balance} = item
                    return (
                        <View style={{padding:6,alignItems:'center',justifyContent:'center'}}>
                            <Avatar source={{ uri:image}} title={name.substring(0,2)} size="large" rounded/>
                            <Badge
                                status={oweMoney?"success":"error"}
                                value={displayMoney(balance)}
                                containerStyle={{ position: 'absolute', top: 0, right: 0 }}
                            />
                            <Text>{name}</Text>   
                        </View>
                    )
                }}
                ListEmptyComponent={()=><View style={{flexGrow:1,alignItems:'center',justifyContent:'center',width:window.width / 1.1}}><Text style={{fontSize:50,padding:20,textAlign:'center'}}>{"Perfectly\nbalanced ⚖"}</Text></View>}
            />
        </View>
        <FlatList
            style={styles.transactionsBox}
            data={groupInfo?.transactions?[...groupInfo?.transactions].reverse():[]}
            keyExtractor={(el, index)=>""+index}
            renderItem={({ item, index }) => {
                return (
                    <ListItem bottomDivider={index!=membersToDisplay.length-1}>
                        <ListItem.Content style={styles.listItem}>
                            <ListItem.Title style={styles.listItemTitle}><Text style={{color:"blue"}}>{groupInfo?.members?.[item?.sender]?.name}</Text> 👉 {item?.recipients.map(number=>groupInfo?.members?.[number]?.name)?.join(", ")}</ListItem.Title>
                            <ListItem.Subtitle style={styles.listItemSubtitle}>{item?.description}</ListItem.Subtitle>
                        </ListItem.Content>
                        <View style={{}}>
                            <Badge
                                status={"primary"}
                                value={displayMoney(item?.amount)}
                                containerStyle={{ marginTop: -20 }}
                            />
                            <Badge
                                status={"secondary"}
                                value={new Date(item?.timestamp).toLocaleDateString()}
                                containerStyle={{ marginBottom: -20 }}
                            />
                            <Icon
                                name='closecircle'
                            />
                        </View>
                    </ListItem>
                )
            }}
            ListEmptyComponent={()=><View style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:40,padding:20,textAlign:'center'}}>{"No transactions yet"}</Text></View>}
        />

        
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
const window = Dimensions.get('window')
const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        margin: 16,
        right: 10,
        bottom: 10,
    },
    container: {
        flex: 1,
        backgroundColor: '#ddd',
        alignItems: 'center',
    },
    containerStyle: {
        alignSelf: 'center',
        width: window.width,
        overflow: 'hidden',
        height: window.width / 2,
        // backgroundColor:"blue"
    },
    sliderContainerStyle: {
        borderRadius: window.width,
        width: window.width * 2,
        height: window.width * 2,
        marginLeft: -(window.width / 2),
        position: 'absolute',
        bottom: 0,
        overflow: 'hidden',
    },
    slider: {
        height: window.width / 2+1,
        width: window.width+5,
        position: 'absolute',
        bottom: 0,
        left:-5,
        marginLeft: window.width / 2,
        backgroundColor: 'white',
        alignItems:'center',
        justifyContent:'center'
    },
    largeText:{
        fontSize:90,
        color:"white"
    },
    peopleBox:{
        backgroundColor:"white",
        flexShrink:1,
        width: window.width / 1.1,
        borderRadius:10,
        margin:20,
        marginBottom:0
    },
    transactionsBox:{
        backgroundColor:"white",
        flex:1,
        width: window.width / 1.1,
        borderRadius:10,
        margin:20,
    },
    listItem:{
        paddingVertical:10
    },
    listItemTitle:{
        fontSize:25
    },
    listItemSubtitle:{
        fontSize:15
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        // alignItems: "center",
        marginTop: 22,
    },
    modalView: {
        margin: 20,
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
        height: "70%",
        backgroundColor:"#03DAC3"
    },
    textInput: {
        fontSize: 20,
        borderRadius: 5,
        borderWidth: 1,
        marginVertical: 10,
        padding: 10,
        backgroundColor: "white",
        color:"black"
    },
    confirmButtonContainer: {
        marginTop: 10,
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        backgroundColor: "blue",
        marginBottom: 10,
        paddingHorizontal: 30,
        alignSelf: 'stretch',
        // marginHorizontal: 50,
    },
    confirmButtonText: {
        fontSize: 22,
        color: "white",
        textAlign: "center"
    },
});