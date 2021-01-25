import firebase from 'firebase/app';
import { currentUser, dataKeeper } from './dataManager';
import { fbConfig } from '.';
import * as d3 from 'd3';
import { structureSelected } from './annotationDashboard/imageDataUtil';
import { renderStructureKnowns } from './annotationDashboard/commentBar';
import { addCommentButton, goBackButton } from './annotationDashboard/topbar';



require('firebase/auth');
require('firebase/database');
const firebaseui = require('firebaseui');

let ui;

export const userLoggedIn = {
  loggedInBool: false,
  uid: null,
  displayName: null,
  admin: false,
  email: null,
};

export function addUser(user) {
  if (user != null) {
    userLoggedIn.uid = user.uid;
    userLoggedIn.displayName = user.displayName;
    userLoggedIn.email = user.email;
    userLoggedIn.loggedInBool = true;
    userLoggedIn.admin = false;
  } else {
    userLoggedIn.uid = null;
    userLoggedIn.displayName = null;
    userLoggedIn.email = null;
    userLoggedIn.loggedInBool = false;
    userLoggedIn.admin = false;
  }
}

function loginSuccess(user) {
  addUser(user);
  console.log('loggin success',userLoggedIn)
  // addCommentButton();
  // updateCommentSidebar();
}

export function cancelLogin(){
  ui.delete();
}

export function signOut(){
  ui.signOut();
}

export function userLogin() {

  if (!firebase.apps.length) {
    firebase.initializeApp(fbConfig[0]);
  }
  
  ui = new firebaseui.auth.AuthUI(firebase.default.auth());

  //let ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebase.auth());

  ui.start('#sign-in-container', {
    callbacks: {
      signInSuccessWithAuthResult(authResult) {
        const { user } = authResult;
        // const { credential } = authResult;
        // const { isNewUser } = authResult.additionalUserInfo;
        // const { providerId } = authResult.additionalUserInfo;
        // const { operationType } = authResult;

        // Do something with the returned AuthResult.
        // Return type determines whether we continue the redirect
        // automatically or whether we leave that to developer to handle.
        // return true;
        return loginSuccess(user);
      },

      signInFailure(error) {
        // Some unrecoverable error occurred during sign-in.
        // Return a promise when error handling is completed and FirebaseUI
        // will reset, clearing any UI. This commonly occurs for error code
        // 'firebaseui/anonymous-upgrade-merge-conflict' when merge conflict
        // occurs. Check below for more details on this.
        //return handleUIError(error);
        return window.alert(error);
      },
      uiShown() {
        // The widget is rendered.
        // Hide the loader.
        // document.getElementById('loader').style.display = 'none';
      },
    },
    signInFlow: 'popup',
    // signInSuccessUrl:"{{url_for('dashboard.index', user=currentUser)}}",
    signInOptions: [
      {
        provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        clientId: '632575175956-49a1hie4ab4gr69vak5onr307fg67bb0.apps.googleusercontent.com',
      },
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
      // firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID,
    ],
    // Other config options...
  });
}



export async function checkUser(callbackArray, callbackArrayNoArgs) {
  if (!firebase.apps.length) {
    firebase.initializeApp(fbConfig[0]);
  }

  firebase.auth().onAuthStateChanged(async (user) => {
    console.log('user??', user)
    if (user) {
      if(!ui){
        ui = new firebaseui.auth.AuthUI(firebase.default.auth());
      }
      d3.select('#sign-out').on('click', ()=> {
        firebase.auth().signOut();
        addUser(null);
        ui.delete();
        d3.select('#user').select('.user_name').remove();
        
        addCommentButton();
      });
      if(structureSelected.selected){
        d3.select('#comment-wrap').style('margin-top', '190px');
        renderStructureKnowns(d3.select('#right-sidebar').select('.top'));
        goBackButton();
      }else{
        d3.select('#comment-wrap').style('margin-top', '0px');
        addCommentButton();
      }
     
      currentUser.push(user);
      addUser(user);

      callbackArray.forEach((fun) => {
        fun(user);
      });
      checkDatabase(callbackArrayNoArgs);
      
      // User is signed in.
    } else {
      console.log('NO USER', user);
      d3.select('#sign-out').on('click', ()=> userLogin());
      addCommentButton();
      checkDatabase(callbackArrayNoArgs);
      // No user is signed in.
    }
   
   // checkDatabase([addCommentButton, updateCommentSidebar])
  });
  return currentUser;
}

export function checkDatabase(callbackArray) {
  const ref = firebase.database().ref();
  ref.on('value', (snapshot) => {
  
    dataKeeper.push({ ...snapshot.val() });
   
    callbackArray.forEach((fun) => {
      fun(snapshot.val());
    });
  }, (error) => {
    console.log(`Error: ${error.code}`);
  });
}
