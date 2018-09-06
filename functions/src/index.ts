import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';

import { TVDBManager } from './TVDBManager';

const app = express();
const router = express.Router();

const tvdb = new TVDBManager();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

router.get('/ping', (req, res) => {
  res.json({ result: 'pong', timestamp: new Date().toISOString() });
});

app.use('/api', router);

export const api = functions.https.onRequest(app);
