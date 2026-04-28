function getProximityScore(rider, order, routeInfo) {

  const maxETA = 30;

  const maxDeliveryETA = 15;
 
  const pickupScore = 1 - (rider.etaToVendor / maxETA);

  const dropScore = 1 - (routeInfo.etaMinutes / maxDeliveryETA);
 
  const directionBonus = rider.isTowardsVendor ? 0.1 : 0;
 
  return Math.max(0, pickupScore + dropScore + directionBonus);

}
 
module.exports = { getProximityScore };

 