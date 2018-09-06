const fs = require('fs');
const request = require('request');

const fileLocation = './tvdb.json';

export class TVDBManager {
    
    constructor() {

        const apiKey: string = this.getTVDBApiKey();
        const auth: string = this.getTVDBAuth(apiKey);

    }

    /*
    * Retrieves the apikey stored in the provided json file.
    * 
    * @returns {string} - The apikey stored in the provided json file.
    */
    private getTVDBApiKey(): string {

         // Get the apikey file.
        try {
            const file = fs.readFileSync(fileLocation, 'utf8');
            const obj = JSON.parse(file);
            return obj.apikey;
        } catch (err) {
            console.log(err);
            return null;
        }

    }

    /*
    * Retrieves the authentication code from https://www.thetvdb.com/ with the provided apikey.
    * 
    * @param {string} apiKey - The apikey of your project from https://www.thetvdb.com/.
    * @returns {string} - The authentication code retrieved from https://www.thetvdb.com/.
    */
    private getTVDBAuth(apiKey: string): string {

        // Object used for stroring the apikey.
        const jsonBody: object = {
            'apikey': apiKey
        };

        const self = this; // Used to call this in request().
        
        // Creates a POST request to the URL with the jsonBody.
        request({
            url: 'https://api.thetvdb.com/login',
            method: 'POST',
            json: true,
            body: jsonBody
        }, function (error, response, body){
            
            // Checks if there hasn't been a response.
            if (!response) {
                console.log(error);
                return null;
            }

            self.storeAuth(apiKey, body.token);
            return body.token;
        });

        return null;

    }

    /*
    * Stores the apikey and authentication code in the provided json file.
    */
    private storeAuth(apiKey: string, auth: string): void {

        const obj: object = {
            apikey: apiKey,
            auth: auth
        }

        // Write the object to the json file.
        try {
            fs.writeFileSync(fileLocation, JSON.stringify(obj), 'utf8');
        } catch (err) {
            console.log(err);
            return;
        }

    }

}
