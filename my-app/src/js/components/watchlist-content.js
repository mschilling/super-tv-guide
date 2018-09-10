import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '../../shared-styles.js';

// Import IDB
import '../idb-promised.js';

// Class watchlistContent (custom element) used to display a user's watchlist items
class watchlistContent extends PolymerElement{

  static get template() { 
    return html`
        <style include="shared-styles">
            :host {
              display: block;
            }
            p{
              margin: 0;
            }
            .dateWritten{
              margin-bottom: 2px;
              font-size: 10pt;
            }
            .serieName{
              color: #B71C1C;
              font-weight: 600;
            }
            .row{
              margin-top: 10px;
              float: left;
              width: 100%;
              display: flex;
              justify-content: space-between;
            }
            .row p{
              float: left;
              color: #3B3B3B;
              margin-top: -1px;
            }
            .card{
              float: left;
              width: calc(100% - 72px);
              margin-bottom: 10px;
              margin-top: 10px;
            }
            .divider{
              margin-top: 5px;
              float: left;
              width: 100%;
              height: 1px;
              background-color: #f2f2f2;
            }
            .icon{
              width: 15px;
              margin-right: 5px;
              margin-top: 2px;
              float: left;
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
        </style>
    `;
  }

  constructor() {
    super();
    watchlistContent.dbPromise = this.createIDB();
    this.loadContentNetworkFirst();
  }

  /* Make sure network content is loaded first,
     If network is not available: load local content.
  */ 
  loadContentNetworkFirst() { 
    this.getShows()
    .then(dataFromNetwork => {
      this.saveLocally(dataFromNetwork)
      .then(() => {
        this.updateUI(dataFromNetwork);
        this.setLastUpdated(new Date());
        this.messageDataSaved();
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
          this.updateUI(offlineData); 
        }
      });
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

  /* Call API and return JSON data of the shows */
  getShows() {

    var request = 'https://us-central1-super-tv-guide.cloudfunctions.net/api/api/testfeed';
   
    return fetch(request).then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    });
  }

  /* Update the UI */
  updateUI(items) {
    // Loop through the items send with the parameter
    items.forEach(item => {
      var newItem = document.createElement('div');
      newItem.innerHTML = `
                          <a onclick="showDetails(${item.serieid})">
                          <div class="card">
                            <p class="dateWritten">${this.getDay(item.episodereleasedate)}</p>
                            <p class="serieName"> ${item.seriename} <p>
                            <div class="divider"></div>
                            <div class="row">
                              <span>
                                <img src="images/icons/calendar.svg" alt="Calendar icon" class="icon">
                                <p class="date">${this.formatDate(item.episodereleasedate)}</p>
                              </span>
                              <span>
                                <img src="images/icons/clock.svg" alt="Clock icon" class="icon icon-clock">
                                <p>${item.episodereleasetime}</p>
                              </span>
                              <p class="se">S${item.seasonnumber}E${item.episodenumber}</p>
                            </div>
                          </div>
                          </a>
                          `;
      this.shadowRoot.appendChild(newItem); // Add the new item to the shadowroot
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
        console.log('Making a new object store');
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
    return watchlistContent.dbPromise.then(db => {
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
    return watchlistContent.dbPromise.then(db => {
      const tx = db.transaction('watchlist', 'readonly');
      const store = tx.objectStore('watchlist');
      return store.getAll();
    });
  }

  /* Clear the database to prevent using too much memory */
  clearDB(){
    if (!('indexedDB' in window)) {return null;}
      return watchlistContent.dbPromise.then(db => {
        const tx = db.transaction('watchlist', 'readwrite');
        const store = tx.objectStore('watchlist');
        return store.clear()
        .catch(() => {
          tx.abort();
          throw Error('Objectstore could not be cleared');
        });
      });
  }

  

}

  // Define the class watchlistContent as custom element
  window.customElements.define('watchlist-content', watchlistContent);