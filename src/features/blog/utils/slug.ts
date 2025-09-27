/**
 * 生成博客文章的 slug
 *
 * 将输入字符串转为小写，移除非法字符，并用连字符连接单词。
 * 与分类/标签的 slug 生成策略保持一致，支持中英文混合内容。
 */
export function generateBlogSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

