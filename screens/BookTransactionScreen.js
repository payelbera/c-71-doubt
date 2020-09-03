import React from 'react';
import {Text,View,TouchableOpacity,StyleSheet,Image,TextInput, Alert} from 'react-native';
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner';
import db from '../config.js'

export default class TransactionScreen extends React.Component{

constructor(){
    super();
    this.state = {
        hasCameraPermissions : null,
        scanned:false,
        scannedData:'',
        buttonState:"normal",
        scannedBookId:'',
        scannedStudentId:'',
        transactionMessage:''
    }
}

getCameraPermissions = async (id)=>{
    
    const {status} = await Permissions.askAsync(Permissions.CAMERA);

    this.setState(
        {hasCameraPermissions:status==="granted",
         buttonState:id,
         scanned:false   
        })
    //alert("permission 2 "+this.state.buttonState);
    
}
handleBarCodeScanned = async ({type,data})=>{
    const {buttonState} = this.state;
     if(buttonState ==="BookId"){
        this.setState({
            scanned:true,
            scannedBookId:data,
            buttonState:'normal'
        });
     }
     else if(buttonState ==="StudentId"){
        this.setState({
            scanned:true,
            scannedStudentId:data,
            buttonState:'normal'
        });
     }
    
//alert("data is "+this.state.scannedData+"buttonState "+this.setState.buttonState)
}

handleTransaction= async ()=>{
var  transactionMessage
db.collection("books").doc(this.state.scannedBookId).get()
.then((doc)=>{
    console.log(doc.data())
    var book = doc.data();
    if(book.bookAvailability){
        console.log("book available")
        this.initiateBookIssue();
        transactionMessage = "Book Issued"
    }
    else{
        this.initiateBookReturn();
        transactionMessage = "Book Returned"

    }
this.setState({transactionMessage:transactionMessage})
})
}

initiateBookIssue = async()=>{
    console.log("initiateBookIssue called")
    //add a txn
    db.collection("transaction").add({
        studentId : this.state.scannedStudentId,
        bookId : this.state.scannedBookId,
        date : firebase.firestore.Timestamp.now().toDate(),
        transactionType: "Issue"
    })
    //change book status

    db.collection("books").doc(this.state.scannedBookId).update({
        bookAvailability:false
    })

    //change Number of issued book for student

    db.collection("student").doc(this.state.scannedStudentId).update({
        numberOfBooksIssued : firebase.firestore.FieldValue.increment(1)
    })
    Alert.alert("book issued!!")
    this.setState({
        scannedBookId:'',
        scannedStudentId:''
    })
}

initiateBookIssue = async()=>{
    //add a txn
    db.collection("transaction").add({
        studentId : this.state.scannedStudentId,
        bookId : this.state.scannedBookId,
        date : firebase.firestore.Timestamp.now().toDate(),
        transactionType: "Return"
    })
    //change book status

    db.collection("books").doc(this.state.scannedBookId).update({
        bookAvailability:true
    })

    //change Number of issued book for student

    db.collection("student").doc(this.state.scannedStudentId).update({
        numberOfBooksIssued : firebase.firestore.FieldValue.increment(-1)
    })
    Alert.alert("book Returned!!")
    this.setState({
        scannedBookId:'',
        scannedStudentId:''
    })
}

render(){
    const hasCameraPermission = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState= this.state.buttonState;
    
    if(buttonState !=="normal" && hasCameraPermission){
        return(
            <BarCodeScanner
            onBarCodeScanned={scanned?undefined:this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}/>
        )
    }
    else if(buttonState==="normal"){
    return(
        <View style={styles.container}>
            <View>
                <Image
                source = {require("../assets/booklogo.jpg")}
                style ={{width:200,height:200}}/>
                <Text style={{textAlign:'center',fontSize:30}}>Wireless Library</Text>
            </View>
            <View style ={styles.inputView}>
            <TextInput style={styles.inputBox}
                placeholder = "Enter Book ID"
                value={this.state.scannedBookId}
            />
            <TouchableOpacity style={styles.scanButton} onPress={()=>{this.getCameraPermissions("BookId")}}>
                <Text style={styles.buttonText}>
                    Scan 
                </Text>
            </TouchableOpacity>
            </View>
            <View style ={styles.inputView}>
            <TextInput style={styles.inputBox}
                placeholder = "Student ID"
                value={this.state.scannedStudentId}
            />
            <TouchableOpacity style={styles.scanButton} onPress={()=>{this.getCameraPermissions("StudentId")}}>
                <Text style={styles.buttonText}>
                    Scan 
                </Text>
            </TouchableOpacity>

            <TouchableOpacity 
            style ={styles.submitButton}
            onPress = {async ()=>{this.handleTransaction()}}
            >
            <Text style ={styles.submitButtonText}>SUBMIT</Text>
                
            </TouchableOpacity>
            </View>
        </View>
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
      fontSize: 20,
    },
    inputView:{
        flexDirection:'row',
        margin:20
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
      },
      submitButton:{
        backgroundColor: '#FbC02D',
        width: 100,
        height: 50,
        
      },
      submitButtonText:{
        padding: 10,
        textAlign: 'center',
        fontSize: 20,
        fontWeight:"bold",
        color:"white"
      }
  });