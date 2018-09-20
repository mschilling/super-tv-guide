/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { setPassiveTouchGestures, setRootPath } from '@polymer/polymer/lib/utils/settings.js';
import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-header-layout/app-header-layout.js';
import '@polymer/app-layout/app-scroll-effects/app-scroll-effects.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/app-route/app-location.js';
import '@polymer/app-route/app-route.js';
import '@polymer/iron-pages/iron-pages.js';
import '@polymer/iron-selector/iron-selector.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import './js/my-icons.js';

// Gesture events like tap and track generated from touch will not be
// preventable, allowing for better scrolling performance.
setPassiveTouchGestures(true);

// Set Polymer's root path to the same value we passed to our service worker
// in `index.html`.
setRootPath(MyAppGlobals.rootPath);

class MyApp extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          --app-primary-color: #B71C1C;
          --app-secondary-color: white;
          display: block;
        }

        app-drawer-layout:not([narrow]) [drawer-toggle] {
          display: none;
        }

        app-header {
          color: #fff;
          background-color: var(--app-primary-color);
        }

        app-header paper-icon-button {
          --paper-icon-button-ink-color: white;
        }

        .drawer-list {
          margin: 0 20px;
        }

        .drawer-list a {
          display: block;
          padding: 0 16px;
          text-decoration: none;
          color: var(--app-secondary-color);
          line-height: 40px;
          font-size: 14pt;
        }
        .drawer-list a:focus{
          outline: none;
        }

        .drawer-list a.iron-selected {
          color: white;
          font-weight: bold;
        }

        app-drawer {
          --app-drawer-scrim-background: rgba(0, 0, 0, 0.5);
          --app-drawer-content-container: {
            background-color: var(--app-primary-color);
          }
        }

        app-toolbar {
          color: white;
        }

        iron-pages {
          width: 600px;
          max-width: 100%;
          min-height: 500px;
        }
        #flex-container{
          float: left;
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .page{
          float: left;
          width: 100%;
          position: relative;
          overflow: hidden;
        }

        #loader{
          position: absolute;
          top: 64px;
          width: 100%;
          height: 6px;
          background-color: #eeeeee;
          overflow-x: hidden;
        }
        #loader-inner {
          float: left;
          width: 100%;
          height: 100%;
        }
        #loader-inner::before {
          content: "";
          display: inline;
          position: absolute;
          width: 50%;
          left: -50%;
          height: 100%;
          text-align: center;
          background-color: #d03838;
        }
        #loader.anim > #loader-inner::before{
          animation: loading 1s linear infinite;
        }
        @keyframes loading {
            from {left: -50%;}
            to {left: 100%;}
        }

      </style>

      <app-location route="{{route}}" url-space-regex="^[[rootPath]]">
      </app-location>

      <app-route route="{{route}}" pattern="[[rootPath]]:page" data="{{routeData}}" tail="{{subroute}}">
      </app-route>

      <app-drawer-layout fullbleed="" force-narrow narrow="{{narrow}}">
        <!-- Drawer content -->
        <app-drawer id="drawer" slot="drawer" swipe-open="[[narrow]]">
          <app-toolbar>Menu</app-toolbar>
          <iron-selector selected="[[page]]" attr-for-selected="name" class="drawer-list" role="navigation">
            <a name="feed" href="[[rootPath]]feed">Feed</a>
            <a name="account" href="[[rootPath]]account">Account</a>
          </iron-selector>
        </app-drawer>

        <!-- Main content -->
        <app-header-layout has-scrolling-region="">

          <app-header slot="header" fixed condenses="" reveals="" effects="waterfall">
            <app-toolbar>
              <template is="dom-if" if="[[!login]]">
                <paper-icon-button icon="my-icons:menu" drawer-toggle=""></paper-icon-button>
              </template>
              <div main-title="">Super TV Guide</div>
            </app-toolbar>
          </app-header>

          <div id="loader" class="anim">
            <div id="loader-inner"></div>
          </div>

          <div id='flex-container'>
            <iron-pages selected="[[page]]" attr-for-selected="name" role="main">
                <my-feed class="page" name="feed"></my-feed>
                <my-watchlist class="page" name="watchlist"></my-watchlist>
                <my-login class="page" name="login"></my-login>
                <my-account class="page" name="account"></my-account>
                <my-view404 class="page" name="view404"></my-view404>
            </iron-pages>
          </div>

        </app-header-layout>
      </app-drawer-layout>
    `;
  }

  static get properties() {
    return {
      page: {
        type: String,
        reflectToAttribute: true,
        observer: '_pageChanged'
      },
      routeData: Object,
      subroute: Object,
      user: {
        type: Object,
        value: {},
      },
    };
  }

  static get observers() {
    return [
      '_routePageChanged(routeData.page)'
    ];
  }

  connectedCallback() {
    super.connectedCallback();
    firebase.auth().onAuthStateChanged((currentUser) => {
      if (currentUser) {
        // <user is signed in>
        this.user = currentUser;
      }else{
        this.user = {};
        this.page = 'login';
      }
    })
  }

  _routePageChanged(page) {
    page = page != '' ? page : 'feed';
    switch (page) {
    case 'feed':
      this.page = page;
      break;
    case 'login':
      this.page = page;
      break;
    case 'watchlist':
      this.page = page;
      break;
    case 'account':
      this.page = page;
    break;
    default:
      this.page = 'feed';
    }

    // Close a non-persistent drawer when the page & route are changed.
    if (!this.$.drawer.persistent) {
      this.$.drawer.close();
    }
  }

  _pageChanged(page) {
    // Import the page component on demand.
    //
    // Note: `polymer build` doesn't like string concatenation in the import
    // statement, so break it up.
    switch (page) {
      case 'feed':
        this.login = false;
        import('./views/my-feed.js');
        break;
      case 'watchlist':
      this.login = false;
        import('./views/my-watchlist.js');
        break;
      case 'account':
        this.login = false;
        import('./views/my-account.js');
      break;
      case 'login':
        this.login = true;
        import('./views/my-login.js');
      break;
    }
    window.history.pushState('forward', null, `/${this.page}`);
  }
}

window.customElements.define('my-app', MyApp);
