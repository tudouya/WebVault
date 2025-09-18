-- D1 schema + seed for WebVault websites
BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS websites (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  favicon_url TEXT,
  screenshot_url TEXT,
  tags TEXT,
  category TEXT,
  is_ad INTEGER NOT NULL DEFAULT 0,
  ad_type TEXT,
  rating INTEGER,
  visit_count INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_public INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

DELETE FROM websites;

INSERT INTO websites (id, title, description, url, favicon_url, tags, category, is_ad, ad_type, rating, visit_count, is_featured, is_public, status, created_at, updated_at) VALUES
('1','GitHub','全球最大的代码托管平台','https://github.com','/api/favicon?domain=github.com',json('["开发工具","代码托管","开源","Git"]'),'开发工具',0,NULL,5,125420,1,1,'active',datetime('now'),datetime('now')),
('2','Stack Overflow','程序员问答社区','https://stackoverflow.com','/api/favicon?domain=stackoverflow.com',json('["问答","编程","社区","学习"]'),'开发社区',0,NULL,5,89340,1,1,'active',datetime('now'),datetime('now')),
('3','Figma','协作式设计工具','https://figma.com','/api/favicon?domain=figma.com',json('["设计工具","UI/UX","协作","原型"]'),'设计工具',1,'sponsored',5,67890,0,1,'active',datetime('now'),datetime('now')),
('4','Notion','一体化工作空间','https://notion.so','/api/favicon?domain=notion.so',json('["生产力","笔记","项目管理","协作"]'),'生产力工具',0,NULL,5,45670,0,1,'active',datetime('now'),datetime('now')),
('5','Tailwind CSS','Utility-first CSS 框架','https://tailwindcss.com','/api/favicon?domain=tailwindcss.com',json('["CSS框架","前端","设计系统","工具"]'),'开发工具',0,NULL,5,98760,1,1,'active',datetime('now'),datetime('now'));

COMMIT;

