/**
 * Helper function to convert time string (e.g., "10:00 AM", "02:30 PM", "14:00") 
 * to minutes from midnight for accurate comparison and parsing.
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  // Match hours, minutes, optional seconds and optional AM/PM
  const match = timeStr.match(/(\d+):(\d+)(?::\d+)?\s*(AM|PM)?/i);
  if (!match) return 0;
  
  let [_, hours, minutes, ampm] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);
  
  if (ampm) {
    ampm = ampm.toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }
  
  return hours * 60 + minutes;
};

/**
 * Parses a time string into a Date object with a specific base date.
 */
export const parseTimeToDate = (timeStr, baseDate = new Date()) => {
  if (!timeStr) return baseDate;
  const totalMinutes = timeToMinutes(timeStr);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
};
