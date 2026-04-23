import * as React from "react"
import { useTranslation } from "react-i18next"
import { 
  Box, 
  Plus, 
  Search, 
  Layers, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react"
import { Button } from "@/ui/controls/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/controls/card"
import { cn } from "@/lib/utils"
import { Input } from "@/ui/controls/input"

export default function MaterialsPage() {
  const { t } = useTranslation()
  const [isFormOpen, setIsFormOpen] = React.useState(true)

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
                  Malzeme Ekle
                </CardTitle>
                <CardDescription>
                  Yeni malzeme ve stok kaydı oluşturun.
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
                  <div className="h-40 flex items-center justify-center border-2 border-dashed border-muted/30 rounded-lg text-muted-foreground italic text-sm">
                    Bu modül yakında eklenecek...
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>

          <Card className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Malzeme Kategorileri
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="h-20 flex items-center justify-center border-2 border-dashed border-muted/30 rounded-lg text-muted-foreground italic text-sm">
                 Kategori yönetimi yakında...
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
                    Malzeme Listesi
                  </CardTitle>
                  <CardDescription>
                    Kayıtlı tüm malzemelerin listesi ve stok durumları.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0 border-t border-muted/20">
               <div className="h-96 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                 <Search className="h-12 w-12 mb-2" />
                 <p>Malzeme tablosu yakında eklenecek.</p>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
