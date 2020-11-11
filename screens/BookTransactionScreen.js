import React from 'react';
import { Text, View, TouchableOpacity, TextInput, Image, StyleSheet, KeyboardAvoidingView } from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase'
import db from '../config.js'

export default class TransactionScreen extends React.Component {
    constructor(){
      super();
      this.state = {
        hasCameraPermissions: null,
        scanned: false,
        scannedBookId: '',
        scannedStudentId:'',
        buttonState: 'normal',
        message: "" 
      }
    }

    getCameraPermissions = async (id) =>{
      const {status} = await Permissions.askAsync(Permissions.CAMERA);
      
      this.setState({
        /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
        hasCameraPermissions: status === "granted",
        buttonState: id,
        scanned: false
      });
    }

    handleBarCodeScanned = async({type, data})=>{
      const {buttonState} = this.state

      if(buttonState==="BookId"){
        this.setState({
          scanned: true,
          scannedBookId: data,
          buttonState: 'normal'
        });
      }
      else if(buttonState==="StudentId"){
        this.setState({
          scanned: true,
          scannedStudentId: data,
          buttonState: 'normal'
        });
      }
      
    }
    bookIssue=async()=>{
      db.collection("Transactions").add({StudentID:this.state.scannedStudentId,
         BookID: this.state.scannedBookId,
         TransactionType:"Issue",
        Date: firebase.firestore.Timestamp.now().toDate()})

        db.collection("Students").doc(this.state.scannedStudentId).update({
          NoOfBooks:firebase.firestore.FieldValue.increment(1)
        })
        db.collection("Books").doc(this.state.scannedBookId).update({
          BookAvailability: false
        })
        alert("Book Issued")
        this.setState({ 
          scannedBookId:"",
          scannedStudentId:"",
        })
    }
    bookReturn=async()=>{
      db.collection("Books").doc(this.state.scannedBookId).update({
        BookAvailability:true
      })
      db.collection("Students").doc(this.state.scannedStudentId).update({
        NoOfBooks:firebase.firestore.FieldValue.increment(-1)
      })
      db.collection("Transactions").add({StudentID:this.state.scannedStudentId, 
        BookID:this.state.scannedBookId, 
        TransactionType:"Return",
       Date:firebase.firestore.Timestamp.now().toDate()})
       alert("Book Returned")
       this.setState({
         scannedBookId:"",
         scannedStudentId:"",
       })
    }
    handleTransaction=async()=>{
      var transactionMessage = ""
    db.collection("Books").doc(this.state.scannedBookId).get()
    .then(doc=>{
      var Book = doc.data()
      console.log(Book.BookAvailability)
      if(Book.BookAvailability===true){
        alert("Processing Book Issue")
        transactionMessage = "Issue"
        this.bookIssue()

      }else{
        alert("Procesing Book Return")
        transactionMessage = "Return"
        this.bookReturn()
      }
      
    })
    this.setState({
      message:transactionMessage
    }
    )
    }
    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;

      if (buttonState !== "normal" && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        );
      }

      else if (buttonState === "normal"){
        return(
          <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
            <View>
              <Image
                source={require("../assets/booklogo.jpg")}
                style={{width:200, height: 200}}/>
              <Text style={{textAlign: 'center', fontSize: 30}}>Wily</Text>
            </View>
            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Book Id"
              value={this.state.scannedBookId}
              onChangeText={text=>{this.setState({scannedBookId:text})}}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("BookId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>
            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Student Id"
              value={this.state.scannedStudentId}
              onChangeText={text=>{this.setState({scannedStudentId:text})}}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("StudentId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>
              
              <TouchableOpacity onPress={this.handleTransaction} style = {styles.scanButton}><Text>Submit</Text></TouchableOpacity>
                    </KeyboardAvoidingView>
        );
      }
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      margin: 10
    },
    buttonText:{
      fontSize: 15,
      textAlign: 'center',
      marginTop: 10
    },
    inputView:{
      flexDirection: 'row',
      margin: 20
    },
    inputBox:{
      width: 200,
      height: 40,
      borderWidth: 1.5,
      borderRightWidth: 0,
      fontSize: 20
    },
    scanButton:{
      backgroundColor: '#66BB6A',
      width: 50,
      borderWidth: 1.5,
      borderLeftWidth: 0
    }
  });