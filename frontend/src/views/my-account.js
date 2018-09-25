import { LitElement, html } from '../../node_modules/@polymer/lit-element';

import { styles } from '../style/main-style.js';

class MyAccount extends LitElement {
  render() {
    return html`
      ${styles}
      <style>
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

       ${this.currentUser
          ? html`<div class="card">
                  <div class="center">
                    <img class="profile-img" src="${this.currentUser.photoURL}" alt="Profile picture of ${this.currentUser.displayName}">
                  </div>
                  <div class="center">
                    <p class="user-name">${this.currentUser.displayName}</p>
                  </div>
                  <div class="center">
                    <paper-button class="custom" @click="${() => this._signOut()}">Sign out</paper-button>
                    <custom-style>
                      <style>
                        paper-button.custom {
                          color: #B71C1C;
                          --paper-button-ink-color: #f3f3f3;
                        }
                      </style>
                    </custom-style>
                  </div>
                </div>`
          : html``
       }
 
    `;
  }

  constructor() {
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

  addLoading() {
    document.querySelectorAll('my-app')[0].shadowRoot.getElementById("loader").classList.add('anim');
  }

  loadingDone() {
    let loader = document.querySelectorAll('my-app')[0].shadowRoot.getElementById("loader");
    loader.addEventListener('animationiteration', function () {
      loader.classList.remove('anim');
    })
    loader.addEventListener('webkitAnimationIteration', function () {
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

  _signOut() {
    firebase.auth().signOut().then(function () {
      // Sign-out successful.
    }).catch(function (error) {
      // An error happened.
    });
  }


}

window.customElements.define('my-account', MyAccount);
