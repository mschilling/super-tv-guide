
const admin = require('firebase-admin');
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = './token.json';

const db = admin.firestore();

export class CalendarManager {

    public async addToCalendar(episodeid, token) {

        return new Promise( async (resolve, reject) => {
            fs.readFile('credentials.json', async (err, content) => {
                if (err) {
                    resolve({ error: 'Error loading client secret file:' });
                }
    
                // Authorize a client with credentials, then call the Google Calendar API.
                resolve(await this.authorize(JSON.parse(content), this.addEvent, episodeid, token));
                // resolve({ token: token});
            });
        });
        
        

        // return new Promise( async (resolve, reject) => {
        //     // Authorize a client with credentials, then call the Google Calendar API.
        //     resolve({ test: 'test' });
        // })
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

            oAuth2Client.getToken(_token, (err, token) => {
                if (err) {
                    resolve({ error: 'Error retrieving access token'});
                    return;
                }
                oAuth2Client.setCredentials(token);
            }); 
            resolve(await callback(oAuth2Client, episodeid));           
        });
      }

      private async getAccessToken(oAuth2Client, callback, episodeid) {
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES,
        });

        return new Promise((resolve, reject) => {
            resolve( { auth: `${authUrl}` } )
        });
        // const rl = readline.createInterface({
        //   input: process.stdin,
        //   output: process.stdout,
        // });
        // rl.question('Enter the code from that page here: ', (code) => {
        //   rl.close();
        //   oAuth2Client.getToken(code, (err, token) => {
        //     if (err) {
        //         return console.error('Error retrieving access token', err);
        //         return new Promise((resolve, reject) => {
        //             resolve({ error: 'Error retrieving access token'});
        //         })
        //     }
        //     oAuth2Client.setCredentials(token);
        //     // Store the token to disk for later program executions
        //     fs.writeFile(TOKEN_PATH, JSON.stringify(token), (error) => {
        //       if (error) console.error(error);
        //       console.log('Token stored to', TOKEN_PATH);
        //     });
            
        //     callback(oAuth2Client, episodeid);
        //   });
        // });
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
                resolve({ error: 'Invalid episodeid' })
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
        
        const event = {
            summary: serie.name,
            description: episodeDescription,
            start: {
                dateTime: `${episode.episodereleasedate}T${serie.airtime.replace(' ', '')}:00.000Z`
            },
            end: {
                dateTime: `${episode.episodereleasedate}T${serie.airtime.replace(' ', '')}:00.000Z`
            }
        }

        return new Promise((resolve, reject) => {
            calendar.events.insert({
                auth: auth,
                calendarId: 'primary',
                resource: event,
            }, (err, _event) => {
                if (err) {
                    console.log(err); // 'There was an error contacting the Calendar service: ' + 
                    resolve({ error: 'Could not create event. ' });
                }
                
                resolve({ status: 'Event got created' });
            });
        });

        // calendar.events.list({
        //   calendarId: 'primary',
        //   timeMin: (new Date()).toISOString(),
        //   maxResults: 10,
        //   singleEvents: true,
        //   orderBy: 'startTime',
        // }, (err, res) => {
        //   if (err) return console.log('The API returned an error: ' + err);
        //   const events = res.data.items;
        //   if (events.length) {
        //     console.log('Upcoming 10 events:');
        //     events.map((event, i) => {
        //       const start = event.start.dateTime || event.start.date;
        //       console.log(`${start} - ${event.summary}`);
        //     });
        //   } else {
        //     console.log('No upcoming events found.');
        //   }
        // });
      }
}

new CalendarManager();