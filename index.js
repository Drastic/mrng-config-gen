var log4js = require("log4js");
var logger = log4js.getLogger();
logger.level = "debug";

const express = require('express');
//const xmlparser = require('express-xml-bodyparser');
const parse = require('csv-parse/sync').parse;
const app = express();
const port = 8000;

const connections = require('./connections');

const path = require('path');
const webDir = path.join(__dirname, '/web');
app.use(express.static(webDir));

// Middleware
//app.use(xmlparser());
app.use(express.text({type:'text/*'}));

app.all('*', (req,res,next) => {
  logger.info(`${req.ip} - ${req.method} ${req.url} ${req.protocol} `);
  next();
});

app.get('/', (req,res) => {
  res.status(200).sendFile(webDir+'index.html');
});

app.listen(port, () => {
  //console.log(`Listening on port ${port}...`);
  logger.debug(`Listening on port ${port}...`);
});

app.post('/upload', (req,res) => {
  //console.log(req.body);
  const dataReq = req.body;
  const records = parse(dataReq, {
    columns: true,
    skip_empty_lines: true,
    from_line: 1
    //objname: 'DID'
  });
  if (!connections.validateOrg(records)) {
    logger.debug(`Listening on port ${port}...`);
    res.status(500).send('Organization name is not consistent within imported records');
    return;
  }
  const dataRes = connections.compileConnTree(records);
  res.status(200).json(dataRes);
});

app.post('/devices', (req,res) => {
  res.status(200).send();
});
