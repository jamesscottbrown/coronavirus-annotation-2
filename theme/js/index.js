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
import { formatVidPlayer, playButtonChange } from "./annotationDashboard/video";


library.add(faCheck, fas, far, fab) 
dom.i2svg() 
dom.watch();



checkUser([renderUser]);
pullDataFromDatabase();

let video = formatVidPlayer(document.getElementById('video-wrap'), true);




