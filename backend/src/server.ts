import express from "express";
import cors from "cors";
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

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: ["http://localhost:3000", "https://connect-u-psi.vercel.app"],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));

app.use(express.json());

app.get("/ping", (req, res) => {
  res.json({ message: "ConnectU API online e organizada!" });
});


// Rotas Express
app.use("/users", userRoutes);
app.use("/jobs", jobRoutes);
app.use("/links", linkRoutes);
app.use("/posts", postRoutes);
app.use("/login", authRoutes);
app.use("/applications", applicationRoutes);
app.use(chatRoutes);

// Config Socket.io

const httpServer = createServer(app);

// Acoplamento do socket.io ao http
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "https://connectu-gd1z.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true
  },
});

registerSocketEvents(io);

// Iniciar
const PORT = process.env.PORT || 3333;

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
