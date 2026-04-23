import * as React from "react"
import { useTranslation } from "react-i18next"
import { 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Tag,
  Loader2,
  Trash2,
  Check,
  ChevronsUpDown,
  ExternalLink,
  MoreVertical,
  Box
} from "lucide-react"
import { Button } from "@/ui/controls/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/controls/card"
import { cn } from "@/lib/utils"
import { Input } from "@/ui/controls/input"
import { Label } from "@/ui/controls/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/controls/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/controls/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/ui/controls/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/controls/dropdown-menu"
import { toast } from "sonner"

interface MaterialCategory {
  ID: number
  Name: string
}

interface Material {
  ID: number
  CategoryID: number
  CategoryName: string
  Name: string
  Quantity: number
  TotalPrice: number
  Link: string
}

const toTitleCase = (str: string) => {
  return str.split(' ').map(w => w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1).toLocaleLowerCase('tr-TR')).join(' ');
}

export default function MaterialsPage() {
  const { t } = useTranslation()
  const [isFormOpen, setIsFormOpen] = React.useState(true)
  const [openCategory, setOpenCategory] = React.useState(false)
  
  const [materials, setMaterials] = React.useState<Material[]>([])
  const [categories, setCategories] = React.useState<MaterialCategory[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [addingCategory, setAddingCategory] = React.useState(false)
  const [newCategory, setNewCategory] = React.useState("")
  const [deletingCategoryId, setDeletingCategoryId] = React.useState<number | null>(null)

  const [formData, setFormData] = React.useState({
    name: "",
    categoryId: "",
    quantity: "1",
    totalPrice: "0",
    link: ""
  })

  const fetchData = React.useCallback(async () => {
    try {
      const [matRes, catRes] = await Promise.all([
        fetch("http://localhost:3001/api/materials"),
        fetch("http://localhost:3001/api/material-categories")
      ])
      const matData = await matRes.json()
      const catData = await catRes.json()
      setMaterials(matData)
      setCategories(catData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.trim()) return
    setAddingCategory(true)
    try {
      const response = await fetch("http://localhost:3001/api/material-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: toTitleCase(newCategory) })
      })
      if (response.ok) {
        setNewCategory("")
        fetchData()
      }
    } catch (error) {
      console.error("Failed to add category:", error)
    } finally {
      setAddingCategory(false)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    setDeletingCategoryId(id)
    try {
      const response = await fetch(`http://localhost:3001/api/material-categories/${id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        toast.success(t("common.notifications.cat_deleted"))
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || t("common.notifications.cat_delete_error"))
      }
    } catch (error) {
      console.error("Failed to delete category:", error)
    } finally {
      setDeletingCategoryId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.categoryId) return
    setSubmitting(true)
    try {
      const response = await fetch("http://localhost:3001/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: toTitleCase(formData.name),
          categoryId: parseInt(formData.categoryId),
          quantity: parseInt(formData.quantity),
          totalPrice: parseFloat(formData.totalPrice),
          link: formData.link
        })
      })
      if (response.ok) {
        toast.success(t("common.notifications.added"))
        setFormData({
          name: "",
          categoryId: "",
          quantity: "1",
          totalPrice: "0",
          link: ""
        })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to add material:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMaterial = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/materials/${id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        toast.success(t("common.notifications.deleted"))
        fetchData()
      }
    } catch (error) {
      console.error("Failed to delete material:", error)
    }
  }

  const isFormValid = formData.name && formData.categoryId

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {t("nav.materials")}
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  {t("materials.save")}
                </CardTitle>
                <CardDescription>
                  {t("materials.new_record_desc")}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="h-8 w-8 p-0"
              >
                {isFormOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <div className={cn(
              "grid transition-all duration-300 ease-in-out",
              isFormOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}>
              <div className="overflow-hidden">
                <CardContent className="pb-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("materials.name")}</Label>
                      <Input
                        placeholder={t("materials.name_placeholder")}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-background/40 border-muted/30 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("materials.category")}</Label>
                      <Popover open={openCategory} onOpenChange={setOpenCategory}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCategory}
                            className="w-full justify-between bg-background/40 border-muted/30 h-10 font-normal px-3"
                          >
                            <span className="truncate">
                                {formData.categoryId
                                  ? categories.find((cat) => cat.ID.toString() === formData.categoryId)?.Name
                                  : t("common.select_category")}
                            </span>
                            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                          <div className="flex items-center justify-between p-2 border-b border-muted/20 bg-muted/5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("materials.category")}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 p-0 text-primary hover:bg-primary/10"
                              onClick={() => {
                                setOpenCategory(false)
                                document.getElementById('category-management')?.scrollIntoView({ behavior: 'smooth' })
                              }}
                                title={t("common.add_category")}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Command>
                            <CommandInput placeholder={t("common.search_category")} />
                            <CommandList className="max-h-[200px] overflow-y-auto scrollbar-none">
                              <CommandEmpty>{t("common.category_not_found")}</CommandEmpty>
                              <CommandGroup>
                                {categories.map((cat) => (
                                  <CommandItem
                                    key={cat.ID}
                                    value={cat.Name}
                                    onSelect={() => {
                                      setFormData({ ...formData, categoryId: cat.ID.toString() })
                                      setOpenCategory(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.categoryId === cat.ID.toString() ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {cat.Name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("materials.quantity")}</Label>
                        <Input
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          className="bg-background/40 border-muted/30 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("materials.total_price")} (TL)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.totalPrice}
                          onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                          className="bg-background/40 border-muted/30 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("materials.link")}</Label>
                      <Input
                        placeholder="Ürün linki (isteğe bağlı)"
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        className="bg-background/40 border-muted/30 transition-all"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={submitting || !isFormValid}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      {t("materials.save")}
                    </Button>
                  </form>
                </CardContent>
              </div>
            </div>
          </Card>

          <Card id="category-management" className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                {t("materials.categories")}
              </CardTitle>
              <CardDescription>{t("materials.categories_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <Input
                  placeholder={t("models.add_category_placeholder")}
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="bg-background/40 border-muted/30"
                />
                <Button size="icon" type="submit" disabled={addingCategory || !newCategory.trim()}>
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
                      onClick={() => handleDeleteCategory(cat.ID)}
                      disabled={deletingCategoryId === cat.ID}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {deletingCategoryId === cat.ID ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg h-full flex flex-col overflow-hidden transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Box className="h-5 w-5 text-primary" />
                    {t("materials.inventory")}
                  </CardTitle>
                  <CardDescription>
                    {t("materials.inventory_desc")}
                  </CardDescription>
                </div>
                <div className="bg-muted/30 px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground flex items-center gap-2 border border-muted/20">
                   {t("filament.total")}: {materials.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0 border-t border-muted/20">
               {loading ? (
                 <div className="flex h-64 items-center justify-center">
                   <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
                 </div>
               ) : (
                 <Table>
                   <TableHeader className="bg-muted/10">
                     <TableRow>
                       <TableHead className="px-6">{t("models.table.name")}</TableHead>
                       <TableHead className="text-center">{t("models.table.category")}</TableHead>
                       <TableHead className="text-center">{t("materials.table.unit_price")}</TableHead>
                       <TableHead className="text-center">{t("materials.table.current")}</TableHead>
                       <TableHead className="text-center">{t("materials.table.link")}</TableHead>
                       <TableHead className="px-6 text-right"></TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {materials.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={6} className="h-48 text-center text-muted-foreground opacity-50">
                           <Search className="h-12 w-12 mx-auto mb-2" />
                           <p>{t("materials.table.no_data")}</p>
                         </TableCell>
                       </TableRow>
                     ) : (
                       materials.map((m) => (
                         <TableRow key={m.ID} className="hover:bg-muted/5 transition-colors border-muted/10 h-16">
                           <TableCell className="px-6 font-medium">{m.Name}</TableCell>
                           <TableCell className="text-center">
                             <span className="px-2 py-0.5 rounded-full bg-muted/20 text-[11px]">
                                {m.CategoryName}
                             </span>
                           </TableCell>
                           <TableCell className="text-center font-bold">{(m.TotalPrice / m.Quantity).toFixed(2)} TL</TableCell>
                           <TableCell className="text-center">{m.Quantity} Adet</TableCell>
                           <TableCell className="text-center">
                             {m.Link ? (
                               <a href={m.Link} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                 Link <ExternalLink className="h-3 w-3" />
                               </a>
                             ) : "-"}
                           </TableCell>
                           <TableCell className="px-6 text-right">
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/20">
                                   <MoreVertical className="h-4 w-4" />
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end" className="w-40">
                                 <DropdownMenuItem onClick={() => handleDeleteMaterial(m.ID)} className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer">
                                   <Trash2 className="mr-2 h-4 w-4" />
                                   {t("filament.actions.delete")}
                                 </DropdownMenuItem>
                               </DropdownMenuContent>
                             </DropdownMenu>
                           </TableCell>
                         </TableRow>
                       ))
                     )}
                   </TableBody>
                 </Table>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
