const path = require('path');
const webDir = path.join(__dirname, '/static');
const logger = require('./modules/logger')('app');

// Express
const express = require('express');
const app = express();
const port = 8000;
const api = require('./api');

// Middleware
app.use(express.static(webDir));
app.use('/api', api);
//app.use(xmlparser());

// Entry points

app.all('*', (req,res,next) => {
  logger.info(`${req.ip} - ${req.method} ${req.url} ${req.protocol} `);
  next();
});

app.get('/', (req,res) => {
  res.status(200).sendFile(webDir+'/index.html');
});

app.listen(port, () => {
  logger.debug(`Listening on port ${port}...`);
});
