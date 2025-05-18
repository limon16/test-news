export function formatServerDate (dateString) {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) { return dateString }
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  } catch (e) {
    return dateString
  }
}
