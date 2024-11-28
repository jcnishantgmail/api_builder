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

exports.computeHourlyRate = (contractorsList, contractor, date) => {
    let contractorInfoArr = contractorsList.filter((contractorInfo) => {
      return String(contractorInfo._id) === String(contractor);
    });
    if(contractorInfoArr) {
      let hourlyRateLog = contractorInfoArr[0].hourlyRateLog;
      let hourlyRate = hourlyRateLog[0].hourlyRate;
      for(let log of hourlyRateLog) {
        if(new Date(date) >= log.rateUpdatedAt) {
          hourlyRate = log.hourlyRate;
        }
      }
      return hourlyRate;
    } else return 0;
  }
  
exports.computeCISRate = (contractorsList, contractor) => {
    let contractorInfoArr = contractorsList.filter((contractorInfo) => {
      return String(contractorInfo._id) === String(contractor);
    });
    if(contractorInfoArr) {
      return contractorInfoArr[0].cis_rate.rate;
    } else return 0;
}