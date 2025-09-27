import { WebsiteDetailAdminPage } from "@/features/websites/components"

export const runtime = "edge"

interface Params {
  id: string
}

export default async function AdminWebsiteDetailRoute({ params }: { params: Promise<Params> }) {
  const { id } = await params
  return <WebsiteDetailAdminPage websiteId={id} />
}
