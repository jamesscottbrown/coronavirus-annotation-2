import firebase from 'firebase/app';
import { currentUser, dataKeeper } from './dataManager';
require('firebase/auth');
require('firebase/database');
import * as d3 from 'd3';

export async function checkUser(callbackArray){

  let fbConfig = await d3.json("../static/assets/firebase_data.json");

  console.log(fbConfig[0]);

    if (!firebase.apps.length) {
        firebase.initializeApp(fbConfig[0]);
    }

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          currentUser.push(user);
          callbackArray.forEach(fun=> {
            console.log("is this working")
            fun(user)});
          // User is signed in.
        } else {
          console.log("NO USER", user);
          // No user is signed in.
        }
    
      });
      return currentUser;
}

export function pullDataFromDatabase(){

  let ref = firebase.database().ref();  
  ref.on("value", function(snapshot) {
      dataKeeper.push(snapshot.val());
  }, function (error) {
      console.log("Error: " + error.code);
  });

  return dataKeeper;
}
// export function checkDatabase(ref, callback, extraArgs){
 
//   ref.on("value", function(snapshot) {

//       extraArgs != null ? callback(snapshot.val(), extraArgs) : callback(snapshot.val());
//       dataKeeper.push(snapshot.val());
      
//   }, function (error) {
//       console.log("Error: " + error.code);
//   });

// }

export function checkDatabase(ref){
 
  ref.on("value", function(snapshot) {

      //extraArgs != null ? callback(snapshot.val(), extraArgs) : callback(snapshot.val());
      dataKeeper.push(snapshot.val());
      
  }, function (error) {
      console.log("Error: " + error.code);
  });

}