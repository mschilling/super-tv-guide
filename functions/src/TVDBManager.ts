const fs = require('fs');
const request = require('request');

const fileLocation = './tvdb.json';

export class TVDBManager {

    apiKey: string;
    auth: string;
    
    constructor() {
        this.setApiKey();
    }

    private setApiKey() {
        const file = JSON.parse(fs.readFileSync(fileLocation, 'utf8'));
        this.apiKey = file.apikey;
    }

    public async authenticate() {

        return new Promise((resolve, reject) => {
            
            if (this.auth === undefined || this.auth === null) {

                const options = {
                    url: 'https://api.thetvdb.com/login',
                    method: 'POST',
                    json: true,
                    body: { 
                        'apikey': this.apiKey 
                    }
                }
    
                const self = this;
    
                function callback(error, response, body) {
    
                    if (error) throw error;
                    self.auth = body.token;
                    resolve();
                }

                request(options, callback);

            }
            else {

                resolve();

            }
        });
    }

    public async getFeed() {

        const ids = [104271, 311900, 75805];

        const promises = ids.map(async (id) => {
            return new Promise((resolve, reject) => {
                resolve(this.getSerie(id));
            })
        });

        const series = await Promise.all(promises);
        const episodes = [];

        series.forEach(serieEpisodes => {
            const _serieEpisodes: any = serieEpisodes;
            _serieEpisodes.forEach(serieEpisode => {
                episodes.push(serieEpisode);
            });
        });

        episodes.sort(function(o1, o2) {
            const a = new Date(o1.episodereleasedate);
            const b = new Date(o2.episodereleasedate);
            return a<b ? -1 : a>b ? 1 : 0;
        });
        

        return new Promise((resolve, reject) => {

            resolve(episodes);

        });

    }

    private async getSerie(id: number) {

        const serie = await this.requestGET(`https://api.thetvdb.com/series/${id}`);
        const serieData = serie['data'];

        const serieEpisodes = await this.getSerieEpisodes(serieData);
        
        return new Promise((resolve, reject) => {
            resolve(serieEpisodes);
        });

    }

    private async getSerieEpisodes(serieData: any) {
        
        const dates: any = [];
        const episodes = [];

        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today.getTime() + i * 86400000);
            const dateString = date.getFullYear() + '-' + ("0" + (date.getMonth() + 1)).slice(-2) + '-' + ("0" + date.getDate()).slice(-2);
            dates.push(dateString);
        }

        let response: any = await this.requestGET(`https://api.thetvdb.com/series/${serieData.id}/episodes`);
        const lastPage = response['links']['last']

        if (lastPage > 1)
            response = await this.requestGET(`https://api.thetvdb.com/series/${serieData.id}/episodes/query?page=${lastPage}`);

        response['data'].forEach(item => {
            if (dates.includes(item.firstAired)) {

                let airTime = serieData.airsTime;

                if (serieData.airsTime.includes('AM') || serieData.airsTime.includes('PM')) {
                    airTime = this.convertTo24Hour(airTime);
                }

                episodes.push({
                    seriename: serieData.seriesName,
                    serieimgurl: serieData.banner,
                    seasonnumber: item.airedSeason,
                    episodenumber: item.airedEpisodeNumber,
                    episodename: item.episodeName,
                    episodedescription: item.overview,
                    episodereleasedate: item.firstAired,
                    episodereleasetime: airTime
                });
            }
        });

        return new Promise((resolve, reject) => {

            resolve(episodes);

        });

    }

    private async requestGET(url: string) {

        return new Promise((resolve, reject) => {

            const options = {
                url: url,
                method: 'GET',
                json: true,
                headers: { 
                    'Authorization': 'Bearer ' + this.auth 
                }
            }

            function callback(error, response, body) {

                if (error) throw error;
                resolve(body);
            }
            
            request(options, callback);

        });

    }

    private convertTo24Hour(_time): string {
        let time = _time;
        const hours = parseInt(time.substr(0, 2));
        console.log(time);
        if(_time.indexOf('AM') != -1 && hours == 12) {
            time = time.replace('12', '0');
        }
        if(_time.indexOf('PM')  != -1 && hours < 12) {
            time = time.replace(hours, (hours + 12));
        }
        return time.replace(/(AM|PM)/, '');
    }

}