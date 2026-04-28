import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/controls/card"

interface AdminTableCardProps {
  title: string
  description?: string
  icon: LucideIcon
  countLabel: string
  count: number
  children: ReactNode
}

export function AdminTableCard({
  title,
  description,
  icon: Icon,
  countLabel,
  count,
  children,
}: AdminTableCardProps) {
  return (
    <Card className="flex h-full flex-col border-muted/40 bg-card/40 shadow-lg backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Icon className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          <div className="rounded-full border border-muted/20 bg-muted/30 px-3 py-1 text-xs font-semibold text-muted-foreground">
            {countLabel}: {count}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto border-t border-muted/20 p-0">{children}</CardContent>
    </Card>
  )
}
