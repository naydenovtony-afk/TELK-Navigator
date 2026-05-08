export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl animate-pulse">
      <div className="h-8 w-56 bg-medical-surface rounded-lg mb-2" />
      <div className="h-4 w-72 bg-medical-surface rounded mb-8" />
      <div className="bg-white rounded-2xl border border-medical-border p-4 sm:p-6 mb-4">
        <div className="h-4 w-32 bg-medical-surface rounded mb-4" />
        <div className="h-10 w-full bg-medical-surface rounded-lg mb-3" />
        <div className="h-10 w-full bg-medical-surface rounded-lg mb-3" />
        <div className="h-24 w-full bg-medical-surface rounded-lg mb-4" />
        <div className="h-10 w-36 bg-medical-surface rounded-lg" />
      </div>
    </div>
  )
}
