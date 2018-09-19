
const admin = require('firebase-admin');
const fs = require('fs');
const {google} = require('googleapis');
const moment = require('moment');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const db = admin.firestore();

export class CalendarManager {

    public async addToCalendar(episodeid, token) {

        return new Promise( async (resolve, reject) => {
            fs.readFile('credentials.json', async (err, content) => {
                if (err) {
                    resolve({ status: 403 });
                }
    
                // Authorize a client with credentials, then call the Google Calendar API.
                resolve(await this.authorize(JSON.parse(content), this.addEvent, episodeid, token));
            });
        });
    }

    private async authorize(credentials, callback, episodeid, _token) {
        const {client_secret, client_id, redirect_uris} = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);
      
        return new Promise( async (resolve, reject) => {
            if (!_token) {
                resolve(await this.getAccessToken(oAuth2Client, callback, episodeid));
                return;
            }

            oAuth2Client.getToken(_token, async (err, token) => {
                if (err) {
                    resolve(await this.getAccessToken(oAuth2Client, callback, episodeid)); // Invalid token
                    return;
                }
                oAuth2Client.setCredentials(token);
                resolve(await callback(oAuth2Client, episodeid));
            });       
        });
      }

      private async getAccessToken(oAuth2Client, callback, episodeid) {
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES,
        });

        return new Promise((resolve, reject) => {
            resolve( {
                status: 401,
                link: `${authUrl}` 
            } )
        });
      }

      private async addEvent(auth, episodeid) {
        const calendar = google.calendar({version: 'v3', auth});
        let episode;
        let serie;
        let episodeDescription = '\n';

        await db.collection('EPISODES').doc(episodeid).get()
            .then(doc => {
                episode = doc.data();
            })
            .catch(error => {
                console.log(error);
            });

        if (!episode) {
            return new Promise((resolve, reject) => {
                resolve({ status: 400 }) // Invalid episode
            })
        }

        await db.collection('SERIES').doc(episode.serieid).get()
            .then(doc => {
                serie = doc.data();
            })
            .catch(error => {
                console.log(error);
            });

        if (episode.episodename) {
            episodeDescription += `Title: ${episode.episodename}\n\n`;
        }

        if (episode.episodedescription) {
            episodeDescription += `Description: ${episode.episodedescription}\n\n`;
        }

        episodeDescription += `ID: ${episode.episodeid}\n\n`;

        const airTime = serie.airtime.replace(' ', '');
        const timeMoment = moment(airTime, 'HH:mm').add(serie.runtime, 'm');
        const finTime = timeMoment.format('HH:mm');
        
        const event = {
            summary: serie.name,
            description: episodeDescription,
            start: {
                dateTime: `${episode.episodereleasedate}T${airTime}:00.000Z`
            },
            end: {
                dateTime: `${episode.episodereleasedate}T${finTime}:00.000Z`
            }
        }

        console.log(event);

        return new Promise((resolve, reject) => {
            calendar.events.insert({
                auth: auth,
                calendarId: 'primary',
                resource: event,
            }, (err, _event) => {
                if (err) {
                    resolve({ status: 409 });
                    return;
                }
                
                resolve({ status: 200 });
            });
        });
      }
}

new CalendarManager();