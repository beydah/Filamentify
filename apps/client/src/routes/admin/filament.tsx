import * as React from "react"
import { useTranslation } from "react-i18next"
import { 
  Plus, 
  Loader2, 
  Tag, 
  Calendar as CalendarIcon, 
  Palette, 
  Info, 
  Check, 
  Trash2,
  ChevronsUpDown,
  Search,
  MoreVertical,
  Edit3,
  ChevronUp,
  ChevronDown,
  X,
  Filter,
  FilterX,
  Eye,
  Database,
  Minus,
  ExternalLink
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { tr, enUS } from "date-fns/locale"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/ui/controls/button"
import { Input } from "@/ui/controls/input"
import { Label } from "@/ui/controls/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/controls/card"
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
import { Calendar } from "@/ui/controls/calendar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/controls/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/controls/dialog"

interface Category {
  ID: number
  Name: string
}

interface Filament {
  ID: number
  CategoryID: number
  CategoryName: string
  Name: string
  Color: string
  Price: number
  Gram: number
  Available_Gram: number
  PurchaseDate: string
  Status: string
  Link?: string
}

const presetColors = [
  { name: "Black", value: "#000000" },
  { name: "Gray", value: "#4b5563" },
  { name: "White", value: "#ffffff" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Purple", value: "#a855f7" },
  { name: "Indigo", value: "#7c3aed" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Green", value: "#10b981" },
  { name: "Lime", value: "#84cc16" },
  { name: "Yellow", value: "#f59e0b" },
  { name: "Orange", value: "#f97316" },
  { name: "Rose", value: "#f43f5e" }
]

const toTitleCase = (str: string) => {
  return str;
}

export default function FilamentPage() {
  const { t, i18n } = useTranslation()
  const currentLocale = i18n.language === 'tr' ? tr : enUS
  
  const [filaments, setFilaments] = React.useState<Filament[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [addingCategory, setAddingCategory] = React.useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = React.useState<number | null>(null)
  
  // Section Toggle State
  const [isFormOpen, setIsFormOpen] = React.useState(true)
  const [isCategoriesOpen, setIsCategoriesOpen] = React.useState(false)

  // Filter State
  const [filterCategory, setFilterCategory] = React.useState<string>("all")
  const [filterColor, setFilterColor] = React.useState<string>("all")
  const [filterStock, setFilterStock] = React.useState<string>("all") // all, 250, 500, 750

  const uniqueColors = React.useMemo(() => {
    const colors = filaments.map(f => f.Color)
    return Array.from(new Set(colors))
  }, [filaments])

  // Edit State
  const [editingFilament, setEditingFilament] = React.useState<Filament | null>(null)
  const [originalFilament, setOriginalFilament] = React.useState<Filament | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [updating, setUpdating] = React.useState(false)
  const [updateSuccess, setUpdateSuccess] = React.useState(false)
  const [editFormData, setEditFormData] = React.useState({
    name: "",
    categoryId: "",
    color: "#ffffff",
    price: "",
    gram: "",
    purchaseDate: new Date(),
    link: ""
  })

  const [detailFilament, setDetailFilament] = React.useState<Filament | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)

  // Form State
  const [newCategory, setNewCategory] = React.useState("")
  const [formData, setFormData] = React.useState({
    categoryId: "",
    name: "",
    color: presetColors[0].value,
    price: "500",
    gram: "1000",
    purchaseDate: new Date(),
    link: ""
  })

  const [openCategory, setOpenCategory] = React.useState(false)
  const [openColor, setOpenColor] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    try {
      const [filRes, catRes] = await Promise.all([
        fetch("http://localhost:3001/api/filaments"),
        fetch("http://localhost:3001/api/categories"),
      ])
      const filData = await filRes.json()
      const catData = await catRes.json()
      setFilaments(filData)
      setCategories(catData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.trim()) return
    setAddingCategory(true)
    try {
      const response = await fetch("http://localhost:3001/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: toTitleCase(newCategory) }),
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
      const response = await fetch(`http://localhost:3001/api/categories/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success(t("common.notifications.cat_deleted"))
        fetchData()
      } else {
        const error = await response.json()
        if (error.error === "Category is in use and cannot be deleted") {
          toast.error(t("common.notifications.cat_in_use"))
        } else {
          toast.error(error.error || t("common.notifications.cat_delete_error"))
        }
      }
    } catch (error) {
      console.error("Failed to delete category:", error)
    } finally {
      setDeletingCategoryId(null)
    }
  }

  const handleDeleteFilament = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/filaments/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success(t("common.notifications.deleted"))
        fetchData()
      } else {
        toast.error(t("common.notifications.delete_error"))
      }
    } catch (error) {
      console.error("Failed to delete filament:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.categoryId || !formData.name || !formData.price || !formData.gram) {
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch("http://localhost:3001/api/filaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId: parseInt(formData.categoryId),
          name: toTitleCase(formData.name),
          color: formData.color,
          price: parseFloat(formData.price),
          gram: parseInt(formData.gram),
          purchaseDate: formData.purchaseDate.toISOString(),
          link: formData.link
        })
      })

      if (response.ok) {
        toast.success(t("common.notifications.added"))
        setFormData({
          categoryId: "",
          name: "",
          color: presetColors[0].value,
          price: "500",
          gram: "1000",
          purchaseDate: new Date(),
          link: ""
        })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to add filament:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditClick = (f: Filament) => {
    setEditingFilament(f)
    setOriginalFilament(f)
    setEditFormData({
      name: f.Name,
      categoryId: f.CategoryID.toString(),
      color: f.Color,
      price: f.Price.toString(),
      gram: f.Gram.toString(),
      purchaseDate: new Date(f.PurchaseDate),
      link: f.Link || ""
    })
    setIsEditDialogOpen(true)
  }

  const isFieldChanged = (field: string, value: any) => {
    if (!originalFilament) return false
    switch (field) {
      case "name": return value !== originalFilament.Name
      case "categoryId": return value !== originalFilament.CategoryID.toString()
      case "color": return value !== originalFilament.Color
      case "price": return value !== originalFilament.Price.toString()
      case "gram": return value !== originalFilament.Gram.toString()
      case "purchaseDate": return value.getTime() !== new Date(originalFilament.PurchaseDate).getTime()
      case "link": return value !== (originalFilament.Link || "")
      default: return false
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFilament) return
    setUpdating(true)
    try {
      const response = await fetch(`http://localhost:3001/api/filaments/${editingFilament.ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: editFormData.categoryId ? parseInt(editFormData.categoryId) : null,
          price: parseInt(editFormData.price),
          gram: parseInt(editFormData.gram),
          purchaseDate: editFormData.purchaseDate.toISOString(),
          link: editFormData.link
        })
      })
      if (response.ok) {
        setUpdateSuccess(true)
        toast.success(t("common.updated"))
        setIsEditDialogOpen(false)
        setUpdateSuccess(false)
        fetchData()
      }
    } catch (error) {
      console.error("Failed to update filament:", error)
    } finally {
      setUpdating(false)
    }
  }

  const filteredFilaments = filaments.filter(f => {
    if (filterCategory !== "all" && f.CategoryName !== filterCategory) return false
    if (filterColor !== "all" && f.Color !== filterColor) return false
    if (filterStock === "bitti" && f.Available_Gram > 0) return false
    if (filterStock === "az" && (f.Available_Gram <= 0 || f.Available_Gram > 250)) return false
    if (filterStock === "orta" && (f.Available_Gram <= 250 || f.Available_Gram > 500)) return false
    if (filterStock === "dolu" && f.Available_Gram <= 500) return false
    return true
  })

  const isFormValid = formData.name && formData.categoryId && formData.price && formData.gram

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {t("nav.filament")}
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Management */}
        <div className="lg:col-span-4 space-y-6">
          {/* Add Filament Form */}
          <Card className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  {t("filament.new_record")}
                </CardTitle>
                <CardDescription>
                  {t("filament.new_record_desc")}
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
                      <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("filament.name")}</Label>
                      <Input
                        placeholder={t("filament.name_placeholder")}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-background/40 border-muted/30 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-7 space-y-2">
                        <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("filament.category")}</Label>
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
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("filament.category")}</span>
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

                      <div className="col-span-5 space-y-2">
                        <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("filament.table.color")}</Label>
                        <Popover open={openColor} onOpenChange={setOpenColor}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-center bg-background/40 border-muted/30 h-10 font-normal px-3"
                            >
                              <div 
                                className="w-5 h-5 rounded-full border border-black dark:border-white shadow-sm shrink-0" 
                                style={{ backgroundColor: formData.color }} 
                              />
                              <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[80px] p-0" align="start">
                            <Command>
                              <CommandList className="max-h-[200px] overflow-y-auto scrollbar-none">
                                <CommandGroup>
                                  {presetColors.map((color) => (
                                    <CommandItem
                                      key={color.value}
                                      value={color.name}
                                      onSelect={() => {
                                        setFormData({ ...formData, color: color.value })
                                        setOpenColor(false)
                                      }}
                                      className="flex items-center justify-center py-2"
                                    >
                                      <div 
                                        className={cn(
                                          "w-6 h-6 rounded-full border border-black dark:border-white transition-all",
                                          formData.color === color.value ? "scale-110 ring-2 ring-primary/20 shadow-md" : "opacity-80"
                                        )}
                                        style={{ backgroundColor: color.value }} 
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price" className="text-xs tracking-wider text-muted-foreground font-semibold">{t("filament.price")}</Label>
                        <Input
                          id="price"
                          type="number"
                          step="100"
                          min="100"
                          max="2500"
                          placeholder="0"
                          value={formData.price}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setFormData({ ...formData, price: isNaN(val) ? "" : val.toString() });
                          }}
                          required
                          className="bg-background/40 border-muted/30 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gram" className="text-xs tracking-wider text-muted-foreground font-semibold">{t("filament.gram")}</Label>
                        <Input
                          id="gram"
                          type="number"
                          step="100"
                          min="100"
                          max="5000"
                          placeholder="1000"
                          value={formData.gram}
                          onChange={(e) => setFormData({ ...formData, gram: e.target.value })}
                          required
                          className="bg-background/40 border-muted/30 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("materials.link")}</Label>
                      <Input
                        placeholder="https://..."
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        className="bg-background/40 border-muted/30 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {t("filament.purchase_date")}
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal bg-background/40 border-muted/30 h-10",
                              !formData.purchaseDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.purchaseDate ? format(formData.purchaseDate, "PPP", { locale: currentLocale }) : <span>{t("filament.select_date")}</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.purchaseDate}
                            onSelect={(date) => date && setFormData({ ...formData, purchaseDate: date })}
                            disabled={(date) => date > new Date() || date < new Date(new Date().setMonth(new Date().getMonth() - 1))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full shadow-md hover:shadow-lg transition-all" 
                      disabled={submitting || !isFormValid}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("filament.saving")}
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          {t("filament.save")}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </div>
            </div>
          </Card>

          {/* Category Management */}
          <Card id="category-management" className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  {t("common.add_category")}
                </CardTitle>
                <CardDescription>
                  {t("filament.categories_desc")}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="h-8 w-8 p-0"
              >
                {isCategoriesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <div className={cn(
              "grid transition-all duration-300 ease-in-out",
              isCategoriesOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}>
              <div className="overflow-hidden">
                <CardContent className="pb-6">
                  <form onSubmit={handleAddCategory} className="flex gap-2">
                    <Input
                      placeholder={t("filament.add_category_placeholder")}
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="bg-background/40 border-muted/30 focus:border-primary/50 transition-all"
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
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-8">
          <Card className="h-full border-muted/40 bg-card/40 backdrop-blur-md shadow-lg flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{t("filament.inventory")}</CardTitle>
                  <CardDescription>
                    {t("filament.inventory_desc")}
                  </CardDescription>
                </div>
                <div className="bg-muted/30 px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground flex items-center gap-2 border border-muted/20">
                  <Info className="h-3 w-3" />
                  {t("filament.total")}: {filaments.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
                </div>
              ) : (
                <div className="border-t border-muted/20">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow className="hover:bg-transparent border-muted/20">
                        <TableHead className="font-semibold px-6 w-[25%]">{t("filament.table.name")}</TableHead>
                        <TableHead className="font-semibold text-center w-[20%]">
                          <div className="flex items-center justify-center gap-1">
                            {t("filament.table.category")}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-muted/30">
                                  <Filter className={cn("h-3 w-3", filterCategory !== "all" && "text-primary fill-primary")} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="center" className="w-40">
                                <DropdownMenuItem onClick={() => setFilterCategory("all")}>{t("common.all")}</DropdownMenuItem>
                                {categories.map(c => (
                                  <DropdownMenuItem key={c.ID} onClick={() => setFilterCategory(c.Name)}>{c.Name}</DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-center w-[15%]">
                          <div className="flex items-center justify-center gap-1">
                            {t("filament.table.color")}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-muted/30">
                                  <Filter className={cn("h-3 w-3", filterColor !== "all" && "text-primary fill-primary")} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="center" className="w-12 min-w-0 p-2">
                                <DropdownMenuItem onClick={() => setFilterColor("all")} className="justify-center px-0 mb-1">
                                  <div className="w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center text-[8px] font-bold">X</div>
                                </DropdownMenuItem>
                                <div className="flex flex-col gap-2 items-center">
                                  {uniqueColors.map(color => (
                                    <button 
                                      key={color} 
                                      onClick={() => { setFilterColor(color); setOpenColor(false); }}
                                      className={cn(
                                        "w-6 h-6 rounded-full border-2 transition-all hover:scale-110 shadow-sm",
                                        filterColor === color ? "border-primary ring-2 ring-primary/20" : "border-muted"
                                      )}
                                      style={{ backgroundColor: color }}
                                      title={color}
                                    />
                                  ))}
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-center w-[15%]">{t("filament.table.price")}</TableHead>
                        <TableHead className="font-semibold text-center w-[20%]">
                          <div className="flex items-center justify-center gap-1">
                            {t("filament.table.available")}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-muted/30">
                                  <Filter className={cn("h-3 w-3", filterStock !== "all" && "text-primary fill-primary")} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="center" className="w-40">
                                <DropdownMenuItem onClick={() => setFilterStock("all")}>{t("common.all")}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterStock("bitti")}>Bitti</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterStock("az")}>Az</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterStock("orta")}>Orta</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterStock("dolu")}>Dolu</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableHead>
                        <TableHead className="w-[10%] px-6 text-right">
                          {(filterCategory !== "all" || filterColor !== "all" || filterStock !== "all") && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setFilterCategory("all")
                                setFilterColor("all")
                                setFilterStock("all")
                              }}
                              title="Filtreleri Temizle"
                            >
                              <FilterX className="h-3 w-3" />
                            </Button>
                          )}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFilaments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2 opacity-50">
                              <Search className="h-12 w-12" />
                              <p>{t("filament.table.no_data")}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFilaments.map((filament) => (
                          <TableRow key={filament.ID} className="hover:bg-muted/5 transition-colors border-muted/10 h-16">
                            <TableCell className="font-medium text-foreground/90 px-6">
                              {filament.Name || "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-center">
                              <span className="px-2 py-0.5 rounded-full bg-muted/20 text-[11px]">
                                {filament.CategoryName || t("common.no_data")}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center">
                                <div 
                                  className="w-4 h-4 rounded-full border border-black dark:border-white shadow-sm ring-1 ring-muted/20" 
                                  style={{ backgroundColor: filament.Color }} 
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {filament.Price}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col items-center gap-1.5 w-full mx-auto max-w-[100px]">
                                <div className="flex justify-between w-full text-[9px] font-bold uppercase tracking-tight text-muted-foreground/80">
                                  <span>{filament.Available_Gram}g</span>
                                  <span>{filament.Gram}g</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full transition-all duration-700",
                                      (filament.Available_Gram / filament.Gram) < 0.2 ? 'bg-destructive' : 'bg-primary'
                                    )}
                                    style={{ width: `${(filament.Available_Gram / filament.Gram) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/20">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem onClick={() => { setDetailFilament(filament); setIsDetailOpen(true); }} className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t("common.details")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditClick(filament)} className="cursor-pointer">
                                    <Edit3 className="mr-2 h-4 w-4" />
                                    {t("common.edit")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteFilament(filament.ID)}
                                    className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t("common.delete")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("filament.edit_dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("filament.edit_dialog.desc")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6 py-4">
            <div className="space-y-4">
              {/* Info Line */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-muted/10">
                <div 
                  className="w-5 h-5 rounded-full border border-black dark:border-white shadow-sm shrink-0" 
                  style={{ backgroundColor: editingFilament?.Color }}
                />
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-bold truncate">{editingFilament?.Name}</span>
                  <span className="text-muted-foreground/60">|</span>
                  <span className="text-sm text-muted-foreground truncate">{editingFilament?.CategoryName}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("filament.category")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-between font-normal", isFieldChanged("categoryId", editFormData.categoryId) && "border-yellow-400 ring-1 ring-yellow-400/50")}>
                      {categories.find(c => c.ID.toString() === editFormData.categoryId)?.Name || t("common.select")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t("common.search")} />
                      <CommandList>
                        <CommandEmpty>{t("common.no_data")}</CommandEmpty>
                        <CommandGroup>
                          {categories.map((cat) => (
                            <CommandItem
                              key={cat.ID}
                              onSelect={() => setEditFormData({ ...editFormData, categoryId: cat.ID.toString() })}
                            >
                              <Check className={cn("mr-2 h-4 w-4", editFormData.categoryId === cat.ID.toString() ? "opacity-100" : "opacity-0")} />
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
                  <Label htmlFor="edit-price" className="text-xs tracking-wider text-muted-foreground font-semibold">{t("filament.price")}</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="100"
                    min="100"
                    max="2500"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                    required
                    className={cn("bg-background/40 text-left", isFieldChanged("price", editFormData.price) && "border-yellow-400 ring-1 ring-yellow-400/50")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gram" className="text-xs tracking-wider text-muted-foreground font-semibold">{t("filament.gram")}</Label>
                  <Input
                    id="edit-gram"
                    type="number"
                    step="100"
                    min="100"
                    max="5000"
                    value={editFormData.gram}
                    onChange={(e) => setEditFormData({ ...editFormData, gram: e.target.value })}
                    required
                    className={cn("bg-background/40 text-left", isFieldChanged("gram", editFormData.gram) && "border-yellow-400 ring-1 ring-yellow-400/50")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("materials.link")}</Label>
                <Input
                  placeholder="https://..."
                  value={editFormData.link}
                  onChange={(e) => setEditFormData({ ...editFormData, link: e.target.value })}
                  className={cn("bg-background/40 transition-all", isFieldChanged("link", editFormData.link) && "border-yellow-400 ring-1 ring-yellow-400/50")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {t("filament.purchase_date")}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal h-10"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editFormData.purchaseDate ? format(editFormData.purchaseDate, "PPP", { locale: currentLocale }) : <span>{t("filament.select_date")}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editFormData.purchaseDate}
                      onSelect={(date) => date && setEditFormData({ ...editFormData, purchaseDate: date })}
                      disabled={(date) => date > new Date() || date < new Date(new Date().setMonth(new Date().getMonth() - 1))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
                disabled={updating || updateSuccess}
              >
                <X className="mr-2 h-4 w-4" />
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit" 
                className={cn(
                  "flex-1 transition-all duration-300",
                  updateSuccess && "bg-green-600 hover:bg-green-700 text-white"
                )} 
                disabled={updating || updateSuccess}
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("filament.saving")}
                  </>
                ) : updateSuccess ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {t("common.updated")}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {t("filament.edit_dialog.save")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-muted/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              {detailFilament?.Name}
            </DialogTitle>
            <DialogDescription>
              {t("filament.details.desc")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("filament.category")}</p>
                <p className="text-sm font-medium">{detailFilament?.CategoryName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("filament.details.color")}</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: detailFilament?.Color }} />
                  <p className="text-sm font-medium">{presetColors.find(c => c.value === detailFilament?.Color)?.name || detailFilament?.Color}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("filament.details.price")}</p>
                <p className="text-sm font-medium">{detailFilament?.Price}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("filament.details.purchase_date")}</p>
                <p className="text-sm font-medium">
                  {detailFilament?.PurchaseDate ? new Date(detailFilament.PurchaseDate).toLocaleDateString('tr-TR') : "-"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{t("materials.link")}</span>
                <div className="text-sm font-medium flex items-center gap-2">
                  {detailFilament?.Link ? (
                    <a href={detailFilament.Link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      {t("common.inspect")} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : "-"}
                </div>
              </div>
              <div className="col-span-2 space-y-3 pt-2">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("filament.details.status")}</p>
                  <p className="text-xs font-bold text-primary">{detailFilament?.Available_Gram}g / {detailFilament?.Gram}g</p>
                </div>
                <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden border border-muted/20">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      detailFilament && (detailFilament.Available_Gram / detailFilament.Gram) < 0.2 ? 'bg-destructive' : 'bg-primary'
                    )}
                    style={{ width: `${detailFilament ? (detailFilament.Available_Gram / detailFilament.Gram) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
