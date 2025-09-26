import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const overviewCards = [
  {
    title: "待审核网站",
    value: "0",
    description: "暂未接入审核流程",
  },
  {
    title: "分类总数",
    value: "0",
    description: "等待数据库结构规划",
  },
  {
    title: "标签总数",
    value: "0",
    description: "标签模块即将上线",
  },
]

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">控制台概览</h1>
        <p className="text-sm text-muted-foreground">
          后台正在建设中，以下数据为占位展示。
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overviewCards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle className="text-base text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{card.value}</div>
              <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>下一步计划</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>· 构建网站管理列表，接入 D1 数据库</p>
          <p>· 完成分类、标签与收藏集的基础 CRUD</p>
          <p>· 打通提交流程，建立审核与发布机制</p>
        </CardContent>
      </Card>
    </div>
  )
}
