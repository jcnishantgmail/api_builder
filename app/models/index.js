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
module.exports = db;
