export const isBadPart = /\d/
export const singleQuoteRegex = /'/g
export const plusRegex = /\+|_/g
export const minusRegex = /-/g

const yearRegex = /^\d{4}$/
const yearMonthRegex = /^\d{6}$/
const yearMonthDayRegex = /^\d{8}$/

/**
 *
 */
export function getDates(filename) {
  const numbers = filename.substring(0, filename.indexOf('.'))

  let date

  if (yearRegex.test(numbers)) {
    // YYYY
    date = new Date(numbers)
  } else if (yearMonthRegex.test(numbers)) {
    // YYYYMM
    date = new Date(numbers.substring(0, 4), numbers.substring(4, 6) - 1)
  } else if (yearMonthDayRegex.test(numbers)) {
    // YYYYMMDD
    date = new Date(numbers.substring(0, 4), numbers.substring(4, 6) - 1, numbers.substring(6, 8))
  }

  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
}
