import { useTranslation } from "react-i18next"

export default function AccountPage() {
  const { t } = useTranslation()
  const title = t("nav.account")

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 border border-dashed border-muted flex items-center justify-center text-muted-foreground">
        {title} Profile Settings
      </div>
    </div>
  )
}
