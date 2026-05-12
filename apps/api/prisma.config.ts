import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://perch:perch@localhost:5432/perchdb",
  },
  migrations: {
    path: "prisma/migrations",
  },
});
