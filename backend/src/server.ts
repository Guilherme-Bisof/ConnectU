import express from "express";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";

// Rotas
import { userRoutes } from "./routes/user.routes.js";
import { jobRoutes } from "./routes/job.routes.js";
import { linkRoutes } from "./routes/link.routes.js";
import { postRoutes } from "./routes/post.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import { applicationRoutes } from "./routes/application.routes.js";
import { chatRoutes } from "./routes/chat.routes.js";
import { registerSocketEvents } from "./controllers/socketController.js";
import { notificationRoutes } from "./routes/notification.routes.js";

const app = express();

const allowedOrigins = (process.env.FRONTEND_URLS ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Permite chamadas sem origin, como Postman, Render e outros serviços internos.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    console.warn("[CORS] Origem bloqueada:", origin);

    callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

app.get("/ping", (req, res) => {
  res.json({ message: "ConnectU API online e organizada!" });
});

// Rotas Express
app.use("/users", userRoutes);
app.use("/jobs", jobRoutes);
app.use("/links", linkRoutes);
app.use("/posts", postRoutes);
app.use("/notifications", notificationRoutes);
app.use("/login", authRoutes);
app.use("/applications", applicationRoutes);
app.use(chatRoutes);

// Config Socket.io

const httpServer = createServer(app);

// Acoplamento do socket.io ao http
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

registerSocketEvents(io);

// Iniciar
const PORT = process.env.PORT || 3333;

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log("[CORS] Origens permitidas:", allowedOrigins);
});
