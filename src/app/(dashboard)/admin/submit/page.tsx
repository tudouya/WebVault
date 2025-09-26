import SubmitWebsiteForm from "@/features/websites/components/submit-website-form"

export default function AdminSubmitPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">提交新网站</h1>
        <p className="text-sm text-muted-foreground">
          填写以下信息以添加新的网站条目，后续将支持审核与发布流程。
        </p>
      </section>
      <SubmitWebsiteForm redirectOnUnauthed={false} />
    </div>
  )
}
