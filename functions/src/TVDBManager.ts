const fs = require('fs');
const axios = require('axios');
const moment = require('moment');
const functions = require('firebase-functions');
const admin = require('firebase-admin');


admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

const fileLocation = './tvdb.json';

export class TVDBManager {

    apiKey: string;
    
    constructor() {
        db.settings({ timestampsInSnapshots: true });
        this.setApiKey();
        axios.defaults.baseURL = 'https://api.thetvdb.com/';
    }

    private setApiKey() {
        const file = JSON.parse(fs.readFileSync(fileLocation, 'utf8'));
        this.apiKey = file.apikey;
    }

    public async authenticate() {
        return new Promise((resolve, reject) => {
            axios.post(`/login`, {
                "apikey": this.apiKey
            }).then((response) => {
                axios.defaults.headers.common['Authorization'] = `Bearer ${response['data'].token}`;
                resolve();
            }).catch((error) => {
                console.log(error);
                reject();
            }); 
        });
    }

    public async getFeed() {
        let episodes: Array<object> = [];
        const ids: Array<number> = [104271, 71424, 75805, 311900, 70710, 71998];
        const foundIds: Array<number> = [];
        const updateIds: Array<number> = [];

        await db.collection('episodes').get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    const episode = doc.data();
                    if (moment(episode.episodereleasedate) > moment() && moment(episode.episodereleasedate) < moment().add(7, 'days')) {
                        episodes.push(episode);
                        if (!this.arrayIncludes(foundIds, episode.serieid)) {
                            foundIds.push(episode.serieid);
                        }
                    }
                });
            })
            .catch(err => {
                console.log(err);
                episodes = [{ status: 'Error' }];
            });

        ids.forEach(id => {
            if (!this.arrayIncludes(foundIds, id)) {
                updateIds.push(id);
            }
        })
        
        if (updateIds.length > 0) {
            this.updateFeed(ids)
            .catch(err => {
                console.log(err);
            });
        }

        return new Promise((resolve, reject) => {
            resolve(this.sortEpisodes(episodes));
        });
    }

    public async updateFeed(_ids) {

        const series = [];
        const ids: Array<number> = _ids;

        // Get all serie information
        let promises = [];

        ids.forEach(id => {
            promises.push(axios.get(`/series/${id}`));
        });

        await axios.all(promises)
        .then((results) => {
            results.forEach(response => {
                series.push(response['data']['data']);
            });
        }).catch((error) => {
            console.log(error);
        });


        // Get all relevant episode information
        promises = [];
        const episodePromises = [];

        series.forEach(serie => {
            promises.push(axios.get(`/series/${serie.id}/episodes`));
        });

        await axios.all(promises)
        .then((results) => {
            results.forEach(response => {
                episodePromises.push(axios.get(`/series/${response['data']['data'][0].seriesId}/episodes?page=${response['data']['links'].last}`));
            });
        }).catch((error) => {
            console.log(error);
        });
        let count = 0;
        axios.all(episodePromises)
        .then((results) => {
            results.forEach(response => {
                const episodeData = response['data']['data'];
                const serieData = series[count];
                const serieAirTime = this.convertTo24Hour(serieData.airsTime);
                episodeData.forEach(episode => {

                    if (episode.firstAired !== '') {
                        if (moment(episode.firstAired) > moment() && moment(episode.firstAired) < moment().add(14, 'days')) {

                            db.collection('episodes').doc(episode.id + '').set({
                                serieid: serieData.id,
                                seriename: serieData.seriesName,
                                serieimgurl: serieData.banner,
                                seasonnumber: episode.airedSeason,
                                episodeid: episode.id,
                                episodenumber: episode.airedEpisodeNumber,
                                episodename: episode.episodeName,
                                episodedescription: episode.overview,
                                episodereleasedate: episode.firstAired,
                                episodereleasetime: serieAirTime,
                                episoderuntime: serieData.runtime
                            });

                        }
                    }
                });
                count++;
            });
        }).catch((error) => {
            console.log(error);
        });

    }

    private sortEpisodes(_episodes) {
        const episodes = _episodes;
        
        episodes.sort(function(_a, _b) {
            const a = new Date(_a.episodereleasedate);
            const b = new Date(_b.episodereleasedate);
            const c = _a.episodereleasetime;
            const d = _b.episodereleasetime;

            // Sort by time
            if (_a.episodereleasedate === _b.episodereleasedate) {
                
                const chm = c.split(':');
                const ch = chm[0];
                const cm = chm[1];

                const dhm = d.split(':');
                const dh = dhm[0];
                const dm = dhm[1];

                const ctotal = +ch * 60 + +cm;
                const dtotal = +dh * 60 + +dm;

                return ctotal<dtotal ? -1 : ctotal>dtotal ? 1 : 0;
            }

            // Sort by date.
            return a<b ? -1 : a>b ? 1 : 0;
        });

        return episodes;
    }

    private arrayIncludes(_array, _item) {
        let found = false;
        _array.forEach(item => {
            if (item === _item) {
                found = true;
            }
        })
        return found;
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
        return time.replace(/(AM|PM)/, '');
    }

}