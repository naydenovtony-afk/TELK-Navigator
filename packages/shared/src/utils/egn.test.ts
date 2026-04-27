import { getAgeFromEGN, isMinorByEGN, getBirthDateFromEGN } from './egn'

describe('getAgeFromEGN', () => {
  it('decodes 1900s century correctly', () => {
    const birth = getBirthDateFromEGN('7501010000')
    expect(birth.getFullYear()).toBe(1975)
    expect(birth.getMonth()).toBe(0)
    expect(birth.getDate()).toBe(1)
  })

  it('decodes 2000s century correctly (mm > 20)', () => {
    const birth = getBirthDateFromEGN('0522010000')
    expect(birth.getFullYear()).toBe(2005)
    expect(birth.getMonth()).toBe(1)
    expect(birth.getDate()).toBe(1)
  })

  it('decodes 1800s century correctly (mm > 40)', () => {
    const birth = getBirthDateFromEGN('9541010000')
    expect(birth.getFullYear()).toBe(1895)
    expect(birth.getMonth()).toBe(0)
    expect(birth.getDate()).toBe(1)
  })

  it('returns correct age for adult', () => {
    const age = getAgeFromEGN('9001010000')
    expect(age).toBeGreaterThanOrEqual(35)
  })
})

describe('isMinorByEGN', () => {
  it('returns true for person born in 2010', () => {
    expect(isMinorByEGN('1021010000')).toBe(true)
  })

  it('returns false for adult born in 1990', () => {
    expect(isMinorByEGN('9001010000')).toBe(false)
  })
})
