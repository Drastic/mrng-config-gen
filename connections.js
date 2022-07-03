//const csv = require('express-request-csv');

class Device {
  id;
  name;
  address;
  category;
  role;
  org;
  constructor(id,name,address,category,role,org) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.category = category;
    this.role = role;
    this.org = org
  }
}

const csvHead = {
  id: 'DID',
  name: 'Device Name',
  address: 'IP Address',
  cat: 'Device Category',
  role: 'Device Class | Sub-class',
  org: 'Organization'
}

// Validate if Org is unique
const validateOrg = function(devices) {
  let org = devices[0][csvHead.org];
  if (!org) return false;
  let result = true;
  for (const device of devices) {
    //console.log(device);
    const thisOrg = device[csvHead.org];
    if (org !== thisOrg) result = false;
    //console.log(`Last org is ${org} and this org is ${thisOrg} and result is ${result}`);
    org = thisOrg;
  }
  return result;
}

// Create connections tree out of imported data
const compileConnTree = function(devices) {
  const data = {};
  data.tree = {};
  const reg = new Set();
  const order = ['org','cat','role'];
  const newChild = function(name, parent, type) {
    let child = (type === 'role') ? [] : {};
    parent[name] = child;
    return child;
  }
  for (const device of devices) {
    const connection = { name: device[csvHead.name], address: device[csvHead.address], id: device[csvHead.id] };
    reg.add(device[csvHead.id]);
    //data.tree.org.cat.role.connection;

    let currentCat = data.tree;
    for (const sub of order) {
      currentCat = currentCat.hasOwnProperty(device[csvHead[sub]]) ? currentCat[device[csvHead[sub]]] : newChild(device[csvHead[sub]], currentCat, sub);
    }
    currentCat.push(connection);
  }
  data.devices = [...reg];
  //console.log(reg);
  //console.log(data.tree);
  return data;
}

exports.validateOrg = validateOrg;
exports.compileConnTree = compileConnTree;
