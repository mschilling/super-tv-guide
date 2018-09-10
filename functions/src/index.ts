import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';

import { feed } from './testfeed'; // Test feed with test data

const app = express();
const router = express.Router();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

router.get('/feed', (req, res) => {
    res.json(feed);
});

app.use('/api', router);

export const api = functions.https.onRequest(app);
