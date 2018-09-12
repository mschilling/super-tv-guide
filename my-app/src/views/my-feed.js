// Import the Polymer library and the html helper function
import { PolymerElement, html} from '@polymer/polymer/polymer-element.js';

// Import template repeater
import '@polymer/polymer/lib/elements/dom-repeat.js';

import '../style/shared-styles.js';

// Import IDB
import '../js/idb-promised.js';

class myFeed extends PolymerElement {

  constructor() {
    super();
    myFeed.dbPromise = this.createIDB();
    this.loadContentNetworkFirst();
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
      detailesOpened: {
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
 loadContentNetworkFirst() { 
  this.getShows()
  .then(dataFromNetwork => {
    this.saveLocally(dataFromNetwork)
    .then(() => {
      this.shows = dataFromNetwork;
      this.setLastUpdated(new Date());
      //this.messageDataSaved();
    }).catch(err => {
      this.messageSaveError();
      console.warn(err);
    });
  }).catch(err => {
    console.log('Network requests have failed, this is expected if offline');
    this.loadLocally()
    .then(offlineData => {
      if (!offlineData.length) {
        this.messageNoData();
      } else {
        this.messageOffline();
        this.shows = offlineData; 
      }
    });
  });
} 

  /* Call API and return JSON data of the shows */
  getShows() {
    var request = 'https://us-central1-super-tv-guide.cloudfunctions.net/api/api/feed';
   
    return fetch(request).then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    });
    
  }

  messageOffline() {
    // alert user that data may not be current
    const lastUpdated = this.getLastUpdated();
    let text = "You're offline and viewing stored data <br>"
    if (lastUpdated) {
      text += ' Last fetched server data: ' + lastUpdated;
    }
    this.popup(text, "#FBC02D")
  }

  messageNoData() {
    // alert user that there is no data available
    this.popup("You're offline and local data is unavailable", "#D32F2F")
  }

  messageDataSaved() {
    //alert user that data has been saved for offline
    const lastUpdated = this.getLastUpdated();
    let text = "Server data was saved for offline mode";
    if (lastUpdated) { text += ' on ' + lastUpdated;}
    this.popup(text, "#388E3C")
  }

   messageSaveError() {
    //alert user that data couldn't be saved offline
    this.popup("Server data couldn't be saved offline :(", "#C62828")
  }

  getLastUpdated() {
    return localStorage.getItem('lastUpdated');
  }

  setLastUpdated(date) {
    localStorage.setItem('lastUpdated', date);
  }

  popup(text, color){

    var newItem = document.createElement('div');
    newItem.id = "popup";
    newItem.innerHTML = '<p class="dateWritten">' + text + '</p>';
    newItem.style.backgroundColor = color;

    this.shadowRoot.appendChild(newItem); // Add the new item to the shadowroot

    // Remove (and fade out) popup after a little while
    setTimeout(() => {
      newItem.classList.add("fadeout");
      setTimeout(() => {
        newItem.remove();
      }, 500);
    }, 4000);
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
            margin: 0 auto;
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
          #back-btn{
            position: fixed;
            background-color: #b71c1c;
            border-radius: 50%;
            height: 60px;
            width: 60px;
            bottom: 25px;
            left: 25px;
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: 2px 2px 20px rgba(0,0,0,0.4);
            opacity: 0;
            transition: opacity 200ms ease-in-out;
          }
          #back-btn.open{
            opacity: 1;
            transition: opacity 250ms ease-in-out 125ms;
          }
          #back-btn i{
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
          .small-icon{
            font-size: 13pt !important;
            margin-right: 5px;
          }
      </style>

      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">

      <template is="dom-repeat" items="{{shows}}">
        <div class="card" on-click="showDetails">
          <p class="date-written">[[getDay(item.episodereleasedate)]]</p>
              <p class="serie-name">[[item.seriename]]</p>
              <div class="divider"></div>
              <div class="row">
                <div>
                  <i class="material-icons small-icon">calendar_today</i>
                  <p class="date go-up">[[formatDate(item.episodereleasedate)]]</p>
                </div>
                <div>
                  <i class="material-icons small-icon">access_time</i>
                  <p class="go-up">[[item.episodereleasetime]]</p>
                </div>
                <div>
                  <p class="se">S[[item.seasonnumber]]E[[item.episodenumber]]</p>
                </div>
              </div>
              </div>
        </div>
      </template>
          
     <div id="show-details">
      <template is="dom-if" if="{{showInfo.serieid}}">

          <div id="header-img">
              <img src="https://www.thetvdb.com/banners/fanart/original/[[showInfo.serieid]]-1.jpg" alt="Serie banner">
          </div>

          <div id="show-details-body" class="card">
            <p class="date-written">[[getDay(showInfo.episodereleasedate)]]</p>
            <p class="serie-name">[[showInfo.seriename]]</p>
            <div class="divider"></div>
            <div class="row">
                <div>
                <i class="material-icons small-icon">calendar_today</i>
                  <p class="date">[[formatDate(showInfo.episodereleasedate)]]</p>
                </div>
                <div>
                  <i class="material-icons small-icon">access_time</i>
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

      <div id="back-btn" on-click="showDetails">
        <i class="material-icons">arrow_back</i>
      </div>
    `;
  }

  showDetails(e) {
    // Set current show to the clicked one
    let container = this.shadowRoot.getElementById("show-details");
    let backbtn = this.shadowRoot.getElementById("back-btn");
    if(!this.detailesOpened){
      this.showInfo = e.model.item;
      container.classList.add("open");
      backbtn.classList.add("open");
      this.detailesOpened = true;
    }else{
      container.classList.remove("open");
      backbtn.classList.remove("open");
      this.detailesOpened = false;
    }
  }

}
customElements.define('my-feed', myFeed);