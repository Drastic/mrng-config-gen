const schema = {
  did: {type: String, required: true },
  name: {type: String, required: true },
  address: {type: String, required: true },
  org: {type: String, required: true },
  cat: {type: String, required: true },
  role: {type: String, required: true }
};

module.exports = schema;
