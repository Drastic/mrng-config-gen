// Modules
const connections = require('./modules/connections');
const DB = require('./modules/database');
const db = new DB();

const ORG = 'cisco';

// Log4js
const log4js = require('log4js');
log4js.configure({
  appenders: { api: { type: 'stdout' } },
  categories: { default: { appenders: ['api'], level: 'debug' } },
});
const logger = log4js.getLogger('api');

// Express
const express = require('express');
const { query } = require('express');
const router = express.Router();
router.use(express.text({type:'text/*'}));


router.post('/upload', (req,res) => {
  const dataReq = req.body;
  let dataRes = null;
  // parse csv
  const dataParsed = connections.parseCsv(dataReq);
  db.setDevices(dataParsed);
  // compile connections tree
  dataRes = connections.compileConnTree(dataParsed);
  res.status(200).json(dataRes);
});


router.get('/devices', (req,res) => {
  if (!req.query) {
    rejectReq(res, new Error('Request is empty.'));
    return;
  }
  const filter = {
    org: req.query.org
  }
  for (const q of ['cat','role','did']) {
    if (!req.query[q]) continue;
    if (req.query[q].length > 0) filter[q] = { '$in': req.query[q] }
  }
  db.getDevices(filter)
    .then(list => connections.compileConnTree(list))
    .then(dataRes => res.status(200).json(dataRes))
    .catch(err => rejectReq(res,err));
});


router.post('/devices', (req,res) => {
  res.status(200).send();
});


router.get('/orgs', (req,res) => {
  db.getOrgs()
    .then(dataRes => res.status(200).json(dataRes))
    .catch(err => rejectReq(res,err));
});


router.get('/categories', (req,res) => {
  if (!req.query) {
    rejectReq(res, new Error('Request is empty.'));
    return;
  }
  const filter = {
    org: req.query.org
  }
  db.getContainers(filter)
    .then(dataRes => res.status(200).json(dataRes))
    .catch(err => rejectReq(res,err));
});


function rejectReq(res,err) {
  res.status(500).send(err.message);
  logger.error(err.message);
}

module.exports = router;
