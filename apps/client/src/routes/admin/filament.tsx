import * as React from "react"
import { useTranslation } from "react-i18next"
import { Plus, Loader2, Tag, Calendar, Palette, Info, Check } from "lucide-react"
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

interface Category {
  ID: number
  Name: string
}

interface Filament {
  ID: number
  CategoryID: number
  CategoryName: string
  Color: string
  Price: number
  Gram: number
  Available_Gram: number
  PurchaseDate: string
  Status: string
}

export default function FilamentPage() {
  const { t } = useTranslation()
  const [filaments, setFilaments] = React.useState<Filament[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [addingCategory, setAddingCategory] = React.useState(false)

  // Form State
  const [newCategory, setNewCategory] = React.useState("")
  const [formData, setFormData] = React.useState({
    categoryId: "",
    color: "#000000",
    price: "",
    gram: "1000",
    purchaseDate: new Date().toISOString().split("T")[0],
  })

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
          color: formData.color,
          price: parseFloat(formData.price),
          gram: parseInt(formData.gram),
          purchaseDate: formData.purchaseDate,
        }),
      })

      if (response.ok) {
        setFormData({
          categoryId: "",
          color: "#000000",
          price: "",
          gram: "1000",
          purchaseDate: new Date().toISOString().split("T")[0],
        })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to add filament:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const presetColors = [
    "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", 
    "#ffff00", "#ff00ff", "#00ffff", "#ffa500", "#808080",
    "#8b4513", "#ffd700", "#c0c0c0", "#f5f5dc", "#add8e6"
  ]

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
          {/* Category Management */}
          <Card className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
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
                  <span key={cat.ID} className="px-2.5 py-1 rounded-md bg-muted/30 border border-muted/20 text-xs font-medium">
                    {cat.Name}
                  </span>
                ))}
                {categories.length === 0 && !loading && (
                  <span className="text-xs text-muted-foreground italic">Henüz kategori eklenmemiş.</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add Filament Form */}
          <Card className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
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
                  <Label htmlFor="category" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Kategori</Label>
                  <select
                    id="category"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                    className="w-full h-10 rounded-md border border-muted/30 bg-background/40 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                  >
                    <option value="" disabled>Kategori Seçin</option>
                    {categories.map((cat) => (
                      <option key={cat.ID} value={cat.ID}>{cat.Name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Renk Seçimi</Label>
                  <div className="p-3 rounded-lg border border-muted/20 bg-background/20 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {presetColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 active:scale-95 flex items-center justify-center ${
                            formData.color === color ? 'border-primary shadow-sm' : 'border-transparent shadow-none'
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {formData.color === color && (
                            <Check className={`h-4 w-4 ${color === '#ffffff' || color === '#ffff00' || color === '#c0c0c0' || color === '#f5f5dc' ? 'text-black' : 'text-white'}`} />
                          )}
                        </button>
                      ))}
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-muted/30 hover:border-primary/50 transition-all shadow-sm">
                        <input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] cursor-pointer bg-transparent border-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div 
                        className="w-10 h-10 rounded-md border border-muted/30 shadow-inner" 
                        style={{ backgroundColor: formData.color }} 
                      />
                      <Input
                        value={formData.color.toUpperCase()}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="h-8 font-mono text-xs text-center"
                        placeholder="#HEX"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Fiyat</Label>
                    <div className="relative">
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        className="bg-background/40 border-muted/30 pl-3 transition-all"
                      />
                    </div>
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
                  <Label htmlFor="purchaseDate" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Alım Tarihi
                  </Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    required
                    className="bg-background/40 border-muted/30 transition-all"
                  />
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
                <div className="bg-muted/30 px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground flex items-center gap-2">
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
                        <TableHead className="font-semibold">Kategori</TableHead>
                        <TableHead className="font-semibold">Renk</TableHead>
                        <TableHead className="font-semibold">Fiyat</TableHead>
                        <TableHead className="font-semibold">Mevcut</TableHead>
                        <TableHead className="font-semibold">Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filaments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2 opacity-50">
                              <Tag className="h-12 w-12" />
                              <p>Henüz filament eklenmemiş.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filaments.map((filament) => (
                          <TableRow key={filament.ID} className="hover:bg-muted/10 transition-colors border-muted/10">
                            <TableCell className="font-semibold text-foreground/90">
                              {filament.CategoryName || "Belirsiz"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full border border-muted/40 shadow-sm" 
                                  style={{ backgroundColor: filament.Color }} 
                                />
                                <span className="text-xs font-mono opacity-70 uppercase">{filament.Color}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{filament.Price.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 w-full max-w-[100px]">
                                <div className="flex justify-between text-[10px] font-medium uppercase tracking-tighter opacity-60">
                                  <span>{filament.Available_Gram}g</span>
                                  <span>{filament.Gram}g</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all ${
                                      (filament.Available_Gram / filament.Gram) < 0.2 ? 'bg-red-500' : 'bg-primary'
                                    }`}
                                    style={{ width: `${(filament.Available_Gram / filament.Gram) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                filament.Status === 'Active' 
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${filament.Status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                {filament.Status === 'Active' ? 'Aktif' : 'Pasif'}
                              </span>
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
