import { RightsCalculator } from '@/components/rights/rights-calculator'

export default function RightsPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-medical-navy">Калкулатор на права</h1>
        <p className="text-sm text-medical-slate mt-1">
          Въведете вашата степен на увреждане и вижте на какви права имате право.
        </p>
      </div>

      <RightsCalculator />
    </div>
  )
}
