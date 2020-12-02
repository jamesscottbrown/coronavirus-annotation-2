import firebase from 'firebase/app';
const { renderUser } = require("./annotationDashboard/topbar");
const { dataKeeper, currentUser } = require("./dataManager");
const { checkUser, pullDataFromDatabase } = require("./firebaseUtil");
import "core-js/stable";
import "regenerator-runtime/runtime";
import { library, dom } from "@fortawesome/fontawesome-svg-core";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import * as d3 from 'd3';
import { formatVidPlayer } from './annotationDashboard/video';

library.add(faCheck, fas, far, fab) 
dom.i2svg() 
dom.watch();

export const fbConfig = [];

init();

async function init(){

    let config = await d3.json("../static/assets/firebase_data.json");
    fbConfig.push(config[0]);

    if (!firebase.apps.length) { firebase.initializeApp(fbConfig[0]);}

    checkUser([renderUser]);
    pullDataFromDatabase();

    formatVidPlayer(true);
    
    
}







