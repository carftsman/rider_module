exports.getCurrentSlot = () => {

  const now = new Date();
  const hour = now.getHours();

  let slotName, slotStart, slotEnd, target;

  if (hour >= 12 && hour < 15) {

    slotName = "PEAK";
    target = 5;

    slotStart = new Date();
    slotStart.setMinutes(0,0,0);

    slotEnd = new Date();
    slotEnd.setHours(15,0,0,0);

  }
  else {

    slotName = "NORMAL";
    target = 8;

    slotStart = new Date();
    slotStart.setMinutes(0,0,0);

    slotEnd = new Date();
    slotEnd.setHours(12,0,0,0);

  }

  return { slotName, slotStart, slotEnd, target };

};
