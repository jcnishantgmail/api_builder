const db = require('../models');

exports.addMaterial = async (data) => {
    await db.materials.create(data)
}