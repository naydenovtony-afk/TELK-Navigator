export default function DashboardLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-medical-surface rounded-lg" />
          <div className="h-4 w-64 bg-medical-surface rounded" />
        </div>
        <div className="h-9 w-32 bg-medical-surface rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-medical-border p-6 space-y-3">
            <div className="h-4 w-3/4 bg-medical-surface rounded" />
            <div className="h-3 w-1/2 bg-medical-surface rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
