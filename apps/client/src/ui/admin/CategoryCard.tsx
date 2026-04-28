import React from "react"
import { Button } from "@/ui/controls/button"
import { Input } from "@/ui/controls/input"
import { Loader2, Plus, Tag, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AdminSectionCard } from "@/ui/admin/admin-section-card"

interface Category {
  ID: number
  Name: string
}

interface CategoryCardProps {
  title: string
  description: string
  categories: Category[]
  onAdd: (name: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
  isLoading?: boolean
  addingCategory?: boolean
  deletingCategoryId?: number | null
  id?: string
}

export function CategoryCard({
  title,
  description,
  categories,
  onAdd,
  onDelete,
  addingCategory,
  deletingCategoryId,
  id
}: CategoryCardProps) {
  const { t } = useTranslation()
  const [newName, setNewName] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    await onAdd(newName.trim())
    setNewName("")
  }

  return (
    <AdminSectionCard id={id} title={title} description={description} icon={Tag}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder={t("common.add_category")}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="h-10 border-muted/30 bg-background/40"
        />
        <Button size="icon" type="submit" disabled={addingCategory || !newName.trim()}>
          {addingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <div key={cat.ID} className="group relative">
            <span className="flex items-center gap-1 rounded-md border border-muted/20 bg-muted/30 px-2.5 py-1 pr-7 text-xs font-medium">
              {cat.Name}
            </span>
            <button
              onClick={() => onDelete(cat.ID)}
              disabled={deletingCategoryId === cat.ID}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground opacity-0 transition-colors group-hover:opacity-100 hover:text-destructive"
            >
              {deletingCategoryId === cat.ID ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
            </button>
          </div>
        ))}
      </div>
    </AdminSectionCard>
  )
}
