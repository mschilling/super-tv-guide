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
        </style>
    `;
  }

  static get properties() {
    return {
      shows: {
        type: Object
      }
    }
  }

  constructor() {
    super();
    watchlistContent.dbPromise = this.createIDB();
    this.loadContentNetworkFirst();
  }

  /* Make sure network content is loaded first,
     If network is not available: load local content.
  */ 
  loadContentNetworkFirst() { // Not done yet
    this.getShows()
    .then(dataFromNetwork => {
      this.saveLocally(dataFromNetwork)
      .then(() => {
        this.updateUI(dataFromNetwork); 
        // TODO: Give feedback that data is saved
      }).catch(err => {
        // TODO: Give feedback that data couldn't be saved
        console.warn(err);
      });
    }).catch(err => {
      console.log('Network requests have failed, this is expected if offline');
      this.loadLocally()
      .then(offlineData => {
        if (!offlineData.length) {
          // TODO: Give feedback that no offline data has been found
        } else {
          // Offline
          this.updateUI(offlineData); 
          // TODO: Give feedback that UI has been updated with local data
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

  /* Update the UI */
  updateUI(items) {
    // Loop through the items send with the parameter
    items.forEach(item => {
      var newItem = document.createElement('div');
      newItem.classList.add("card");
      newItem.innerHTML = '<div>Title: ' + item.seriename + '</div>' +
                          '<div>S' + item.seasonnumber + 'E' + item.episodenumber + '</div>';
      this.shadowRoot.appendChild(newItem); // Add the new item to the shadowroot
    });
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