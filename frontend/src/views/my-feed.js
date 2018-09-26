import { LitElement, html } from '../../node_modules/@polymer/lit-element';

import { styles } from '../style/main-style.js';
import { feedStyle } from '../style/feed-style.js';

import { Icon } from "@material/mwc-icon";
 
import '../../node_modules/@polymer/paper-toast/paper-toast.js';


// Import IDB
import '../js/idb-promised.js';

class myFeed extends LitElement {

  constructor() {
    super();
    this.rendered = false;
    this.addLoading();
    myFeed.dbPromise = this.createIDB();
    this.loadContentCacheFirst();
    myFeed.cards = [];
    this.loader = document.querySelectorAll('my-app')[0].shadowRoot.getElementById("loader");
    this.refreshed = false;
    this.pStart = { x: 0, y: 0 };
    this.pStop = { x: 0, y: 0 };
  }

  static get properties() {
    return {
      cards: {
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

  connectedCallback() {
    super.connectedCallback();
    firebase.auth().getRedirectResult().then(function (result) {
      if (result.credential) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        let token = result.credential.accessToken;
        localStorage.setItem('access_token', token);
      }
    }).catch(function (error) {
      console.log('Error getting access_token');
    });
    // Bind event listeners for refresh handling
    window.addEventListener('touchstart', this._swipeStart.bind(this));
    window.addEventListener('touchend', this._swipeEnd.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('touchstart', this._swipeStart);
    window.removeEventListener('touchend', this._swipeEnd);
  }

  _swipeStart(event) {
    if (typeof event['targetTouches'] !== "undefined") {
      var touch = event.targetTouches[0];
      this.pStart.x = touch.screenX;
      this.pStart.y = touch.screenY;
    } else {
      this.pStart.x = event.screenX;
      this.pStart.y = event.screenY;
    }
  }

  _swipeEnd(event) {
    if (typeof event['changedTouches'] !== "undefined") {
      var touch = event.changedTouches[0];
      this.pStop.x = touch.screenX;
      this.pStop.y = touch.screenY;
    } else {
      this.pStop.x = event.screenX;
      this.pStop.y = event.screenY;
    }

    this.swipeCheck();
  }

  swipeCheck() { 
    var changeY = this.pStart.y - this.pStop.y;
    var changeX = this.pStart.x - this.pStop.x;
    if (this.isPullDown(changeY, changeX) && (window.location.href.endsWith('feed'))) {
      document.body.classList.add('refreshing')
      this.addLoading();
      this.refreshed = true;
      this.loadContentCacheFirst();
    }
  }

  isPullDown(dY, dX) {
    // methods of checking slope, length, direction of line created by swipe action 
    return dY < 0 && (
      (Math.abs(dX) <= 100 && Math.abs(dY) >= 300)
      || (Math.abs(dX) / Math.abs(dY) <= 0.3 && dY >= 60)
    );
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
        this.updateFeed(offlineData)
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
            this.updateFeed(dataFromNetwork);
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

  updateFeed(items) {
    myFeed.cards = []; 
    for(let i = 0; i < items.length; i++){
      myFeed.cards.push(
        html`
        <div class="card feed-item" @click="${(e) => this._showDetails(e)}">

          <div class="header-img">
            <img class="lazy" src="/images/placeholder.jpg" data-src="https://www.thetvdb.com/banners/fanart/original/${items[i].serieid}-1.jpg" alt="Serie Banner">
          </div>

          <div class="basic-info">
            <p class="date-written">${this.getDay(items[i].episodereleasedate)}</p>
            <p class="serie-name">${items[i].seriename}</p>
            <div class="divider"></div>
            <div class="row">
              <div>
                <mwc-icon>calendar_today</mwc-icon>
                <p class="date go-up">${this.formatDate(items[i].episodereleasedate)}</p>
              </div>
              <div>
                <mwc-icon>access_time</mwc-icon>
                <p class="go-up">${items[i].episodereleasetime}</p>
              </div>
              <div>
                <p class="se">S${items[i].seasonnumber}E${items[i].episodenumber}</p>
              </div>
            </div>
          </div>

          <div class="description">
            <div class="divider"></div>
            <p class="episode-title">${items[i].episodename}</p>
            <p>${items[i].episodedescription}</p>
            <a href="${items[i].calendarlink}" target="_blank" rel="noopener" class="add-calendar">
              <mwc-icon>add</mwc-icon>
              <p>Add to Google Calendar</p>
            </a>
          </div>

        </div>
        `
      )
    };
  }

  loadingDone() {
    this.rendered = true;
    this.loader.addEventListener('animationiteration',  this._handleAnimationStop.bind(this));
    this.loader.addEventListener('webkitAnimationIteration',  this._handleAnimationStop.bind(this));
    let body = document.querySelector('body');
    if (body.classList.contains('refreshing')) {
      body.classList.remove('refreshing');
    }
    if(this.refreshed){
      this.refreshed = false;
      this.toast('updated');
    }
  }

  _handleAnimationStop() {
    this.loader.classList.remove('anim');
    // Hack to remove the event listener,
    // by replacing the element with itself.
    let old_element = this.loader;
    let new_element = old_element.cloneNode(true);
    old_element.parentNode.replaceChild(new_element, old_element);
    this.loader = new_element;
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

  render() {
    return html`
      ${styles}
      ${feedStyle}

      ${this.rendered 
        ? html`<div id="cards-container">
                  ${myFeed.cards}
              </div>`
        : html`<div id="cards-container">
                <div class="card feed-item skeleton"></div>
                <div class="card feed-item skeleton"></div>
                <div class="card feed-item skeleton"></div>
                <div class="card feed-item skeleton"></div>
                <div class="card feed-item skeleton"></div>
              </div>`
        }

       ${this.noData
          ? html`<div class="error-container">
                  <mwc-icon>error_outline</mwc-icon>
                </div>`
          : html``
       }

       ${this.noSeries
          ? html`<div class="error-container">
                    <mwc-icon>sentiment_dissatisfied</mwc-icon>
                </div>`
          : html``
       }

      <a id="add-btn" class="floating-btn" href="/watchlist">
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

      <paper-toast id="toast-updated" class="fit-bottom toast-succes" duration="3000" text="Data has been updated :)"></paper-toast>

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
        .toast-succes{
          --paper-toast-background-color: #43A047;
          -paper-toast-color: white;
        }
      </style></custom-style>
    `;
  }

  _showDetails(e) {
    let myFeed = document.querySelectorAll('my-app')[0].shadowRoot.querySelectorAll('my-feed')[0].shadowRoot;
    let card = e.currentTarget;
    if (card.classList.contains('open')) {
      let cards = myFeed.querySelectorAll('.card');
      cards.forEach(function (i) {
        i.classList.remove('open');
      });
    } else {
      let cards = myFeed.querySelectorAll('.card');
      cards.forEach(function (i) {
        i.classList.remove('open');
      });
      card.classList.add('open');
      if(card.querySelector('.lazy')){
        let lazyImage = card.querySelector('.lazy');
        lazyImage.src = lazyImage.dataset.src;
        lazyImage.classList.remove("lazy");
      }
    }
  }

}
customElements.define('my-feed', myFeed);
