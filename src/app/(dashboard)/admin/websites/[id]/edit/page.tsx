import { WebsiteEditPage } from "@/features/websites/components"

export const runtime = "edge"

interface Params {
  id: string
}

export default async function AdminWebsiteEditRoute({ params }: { params: Promise<Params> }) {
  const { id } = await params
  return <WebsiteEditPage websiteId={id} />
}
