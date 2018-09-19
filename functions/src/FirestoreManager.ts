
const schedule = require('node-schedule');

const admin = require('firebase-admin');
const axios = require('axios');
const moment = require('moment');
const fs = require('fs');

const db = admin.firestore();
db.settings({ timestampsInSnapshots: true });

const fileLocation = './tvdb.json';

let self;

export class FirestoreManager {

    apikey: string;

    constructor() {
        self = this;
        const file = JSON.parse(fs.readFileSync(fileLocation, 'utf8'));
        this.apikey = file.apikey;
        schedule.scheduleJob('0 0 * * *', this.update); // Schedule a update every day 00:00
    }

    public async addSerieToUser(_userid: string, _serieid: string)  {

        let userSeries: Array<string> = [];

        axios.defaults.baseURL = 'https://api.thetvdb.com/';
        await this.authenticate();

        // Check if the serieid is legit
        try {
            await axios.get(`/series/${_serieid}`);
        } catch (error) {
            return new Promise((resolve) => {
                resolve({ status: 400 });
            })
        }
        
        // Check if the user already has any series
        try {
            const doc = await db.collection('USERS').doc(_userid).get();
            if (doc.exists) {
                userSeries = doc.data().series;
            }
        } catch (error) {
            console.log(error);
        }

        // Check if the user already has the serie
        if (userSeries.indexOf(_serieid) > -1) {
            return new Promise(resolve => {
                resolve({ status: 409 })
            })
        }

        try {
            userSeries.push(_serieid);
            this.addSerieToDatabase(_serieid).catch(error => { console.log(error) });
        } catch (error) {
            console.log(error);
        }        
        
        // Add the series to the user.
        await db.collection('USERS').doc(_userid).set({
            series: userSeries
        });

        return new Promise((resolve) => {
            resolve({ status: 200 });
        })
    }

    private async addSerieToDatabase(_serieid) {

        // Check if the serie is already in firestore, if not add it.
        try {

            const doc = await db.collection('SERIES').doc(_serieid.toString()).get();
            if (doc.exists) {
                const data = doc.data();
                db.collection('SERIES').doc(_serieid.toString()).update({
                    subscribers: data.subscribers + 1
                });
            }

            else {

                const response = await axios.get(`/series/${_serieid}`);
                const { data } = await response;

                db.collection('SERIES').doc(_serieid).set({
                    id: data['data'].id,
                    name: data['data'].seriesName,
                    airtime: this.convertTo24Hour(data['data'].airsTime),
                    runtime: data['data'].runtime,
                    subscribers: 1
                });

                this.addSerieEpisodesToDatabase(_serieid, 1).catch(error => { console.log(error) });

            }
        } catch (error) {
            console.log(error);
        }
    }

    private async addSerieEpisodesToDatabase(_serieid, page) {

        try {

            const response = axios.get(`/series/${_serieid}/episodes/query?page=${page}`);
            const { data } = await response;
            const episodes = data['data'];
            const links = data['links'];

            if (links.next) {
                
                if (links.last > 5 && page === 1) {
                    this.addSerieEpisodesToDatabase(_serieid, links.last - 5).catch(error => { console.log(error) });
                }
                else {
                    this.addSerieEpisodesToDatabase(_serieid, links.next).catch(error => { console.log(error) });
                }

            }

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

        } catch (error) {
            console.log(error);
        }
    }

    public async getUserFeed(_userid) {

        let userSeries;
        const userEpisodes = [];

        try {
            const doc = await db.collection('USERS').doc(_userid).get();
            if (!doc.exists) {
                return new Promise((resolve) => {
                    resolve({ status: '404-1' });
                });
            }
            userSeries = doc.data().series;
        } catch (error) {
            console.log(error);
        }

        try {

            for (const serieid of userSeries) {
                    
                const serieDoc = await db.collection('SERIES').doc(serieid + '').get();
                const serie = serieDoc.data();

                // Retrieve all episodes of the users serie that aired between now and 14 days
                const episodeSnapshot = await db.collection('EPISODES')
                    .where('serieid', '==', +serieid)
                    .where('episodereleasedate', '>', moment().format('YYYY-MM-DD'))
                    .where('episodereleasedate', '<', moment().add(14, 'd').format('YYYY-MM-DD'))
                    .get();

                episodeSnapshot.forEach(episodeDoc => {

                    const episode = episodeDoc.data();
                    userEpisodes.push({
                        serieid: serie.id,
                        seriename: serie.name,
                        seasonnumber: episode.seasonnumber,
                        episodenumber: episode.episodenumber,
                        episodename: episode.episodename,
                        episodedescription: episode.episodedescription,
                        episodereleasedate: episode.episodereleasedate,
                        episodereleasetime: serie.airtime
                    });  
                });

                userEpisodes.sort(compare);
            }
        } catch (error) {
            console.log(error);
        }

        return new Promise((resolve) => {

            if (userEpisodes.length <= 0) {
                resolve({ status: '404-2'});
                return;
            }

            resolve(userEpisodes.slice(0, 15));
        });

        function compare(a,b) {

            if (a.episodereleasedate.split('-').join() === b.episodereleasedate.split('-').join()) {
                if (a.episodereleasetime.split(':').join() > b.episodereleasetime.split(':').join() ) {
                    return -1;
                }
                else if (a.episodereleasetime.split(':').join() < b.episodereleasetime.split(':').join() ) {
                    return 1;
                }
            }

            if (a.episodereleasedate.split('-').join() < b.episodereleasedate.split('-').join())
                return -1;
            else if (a.episodereleasedate.split('-').join() > b.episodereleasedate.split('-').join())
                return 1;
            return 0;
        }
    }

    public async getPopularSeries() {

        const popularSeries = [];

        try {

            // Get the 10 most popular shows.
            const snapshot = await db.collection('SERIES')
                .orderBy('subscribers', 'desc')
                .orderBy('name')
                .limit(10)
                .get();
            
            snapshot.forEach(doc => {
                popularSeries.push(doc.data());
            });
        } catch (error) {
            console.log(error);
        }

        return new Promise((resolve) => {
            resolve(popularSeries);
        });
    }

    public async update() {
        
        console.log('Updating series...');

        axios.defaults.baseURL = 'https://api.thetvdb.com/';
        await self.authenticate();

        const series = [];
        const today = moment().utc();
        today.hours(0).minutes(0).seconds(0).milliseconds(0);

        try {
            const snapshot = await db.collection('SERIES').get();
            snapshot.forEach(doc => {
                series.push(doc.data().id);
            });
        } catch (error) {
            console.log(error);
        }

        try {
            const response = await axios.get(`/updated/query?fromTime=${today.unix()}&toTime=${today.add(1, 'd').unix()}`);
            const { data } = await response;

            data['data'].forEach(update => {
                if (series.indexOf(update.id) > -1) {
                    self.addSerieEpisodesToDatabase(update.id, 1)
                        .catch(error => {
                            console.log(error);
                        });
                }
            });

        } catch (error) {
            console.log(error);
        }

        return new Promise((resolve) => {
            resolve();
        })
    }

    private async authenticate() {

        return new Promise( async (resolve, reject) => {
            try {

                const response = await axios.post(`/login`, { "apikey": this.apikey });
                const { data } = await response;
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
                resolve();

            } catch (error) {
                console.log(error);
                reject();
            }
        })
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