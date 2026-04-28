function getPerformanceScore(rider) {

  const acceptanceWeight = rider.acceptanceRate / 100;

  const ratingWeight = rider.rating / 5;
 
  return (acceptanceWeight + ratingWeight) / 2;

}
 
module.exports = { getPerformanceScore };

 