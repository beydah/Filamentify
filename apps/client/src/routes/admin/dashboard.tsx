import { useTranslation } from "react-i18next"

export default function DashboardPage() {
  const { t } = useTranslation()
  const title = t("nav.dashboard")

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50 border border-dashed border-muted flex items-center justify-center text-muted-foreground">
          {title} Chart 1
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 border border-dashed border-muted flex items-center justify-center text-muted-foreground">
          {title} Chart 2
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 border border-dashed border-muted flex items-center justify-center text-muted-foreground">
          {title} Chart 3
        </div>
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min border border-dashed border-muted flex items-center justify-center text-muted-foreground">
        {title} Content Area
      </div>
    </div>
  )
}
