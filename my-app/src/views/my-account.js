import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import {Button} from "@material/mwc-button";

import '../style/shared-styles.js';

class MyAccount extends PolymerElement {
  static get template() {
    return html`
      <style include="shared-styles">
        :host {
          display: block;
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

      <div id="loader" class="anim"></div>
  
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
            <mwc-button class="button" on-click="_signOut" >Sign Out</mwc-button>
          </div>
        </div>
      </template>
 
    `;
  }

  constructor(){
    super();
  }

  static get properties() {
    return {
      currentUser: {
        type: Object
      }
    };
  }

  loadingDone(){ 
    let loader = this.shadowRoot.getElementById("loader");
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
