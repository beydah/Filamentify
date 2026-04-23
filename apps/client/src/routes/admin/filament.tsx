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
  ChevronLeft, 
  ChevronRight, 
  Trash2,
  ChevronsUpDown,
  Search,
  MoreHorizontal,
  Eye,
  Edit3
} from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
}

// 10 core colors from black to white including primary
const presetColors = [
  "#000000", // Black
  "#4b5563", // Gray
  "#ffffff", // White
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Yellow
  "#10b981", // Green
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#a855f7", // Purple
]

export default function FilamentPage() {
  const { t } = useTranslation()
  const [filaments, setFilaments] = React.useState<Filament[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [addingCategory, setAddingCategory] = React.useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = React.useState<number | null>(null)
  const [deletingFilamentId, setDeletingFilamentId] = React.useState<number | null>(null)

  // Form State
  const [newCategory, setNewCategory] = React.useState("")
  const [formData, setFormData] = React.useState({
    categoryId: "",
    name: "",
    color: presetColors[0],
    price: "",
    gram: "1000",
    purchaseDate: new Date(),
  })

  const [openCategory, setOpenCategory] = React.useState(false)

  const fetchData = async () => {
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
  }

  React.useEffect(() => {
    fetchData()
  }, [])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.trim()) return
    setAddingCategory(true)
    try {
      const response = await fetch("http://localhost:3001/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
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
        fetchData()
      } else {
        const error = await response.json()
        alert(error.error || "Kategori silinemedi")
      }
    } catch (error) {
      console.error("Failed to delete category:", error)
    } finally {
      setDeletingCategoryId(null)
    }
  }

  const handleDeleteFilament = async (id: number) => {
    if (!confirm("Bu filamenti silmek istediğinize emin misiniz?")) return
    setDeletingFilamentId(id)
    try {
      const response = await fetch(`http://localhost:3001/api/filaments/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchData()
      } else {
        alert("Filament silinemedi")
      }
    } catch (error) {
      console.error("Failed to delete filament:", error)
    } finally {
      setDeletingFilamentId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.categoryId) {
      alert("Lütfen bir kategori seçin")
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
          name: formData.name,
          color: formData.color,
          price: parseFloat(formData.price),
          gram: parseInt(formData.gram),
          purchaseDate: formData.purchaseDate.toISOString(),
        }),
      })

      if (response.ok) {
        setFormData({
          categoryId: "",
          name: "",
          color: presetColors[0],
          price: "",
          gram: "1000",
          purchaseDate: new Date(),
        })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to add filament:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current
      const scrollTo = direction === 'left' ? scrollLeft - 100 : scrollLeft + 100
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' })
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {t("nav.filament")}
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Management */}
        <div className="lg:col-span-4 space-y-8">
          {/* Add Filament Form */}
          <Card className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                Yeni Filament Kaydı
              </CardTitle>
              <CardDescription>
                Stoktaki yeni filamenti detaylarıyla kaydedin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">İsim</Label>
                  <Input
                    placeholder="Filament İsmi (Örn: Siyah PLA)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-background/40 border-muted/30 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Kategori</Label>
                  <Popover open={openCategory} onOpenChange={setOpenCategory}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCategory}
                        className="w-full justify-between bg-background/40 border-muted/30 h-10 font-normal"
                      >
                        {formData.categoryId
                          ? categories.find((cat) => cat.ID.toString() === formData.categoryId)?.Name
                          : "Kategori Seçin..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Kategori ara..." />
                        <CommandList>
                          <CommandEmpty>Kategori bulunamadı.</CommandEmpty>
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

                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Renk Seçimi</Label>
                  <div className="relative flex items-center gap-2 group">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => scroll('left')}
                      className="absolute -left-2 z-10 h-8 w-8 rounded-full bg-background/80 shadow-sm border border-muted/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div 
                      ref={scrollContainerRef}
                      className="flex-1 flex gap-3 overflow-x-auto scrollbar-none py-2 px-1 snap-x"
                    >
                      {presetColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={cn(
                            "flex-shrink-0 w-10 h-10 rounded-xl border-2 transition-all snap-center relative",
                            formData.color === color ? "border-primary scale-110 shadow-lg ring-2 ring-primary/20" : "border-transparent opacity-60 hover:opacity-100"
                          )}
                          style={{ backgroundColor: color }}
                        >
                          {formData.color === color && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check className={cn("h-5 w-5", color === "#ffffff" || color === "#f5f5dc" ? "text-black" : "text-white")} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => scroll('right')}
                      className="absolute -right-2 z-10 h-8 w-8 rounded-full bg-background/80 shadow-sm border border-muted/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center pt-1">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase bg-muted/30 px-2 py-0.5 rounded-full">
                      {formData.color}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Fiyat</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="bg-background/40 border-muted/30 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gram" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Gramaj (gr)</Label>
                    <Input
                      id="gram"
                      type="number"
                      placeholder="1000"
                      value={formData.gram}
                      onChange={(e) => setFormData({ ...formData, gram: e.target.value })}
                      required
                      className="bg-background/40 border-muted/30 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Alım Tarihi
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
                        {formData.purchaseDate ? format(formData.purchaseDate, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.purchaseDate}
                        onSelect={(date) => date && setFormData({ ...formData, purchaseDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-all" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Filamenti Kaydet
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Category Management */}
          <Card className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Filament Kategorileri
              </CardTitle>
              <CardDescription>
                PLA, ABS, PETG gibi kategoriler ekleyin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <Input
                  placeholder="Örn: PLA Silk"
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
                {categories.length === 0 && !loading && (
                  <span className="text-xs text-muted-foreground italic">Henüz kategori eklenmemiş.</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-8">
          <Card className="h-full border-muted/40 bg-card/40 backdrop-blur-md shadow-lg flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Filament Envanteri</CardTitle>
                  <CardDescription>
                    Mevcut filament stoklarınızın durumu.
                  </CardDescription>
                </div>
                <div className="bg-muted/30 px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground flex items-center gap-2 border border-muted/20">
                  <Info className="h-3 w-3" />
                  Toplam: {filaments.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
                </div>
              ) : (
                <div className="rounded-xl border border-muted/20 bg-background/20 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow className="hover:bg-transparent border-muted/20">
                        <TableHead className="font-semibold">İsim</TableHead>
                        <TableHead className="font-semibold">Kategori</TableHead>
                        <TableHead className="font-semibold text-center">Renk</TableHead>
                        <TableHead className="font-semibold">Fiyat</TableHead>
                        <TableHead className="font-semibold">Mevcut</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filaments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2 opacity-50">
                              <Search className="h-12 w-12" />
                              <p>Henüz filament eklenmemiş.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filaments.map((filament) => (
                          <TableRow key={filament.ID} className="hover:bg-muted/10 transition-colors border-muted/10">
                            <TableCell className="font-medium text-foreground/90">
                              {filament.Name || "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {filament.CategoryName || "Belirsiz"}
                            </TableCell>
                            <TableCell className="flex justify-center">
                              <div 
                                className="w-5 h-5 rounded-full border-2 border-background shadow-md ring-1 ring-muted/20" 
                                style={{ backgroundColor: filament.Color }} 
                                title={filament.Color}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{filament.Price.toFixed(2)} ₺</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1.5 w-full max-w-[120px]">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-muted-foreground/80">
                                  <span>{filament.Available_Gram}g</span>
                                  <span>{filament.Gram}g</span>
                                </div>
                                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden shadow-sm">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(var(--primary),0.5)]",
                                      (filament.Available_Gram / filament.Gram) < 0.2 ? 'bg-destructive' : 'bg-primary'
                                    )}
                                    style={{ width: `${(filament.Available_Gram / filament.Gram) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                    <span className="sr-only">Menüyü aç</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => alert("Detay sayfası yakında!")}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Detay
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => alert("Düzenleme özelliği yakında!")}>
                                    <Edit3 className="mr-2 h-4 w-4" />
                                    Düzenle
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteFilament(filament.ID)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Sil
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
    </div>
  )
}
