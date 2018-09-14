const admin = require('firebase-admin');
const axios = require('axios');
const moment = require('moment');
const fs = require('fs');

const db = admin.firestore();
db.settings({ timestampsInSnapshots: true });

const fileLocation = './tvdb.json';

export class FirestoreManager {

    apikey: string;

    constructor() {
        const file = JSON.parse(fs.readFileSync(fileLocation, 'utf8'));
        this.apikey = file.apikey;
    }

    public async addSerieToUser(_userid: string, _serieid: string)  {

        axios.defaults.baseURL = 'https://api.thetvdb.com/';
        await this.authenticate();

        let legitSerie;
        await axios.get(`/series/${_serieid}`)
            .then(result => {
                legitSerie = true;
            })
            .catch(err => {
                legitSerie = false;
            });
        if (!legitSerie) {
            return new Promise((resolve, reject) => {
                resolve({ status: `Denied, ${_serieid} is not a serie` });
            })
        }
        
        this.addSerieToDatabase(_serieid);

        let userSeries: Array<string>;

        // Check if the user already has series.
        await db.collection('USERS').doc(_userid).get()
            .then(doc => {
                if (doc.exists) {
                    userSeries = doc.data().series;
                }
            })
            .catch(err => {
                console.log(err);
            });

        if (userSeries === undefined) {
            userSeries = [];
        }

        let status;

        // If the user doesnt have the serie add it.
        if (userSeries.indexOf(_serieid) === -1) {
            userSeries.push(_serieid);
            status = { status: `Completed, added ${_serieid} to user ${_userid}` };
        }
        else {
            status = { denied: `Denied, user ${_userid} already has ${_serieid} to ` };
        }
        
        // Add the series to the user.
        await db.collection('USERS').doc(_userid).set({
            series: userSeries
        });

        return new Promise((resolve, reject) => {
            resolve(status);
        })
    }

    private async addSerieToDatabase(_serieid) {

        // Check if the serie is already in firestore, if not add it.
        db.collection('SERIES').doc(_serieid + '').get()
            .then(async doc => {
                if (!doc.exists) {
                    await axios.get(`/series/${_serieid}`)
                        .then(result => {
                            db.collection('SERIES').doc(_serieid).set({
                                id: result['data']['data'].id,
                                name: result['data']['data'].seriesName,
                                airtime: this.convertTo24Hour(result['data']['data'].airsTime),
                                runtime: result['data']['data'].runtime
                            });
                        })
                        .catch(err => {
                            console.log(err);
                        });
                    this.addSerieEpisodesToDatabase(_serieid, 1);
                }
            })
            .catch(err => {
                console.log(err);
            })
    }

    private async addSerieEpisodesToDatabase(_serieid, page) {
        
        axios.get(`/series/${_serieid}/episodes/query?page=${page}`)
            .then(result => {
                const episodes = result['data']['data'];
                const links = result['data']['links'];
                episodes.forEach(episode => {
                    if (moment(episode.firstAired) > moment()) {
                        db.collection('EPISODES').doc(episode.id + '').set({
                            episodeid: episode.id,
                            serieid: _serieid,
                            episodenumber: episode.airedEpisodeNumber,
                            seasonnumber: episode.airedSeason,
                            episodename: episode.episodeName,
                            episodedescription: episode.overview,
                            episodereleasedate: episode.firstAired
                        });
                    }
                });
                if (links.next !== null) {
                    if (links.last > 5 && page === 1) {
                        this.addSerieEpisodesToDatabase(_serieid, links.last - 5);
                    }
                    else {
                        this.addSerieEpisodesToDatabase(_serieid, links.next);
                    }
                    
                }
            })
            .catch(err => {
                console.log(err);
            });
    }

    private async authenticate() {
        return new Promise((resolve, reject) => {
            axios.post(`/login`, {
                "apikey": this.apikey
            }).then((response) => {
                axios.defaults.headers.common['Authorization'] = `Bearer ${response['data'].token}`;
                resolve();
            }).catch((error) => {
                console.log(error);
                reject();
            }); 
        });
    }

    private convertTo24Hour(_time): string {
        let time = _time;
        const hours = parseInt(time.substr(0, 2));

        if(_time.indexOf('AM') !== -1 && hours === 12) {
            time = time.replace('12', '0');
        }
        if(_time.indexOf('PM')  !== -1 && hours < 12) {
            time = time.replace(hours, (hours + 12));
        }
        return time.replace(/(AM|PM|' ')/, '');
    }
}