export const isBadPart = /\d/
export const singleQuoteRegex = /'/g
export const plusRegex = /\+|_/g
export const minusRegex = /-/g

const yearRegex = /^\d{4}$/
const yearMonthRegex = /^\d{6}$/
const yearMonthDayRegex = /^\d{8}$/
const hyphenYearRegex = /^\d{4}-\d{4}$/

// Helper function to check if a string is a valid date
function isValidDate(date) {
    return date instanceof Date && !isNaN(date);
}

// Function to parse dates from extracted numbers
export function getDates(numbers) {
  const dates = []

  numbers.forEach(num => {
    let date

    if (yearRegex.test(num)) {
      // YYYY
      date = new Date(num)
    } else if (yearMonthRegex.test(num)) {
      // YYYYMM
      date = new Date(num.substring(0, 4), num.substring(4, 6) - 1)
    } else if (yearMonthDayRegex.test(num)) {
      // YYYYMMDD
      date = new Date(num.substring(0, 4), num.substring(4, 6) - 1, num.substring(6, 8))
    } else if (hyphenYearRegex.test(num)) {
      // YYYY-YYYY
      const years = num.split('-')
      const startDate = new Date(years[0])
      const endDate = new Date(years[1])

      if (isValidDate(startDate) && isValidDate(endDate)) {
        dates.push({ startDate, endDate })
      }

      return // Skip to the next number
    }

    if (isValidDate(date)) {
      dates.push(date)
    }
  })

  return dates
}
