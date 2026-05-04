export default function DocumentsLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="h-8 w-40 bg-medical-surface rounded-lg mb-8" />
      <div className="bg-white rounded-2xl border border-medical-border overflow-hidden">
        <div className="px-5 py-3 bg-medical-surface/40 border-b border-medical-border">
          <div className="h-3 w-80 bg-medical-surface rounded" />
        </div>
        <div className="divide-y divide-medical-border">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <div className="w-9 h-9 bg-medical-surface rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-1/2 bg-medical-surface rounded" />
                <div className="h-3 w-1/3 bg-medical-surface rounded" />
              </div>
              <div className="h-5 w-16 bg-medical-surface rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
