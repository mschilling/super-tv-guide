import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';

import { feed } from './testfeed'; // Test feed with test data
import { TVDBManager } from './TVDBManager';

const app = express();
const router = express.Router();

const tvdb = new TVDBManager();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

router.get('/feed', (req, res) => {

    tvdb.authenticate()
        .catch(err => console.log(err))
        .then(() => {

        async function getFeed() {

            res.json(await tvdb.getFeed());

        }

        getFeed();

    });

});

router.get('/testfeed', (req, res) => {

    res.json(feed);

});



app.use('/api', router);

export const api = functions.https.onRequest(app);
