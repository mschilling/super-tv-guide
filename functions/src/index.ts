import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

import { FirestoreManager } from './FirestoreManager';
import { feed } from './testfeed';

const app = express();
const router = express.Router();

const fm = new FirestoreManager();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

router.get('/feed', (req, res) => {
    res.json(feed);
});

router.get('/user/:userid/add/:serieid', async (req, res) => {
    const userid = req.params.userid;
    const serieid = req.params.serieid;
    res.json(await fm.addSerieToUser(userid, serieid));
});

router.get('/user/:userid/feed', async (req, res) => {
    const userid = req.params.userid;
    res.json(await fm.getUserFeed(userid));
});


app.use('/api', router);

export const api = functions.https.onRequest(app);
