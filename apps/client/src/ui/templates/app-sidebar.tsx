import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  Box,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  User,
  Users2,
  Command,
  Github,
  BarChart3,
  ShoppingBag,
  Image,
  FileText,
  Cpu,
  ClipboardList,
  Layers,
} from "lucide-react"
import { Link } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/ui/controls/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation()

  const navMain = [
    {
      title: t("nav.dashboard"),
      url: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("nav.stats"),
      url: "/admin/stats",
      icon: BarChart3,
    },
    {
      title: t("nav.orders"),
      url: "/admin/orders",
      icon: ShoppingCart,
    },
    {
      title: t("nav.products"),
      url: "/admin/products",
      icon: ShoppingBag,
    },
    {
      title: t("nav.materials"),
      url: "/admin/materials",
      icon: Layers,
    },
    {
      title: t("nav.models"),
      url: "/admin/models",
      icon: Package,
    },
    {
      title: t("nav.filament"),
      url: "/admin/filament",
      icon: Box,
    },
    {
      title: t("nav.posts"),
      url: "/admin/posts",
      icon: FileText,
    },
    {
      title: t("nav.media"),
      url: "/admin/media",
      icon: Image,
    },
    {
      title: t("nav.customers"),
      url: "/admin/customers",
      icon: Users,
    },
    {
      title: t("nav.forms"),
      url: "/admin/forms",
      icon: ClipboardList,
    },
  ]

  const navSecondary = [
    {
      title: t("nav.machines"),
      url: "/admin/machines",
      icon: Cpu,
    },
    {
      title: t("nav.users"),
      url: "/admin/members",
      icon: Users2,
    },
    {
      title: t("nav.account"),
      url: "/admin/account",
      icon: User,
    },
    {
      title: t("nav.settings"),
      url: "/admin/settings",
      icon: Settings,
    },
  ]

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/admin/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="font-semibold">Filamentify</span>
                  <span className="text-xs">v1.0.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-2 py-2">
          <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-2 px-2">
            Operations
          </div>
          <SidebarMenu>
            {navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link to={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>

        <div className="mt-auto px-2 py-2">
          <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-2 px-2">
            System
          </div>
          <SidebarMenu>
            {navSecondary.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link to={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="https://github.com" target="_blank" rel="noreferrer">
                <Github className="size-4" />
                <span>Open Source</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
