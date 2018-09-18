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

import '../style/shared-styles.js';

import {Icon} from "@material/mwc-icon";

import '@polymer/paper-toast/paper-toast.js';
import '@polymer/paper-button/paper-button.js';

class MyWatchlist extends PolymerElement {
  static get template() {
    return html`
      <style include="shared-styles">
        :host {
          display: block;
        }
        h2{
            color: #212121;
            font-size: 16px;
        }
        .button{
            --mdc-theme-on-primary: white;
            --mdc-theme-primary: #B71C1C;
            --mdc-theme-on-secondary: white;
            --mdc-theme-secondary: #B71C1C;
        }
        .center{
            width: 100%;
            float: left;
            display: flex;
            justify-content: center;
        }
        .card{
            float: left;
            width: calc(100% - 52px);
        }
        .form-group{
            float: left;
            width: 100%;
        }
        input{
            float: left;
            width: calc(100% - 67px);
            padding: 7px;
            padding-bottom: 6px;
            padding-top: 8px;
            border: 1px solid #eeeeee;
            border-right: none;
            border-top-left-radius: 5px;
            border-bottom-left-radius: 5px;
        }
        input:focus{
            outline: none;
        }
        .form-group a{
            background-color: #B71C1C;
            color: white;
            float: left;
            width: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 30px;
            border-top-right-radius: 5px;
            border: 1px solid #eeeeee;
            border-bottom-right-radius: 5px;
        }
        a{
            color: #757575;
        }
        .popular-item{
            color: #363636;
        }
        .popular-item p{
            float: left
            width: calc(100% - 30px);
        }
        .popular-item a{
            width: 30px;
            float: left;
        }
        .spacer{
            float: left;
            width: 100%;
            height: 15px;
        }
      </style>
        <div class="spacer"></div>
        <div class="card">
            <h2>Add watchlist item</h2>
            <p>Search on <a href="www.thetvdb.com">TVDB</a> for the serie ID, and enter it below. Or choose one of the most popular series below.</p>
            <form id="form" action="?">
               <div class="form-group">
                <input id="serieid" type="text" name="serieid" placeholder="Serie ID">
                <a on-click="_addSerie">
                    <mwc-icon class="arrow_back" >add</mwc-icon>
                </a>
               </div>
            </form> 
        </div>

        <div class="card">
            <h2>Popular shows</h2>
            <p>Click on an item to add it to your feed.</p>
            <template is="dom-repeat" items="{{shows}}">
                <div class="popular-item" on-click="_addSerieWithId">
                <a><mwc-icon class="arrow_back" >add</mwc-icon></a>
                <p>[[item.name]]</p>
                </div>
            </template>
        </div>

        <!-- Toast messages -->
      <paper-toast id="toast-incorrect-serie" class="fit-bottom toast-error" duration="3000" text="Serie ID incorrect!"></paper-toast>
        
      <paper-toast id="toast-empty" class="fit-bottom toast-warning" duration="3000" text="Please fill in the field."></paper-toast>

      <paper-toast id="toast-couldnt-add" class="fit-bottom toast-error" duration="3000" text="Couldn't add serie to your watchlist."></paper-toast>
      
      <paper-toast id="toast-no-popular" class="fit-bottom toast-warning" duration="3000" text="Couldn't retrieve popular series."></paper-toast>

      <paper-toast id="toast-added" class="fit-bottom toast-succes" duration="3000" text="Serie added to your watchlist!"></paper-toast>

      <custom-style><style is="custom-style">
        .toast-error {
          --paper-toast-background-color: #B71C1C;
          --paper-toast-color: white;
        }
        .toast-warning{
          --paper-toast-background-color: #FFB300;
          --paper-toast-color: white;
        }
        .toast-succes{
            --paper-toast-background-color: #43A047;
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
  constructor(){
    super();
    this.loadFromNetwork();
  }

  static get properties() {
    return {
      shows: {
        type: Array,
        value() {
          return [];
        }
      },
      user: {
          type: Object,
          value() {
              return null;
          }
      }
    }
}

  getUser(){
    if(this.user){
        return this.user;
    }
    return new Promise(resolve => {
      firebase.auth().onAuthStateChanged((currentUser) => {
        if (currentUser) {
            this.user = currentUser;
            resolve(currentUser);
        }
      })
    })
  }

  async loadFromNetwork(){
    this.getPopularShows().then(shows => {
        this.shows = shows;
    })
  }

  getPopularShows() {
    var request = `https://us-central1-super-tv-guide.cloudfunctions.net/api/api/popular`;
    return fetch(request).then(response => {
      if (!response.ok) {
        this.toast('no-popular')
      }
      return response.json();
    });
    
  }

  async _addSerie(){
    let user = await this.getUser();
    let id = this.shadowRoot.getElementById("serieid").value;
    if(!id){
        this.toast('empty');
    }else{
        var request = `https://us-central1-super-tv-guide.cloudfunctions.net/api/api/user/${user.uid}/add/${id}`;
    
        return fetch(request).then(response => {
            if (!response.ok) {
                this.toast('couldnt-add');
            }
            this.toast('added');
            return response.json();
        });
    }
  }

  async _addSerieWithId(e){
    let id = e.model.item.id;
    let user = await this.getUser();
    if(!id){
        console.log('Empty ID');
    }else{
        var request = `https://us-central1-super-tv-guide.cloudfunctions.net/api/api/user/${user.uid}/add/${id}`;
    
        return fetch(request).then(response => {
        if (!response.ok) {
            this.toast('couldnt-add');
        }
        this.toast('added');
        return response.json();
        });
    }
  }

  toast(item){
    this.shadowRoot.getElementById(`toast-${item}`).open();
  }

}

window.customElements.define('my-watchlist', MyWatchlist);
