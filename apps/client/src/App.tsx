import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/ui/controls/sidebar"

// Admin Routes
import DashboardPage from "@/routes/admin/dashboard"
import FilamentPage from "@/routes/admin/filament"
import ModelsPage from "@/routes/admin/models"
import OrdersPage from "@/routes/admin/orders"
import CustomersPage from "@/routes/admin/customers"
import MembersPage from "@/routes/admin/members"
import AccountPage from "@/routes/admin/account"
import SettingsPage from "@/routes/admin/settings"
import StatsPage from "@/routes/admin/stats"
import ProductsPage from "@/routes/admin/products"
import MediaPage from "@/routes/admin/media"
import PostsPage from "@/routes/admin/posts"
import AppearancePage from "@/routes/admin/appearance"
import MachinesPage from "@/routes/admin/machines"
import FormsPage from "@/routes/admin/forms"

function AppContent() {

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-muted/20">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/admin/dashboard">Filamentify</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Admin</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <LanguageToggle />
            <ModeToggle />
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/filament" element={<FilamentPage />} />
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
          <Route path="/admin/appearance" element={<AppearancePage />} />
          <Route path="/admin/machines" element={<MachinesPage />} />
          <Route path="/admin/forms" element={<FormsPage />} />
        </Routes>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  )
}
