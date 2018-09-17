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
      </style>
        <div class="card">
            <h2>Add watchlist item</h2>
            <form id="form" action="?">
               <div class="form-group">
                <input id="serieid" type="text" name="serieid" placeholder="Serie ID">
                <a on-click="_addSerie">
                    <mwc-icon class="arrow_back" >add</mwc-icon>
                </a>
               </div>
            </form> 
        </div>
    `;
  }
  constructor(){
    super();
  }

  getUser(){
    return new Promise(resolve => {
      firebase.auth().onAuthStateChanged((currentUser) => {
        if (currentUser) {
          resolve(currentUser);
        }
      })
    })
  }

  async _addSerie(){
    let user = await this.getUser();
    let id = this.shadowRoot.getElementById("serieid").value;
    if(!id){
        console.log('Empty ID');
    }else{
        var request = `https://us-central1-super-tv-guide.cloudfunctions.net/api/api/user/${user.uid}/add/${id}`;
    
        return fetch(request).then(response => {
        if (!response.ok) {
            throw Error(response.statusText);
        }
        return response.json();
        });
    }
  }
}

window.customElements.define('my-watchlist', MyWatchlist);
