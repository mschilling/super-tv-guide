// Import the Polymer library and the html helper function
import { PolymerElement, html} from '@polymer/polymer/polymer-element.js';

// Import template repeater
import '@polymer/polymer/lib/elements/dom-repeat.js';

import '../style/shared-styles.js';

import {Icon} from "@material/mwc-icon"

import '@polymer/paper-toast/paper-toast.js';
import '@polymer/paper-button/paper-button.js';


// Import IDB
import '../js/idb-promised.js';

class myFeed extends PolymerElement {

  constructor() {
    super();
    myFeed.dbPromise = this.createIDB();
    this.loadContentCacheFirst();
    this.backButtonControl();
  }
  
  static get properties() {
    return {
      shows: {
        type: Array,
        value() {
          return [];
        }
      },
      showInfo: {
        type: Array,
        value() {
          return [];
        }
      },
      noData: {
        type: Boolean,
        value() {
          return false;
        }
      },
      noSeries: {
        type: Boolean,
        value() {
          return false;
        }
      },
      lastUpdated: {
        type: String,
        value(){
          return '';
        }
      },
      rendered: {
        type: Boolean,
        value() {
          return false;
        }
      }
    };
  }

  /* 
  *  Make sure network content is loaded first,
  *  If network is not available: load local content.
  */ 
  loadContentCacheFirst() { 
   this.loadLocally().then(offlineData => {
      if (!offlineData.length){
        this.loadFromNetwork();
      } else{
        this.shows = offlineData;
        this.rendered = true; 
        this.loadFromNetwork();
      }
    }).catch(err => {
      console.warn(err);
      this.loadFromNetwork();
    })
  } 

  async loadFromNetwork(){
    let user = await this.getUser();
    this.getShows(user)
    .then(dataFromNetwork => {
      this.saveLocally(dataFromNetwork)
      .then(() => {
        this.shows = dataFromNetwork;
        this.loadingDone(); 
      }).catch(err => {
        if(dataFromNetwork.error){
          this.noSeries = true;
          this.toast('no-series');
        }else{
          console.log("Could not save data");
        }
        this.loadingDone();
      });
    }).catch(err => {
      if(!this.shows.length){
        this.toast('no-data');
        this.loadingDone(); 
        this.noData = true;
      }else{
        this.toast('offline');
        this.loadingDone();
      }
    })
  }

  getUser(){
    return new Promise(resolve => {
      firebase.auth().onAuthStateChanged((currentUser) => {
        if (currentUser) {
          resolve(currentUser);
        }
      })
    })
  }

  loadingDone(){
    this.rendered = true; 
    let loader = this.shadowRoot.getElementById("loader");
    loader.addEventListener('animationiteration', function(){
      loader.classList.remove('anim');
    })
    loader.addEventListener('webkitAnimationIteration', function(){
      loader.classList.remove('anim');
    })
  }

  /* Call API and return JSON data of the shows */
  getShows(user) {
    if(!user){
      throw Error("User not found");
    }

    var request = `https://us-central1-super-tv-guide.cloudfunctions.net/api/api/user/${user.uid}/feed`;
    
    return fetch(request).then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    });
  }

  /* Find if the episode is aired today, tomorrow, has already been aired or will be */
  getDay(date){

    // Split date and convert to date object
    var parts = date.split('-');
    // Please pay attention to the month (parts[1]); JavaScript counts months from 0:
    // January - 0, February - 1, etc.
    var convertedDate = new Date(parts[0], parts[1] - 1, parts[2]); 

    var date_today = new Date(); // Current date (today)

    var date_tomorrow = new Date(date_today.getFullYear(), date_today.getMonth(), date_today.getDate() + 1); // Date of tomorrow

    // Check the date
    if (convertedDate.getFullYear() == date_today.getFullYear() && convertedDate.getMonth() == date_today.getMonth() && convertedDate.getDate() == date_today.getDate()){
      return 'Today';
    }else if(convertedDate.getFullYear() == date_tomorrow.getFullYear() && convertedDate.getMonth() == date_tomorrow.getMonth() && convertedDate.getDate() == date_tomorrow.getDate()){
      return 'Tomorrow';
    }else if (convertedDate < date_today){
      return 'Aired'; // If show is already aired (input date < current date)
    }else{
      return 'Upcoming'; // Show is not today or tomorrow
    }
  }

  /* Format the date into date/month format */
  formatDate(date){
    var parts = date.split('-');
    return parts[2] + '/' + parts[1];
  }

  /* Create IndexedDB */
  createIDB(){
    // Make new db if not existent
    return idb.open('super-tv-guide', 1, function(upgradeDb) {
        if (!upgradeDb.objectStoreNames.contains('watchlist')) {
          upgradeDb.createObjectStore('watchlist', {keyPath: 'id',
          autoIncrement: true});
        }
    });
  }

  /* Save the watchlist items locally */
  saveLocally(data){
    if (!('indexedDB' in window)) {return null;}
    this.clearDB();
    return myFeed.dbPromise.then(db => {
      const tx = db.transaction('watchlist', 'readwrite');
      const store = tx.objectStore('watchlist');
      return Promise.all(data.map(item => store.put(item)))
      .catch(() => {
        tx.abort();
        throw Error('Items were not added to the store');
      });
    });
  }

  /* Load content from IndexedDB in case user is offline */
  loadLocally(){
    if (!('indexedDB' in window)) {return null;}
    return myFeed.dbPromise.then(db => {
      const tx = db.transaction('watchlist', 'readonly');
      const store = tx.objectStore('watchlist');
      return store.getAll();
    });
  }

  /* Clear the database to prevent using too much memory */
  clearDB(){
    if (!('indexedDB' in window)) {return null;}
      return myFeed.dbPromise.then(db => {
        const tx = db.transaction('watchlist', 'readwrite');
        const store = tx.objectStore('watchlist');
        return store.clear()
        .catch(() => {
          tx.abort();
          throw Error('Objectstore could not be cleared');
        });
      });
  }

  toast(item){
    this.shadowRoot.getElementById(`toast-${item}`).open();
  }
  
  static get template() {
    return html`
        <style include="shared-styles">
          :host {
            display: block;
          }
          p{
            margin: 0;
          }
          .date-written{
            margin-bottom: 2px;
            font-size: 10pt;
          }
          .serie-name{
            color: #B71C1C;
            font-weight: 600;
            font-size: 13pt;
            margin-top: 5px;
            margin-bottom: 5px;
          }
          .row{
            float: left;
            margin-top: 10px;
            float: left;
            width: 100%;
          }
          .row p{
            float: left;
            color: #585858;
            margin-top: -3.5px;
          }
          .row div{
            height: 18px;
            float: left;
            width: 33%;
            display: flex
          }
          .row div:nth-child(2){
            justify-content: center;
          }
          .row div:last-child p{
            width: 100%;
            text-align: right;
          }
          .card{
            float: left;
            width: calc(100% - 52px);
            margin-bottom: 10px;
            margin-top: 10px;
          }
          .divider{
            float: left;
            margin-top: 5px;
            float: left;
            width: 100%;
            height: 1px;
            background-color: #f2f2f2;
          }
          .row .se{
            color: #a2a2a2;
          }
          .icon-clock{
            margin-top: 3px;
          }
          #popup{
            border-radius: 5px;
            position: fixed;
            padding: 10px;
            width: calc(90% - 20px);
            left: calc(5%);
            bottom: 15px;
            color: white;
          }
          .fadeout{
            opacity: 0;
            transition: all 0.4s ease-out;
          }
          #show-details{
            width: 100%;
            height: calc(100vh - 64px);
            padding-top: 64px;
            bottom: 0;
            overflow-y: scroll;
            position: fixed;
            background-color: #eeeeee;
            transform: translateX(100%);
            transition: all 250ms ease-in-out;
          }
          #show-details-body{
            margin: 10px;
            margin-top: -15px;
            width: calc(100% - 52px);
            margin-bottom: 75px;
          }
          #show-details.open{
            transform: translateX(0) !important;
          }
          #header-img{
            float: left;
            width: 100%;
            height: 200px;
          }
          #header-img img{
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .floating-btn{
            position: fixed;
            background-color: #b71c1c;
            border-radius: 50%;
            height: 60px;
            width: 60px;
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: 2px 2px 20px rgba(0,0,0,0.4);
          }
          #add-btn{
            right: 25px;
            bottom: 25px;
            transition: opacity 100ms ease-in-out;
            opacity: 1;
          }
          #add-btn.closed{
            opacity: 0;
          }
          #back-btn{
            bottom: 25px;
            left: 25px;
            opacity: 0;
            transition: opacity 200ms ease-in-out;
          }
          #back-btn.open{
            opacity: 1;
            transition: opacity 250ms ease-in-out 125ms;
          }
          .floating-btn i{
            color: white;
          }
          #detailed-content{
            float: left;
            margin-top: 15px;
            margin-bottom: 15px;
          }
          #episode-title{
            color: #1e1e1e;
            font-weight: 600;
            margin-bottom: 10px;
          }
          #no-info-found{
            height: 100%;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          mwc-icon{
            font-size: 13pt !important;
            margin-right: 5px;
          }
          mwc-icon.arrow_back{
            font-size: 15pt !important;
            margin: 0;
            color: white;
          }
        #loader {
          position: absolute;
          top: 64px;
          width: 100%;
          height: 6px;
          background-color: #eeeeee;
        }
        #loader::before {
          content: "";
          display: inline;
          position: absolute;
          width: 50%;
          left: -50%;
          height: 100%;
          text-align: center;
          background-color: #d03838;
        }
        #loader.anim::before{
          animation: loading 1s linear infinite;
        }
        @keyframes loading {
            from {left: -50%;}
            to {left: 100%;}
        }
        #cards-container{
          float: left;
          width: 100%;
          margin-top: 15px;
        }
        .error-container{
          width: 100%;
          height: calc(100vh - 100px);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
        }
        .error-container mwc-icon{
          font-size: 60pt !important;
          color: #d8d8d8;
        }
      </style>

      <link rel="stylesheet" href="/src/style/skeleton.css">
      
      <div id="loader" class="anim"></div>

      <template is="dom-if" if="{{!rendered}}">
          <div id="cards-container">
          <div class="card feed-item"></div>
          <div class="card feed-item"></div>
          <div class="card feed-item"></div>
          <div class="card feed-item"></div>
          <div class="card feed-item"></div>
        </div>
      </template>

      <div id="cards-container">
        <template is="dom-repeat" items="{{shows}}">
          <div class="card feed-item" on-click="showDetails">
            <p class="date-written">[[getDay(item.episodereleasedate)]]</p>
                <p class="serie-name">[[item.seriename]]</p>
                <div class="divider"></div>
                <div class="row">
                  <div>
                    <mwc-icon>calendar_today</mwc-icon>
                    <p class="date go-up">[[formatDate(item.episodereleasedate)]]</p>
                  </div>
                  <div>
                    <mwc-icon>access_time</mwc-icon>
                    <p class="go-up">[[item.episodereleasetime]]</p>
                  </div>
                  <div>
                    <p class="se">S[[item.seasonnumber]]E[[item.episodenumber]]</p>
                  </div>
                </div>
                </div>
          </div>
        </template>
      </div>
          
     <div id="show-details">
      <template is="dom-if" if="{{showInfo.serieid}}">

          <div id="header-img">
              <img src="https://www.thetvdb.com/banners/fanart/original/[[showInfo.serieid]]-2.jpg" alt="Serie banner">
          </div>

          <div id="show-details-body" class="card">
            <p class="date-written">[[getDay(showInfo.episodereleasedate)]]</p>
            <p class="serie-name">[[showInfo.seriename]]</p>
            <div class="divider"></div>
            <div class="row">
                <div>
                  <mwc-icon>calendar_today</mwc-icon>
                  <p class="date">[[formatDate(showInfo.episodereleasedate)]]</p>
                </div>
                <div>
                  <mwc-icon>access_time</mwc-icon>
                  <p>[[showInfo.episodereleasetime]]</p>
                </div>
                <div>
                  <p class="se">S[[showInfo.seasonnumber]]E[[showInfo.episodenumber]]</p>
                </div>
              </div>
            <div class="divider"></div>
            
            <div id="detailed-content">
              <template is="dom-if" if="{{showInfo.episodename}}">
                <p id="episode-title">[[showInfo.episodename]]</p>
              </template>

              <template is="dom-if" if="{{showInfo.episodedescription}}">
                <p>[[showInfo.episodedescription]]</p>
              </template>

              <template is="dom-if" if="{{!showInfo.episodename}}">
                <p id="episode-title">No title available</p>
              </template>

              <template is="dom-if" if="{{!showInfo.episodedescription}}">
                <p>No description available.</p>
              </template>

            </div>

          </div>
          
      </template>

      <template is="dom-if" if="{{!showInfo.serieid}}">
          <div id="no-info-found">
            <h1>No info found</h1>
          </div>
      </template>

     </div>

      <template is="dom-if" if="{{noData}}">
          <div class="error-container">
            <mwc-icon>error_outline</mwc-icon>
          </div>
      </template>

      <template is="dom-if" if="{{noSeries}}">
          <div class="error-container">
            <mwc-icon>sentiment_dissatisfied</mwc-icon>
          </div>
      </template>

      <a id="add-btn" class="floating-btn" href="[[rootPath]]watchlist">
        <mwc-icon class="arrow_back" >add</mwc-icon>
      </a>

      <div id="back-btn" class="floating-btn" on-click="showDetails">
        <mwc-icon class="arrow_back" >arrow_back</mwc-icon>
      </div>

      <!-- Toast messages -->
      <paper-toast id="toast-offline" class="fit-bottom toast-warning" duration="5000" text="You're offline and seeing local data."></paper-toast>
   
      <paper-toast id="toast-no-series" class="fit-bottom toast-warning" duration="5000" text="You don't have any series. Try adding a few by clicking the button in the right bottom corner."></paper-toast>
      
      <paper-toast id="toast-no-data" class="fit-bottom toast-error" duration="0" text="You're offline and don't have any local data. Try refreshing when you've got an internet connection.">
        <paper-button class="error" onclick="document.querySelectorAll('my-app')[0].shadowRoot.querySelectorAll('my-feed')[0].shadowRoot.getElementById('toast-no-data').close()">Close</paper-button>
      </paper-toast>

      <custom-style><style is="custom-style">
        .toast-error {
          --paper-toast-background-color: #B71C1C;
          --paper-toast-color: white;
        }
        .toast-warning{
          --paper-toast-background-color: #FFB300;
          --paper-toast-color: white;
        }
        paper-button.error {
          float: right;
          margin-top: 10px;
          color: white;
          --paper-button-ink-color: #f3f3f3;
        }
      </style></custom-style>
    `;
  }
  backButtonControl(){
    window.onpopstate = function(event) {
      // get feed object
      let myFeed = document.querySelectorAll('my-app')[0].shadowRoot.querySelectorAll('my-feed')[0].shadowRoot;
      // get show details container and back btn
      let container = myFeed.getElementById("show-details");
      let backbtn = myFeed.getElementById("back-btn");
      let addbtn = myFeed.getElementById("add-btn");
      if(container.classList.contains('open')){
        container.classList.remove("open");
        backbtn.classList.remove("open");
        addbtn.classList.remove("closed");
      }
    };
  }

  showDetails(e) {
    // Set current show to the clicked one
    let container = this.shadowRoot.getElementById("show-details");
    let backbtn = this.shadowRoot.getElementById("back-btn");
    let addbtn = this.shadowRoot.getElementById("add-btn");
    if(!(container.classList.contains('open'))){
      this.showInfo = e.model.item;
      container.classList.add("open");
      backbtn.classList.add("open");
      addbtn.classList.add("closed");
      window.history.pushState('forward', null, '/details')
    }else{
      let location = window.location.href;
      container.classList.remove("open");
      backbtn.classList.remove("open");
      addbtn.classList.remove("closed");
      if(location.endsWith("details")){
        window.history.back();
      }
    }
  }

}
customElements.define('my-feed', myFeed);
