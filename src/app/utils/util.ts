export const formatLocalDate = (dateObj: Date) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const uid = function () {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const compareDates = (date1: Date, date2: Date) => {
  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);

  if (date1 < date2) return -1;
  if (date1 > date2) return 1;
  else return 0;
};
