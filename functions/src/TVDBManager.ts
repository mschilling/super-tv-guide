const fs = require('fs');
const request = require('request');
const axios = require('axios');

const fileLocation = './tvdb.json';

export class TVDBManager {

    apiKey: string;
    
    constructor() {
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

        const ids = [104271, 311900, 75805, 71998, 70710, 71424];
        const series = [];
        const episodes = [];

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

        await axios.all(episodePromises)
        .then((results) => {
            results.forEach(response => {
                const episodeData = response['data']['data'];
                episodeData.forEach(episode => {

                    
                    episodes.push(episode);
                });
                // response['data'].foreach(episode => {
                //     console.log(episode.airedEpisodeNumber);
                // });
            });
        }).catch((error) => {
            console.log(error);
        });

        // series.forEach(serie => {
        //     promises.push(axios.get(`/series/${serie.id}/episodes`));
        // });
        // await axios.all(promises)
        // .then((results) => {
        //     results.forEach(response => {
        //         response['data']['data'].forEach(episode => {
        //             console.log(episode.firstAired);
        //         });
        //     });
        // }).catch((error) => {
        //     console.log(error);
        // });

        // const promises = ids.map(async (id) => {
        //     return new Promise((resolve, reject) => {
        //         resolve(this.getSerie(id));
        //     })
        // });

        // const series = await Promise.all(promises);
        // console.log(series);
        // const episodes = [];

        // series.forEach(serieEpisodes => {
        //     const _serieEpisodes: any = serieEpisodes;
        //     _serieEpisodes.forEach(serieEpisode => {
        //         episodes.push(serieEpisode);
        //     });
        // });

        // episodes.sort(function(o1, o2) {
        //     const a = new Date(o1.episodereleasedate);
        //     const b = new Date(o2.episodereleasedate);
        //     const c = o1.episodereleasetime;
        //     const d = o2.episodereleasetime;
            
        //     // Sort by time
        //     if (o1.episodereleasedate === o2.episodereleasedate) {
                
        //         const chm = c.split(':');
        //         const ch = chm[0];
        //         const cm = chm[1];

        //         const dhm = d.split(':');
        //         const dh = dhm[0];
        //         const dm = dhm[1];

        //         const ctotal = +ch * 60 + +cm;
        //         const dtotal = +dh * 60 + +dm;

        //         return ctotal<dtotal ? -1 : ctotal>dtotal ? 1 : 0;
        //     }

        //     // Sort by date
        //     return a<b ? -1 : a>b ? 1 : 0;
        // });
        

        // return new Promise((resolve, reject) => {

        //     resolve(episodes);

        // });

    }

    // private async getSerie(id: number) {
        
    //     return new Promise((resolve, reject) => {

    //         axios.get(`/series/${id}`)
    //         .then((response) => {
    //             resolve(response['data']['data']);
    //         }).catch((error) => {
    //             console.log(error);
    //             reject();
    //         });
    //     });

    // }

    // private async getEpisodes(serieId: number) {
        
        // return new Promise((resolve, reject) => {

        //     axios.get(`/series/${id}`)
        //     .then((response) => {
        //         resolve(response['data']['data']);
        //     }).catch((error) => {
        //         console.log(error);
        //         reject();
        //     });
        // });

    // }

    // private async getSerieEpisodes(serieData: any) {
        
    //     const dates: any = [];
    //     const episodes = [];

    //     const today = new Date();
    //     for (let i = 0; i < 7; i++) {
    //         const date = new Date(today.getTime() + i * 86400000);
    //         const dateString = date.getFullYear() + '-' + ("0" + (date.getMonth() + 1)).slice(-2) + '-' + ("0" + date.getDate()).slice(-2);
    //         dates.push(dateString);
    //     }

    //     let response: any = await this.requestGET(`https://api.thetvdb.com/series/${serieData.id}/episodes`);
    //     const lastPage = response['links']['last']

    //     if (lastPage > 1)
    //         response = await this.requestGET(`https://api.thetvdb.com/series/${serieData.id}/episodes/query?page=${lastPage}`);

    //     response['data'].forEach(item => {
    //         if (dates.includes(item.firstAired)) {

    //             let airTime = serieData.airsTime;

    //             if (serieData.airsTime.includes('AM') || serieData.airsTime.includes('PM')) {
    //                 airTime = this.convertTo24Hour(airTime);
    //             }

                // episodes.push({
                //     serieid: serieData.id,
                //     seriename: serieData.seriesName,
                //     serieimgurl: serieData.banner,
                //     seasonnumber: item.airedSeason,
                //     episodenumber: item.airedEpisodeNumber,
                //     episodename: item.episodeName,
                //     episodedescription: item.overview,
                //     episodereleasedate: item.firstAired,
                //     episodereleasetime: airTime,
                //     episodeid: item.id
                // });
    //         }
    //     });

    //     return new Promise((resolve, reject) => {

    //         resolve(episodes);

    //     });

    // }

    // private async requestGET(url: string) {

    //     return new Promise((resolve, reject) => {

    //         const options = {
    //             url: url,
    //             method: 'GET',
    //             json: true,
    //             headers: { 
    //                 'Authorization': 'Bearer ' + this.auth 
    //             }
    //         }

    //         function callback(error, response, body) {

    //             if (error) throw error;
    //             resolve(body);
    //         }
            
    //         request(options, callback);

    //     });

    // }

    // private convertTo24Hour(_time): string {
    //     let time = _time;
    //     const hours = parseInt(time.substr(0, 2));

    //     if(_time.indexOf('AM') !== -1 && hours === 12) {
    //         time = time.replace('12', '0');
    //     }
    //     if(_time.indexOf('PM')  !== -1 && hours < 12) {
    //         time = time.replace(hours, (hours + 12));
    //     }
    //     return time.replace(/(AM|PM)/, '');
    // }

}

const tvdb = new TVDBManager();

tvdb.authenticate()
        .then(() => {

        async function getFeed() {

            await tvdb.getFeed();

        }

        getFeed().catch(err => console.log(err));

    })
    .catch(err => console.log(err));