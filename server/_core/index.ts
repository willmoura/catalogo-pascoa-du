import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Force Content-Language to pt-BR to discourage auto-translation
  app.use((req, res, next) => {
    res.setHeader("Content-Language", "pt-BR");
    next();
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Endpoint de emergência para corrigir o banco de Produção
  app.get("/api/fix-trufados", async (req, res) => {
    try {
      const { trufadosMapping } = await import("../trufados-mapping");
      const { getDb } = await import("../db");
      const { sql } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "No Database" });
        return;
      }

      let updated = 0;
      for (const item of trufadosMapping) {
        if (!item.imageUrl || item.imageUrl.includes('.png')) continue;

        await db.execute(sql`UPDATE products SET imageUrl = ${item.imageUrl} WHERE slug = ${item.slug}`);
        const arr = JSON.stringify([item.imageUrl]);
        await db.execute(sql`UPDATE products SET galleryImages = ${arr} WHERE slug = ${item.slug}`);
        updated++;
      }
      res.json({ success: true, message: `Sincronização forçada concluída com sucesso. ${updated} ovos atualizados na nuvem.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
