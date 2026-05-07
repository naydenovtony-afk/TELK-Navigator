import { calculateRights } from '@/lib/rights'

describe('calculateRights', () => {
  describe('tier classification', () => {
    it('returns null tier for percent below 50', () => {
      expect(calculateRights(49).tier).toBeNull()
      expect(calculateRights(0).tier).toBeNull()
    })

    it('returns tier 50 for percent 50–70', () => {
      expect(calculateRights(50).tier).toBe(50)
      expect(calculateRights(70).tier).toBe(50)
    })

    it('returns tier 71 for percent 71–90', () => {
      expect(calculateRights(71).tier).toBe(71)
      expect(calculateRights(90).tier).toBe(71)
    })

    it('returns tier 91 for percent 91–100', () => {
      expect(calculateRights(91).tier).toBe(91)
      expect(calculateRights(100).tier).toBe(91)
    })
  })

  describe('monthly allowance', () => {
    it('returns null allowance below 50%', () => {
      expect(calculateRights(49).monthlyAllowance).toBeNull()
    })

    it('returns 75 BGN for tier 50', () => {
      expect(calculateRights(50).monthlyAllowance).toBe(75)
      expect(calculateRights(70).monthlyAllowance).toBe(75)
    })

    it('returns 150 BGN for tier 71', () => {
      expect(calculateRights(71).monthlyAllowance).toBe(150)
      expect(calculateRights(90).monthlyAllowance).toBe(150)
    })

    it('returns 225 BGN for tier 91', () => {
      expect(calculateRights(91).monthlyAllowance).toBe(225)
      expect(calculateRights(100).monthlyAllowance).toBe(225)
    })
  })

  describe('benefits', () => {
    it('returns no benefits below 50%', () => {
      expect(calculateRights(49).benefits).toHaveLength(0)
    })

    it('returns 6 benefits at exactly 50%', () => {
      expect(calculateRights(50).benefits).toHaveLength(6)
    })

    it('returns more benefits at 71% (unlocks 5 more)', () => {
      const at50 = calculateRights(70).benefits.length
      const at71 = calculateRights(71).benefits.length
      expect(at71).toBeGreaterThan(at50)
    })

    it('returns all 15 benefits at 91%', () => {
      expect(calculateRights(91).benefits).toHaveLength(15)
      expect(calculateRights(100).benefits).toHaveLength(15)
    })

    it('benefits have required fields', () => {
      const { benefits } = calculateRights(71)
      benefits.forEach((b) => {
        expect(b).toHaveProperty('id')
        expect(b).toHaveProperty('label')
        expect(b).toHaveProperty('detail')
        expect(b).toHaveProperty('category')
      })
    })
  })

  describe('input clamping', () => {
    it('clamps negative values to 0', () => {
      const result = calculateRights(-10)
      expect(result.percent).toBe(0)
      expect(result.tier).toBeNull()
    })

    it('clamps values above 100 to 100', () => {
      const result = calculateRights(150)
      expect(result.percent).toBe(100)
      expect(result.tier).toBe(91)
    })

    it('rounds fractional percentages', () => {
      expect(calculateRights(50.4).percent).toBe(50)
      expect(calculateRights(50.5).percent).toBe(51)
    })
  })

  describe('tier boundary correctness', () => {
    it('49% does not unlock 50% tier benefits', () => {
      expect(calculateRights(49).benefits).toHaveLength(0)
    })

    it('70% does not unlock 71% tier benefits', () => {
      const result = calculateRights(70)
      const has71Benefit = result.benefits.some((b) => b.id === 'B007')
      expect(has71Benefit).toBe(false)
    })

    it('90% does not unlock 91% tier benefits', () => {
      const result = calculateRights(90)
      const has91Benefit = result.benefits.some((b) => b.id === 'B012')
      expect(has91Benefit).toBe(false)
    })
  })
})
