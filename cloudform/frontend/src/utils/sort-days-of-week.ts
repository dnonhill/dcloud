type Days = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

const orderDays = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export function sortDaysOfWeek(days: Days[]) {
  let table = Array(7).fill('');
  days.forEach((d) => (table[orderDays[d]] = d));
  return table.filter((t) => t);
}
