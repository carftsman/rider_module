function getWeekNumber(date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = Math.floor((date - firstDay) / 86400000);
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
}

function getWeekRange(week, year) {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = (week - 1) * 7;

  const start = new Date(firstDayOfYear);
  start.setDate(firstDayOfYear.getDate() + daysOffset);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getISOWeekRange(week, year) {
  // Jan 4 is always in week 1 (ISO rule)
  const jan4 = new Date(year, 0, 4);

  // Get Monday of week 1
  const dayOfWeek = jan4.getDay() || 7; // Sunday = 7
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - (dayOfWeek - 1));
  week1Monday.setHours(0, 0, 0, 0);

  // Calculate target week start (Monday)
  const start = new Date(week1Monday);
  start.setDate(week1Monday.getDate() + (week - 1) * 7);

  // End of week (Sunday)
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}


// function getCurrentISOWeek() {
//   const today = new Date();
//   const temp = new Date(today);
//   console.log("Today's Date:", temp);
//   temp.setHours(0, 0, 0, 0);

//   // Thursday determines the week
//   temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));

//   const week1 = new Date(temp.getFullYear(), 0, 4);
//   console.log("Week 1 Reference Date:", week1);
//   return {
//     week: Math.ceil((((temp - week1) / 86400000) + 1) / 7),
//     year: temp.getFullYear()
//   };
// }

function getCurrentISOWeek() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  // ISO week date weeks start on Monday, so correct day number
  const dayNum = (date.getDay() + 6) % 7;

  // Set date to Thursday of current week
  date.setDate(date.getDate() - dayNum + 3);

  // ISO year is the year of the Thursday
  const isoYear = date.getFullYear();

  // Find first Thursday of ISO year
  const firstThursday = new Date(isoYear, 0, 4);
  firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);

  // Calculate week number
  const week = 1 + Math.round(
    (date - firstThursday) / (7 * 24 * 60 * 60 * 1000)
  );

  return { week, year: isoYear };
}




module.exports = { getWeekNumber, getWeekRange, getISOWeekRange, getCurrentISOWeek};