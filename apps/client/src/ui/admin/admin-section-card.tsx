import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/ui/controls/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/controls/card"

interface AdminSectionCardProps {
  id?: string
  title: string
  description?: string
  icon: LucideIcon
  defaultOpen?: boolean
  children: React.ReactNode
}

export function AdminSectionCard({
  id,
  title,
  description,
  icon: Icon,
  defaultOpen = true,
  children,
}: AdminSectionCardProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <Card id={id} className="overflow-hidden border-muted/40 bg-card/40 shadow-lg backdrop-blur-md transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen((current) => !current)}
          className="h-8 w-8 p-0"
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <div className={cn("grid transition-all duration-300 ease-in-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <CardContent className="pb-6">{children}</CardContent>
        </div>
      </div>
    </Card>
  )
}
