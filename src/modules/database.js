const mongoose = require('mongoose');
const schema = require('./schema');
const logger = require('./logger')('db');


class Database {
  deviceSchema;

  constructor() {

    if (Database.instance instanceof Database) {
      return Database.instance;
    }

    this.deviceSchema = new mongoose.Schema(schema);
    
		mongoose
			.connect(
			'mongodb://localhost:27017/mrng',
			{ useNewUrlParser: true }
			)
			.then(() => logger.info('MongoDB connected'))
			.catch(err => logger.error(err));

    //Object.freeze(this.deviceSchema);
    Database.instance = this;
  }

	async createDevice() {
		const Device = mongoose.model('Device', this.deviceSchema);
		const device = new Device({
			did: 1,
			name: 'Test',
			address: '10.0.0.1',
			org: 'cisco',
			cat: 'cc',
			role: 'CVP'
		});

		const result = await device.save();
		logger.debug(result);
	}

	async getDevices(query) {
		if (mongoose.connection.readyState !== 1) return Promise.reject(new Error('Database connection is not established.'));
		const Device = mongoose.model('Device', this.deviceSchema);
		let devices = await Device.find(query);
		return devices;
	}

	async getOrgs() {
		if (mongoose.connection.readyState !== 1) return Promise.reject(new Error('Database connection is not established.'));
		const Device = mongoose.model('Device', this.deviceSchema);
		const orgs = await Device.distinct('org');
		return orgs;
	}

	async getContainers(query) {
		if (mongoose.connection.readyState !== 1) return Promise.reject(new Error('Database connection is not established.'));
		const Device = mongoose.model('Device', this.deviceSchema);
		//const org = await Device.distinct('org');
		const cat = await Device.distinct('cat', query);
		const role = await Device.distinct('role', query);
		const data = {org: query.org, cat, role};
		return data;
	}

	async setDevices(devices) {
		if (mongoose.connection.readyState !== 1) return Promise.reject(new Error('Database connection is not established.'));
		const Device = mongoose.model('Device', this.deviceSchema);
		for (const device of devices) {
			let res = null;
			try {
				res = await Device.updateOne(device,device,{upsert: true});
			} catch(error) {
				logger.error(error.message);
				logger.debug(error);
			}
			if (Array.isArray(res)) {
				for (const r of res) {
					if (!r.acknowledged) logger.error(`Failed to acknowledge ${r.upsertedId}`);
				}
			}
		}
	}

}


//exports.getOrgs = getOrgs;
//exports.getDevices = getDevices;
//exports.getContainers = getContainers;
//exports.setDevices = setDevices;
module.exports = Database;
