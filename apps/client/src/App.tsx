import * as React from "react"
import { useTranslation } from "react-i18next"
import { BrowserRouter as Router, Link, Navigate, Route, Routes, useLocation } from "react-router-dom"
import { AppSidebar } from "@/ui/templates/app-sidebar"
import { ThemeProvider } from "@/ui/providers/theme-provider"
import { ModeToggle } from "@/ui/components/mode-toggle"
import { LanguageToggle } from "@/ui/components/language-toggle"
import "@/i18n"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/ui/controls/breadcrumb"
import { Separator } from "@/ui/controls/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/ui/controls/sidebar"
import { Toaster } from "@/ui/controls/sonner"

const DashboardPage = React.lazy(() => import("@/routes/admin/dashboard"))
const FilamentPage = React.lazy(() => import("@/routes/admin/filament"))
const ModelsPage = React.lazy(() => import("@/routes/admin/models"))
const OrdersPage = React.lazy(() => import("@/routes/admin/orders"))
const CustomersPage = React.lazy(() => import("@/routes/admin/customers"))
const MembersPage = React.lazy(() => import("@/routes/admin/members"))
const AccountPage = React.lazy(() => import("@/routes/admin/account"))
const SettingsPage = React.lazy(() => import("@/routes/admin/settings"))
const StatsPage = React.lazy(() => import("@/routes/admin/stats"))
const ProductsPage = React.lazy(() => import("@/routes/admin/products"))
const MediaPage = React.lazy(() => import("@/routes/admin/media"))
const PostsPage = React.lazy(() => import("@/routes/admin/posts"))
const MachinesPage = React.lazy(() => import("@/routes/admin/machines"))
const FormsPage = React.lazy(() => import("@/routes/admin/forms"))
const MaterialsPage = React.lazy(() => import("@/routes/admin/materials"))

function RouteFallback() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/80 p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-foreground">Loading admin module...</p>
      </div>
    </div>
  )
}

function Breadcrumbs() {
  const { t } = useTranslation()
  const location = useLocation()
  const pathnames = location.pathname.split("/").filter(Boolean)

  const routeNames: Record<string, string> = {
    admin: "Admin",
    dashboard: t("nav.dashboard"),
    filament: t("nav.filament"),
    models: t("nav.models"),
    orders: t("nav.orders"),
    customers: t("nav.customers"),
    materials: t("nav.materials"),
    members: t("nav.users"),
    account: t("nav.account"),
    settings: t("nav.settings"),
    stats: t("nav.stats"),
    products: t("nav.products"),
    media: t("nav.media"),
    posts: t("nav.posts"),
    machines: t("nav.machines"),
    forms: t("nav.forms"),
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link to="/admin/dashboard">Filamentify</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathnames.map((name, index) => {
          const isLast = index === pathnames.length - 1
          const href = `/${pathnames.slice(0, index + 1).join("/")}`
          const displayName = routeNames[name] || name.charAt(0).toUpperCase() + name.slice(1)

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{displayName}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={href}>{displayName}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function AppContent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-muted/20">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumbs />
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <LanguageToggle />
            <ModeToggle />
          </div>
        </header>
        <React.Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/admin/filament" element={<FilamentPage />} />
            <Route path="/admin/materials" element={<MaterialsPage />} />
            <Route path="/admin/models" element={<ModelsPage />} />
            <Route path="/admin/orders" element={<OrdersPage />} />
            <Route path="/admin/customers" element={<CustomersPage />} />
            <Route path="/admin/members" element={<MembersPage />} />
            <Route path="/admin/account" element={<AccountPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="/admin/stats" element={<StatsPage />} />
            <Route path="/admin/products" element={<ProductsPage />} />
            <Route path="/admin/media" element={<MediaPage />} />
            <Route path="/admin/posts" element={<PostsPage />} />
            <Route path="/admin/machines" element={<MachinesPage />} />
            <Route path="/admin/forms" element={<FormsPage />} />
          </Routes>
        </React.Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <Router>
        <AppContent />
        <Toaster position="bottom-right" closeButton duration={5000} />
      </Router>
    </ThemeProvider>
  )
}
