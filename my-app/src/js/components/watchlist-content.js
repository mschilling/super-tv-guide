import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '../../shared-styles.js';

// Class watchlistContent (custom element) used to display a user's watchlist items
class watchlistContent extends PolymerElement{

  static get template() { 
    return html`
        <style include="shared-styles">
            :host {
            display: block;
            }
        </style>

            <dom-repeat items="{{shows}}">
                <template>
                    <div class="card">
                        <div>Title: <span>{{item.title}}</span></div>
                        <div>Description: <span>{{item.body}}</span></div>
                    </div>
                </template>
            </dom-repeat>
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
    this.getShows();
  }

  getShows() {
    let userID = 1; // Static for now, should be variable.
  
     // API request
     var request = 'https://jsonplaceholder.typicode.com/posts?userId=' + userID; // TODO: Change URL to the API api/users/shows/userid or something
  
     // Fetch the JSON data from the API
     fetch(request).then(response => {
       return response.json();
     }).then(data => {
        this.shows = data;
     }).catch(err => {
       alert("Oops! No content found..."); // Need to make something nice for this
     });
    
  }

}

  // Define the class watchlistContent as custom element
  window.customElements.define('watchlist-content', watchlistContent);