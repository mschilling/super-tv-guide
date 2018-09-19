import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

import { FirestoreManager } from './FirestoreManager';
import { CalendarManager } from './CalendarManager';
import { feed } from './testfeed';

const app = express();
const router = express.Router();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const fm = new FirestoreManager();
const cm = new CalendarManager();

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

router.get('/popular', async (req, res) => {
    res.json(await fm.getPopularSeries());
});

router.get('/calendar/add/:episodeid', async (req, res) => {
    const episodeid = req.params.episodeid;
    res.json(await cm.addToCalendar(episodeid, null));
});

router.post('/calendar/add/:episodeid', async (req, res) => {
    const episodeid = req.params.episodeid;
    const token = req.body;
    res.json(await cm.addToCalendar(episodeid, token));
});

app.use('/api', router);

export const api = functions.https.onRequest(app);
