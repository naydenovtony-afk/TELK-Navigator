export default function DeadlinesLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-8 w-36 bg-medical-surface rounded-lg" />
          <div className="h-4 w-52 bg-medical-surface rounded" />
        </div>
        <div className="h-9 w-36 bg-medical-surface rounded-lg" />
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-medical-border px-5 py-4 flex items-center gap-4">
            <div className="w-5 h-5 rounded-full bg-medical-surface shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-2/3 bg-medical-surface rounded" />
              <div className="h-3 w-1/3 bg-medical-surface rounded" />
            </div>
            <div className="h-5 w-16 bg-medical-surface rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
