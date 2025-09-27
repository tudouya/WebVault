import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>系统设置</CardTitle>
          <CardDescription>这里将用于管理全局设置和后台配置。</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            暂无可用设置。我们正在规划更完善的系统配置功能，敬请期待。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
