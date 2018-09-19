import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-button/paper-button.js';

import '../style/shared-styles.js';

class MyAccount extends PolymerElement {
  static get template() {
    return html`
      <style include="shared-styles">
        :host {
          display: block;
        }
        .button{
          --mdc-theme-on-primary: white;
          --mdc-theme-primary: #B71C1C;
          --mdc-theme-on-secondary: white;
          --mdc-theme-secondary: #B71C1C;
        }
        .profile-img{
          border-radius: 50%;
          width: 75px;
          height: 75px;
          object-fit: cover;
          display: block;
          clear: both;
        }
        .center{
          width: 100%;
          float: left;
          display: flex;
          justify-content: center;
        }
        .user-name{
          float: left;
          text-align: center;
        }
        .card{
          float: left;
          width: calc(100% - 52px);
        }
        .spacer{
          float: left;
          width: 100%;
          height: 15px;
      }
      </style>
  
      <div class="spacer"></div>

      <template is="dom-if" if="{{currentUser}}">
        <div class="card">
          <div class="center">
            <img class="profile-img" src="{{currentUser.photoURL}}" alt="Profile picture of {{currentUser.displayName}}">
          </div>
          <div class="center">
            <p class="user-name">{{currentUser.displayName}}</p>
          </div>
          <div class="center">
            <paper-button class="custom" on-click="_signOut">Sign out</paper-button>
            <custom-style>
              <style>
                paper-button.custom {
                  color: #B71C1C;
                  --paper-button-ink-color: #f3f3f3;
                }
              </style>
            </custom-style>
          </div>
        </div>
      </template>
 
    `;
  }

  constructor(){
    super();
    this.addLoading();
  }

  static get properties() {
    return {
      currentUser: {
        type: Object
      }
    };
  }

  addLoading(){
    document.querySelectorAll('my-app')[0].shadowRoot.getElementById("loader").classList.add('anim');
  }

  loadingDone(){ 
    let loader = document.querySelectorAll('my-app')[0].shadowRoot.getElementById("loader");
    loader.addEventListener('animationiteration', function(){
      loader.classList.remove('anim');
    })
    loader.addEventListener('webkitAnimationIteration', function(){
      loader.classList.remove('anim');
    })
  }

  connectedCallback() {
    super.connectedCallback();
    firebase.auth().onAuthStateChanged((currentUser) => {
      if (currentUser) {
        this.currentUser = currentUser;
        this.loadingDone();
      }
    });
  }

  _signOut(){
    firebase.auth().signOut().then(function() {
      // Sign-out successful.
    }).catch(function(error) {
      // An error happened.
    });
  }


}

window.customElements.define('my-account', MyAccount);
