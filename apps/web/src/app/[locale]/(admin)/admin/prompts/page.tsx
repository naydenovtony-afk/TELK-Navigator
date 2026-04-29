import { db } from '@/db'
import { promptModules } from '@/db/schema'
import { PromptManager } from '@/components/admin/prompt-manager'

export const dynamic = 'force-dynamic'

export default async function AdminPromptsPage() {
  const rows = await db.query.promptModules.findMany()

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-medical-navy">Prompt модули</h1>
        <p className="text-sm text-medical-slate mt-1">
          Управлявайте AI промптовете, използвани при анализ на документи.
        </p>
      </div>
      <PromptManager initialPrompts={rows} />
    </div>
  )
}
