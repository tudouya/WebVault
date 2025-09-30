import { CategoriesPage } from "@/features/categories/components/categories-page"

// Admin pages should not be statically generated
export const dynamic = 'force-dynamic';
// Use Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

export default function AdminCategoriesPage() {
  return <CategoriesPage />
}

