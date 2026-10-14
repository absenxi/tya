import express from "express";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware to parse JSON payloads
  app.use(express.json());

  // Health check endpoint for Cloud Run and monitoring
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // WhatsApp Gateway Send Endpoint (Fonnte / Wablas / Custom)
  app.post("/api/whatsapp/send", async (req, res) => {
    try {
      const { token, endpointUrl, target, message } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "API Token wajib diisi.",
        });
      }
      if (!target) {
        return res.status(400).json({
          success: false,
          message: "Nomor Tujuan / ID Group WhatsApp wajib diisi.",
        });
      }
      if (!message) {
        return res.status(400).json({
          success: false,
          message: "Isi Pesan wajib diisi.",
        });
      }

      const targetUrl = endpointUrl || "https://api.fonnte.com/send";

      // Send to Fonnte / Gateway using FormData which is Fonnte's standard format
      const formData = new FormData();
      formData.append("target", target.trim());
      formData.append("message", message);
      formData.append("countryCode", "62");

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          Authorization: token.trim(),
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.status !== false) {
        return res.json({
          success: true,
          data,
          message: "Pesan WhatsApp berhasil dikirim melalui Gateway!",
        });
      } else {
        const errorReason =
          data?.reason || data?.message || "Gagal mengirim pesan melalui Gateway WhatsApp.";
        return res.status(response.status >= 400 ? response.status : 400).json({
          success: false,
          data,
          message: errorReason,
        });
      }
    } catch (error: any) {
      console.error("Error proxying WhatsApp request:", error);
      return res.status(500).json({
        success: false,
        message: error?.message || "Terjadi kesalahan pada server saat menghubungi Gateway WhatsApp.",
      });
    }
  });

  const distPath = path.join(process.cwd(), "dist");
  const distIndexHtml = path.join(distPath, "index.html");
  const isProduction =
    process.env.NODE_ENV === "production" && fs.existsSync(distIndexHtml);

  // Vite middleware for development
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(distIndexHtml);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
