export default {
  schema: './src/lib/db/schema/**/*.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
};

