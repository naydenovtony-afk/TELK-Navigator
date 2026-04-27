export function getAgeFromEGN(egn: string): number {
  const yy = parseInt(egn.slice(0, 2), 10)
  const mm = parseInt(egn.slice(2, 4), 10)
  const dd = parseInt(egn.slice(4, 6), 10)

  let year: number
  let realMonth: number

  if (mm > 40) {
    year = 1800 + yy
    realMonth = mm - 40
  } else if (mm > 20) {
    year = 2000 + yy
    realMonth = mm - 20
  } else {
    year = 1900 + yy
    realMonth = mm
  }

  const birthDate = new Date(year, realMonth - 1, dd)
  const today = new Date()

  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

export function isMinorByEGN(egn: string): boolean {
  return getAgeFromEGN(egn) < 18
}

export function getBirthDateFromEGN(egn: string): Date {
  const yy = parseInt(egn.slice(0, 2), 10)
  const mm = parseInt(egn.slice(2, 4), 10)
  const dd = parseInt(egn.slice(4, 6), 10)

  let year: number
  let realMonth: number

  if (mm > 40) {
    year = 1800 + yy
    realMonth = mm - 40
  } else if (mm > 20) {
    year = 2000 + yy
    realMonth = mm - 20
  } else {
    year = 1900 + yy
    realMonth = mm
  }

  return new Date(year, realMonth - 1, dd)
}
