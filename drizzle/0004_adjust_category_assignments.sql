-- Reassign selected websites to more specific child categories

UPDATE websites
SET category_id = 'cat_1759307274412_1c9qsd'
WHERE slug IN (
  'github.com',
  'gitlab.com',
  'codesandbox.io',
  'replit.com',
  'codepen.io',
  'sourcetreeapp.com',
  'dbeaver.io'
);

UPDATE websites
SET category_id = 'cat_1759307274412_v6mlqo'
WHERE slug IN (
  'postman.com',
  'insomnia.rest',
  'jsonplaceholder.typicode.com'
);

UPDATE websites
SET category_id = 'cat_1759307274412_gcewwm'
WHERE slug IN (
  'tailwindcss.com'
);

UPDATE websites
SET category_id = 'cat_1759307274412_95oibr'
WHERE slug IN (
  'fontawesome.com',
  'lucide.dev'
);
