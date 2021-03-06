
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
                resolve({ status: 400 });
            })
        }
        
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
            this.addSerieToDatabase(_serieid)
                .catch(err => {
                    console.log(err);
                });
            status = { status: 200 };
        }
        else {
            status = { status: 409 };
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
                                runtime: result['data']['data'].runtime,
                                subscribers: 1
                            });
                        })
                        .catch(err => {
                            console.log(err);
                        });
                    this.addSerieEpisodesToDatabase(_serieid, 1)
                    .catch(err => {
                        console.log(err);
                    });
                }
                else {
                    const data = doc.data();
                    db.collection('SERIES').doc(data.id + '').set({
                        id: data.id,
                        name: data.name,
                        airtime: data.airtime,
                        runtime: data.runtime,
                        subscribers: data.subscribers + 1
                    });
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
                        this.addSerieEpisodesToDatabase(_serieid, links.last - 5)
                        .catch(err => {
                            console.log(err);
                        });
                    }
                    else {
                        this.addSerieEpisodesToDatabase(_serieid, links.next)
                        .catch(err => {
                            console.log(err);
                        });
                    }
                    
                }
            })
            .catch(err => {
                console.log(err);
            });
    }

    public async getUserFeed(_userid) {

        let userSeries;
        const userEpisodes = [];

        await db.collection('USERS').doc(_userid).get()
            .then(doc => {
                if (doc.exists) {
                    userSeries = doc.data().series;
                }
            })
            .catch(err => {
                console.log(err);
            });

        if (!userSeries) {
            return new Promise((resolve, reject) => {
                resolve({ status: '404-1' });
            })
        }

        for (const serieid of userSeries) {
            let serie;
            
            await db.collection('SERIES').doc(serieid + '').get()
                .then(doc => {
                    serie = doc.data();
                })
                .catch(error => {
                    console.log(error);
                });

            const today = moment();
            await db.collection('EPISODES').where('serieid', '==', serieid).where('episodereleasedate', '>', today.format('YYYY-MM-DD')).where('episodereleasedate', '<', today.add(14, 'd').format('YYYY-MM-DD')).get()
                .then(snapshot => {
                    snapshot.forEach((doc) => {
                        const episode = doc.data();
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
                })
                .catch(error => {
                    console.log(error);
                })
        };

        userEpisodes.sort(compare);
        const firstFifteen = userEpisodes.slice(0, 15);
        
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

        return new Promise((resolve, reject) => {
            if (firstFifteen.length <= 0) {
                resolve({ status: '404-2'});
                return;
            }

            resolve(firstFifteen);
        })
    }

    public async getPopularSeries() {
        const popularSeries = [];
        await db.collection('SERIES').orderBy('subscribers', 'desc').orderBy('name').limit(10).get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    popularSeries.push(doc.data());
                });
            })
            .catch(error => {
                console.log(error);
            });

        return new Promise((resolve, reject) => {
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

        await db.collection('SERIES').get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    series.push(doc.data().id);
                });
            })
            .catch(error => {
                console.log(error);
            })

        axios.get(`/updated/query?fromTime=${today.unix()}&toTime=${today.add(1, 'd').unix()}`)
            .then(result => {
                result['data']['data'].forEach(update => {
                    if (series.indexOf(update.id) > -1) {
                        self.addSerieEpisodesToDatabase(update.id, 1)
                            .catch(error => {
                                console.log(error);
                            });
                    }
                });
            })
            .catch(error => {
                console.log(error);
            });

        return new Promise((resolve, reject) => {
            resolve();
        })
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