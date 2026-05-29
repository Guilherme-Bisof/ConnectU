import express from "express";
import cors from "cors";
import { userRoutes } from "./routes/user.routes.js";
import { jobRoutes } from "./routes/job.routes.js";
import { linkRoutes } from './routes/link.routes.js'; 
import { postRoutes } from './routes/post.routes.js'; 
import { authRoutes } from './routes/auth.routes.js';
import { applicationRoutes } from "./routes/application.routes.js";

const app = express();

app.use(cors());
app.use(express.json());


app.get("/ping", (req, res) => {
  res.json({ message: "ConnectU API online e organizada!" });
});


app.use("/users", userRoutes);
app.use("/jobs", jobRoutes);
app.use("/links", linkRoutes);
app.use("/posts", postRoutes);
app.use("/login", authRoutes);
app.use("/applications", applicationRoutes);

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
