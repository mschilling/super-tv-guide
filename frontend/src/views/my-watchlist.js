import { LitElement, html } from '../../node_modules/@polymer/lit-element';

import { styles } from '../style/main-style.js';

import { Icon } from "@material/mwc-icon";

import '../../node_modules/@polymer/paper-toast/paper-toast.js';

class MyWatchlist extends LitElement {
    render() {
        return html`
        ${styles}
        <style>
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
                padding-left: 10px;
                padding-bottom: 11px;
                padding-top: 13px;
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
                height: 40px;
                border-top-right-radius: 5px;
                border: 1px solid #eeeeee;
                border-bottom-right-radius: 5px;
            }
            a{
                color: #757575;
            }
            .popular-item{
                float: left;
                width: 100%;
                color: #363636;
                margin-bottom: 10px;
            }
            .popular-item p{
                margin: 0;
                float: left;
                width: calc(100% - 53px);
                padding-left: 10px;
                padding-bottom: 8px;
                padding-top: 8px;
                border: 1px solid #eeeeee;
                border-left: none;
                border-top-right-radius: 5px;
                border-bottom-right-radius: 5px;
            }
            .popular-item a{
                width: 40px;
                float: left;
                background-color: #eeeeee;
                color: #828282;
                float: left;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 40px;
                border-top-left-radius: 5px;
                border: 1px solid #eeeeee;
                border-bottom-left-radius: 5px;
                cursor: pointer;
                background-position: center;
                transition: background 0.8s;
            }
            .popular-item a:hover {
                background: #cdcdcd radial-gradient(circle, transparent 1%, #cdcdcd 1%) center/15000%;
            }
            .popular-item a:active {
                background-color: #afafaf;
                background-size: 100%;
                transition: background 0s;
            }
            .spacer{
                float: left;
                width: 100%;
                height: 15px;
            }
            .ripple {
                cursor: pointer;
                background-position: center;
                transition: background 0.8s;
            }
            .ripple:hover {
                background: #E53935 radial-gradient(circle, transparent 1%, #E53935 1%) center/15000%;
            }
            .ripple:active {
                background-color: #C62828;
                background-size: 100%;
                transition: background 0s;
            }
        </style>
            <div class="spacer"></div>
            <div class="card">
                <h2>Add watchlist item</h2>
                <p>Search on <a target="_blank" href="https://www.thetvdb.com">TVDB</a> for the serie ID, and enter it below. Or choose one of the most popular series below.</p>
                <form id="form" action="?">
                <div class="form-group">
                    <input id="serieid" type="text" name="serieid" placeholder="Serie ID">
                    <a @click="${() => this._addSerie()}" class="ripple">
                        <mwc-icon class="arrow_back" >add</mwc-icon>
                    </a>
                </div>
                </form> 
            </div>

            <div class="card">
                <h2>Popular shows</h2>
                <p>Click on an item to add it to your feed.</p>
                ${MyWatchlist.popularShows}
            </div>

            <!-- Toast messages -->
            <paper-toast id="toast-incorrect-id" class="fit-bottom toast-error" duration="3000" text="Serie ID incorrect."></paper-toast>
                
            <paper-toast id="toast-empty" class="fit-bottom toast-warning" duration="3000" text="Please fill in the field."></paper-toast>

            <paper-toast id="toast-something-wrong" class="fit-bottom toast-error" duration="4000" text="Something went wrong while adding the serie to your watchlist."></paper-toast>
            
            <paper-toast id="toast-no-popular" class="fit-bottom toast-warning" duration="3000" text="Couldn't retrieve popular series."></paper-toast>

            <paper-toast id="toast-already-added" class="fit-bottom toast-warning" duration="3000" text="This serie is already in your watchlist."></paper-toast>

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
    constructor() {
        super();
        this.addLoading();
        this.loadFromNetwork();
    }

    addLoading() {
        document.querySelectorAll('my-app')[0].shadowRoot.getElementById("loader").classList.add('anim');
    }

    static get properties() {
        return {
            popularShows: {
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

    loadingDone() {
        let loader = document.querySelectorAll('my-app')[0].shadowRoot.getElementById("loader");
        loader.addEventListener('animationiteration', function () {
            loader.classList.remove('anim');
        })
        loader.addEventListener('webkitAnimationIteration', function () {
            loader.classList.remove('anim');
        })
    }

    getUser() {
        if (this.user) {
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

    async loadFromNetwork() {
        this.getPopularShows().then(shows => {
            this.fillPopularItems(shows);
            this.loadingDone();
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

    fillPopularItems(items) {
        MyWatchlist.popularShows = [];
        for (let i = 0; i < items.length; i++) {
            if(items[i].name){
                MyWatchlist.popularShows.push(
                    html`
                        <div class="popular-item">
                            <a @click="${() => this._addSerieWithId(items[i].id)}">
                                <mwc-icon class="arrow_back">add</mwc-icon>
                            </a>
                            <p>${items[i].name}</p>
                        </div>`
                )
            }
        };
        this.update();
    }

    async _addSerie() {
        let user = await this.getUser();
        let serie = this.shadowRoot.getElementById("serieid").value;
        this.shadowRoot.getElementById("serieid").value = "";
        if (!serie) {
            this.toast('empty');
        } else {
            this.addSerie(user, serie).then(response => {
                this.giveResponse(response);
            })
        }
    }



    addSerie(user, serie) {
        var request = `https://us-central1-super-tv-guide.cloudfunctions.net/api/api/user/${user.uid}/add/${serie}`;

        return fetch(request).then(response => {
            if (!response.ok) {
                this.toast('something-wrong');
            }
            return response.json();
        });
    }

    async _addSerieWithId(id) {
        let serie = id;
        let user = await this.getUser();
        if (!serie) {
            this.toast('empty');
        } else {
            this.addSerie(user, serie).then(response => {
                this.giveResponse(response);
            })
        }
    }

    giveResponse(response) {
        switch (response.status) {
            case 200:
                // OK
                this.toast('added');
                break;
            case 400:
                // Serie ID is wrong
                this.toast('incorrect-id');
                break;
            case 409:
                // User already has serie
                this.toast('already-added');
                break;
            default:
                // Something else went wrong
                this.toast('something-wrong');
        }
    }

    toast(item) {
        this.shadowRoot.getElementById(`toast-${item}`).open();
    }

}

window.customElements.define('my-watchlist', MyWatchlist);
