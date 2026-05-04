export default function CaseDetailLoading() {
  return (
    <div className="p-8 max-w-3xl animate-pulse">
      <div className="h-4 w-48 bg-medical-surface rounded mb-6" />
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="h-8 w-72 bg-medical-surface rounded-lg" />
          <div className="h-3 w-40 bg-medical-surface rounded" />
        </div>
        <div className="h-7 w-24 bg-medical-surface rounded-full" />
      </div>
      <div className="h-5 w-40 bg-medical-surface rounded mb-3" />
      <div className="bg-white rounded-2xl border border-medical-border p-8 mb-10">
        <div className="h-32 w-full bg-medical-surface rounded-xl" />
      </div>
      <div className="h-5 w-36 bg-medical-surface rounded mb-4" />
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-medical-border p-5 space-y-2">
            <div className="h-4 w-1/2 bg-medical-surface rounded" />
            <div className="h-3 w-1/3 bg-medical-surface rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
