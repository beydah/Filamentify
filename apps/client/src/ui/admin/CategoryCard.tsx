import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/controls/card"
import { Button } from "@/ui/controls/button"
import { Input } from "@/ui/controls/input"
import { Label } from "@/ui/controls/label"
import { Tag, Plus, Trash2, Loader2, ChevronUp, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

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
  const [isOpen, setIsOpen] = React.useState(true)
  const [newName, setNewName] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    await onAdd(newName.trim())
    setNewName("")
  }

  return (
    <Card id={id} className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8 p-0"
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}>
        <div className="overflow-hidden">
          <CardContent className="pb-6">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                placeholder={t("common.add_category")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-background/40 border-muted/30 h-10"
              />
              <Button size="icon" type="submit" disabled={addingCategory || !newName.trim()}>
                {addingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div key={cat.ID} className="group relative">
                  <span className="px-2.5 py-1 pr-7 rounded-md bg-muted/30 border border-muted/20 text-xs font-medium flex items-center gap-1">
                    {cat.Name}
                  </span>
                  <button
                    onClick={() => onDelete(cat.ID)}
                    disabled={deletingCategoryId === cat.ID}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {deletingCategoryId === cat.ID ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  )
}
