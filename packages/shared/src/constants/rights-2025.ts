export interface RightsTier {
  monthlySupport: number
  extraLeave?: number
  taxRelief?: number
  jobProtection?: boolean
  partialMeds?: boolean
  fullMeds?: boolean
  vignette?: boolean
  parking?: boolean
}

export const RIGHTS_2025: Record<string, RightsTier> = {
  above50: {
    monthlySupport: 44.66,
    extraLeave: 5,
    taxRelief: 660,
    jobProtection: true,
  },
  above71: {
    monthlySupport: 95.70,
    extraLeave: 5,
    taxRelief: 660,
    jobProtection: true,
    partialMeds: true,
  },
  above91: {
    monthlySupport: 429.90,
    extraLeave: 5,
    taxRelief: 660,
    jobProtection: true,
    fullMeds: true,
  },
  above100withAid: {
    monthlySupport: 491.31,
    extraLeave: 5,
    taxRelief: 660,
    jobProtection: true,
    fullMeds: true,
    vignette: true,
    parking: true,
  },
}
