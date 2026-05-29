"use client";

import { useEffect, useState } from "react";
import { FiThumbsUp, FiMessageSquare, FiTrash2, FiAward } from "react-icons/fi";

interface UserData {
  id: string;
  name: string;
  role: string;
  course?: string;
  institution?: string;
  isPioneer?: boolean;
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  likes: { userId: string }[];
  userId: string;
  comments: {
    id: string;
    content: string;
    userId: string;
    user: {
      id: string;
      name: string;
      isPioneer?: boolean;
    };
  }[];
  author: {
    name: string;
    role: string;
    course?: string;
    institution?: string;
    isPioneer?: boolean;
  };
}

// Função para calcular o tempo relativo (Ex: "Há 5 min")
function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Agora mesmo";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Há ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Há ${diffInHours} h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Há ${diffInDays} dias`;
  return date.toLocaleDateString("pt-BR");
}

export default function DashboardFeed() {
  const [user, setUser] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState("");

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(
    null,
  );
  const [commentContent, setCommentContent] = useState("");

  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem("connectu_user");
      if (storedUser) setUser(JSON.parse(storedUser));
    };

    loadUser();
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setIsFetching(true);
    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch("http://localhost:3333/posts", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (Array.isArray(data)) {
        setPosts(data);
      } else {
        console.warn("O backend não retornou uma lista:", data);
        setPosts([]);
      }
    } catch (error) {
      console.error("Erro ao buscar feed:", error);
      setPosts([]);
    } finally {
      setIsFetching(false);
    }
  }

  async function handleCreatePost() {
    if (!newPostText.trim() || !user) return;
    setLoading(true);
    setFeedback(null);

    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch("http://localhost:3333/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newPostText,
          authorId: user.id,
        }),
      });

      if (res.ok) {
        setNewPostText("");
        setFeedback({
          type: "success",
          msg: "Publicação enviada com sucesso!",
        });
        fetchPosts();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({
          type: "error",
          msg: "Não foi possível publicar. Tente novamente.",
        });
      }
    } catch (error) {
      setFeedback({ type: "error", msg: "Erro de conexão com o servidor." });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm("Tem certeza que deseja excluir esta publicação?")) return;

    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch(`http://localhost:3333/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  }

  async function handleComment(postId: string) {
    const token = localStorage.getItem("connectu_token");
    try {
      const res = await fetch(`http://localhost:3333/posts/${postId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: commentContent }),
      });

      if (res.ok) {
        setCommentContent("");
        setActiveCommentPostId(null);
        await fetchPosts();
      }
    } catch (error) {
      console.error("Erro ao comentar:", error);
    }
  }

  async function handleLike(postId: string) {
    if (!user) return;
    const token = localStorage.getItem("connectu_token");

    try {
      const res = await fetch(`http://localhost:3333/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await fetchPosts();
      }
    } catch (error) {
      console.error("Erro ao curtir:", error);
    }
  }

  async function handleDeleteComment(commentId: string) {
    const token = localStorage.getItem("connectu_token");
    try {
      const res = await fetch(
        `http://localhost:3333/posts/comment/${commentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) fetchPosts();
    } catch (error) {
      console.error("Erro ao deletar comentário:", error);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Feed de Atualizações</h2>
        <p className="text-zinc-400">Veja o que está rolando na rede hoje.</p>
      </div>

      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white uppercase">
            {user.name.charAt(0)}
          </div>

          <div className="flex-1">
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="Compartilhe um projeto, dúvida ou vaga..."
              className="w-full resize-none bg-transparent pt-2 text-zinc-100 placeholder-zinc-500 outline-none focus:ring-0"
              rows={2}
            />

            {feedback && (
              <p
                className={`text-sm mt-2 ${feedback.type === "success" ? "text-emerald-400" : "text-red-400"}`}
              >
                {feedback.msg}
              </p>
            )}

            <div className="mt-2 flex items-center justify-between border-t border-zinc-800 pt-3">
              <span className="text-xs text-zinc-500">
                Postando como:{" "}
                <strong className="text-zinc-300">
                  {user.role === "STUDENT" ? "Talento" : "Empresa"}
                </strong>
              </span>
              <button
                onClick={handleCreatePost}
                disabled={loading || !newPostText.trim()}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {isFetching ? (
          [1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 animate-pulse"
            >
              <div className="flex gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-zinc-800"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
                  <div className="h-3 bg-zinc-800 rounded w-1/3"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-zinc-800 rounded"></div>
                <div className="h-3 bg-zinc-800 rounded w-5/6"></div>
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <p className="text-center text-zinc-500 py-8">
            Nenhuma publicação ainda. Seja o primeiro a postar!
          </p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:bg-zinc-900 group"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 font-bold text-zinc-300 uppercase">
                    {post.author.name.charAt(0)}
                  </div>

                  {/* Bloco do Autor Corrigido com Flexbox */}
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-medium text-zinc-100">
                        {post.author.name}
                      </h3>
                      {post.author.isPioneer && (
                        <div
                          className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-linear-to-r from-amber-900/40 via-yellow-900/20 to-amber-900/40 px-2 py-0.5 shadow-[0_0_10px_rgba(245,158,11,0.2)] backdrop-blur-md"
                          title="Membro Fundador"
                        >
                          <FiAward className="text-amber-400" size={10} />
                          <span className="text-[9px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-linear-to-r from-amber-200 to-yellow-500">
                            Pioneiro
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {post.author.role === "STUDENT"
                        ? `${post.author.course} na ${post.author.institution}`
                        : "Empresa"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-600">
                    {formatTimeAgo(post.createdAt)}
                  </span>
                  {post.authorId === user.id && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Excluir post"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>

              <p className="mb-4 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                {post.content}
              </p>

              <div className="mb-4 flex items-center gap-6 text-xs font-medium text-zinc-500">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 transition-colors ${
                    post.likes.some((like) => like.userId === user?.id)
                      ? "text-blue-500 font-bold"
                      : "text-zinc-500 hover:text-blue-400"
                  }`}
                >
                  <FiThumbsUp
                    className={`text-base ${post.likes.some((like) => like.userId === user?.id) ? "fill-current" : ""}`}
                  />{" "}
                  Curtir ({post.likes.length})
                </button>
                <button
                  onClick={() =>
                    setActiveCommentPostId(
                      post.id === activeCommentPostId ? null : post.id,
                    )
                  }
                  className="flex items-center gap-2 transition-colors hover:text-blue-400"
                >
                  <FiMessageSquare className="text-base" /> Comentar
                </button>
              </div>

              {activeCommentPostId === post.id && (
                <div className="mb-4 flex gap-2">
                  <input
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="flex-1 bg-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Escreva um comentário..."
                  />
                  <button
                    onClick={() => handleComment(post.id)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white text-sm transition-colors"
                  >
                    Enviar
                  </button>
                </div>
              )}

              {post.comments && post.comments.length > 0 && (
                <div className="space-y-3 border-t border-zinc-800 pt-4 mt-2">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 group">
                      <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400 uppercase">
                        {comment.user.name.charAt(0)}
                      </div>
                      <div className="flex-1 rounded-2xl bg-zinc-800/50 px-4 py-2 text-sm text-zinc-300 relative">
                        {/* Bloco do Comentário Corrigido */}
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-zinc-200 text-xs">
                            {comment.user.name}
                          </p>
                          {comment.user.isPioneer && (
                            <div
                              className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-linear-to-r from-amber-900/40 via-yellow-900/20 to-amber-900/40 px-1.5 py-0.5 shadow-[0_0_10px_rgba(245,158,11,0.2)] backdrop-blur-sm"
                              title="Membro Fundador"
                            >
                              <FiAward className="text-amber-400" size={10} />
                              <span className="text-[9px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-linear-to-r from-amber-200 to-yellow-500">
                                Pioneiro
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="leading-relaxed">{comment.content}</p>

                        {comment.userId === user?.id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity"
                            title="Excluir comentário"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
