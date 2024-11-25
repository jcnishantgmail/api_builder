const db = require('../models');

exports.computeTravelCost = async (distance_travelled) => {
    const travel_rates = await db.travel_rates.find({isDeleted: false});
    for(let i = 0;i<travel_rates.length;i++) {
      if(+distance_travelled >= +(travel_rates[i].start) && +distance_travelled < +(travel_rates[i].end)) {
        return travel_rates[i].amount;
      }
    }
    return 0;
  }