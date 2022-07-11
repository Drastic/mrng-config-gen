const parse = require('csv-parse/sync').parse;
//const csv = require('express-request-csv');

// Log4js
const log4js = require('log4js');
log4js.configure({
  appenders: { connections: { type: 'stdout' } },
  categories: { default: { appenders: ['connections'], level: 'debug' } },
});
const logger = log4js.getLogger('connections');

class Device {
  did;
  name;
  address;
  cat;
  role;
  org;
  constructor(did,name,address,cat,role,org) {
    this.did = did;
    this.name = name;
    this.address = address;
    this.cat = cat;
    this.role = role;
    this.org = org
  }
}

const csvHead = {
  did: 'DID',
  name: 'Device Name',
  address: 'IP Address',
  cat: 'Device Category',
  role: 'Device Class | Sub-class',
  org: 'Organization'
}

const csvHeadRev = {
  'DID': 'did',
  'Device Name': 'name',
  'IP Address': 'address',
  'Device Category': 'cat',
  'Device Class | Sub-class': 'role',
  'Organization': 'org'
}

// Parse csv data and return array of objects
const parseCsv = function(csv) {
  let data = null;
  try {
    data = parse(csv, {
      cast: (value, context) => {
        if(context.header) return csvHeadRev[value];
        return String(value);
      },
      columns: true,
      skip_empty_lines: true,
      from_line: 1,
      trim: true
      //objname: 'DID'
    });
  } catch(error) {
    logger.error(error.message);
    logger.debug(error);
  }
  if (!validateNodes(data)) {
    logger.error('Error validating parsed csv data in validateNodes method.');
    return null;
  }
  if (!validateOrg(data)) {
    logger.error('Organization name is not consistent within imported records.');
    //return null;
  }
  return data;
}

// Validate data
const validateNodes = function(arr) {
  if (!Array.isArray(arr)) return false;
  for (const node of arr) {
    if (!(typeof node === 'object' && !Array.isArray(node) && node !== null))
      return false;
    if (!(node.hasOwnProperty('did') && node.hasOwnProperty('name') && node.hasOwnProperty('address') && node.hasOwnProperty('cat') && node.hasOwnProperty('role') && node.hasOwnProperty('org')))
      return false;
    if (node.did === null || node.name === null || node.address === null)
      return false;
  }
  return true;
}

// Validate if Org is constant within data
const validateOrg = function(devices) {
  let org = null;
  org = devices[0].org;
  for (const device of devices) {
    const thisOrg = device.org;
    if (org !== thisOrg) return false;
    //console.log(`Last org is ${org} and this org is ${thisOrg} and result is ${result}`);
    //org = thisOrg;
  }
  return true;
}

// Create connections tree out of array of device objects
const compileConnTree = function(devices) {
  const data = {
    tree: {},
    devices: []
  };
  const reg = new Set();
  //data.tree.org.cat.role.connection;
  const order = ['org','cat','role'];
  const newChild = function(name, parent, type) {
    let child = (type === 'role') ? [] : {};
    parent[name] = child;
    return child;
  }
  for (const device of devices) {
    const connection = { name: device.name, address: device.address, did: device.did };
    reg.add(device.did);

    let currentCat = data.tree;
    for (const sub of order) {
      currentCat = currentCat.hasOwnProperty(device[sub]) ? currentCat[device[sub]] : newChild(device[sub], currentCat, sub);
    }
    currentCat.push(connection);
  }
  data.devices = [...reg];
  return data;
}

exports.parseCsv = parseCsv;
exports.compileConnTree = compileConnTree;
