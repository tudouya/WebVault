-- Insert additional child categories for each top-level classification

INSERT INTO categories (id, name, slug, description, parent_id, display_order, icon, is_active, status, created_at, updated_at)
VALUES
  ('cat_dev_environment', '开发环境', 'dev-environment', '本地与云端开发环境、构建工具', 'cat_1759307274412_rkndju', 3, 'Laptop', 1, 'active', '2025-02-20T00:00:00Z', '2025-02-20T00:00:00Z'),
  ('cat_dev_playgrounds', '在线演练场', 'code-playgrounds', '在线代码演练与协作平台', 'cat_1759307274412_rkndju', 4, 'Terminal', 1, 'active', '2025-02-20T00:00:00Z', '2025-02-20T00:00:00Z'),
  ('cat_dev_docs', '开发文档', 'developer-docs', '常用开发文档与参考资料', 'cat_1759307274412_rkndju', 5, 'Book', 1, 'active', '2025-02-20T00:00:00Z', '2025-02-20T00:00:00Z'),
  ('cat_design_inspiration', '设计灵感', 'design-inspiration', '灵感站点与视觉资源集合', 'cat_1759307274412_uplk3', 3, 'Sparkles', 1, 'active', '2025-02-20T00:00:00Z', '2025-02-20T00:00:00Z'),
  ('cat_learning_courses', '在线课程', 'online-courses', '系统化的在线课程平台', 'cat_1759307274412_z0a5q', 1, 'GraduationCap', 1, 'active', '2025-02-20T00:00:00Z', '2025-02-20T00:00:00Z'),
  ('cat_learning_practice', '编程练习', 'coding-practice', '动手练习与编程挑战平台', 'cat_1759307274412_z0a5q', 2, 'Keyboard', 1, 'active', '2025-02-20T00:00:00Z', '2025-02-20T00:00:00Z'),
  ('cat_ai_chat', '对话助手', 'ai-chatbots', '智能对话与问答助手', 'cat_1759307274412_ir4lki', 1, 'MessageSquare', 1, 'active', '2025-02-20T00:00:00Z', '2025-02-20T00:00:00Z'),
  ('cat_ai_creation', '创作工具', 'ai-creation', 'AI 辅助创作与生成工具', 'cat_1759307274412_ir4lki', 2, 'Wand', 1, 'active', '2025-02-20T00:00:00Z', '2025-02-20T00:00:00Z'),
  ('cat_productivity_notes', '笔记工具', 'note-taking', '知识笔记与个人知识库', 'cat_1759307274412_v27tt', 1, 'Notebook', 1, 'active', '2025-02-20T00:00:00Z', '2025-02-20T00:00:00Z'),
  ('cat_productivity_tasks', '任务管理', 'task-management', '任务与团队协作管理工具', 'cat_1759307274412_v27tt', 2, 'CheckSquare', 1, 'active', '2025-02-20T00:00:00Z', '2025-02-20T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Reassign development resources to child categories (ensure one child contains >15 entries for pagination tests)

UPDATE websites
SET category_id = 'cat_1759307274412_1c9qsd'
WHERE slug IN ('github.com', 'gitlab.com');

UPDATE websites
SET category_id = 'cat_dev_playgrounds'
WHERE slug IN ('codepen.io', 'codesandbox.io', 'replit.com');

UPDATE websites
SET category_id = 'cat_dev_environment'
WHERE slug IN (
  'code.visualstudio.com',
  'npmjs.com',
  'prettier.io',
  'eslint.org',
  'webpack.js.org',
  'vitejs.dev',
  'babeljs.io',
  'jestjs.io',
  'cypress.io',
  'sourcetreeapp.com',
  'dbeaver.io',
  'vercel.com',
  'netlify.com',
  'hub.docker.com',
  'example-pending1.com',
  'example-rejected.com'
);

UPDATE websites
SET category_id = 'cat_dev_docs'
WHERE slug IN ('stackoverflow.com', 'developer.mozilla.org', 'caniuse.com', 'regex101.com');

UPDATE websites
SET category_id = 'cat_1759307274412_v6mlqo'
WHERE slug IN ('postman.com', 'insomnia.rest', 'jsonplaceholder.typicode.com');

-- Design resources

UPDATE websites
SET category_id = 'cat_design_inspiration'
WHERE slug IN ('figma.com', 'dribbble.com', 'behance.net', 'unsplash.com', 'pexels.com', 'coolors.co', 'example-pending2.com');

UPDATE websites
SET category_id = 'cat_1759307274412_gcewwm'
WHERE slug IN ('tailwindcss.com');

UPDATE websites
SET category_id = 'cat_1759307274412_95oibr'
WHERE slug IN ('fontawesome.com', 'lucide.dev');

-- Learning platforms

UPDATE websites
SET category_id = 'cat_learning_courses'
WHERE slug IN ('freecodecamp.org', 'coursera.org', 'udemy.com');

UPDATE websites
SET category_id = 'cat_learning_practice'
WHERE slug IN ('leetcode.com', 'hackerrank.com');

-- AI tools

UPDATE websites
SET category_id = 'cat_ai_chat'
WHERE slug IN ('chat.openai.com', 'claude.ai');

UPDATE websites
SET category_id = 'cat_ai_creation'
WHERE slug IN ('midjourney.com', 'stability.ai', 'github.com-features-copilot');

-- Productivity tools

UPDATE websites
SET category_id = 'cat_productivity_notes'
WHERE slug IN ('notion.so', 'obsidian.md');

UPDATE websites
SET category_id = 'cat_productivity_tasks'
WHERE slug IN ('trello.com', 'example-inactive.com');

