// Import the Polymer library and the html helper function
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

// Import template repeater
import '@polymer/polymer/lib/elements/dom-repeat.js';

import '../style/shared-styles.js';

import { Icon } from "@material/mwc-icon"

import '@polymer/paper-toast/paper-toast.js';
import '@polymer/paper-button/paper-button.js';


// Import IDB
import '../js/idb-promised.js';

class myFeed extends PolymerElement {

  constructor() {
    super();
    myFeed.dbPromise = this.createIDB();
    this.loadContentCacheFirst();
    this.addLoading();
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
        value() {
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
      if (!offlineData.length) {
        this.loadFromNetwork();
      } else {
        this.shows = offlineData;
        this.rendered = true;
        this.loadFromNetwork();
      }
    }).catch(err => {
      console.warn(err);
      this.loadFromNetwork();
    })
  }

  async loadFromNetwork() {
    let user = await this.getUser();
    this.getShows(user)
      .then(dataFromNetwork => {
        this.giveResponse(dataFromNetwork);
        this.saveLocally(dataFromNetwork)
          .then(() => {
            this.shows = dataFromNetwork;
            this.loadingDone();
          }).catch(err => {
            console.log("Could not save data. This is expected if the user has no series or no data could be retrieved.");
            this.loadingDone();
          });
      }).catch(err => {
        if (!this.shows.length) {
          this.toast('no-data');
          this.loadingDone();
          this.noData = true;
        } else {
          this.toast('offline');
          this.loadingDone();
        }
      })
  }

  getUser() {
    return new Promise(resolve => {
      firebase.auth().onAuthStateChanged((currentUser) => {
        if (currentUser) {
          resolve(currentUser);
        }
      })
    })
  }

  addLoading() {
    document.querySelectorAll('my-app')[0].shadowRoot.getElementById("loader").classList.add('anim');
  }

  loadingDone() {
    this.rendered = true;
    let loader = document.querySelectorAll('my-app')[0].shadowRoot.getElementById("loader");
    loader.addEventListener('animationiteration', function () {
      loader.classList.remove('anim');
    })
    loader.addEventListener('webkitAnimationIteration', function () {
      loader.classList.remove('anim');
    })
  }

  /* Call API and return JSON data of the shows */
  getShows(user) {
    if (!user) {
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
  getDay(date) {

    // Split date and convert to date object
    var parts = date.split('-');
    // Please pay attention to the month (parts[1]); JavaScript counts months from 0:
    // January - 0, February - 1, etc.
    var convertedDate = new Date(parts[0], parts[1] - 1, parts[2]);

    var date_today = new Date(); // Current date (today)

    var date_tomorrow = new Date(date_today.getFullYear(), date_today.getMonth(), date_today.getDate() + 1); // Date of tomorrow

    // Check the date
    if (convertedDate.getFullYear() == date_today.getFullYear() && convertedDate.getMonth() == date_today.getMonth() && convertedDate.getDate() == date_today.getDate()) {
      return 'Today';
    } else if (convertedDate.getFullYear() == date_tomorrow.getFullYear() && convertedDate.getMonth() == date_tomorrow.getMonth() && convertedDate.getDate() == date_tomorrow.getDate()) {
      return 'Tomorrow';
    } else if (convertedDate < date_today) {
      return 'Aired'; // If show is already aired (input date < current date)
    } else {
      return 'Upcoming'; // Show is not today or tomorrow
    }
  }

  /* Format the date into date/month format */
  formatDate(date) {
    var parts = date.split('-');
    return parts[2] + '/' + parts[1];
  }

  /* Create IndexedDB */
  createIDB() {
    // Make new db if not existent
    return idb.open('super-tv-guide', 1, function (upgradeDb) {
      if (!upgradeDb.objectStoreNames.contains('watchlist')) {
        upgradeDb.createObjectStore('watchlist', {
          keyPath: 'id',
          autoIncrement: true
        });
      }
    });
  }

  /* Save the watchlist items locally */
  saveLocally(data) {
    if (!('indexedDB' in window)) { return null; }
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
  loadLocally() {
    if (!('indexedDB' in window)) { return null; }
    return myFeed.dbPromise.then(db => {
      const tx = db.transaction('watchlist', 'readonly');
      const store = tx.objectStore('watchlist');
      return store.getAll();
    });
  }

  /* Clear the database to prevent using too much memory */
  clearDB() {
    if (!('indexedDB' in window)) { return null; }
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

  async giveResponse(response) {
    if (response.status) {
      switch (response.status) {
        case '404-1':
          // User does not have any series
          this.noSeries = true;
          this.toast('no-series');
          break;
        case '404-2':
          // No upcoming shows currently
          this.toast('no-upcoming');
          break;
        default:
          // Something else went wrong
          this.toast('something-wrong');
      }
    } else if (response[0].seriename) {
      // Seems like everything went OK
    } else {
      // Error somewhere else?
      this.toast('something-wrong');
    }
  }

  toast(item) {
    this.shadowRoot.getElementById(`toast-${item}`).open();
  }

  static get template() {
    return html`
        <style include="shared-styles">
          :host {
            display: block;
          }
      </style>

      <link rel="stylesheet" href="/src/style/skeleton.css">
      <link rel="stylesheet" href="/src/style/feed-style.css">

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

            <div class="header-img">
              <img src="https://www.thetvdb.com/banners/fanart/original/[[item.serieid]]-2.jpg" alt="Serie banner">
            </div>

            <div class="basic-info">
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

              <div class="description">
                  <div class="divider"></div>
                  <p class="episode-title">[[item.episodename]]</p>
                  <p>[[item.episodedescription]]</p>
              </div>

            </div>

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

      <!-- Toast messages -->
      <paper-toast id="toast-offline" class="fit-bottom toast-warning" duration="4000" text="You're offline and seeing local data."></paper-toast>
        
      <paper-toast id="toast-no-upcoming" class="fit-bottom toast-warning" duration="4000" text="There are currently no upcoming shows for you :(. Try adding a few more shows! :)"></paper-toast>

      <paper-toast id="toast-no-series" class="fit-bottom toast-warning" duration="5000" text="You don't have any series :( Try adding a few by clicking the button in the right bottom corner."></paper-toast>
      
      <paper-toast id="toast-no-data" class="fit-bottom toast-error" duration="0" text="You're offline and don't have any local data. Try refreshing when you've got an internet connection.">
        <paper-button class="error" onclick="document.querySelectorAll('my-app')[0].shadowRoot.querySelectorAll('my-feed')[0].shadowRoot.getElementById('toast-no-data').close()">Close</paper-button>
      </paper-toast>

      <paper-toast id="toast-something-wrong" class="fit-bottom toast-error" duration="5000" text="Something went wrong! :O Please try refreshing after a few seconds."></paper-toast>

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

  showDetails(e) {
    let myFeed = document.querySelectorAll('my-app')[0].shadowRoot.querySelectorAll('my-feed')[0].shadowRoot;
    let card = e.currentTarget;
    if(card.classList.contains('open')){
      let cards = myFeed.querySelectorAll('.card');
      cards.forEach(function(i) {
        i.classList.remove('open');
      });
    }else{
      let cards = myFeed.querySelectorAll('.card');
      cards.forEach(function(i) {
        i.classList.remove('open');
      });
      card.classList.add('open');
    }
  }

}
customElements.define('my-feed', myFeed);
