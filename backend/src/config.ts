export default () => ({
  db: {
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    host: process.env.DB_HOST,
    pwd: process.env.DB_PWD,
    user: process.env.DB_USER,
    db: process.env.DB_DB,
  },
});
