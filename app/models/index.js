const dbConfig = require('../config/db.config.js');

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = dbConfig.url;

db.users = require('./users.model.js')(mongoose);
db.categories = require('./categories.model.js')(mongoose);
db.roles = require('./roles.model.js')(mongoose);
db.blog = require('./blog.model.js')(mongoose);
db.cms = require('./cms.model.js')(mongoose);
db.materials = require('./materials.model.js')(mongoose);
db.properties = require('./properties.model.js')(mongoose);
db.skills = require("./skills.model.js")(mongoose);
db.jobs =  require("./jobs.model.js")(mongoose);
db.invoices = require("./invoices.model.js")(mongoose);
db.payments = require("./payment.model.js")(mongoose);
db.datelogs = require("./datelog.model.js")(mongoose);
db.contractor_payables = require("./contractor_payable.model.js")(mongoose);
db.cis_rates = require("./cis_rates.model.js")(mongoose);
db.travel_rates = require("./travel_rates.model.js");
module.exports = db;
