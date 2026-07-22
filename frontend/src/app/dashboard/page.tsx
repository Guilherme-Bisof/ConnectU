"use client";

import { useEffect, useState, useCallback } from "react";
import { FiTrash2, FiAward } from "react-icons/fi";
import Link from "next/link";
import RightSidebar from "./RightSidebar";
import { apiEndpoint } from "@/lib/api";

interface UserData {
  id: string;
  name: string;
  role: string;
  course?: string;
  institution?: string;
  isPioneer?: boolean;
  avatarUrl?: string;
}

interface Post {
  id: string;
  content: string;
  imageUrl?: string;
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
      avatarUrl?: string;
    };
  }[];
  author: {
    name: string;
    role: string;
    course?: string;
    institution?: string;
    isPioneer?: boolean;
    avatarUrl?: string;
  };
}

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
  const [postFile, setPostFile] = useState<File | null>(null);
  const [newPostText, setNewPostText] = useState("");

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(
    null,
  );
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(
    async (isSilent = false, reset = false) => {
      if (!isSilent) {
        queueMicrotask(() => setIsFetching(true));
      }
      try {
        const token = localStorage.getItem("connectu_token");
        const currentPage = reset ? 1 : page;

        const res = await fetch(
          apiEndpoint(`/posts?page=${currentPage}`),
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await res.json();

        if (Array.isArray(data)) {
          queueMicrotask(() => {
            if (data.length === 0 && !reset) {
              setHasMore(false);
              return;
            }

            setPosts((prev) => {
              if (reset) {
                setHasMore(data.length > 0);
                return data;
              }

              const allPosts = [...prev, ...data];
              const uniquePosts = allPosts.filter(
                (post, index, self) =>
                  self.findIndex((p) => p.id === post.id) === index,
              );

              return uniquePosts;
            });
          });
        }
      } catch (error) {
        console.error("Erro ao buscar feed:", error);
      } finally {
        if (!isSilent) {
          queueMicrotask(() => setIsFetching(false));
        }
      }
    },
    [page],
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("connectu_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      queueMicrotask(() => setUser(parsedUser));
    }
  }, []);

  useEffect(() => {
    let active = true;

    if (active) {
      fetchPosts(false, true);
    }

    return () => {
      active = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;

    if (page > 1 && active) {
      fetchPosts(true);
    }

    return () => {
      active = false;
    };
  }, [page, fetchPosts]);

  async function handleCreatePost() {
    if (!newPostText.trim() || !user) return;
    setLoading(true);
    setFeedback(null);

    try {
      const token = localStorage.getItem("connectu_token");

      const formData = new FormData();
      formData.append("content", newPostText);
      formData.append("authorId", user.id);
      if (postFile) {
        formData.append("file", postFile);
      }

      const res = await fetch(apiEndpoint("/posts"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        setNewPostText("");
        setPostFile(null);
        setFeedback({
          type: "success",
          msg: "Publicação enviada com sucesso!",
        });
        setPage(1);
        fetchPosts(true, true);

        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({
          type: "error",
          msg: "Não foi possível publicar. Tente novamente.",
        });
      }
    } catch {
      setFeedback({ type: "error", msg: "Erro de conexão com o servidor." });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm("Tem certeza que deseja excluir esta publicação?")) return;

    try {
      const token = localStorage.getItem("connectu_token");
      const res = await fetch(
        apiEndpoint(`/posts/${postId}`),
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        setPosts((prev) => prev.filter((post) => post.id !== postId));
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  }

  async function handleComment(postId: string) {
    if (isSubmittingComment || !commentContent.trim()) return;

    setIsSubmittingComment(true);
    const token = localStorage.getItem("connectu_token");
    try {
      const res = await fetch(
        apiEndpoint(`/posts/${postId}/comment`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: commentContent }),
        },
      );

      if (res.ok) {
        setCommentContent("");
        setActiveCommentPostId(null);
        setPage(1);
        fetchPosts(true, true);
      }
    } catch (error) {
      console.error("Erro ao comentar:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleLike(postId: string) {
    if (!user) return;
    const token = localStorage.getItem("connectu_token");

    try {
      const res = await fetch(
        apiEndpoint(`/posts/${postId}/like`),
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              const alreadyLiked = post.likes.some(
                (like) => like.userId === user.id,
              );

              const newLikes = alreadyLiked
                ? post.likes.filter((like) => like.userId !== user.id)
                : [...post.likes, { userId: user.id }];

              return { ...post, likes: newLikes };
            }
            return post;
          }),
        );
      }
    } catch (error) {
      console.error("Erro ao curtir:", error);
    }
  }

  async function handleDeleteComment(commentId: string) {
    const token = localStorage.getItem("connectu_token");
    try {
      const res = await fetch(
        apiEndpoint(`/posts/comment/${commentId}`),
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setPage(1);
        fetchPosts(true, true);
      }
} catch (error) {
      console.error("Erro ao deletar comentário:", error);
    }
  }

  useEffect(() => {
    if (isFetching || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      {
        rootMargin: "200px",
      },
    );

    const target = document.querySelector("#feed-sentinel");
    if (target) observer.observe(target);

    return () => observer.disconnect();
  }, [isFetching, hasMore]);

  if (!user) return null;

  return (
    <>
      <div className="lg:mr-80 flex flex-col items-center w-full min-w-0 max-w-full">
        <div className="mx-auto w-full min-w-0 max-w-[650px] space-y-[16px] sm:space-y-[20px]">
          {/* Feed Creation Box */}
          <div
            className="rounded-xl border border-[#2a2d32] bg-[#181a1d] p-[16px] sm:p-[20px] w-full min-w-0 max-w-full overflow-hidden"
            data-purpose="creation-box"
          >
            <div className="flex gap-3 sm:gap-4 mb-4 min-w-0">
              {/* Avatar do usuário */}
              {user.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-transparent shrink-0"
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <textarea
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  className="w-full min-w-0 bg-[#1c1e22] border-none rounded-xl text-gray-300 p-3 sm:p-4 resize-none h-28 focus:ring-1 focus:ring-[#316cf4] focus:outline-none text-sm"
                  placeholder="No que você está trabalhando?"
                />
              </div>
            </div>

            {/* Feedback de publicação */}
            {feedback && (
              <p
                className={`text-sm mb-3 px-1 ${feedback.type === "success" ? "text-emerald-400" : "text-red-400"}`}
              >
                {feedback.msg}
              </p>
            )}

            {/* Pré-visualização do arquivo selecionado */}
            {postFile && (
              <div className="mb-3 flex items-center gap-2 px-1 min-w-0">
                <span className="text-xs text-gray-400 truncate">
                  📸 {postFile.name}
                </span>
                <button
                  onClick={() => setPostFile(null)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors shrink-0"
                >
                  Remover
                </button>
              </div>
            )}

            <div className="flex flex-col gap-[16px] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-center justify-between gap-[12px]">
                {/* Botão de adicionar imagem */}
                <label className="cursor-pointer flex items-center gap-2 text-gray-400 hover:text-white rounded-lg transition-colors text-xs sm:text-sm shrink-0">
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span className="truncate">{postFile ? "Imagem adicionada" : "Adicionar Imagem"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setPostFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>

                <span className="text-xs text-gray-500 truncate min-w-0">
                  Postando como:{" "}
                  <strong className="text-gray-300">
                    {user.role === "STUDENT" ? "Talento" : "Empresa"}
                  </strong>
                </span>
              </div>

              <button
                onClick={handleCreatePost}
                disabled={loading || !newPostText.trim()}
                className="min-h-[48px] w-full whitespace-nowrap sm:w-auto sm:min-w-[134px] px-6 py-2 bg-[#316cf4] text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
              >
                {loading ? "Publicando..." : "Publicar projeto"}
              </button>
            </div>
          </div>

          {/* Section Feed de Posts */}
          <div className="space-y-[16px] sm:space-y-[20px] w-full min-w-0 max-w-full" data-purpose="feed-stream">
            {isFetching ? (
              [1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="rounded-xl border border-[#2a2d32] bg-[#181a1d] p-[16px] sm:p-[20px] animate-pulse w-full min-w-0 max-w-full"
                >
                  <div className="flex gap-3 mb-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#2a2d32] shrink-0" />
                    <div className="flex-1 space-y-2 py-1 min-w-0">
                      <div className="h-4 bg-[#2a2d32] rounded w-1/4" />
                      <div className="h-3 bg-[#2a2d32] rounded w-1/3" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-[#2a2d32] rounded" />
                    <div className="h-3 bg-[#2a2d32] rounded w-5/6" />
                  </div>
                </div>
              ))
            ) : posts.length === 0 ? (
              <div className="rounded-xl border border-[#2a2d32] bg-[#181a1d] p-8 sm:p-12 text-center w-full min-w-0 max-w-full">
                <svg
                  className="w-12 h-12 text-gray-600 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                <p className="text-gray-500 text-sm">
                  Nenhuma publicação ainda. Seja o primeiro a postar!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <article
                  key={post.id}
                  className="group/post rounded-xl border border-[#2a2d32] bg-[#181a1d] overflow-hidden transition-colors hover:border-[#3a3d42] w-full min-w-0 max-w-full"
                >
                  <div className="p-[16px] sm:p-[20px]">
                    {/* Header do Post */}
                    <div className="flex items-start justify-between gap-3 mb-4 min-w-0">
                      <Link
                        href={`/dashboard/perfil/${post.authorId}`}
                        className="flex min-w-0 flex-1 items-start gap-3 group cursor-pointer"
                      >
                        {/* Avatar do autor */}
                        {post.author.avatarUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={post.author.avatarUrl}
                            alt={post.author.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shrink-0 border border-[#2a2d32] group-hover:ring-2 ring-[#316cf4] transition-all"
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-600 flex items-center justify-center shrink-0 group-hover:ring-2 ring-[#316cf4] transition-all">
                            <svg
                              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                              />
                            </svg>
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0 mb-0.5">
                            <h3 className="font-bold text-white leading-tight truncate min-w-0 group-hover:text-[#316cf4] group-hover:underline transition-colors text-sm sm:text-base">
                              {post.author.name}
                            </h3>
                            {post.author.isPioneer && (
                              <div
                                className="shrink-0 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-linear-to-r from-amber-900/40 via-yellow-900/20 to-amber-900/40 px-1.5 py-0.5 shadow-[0_0_10px_rgba(245,158,11,0.2)] backdrop-blur-md"
                                title="Membro Fundador"
                              >
                                <FiAward className="text-amber-400" size={10} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-linear-to-r from-amber-200 to-yellow-500 hidden sm:inline">
                                  Pioneiro
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate min-w-0">
                            {post.author.role === "STUDENT"
                              ? `${post.author.course} na ${post.author.institution}`
                              : "Empresa"}
                          </p>
                        </div>
                      </Link>

                      <div className="flex shrink-0 items-center gap-2 sm:gap-3 text-xs text-gray-500">
                        <span>
                          {formatTimeAgo(post.createdAt)}
                        </span>
                        {post.authorId === user.id && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors opacity-100 md:opacity-0 md:group-hover/post:opacity-100 p-1"
                            title="Excluir post"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Conteúdo do Post */}
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed whitespace-pre-wrap break-words min-w-0 max-w-full overflow-hidden">
                      {post.content}
                    </p>

                    {/* Imagem do Post */}
                    {post.imageUrl && (
                      <div className="mb-4 overflow-hidden rounded-xl border border-[#2a2d32] bg-[#0d0f11] w-full max-w-full flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.imageUrl}
                          alt="Imagem da publicação"
                          className="h-auto max-h-[420px] w-full max-w-full object-contain"
                        />
                      </div>
                    )}

                    {/* Ações do Post */}
                    <div className="grid grid-cols-3 gap-[6px] pt-4 border-t border-[#2a2d32] text-gray-400 text-xs sm:text-sm">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center justify-center gap-[6px] min-w-0 py-1 transition-colors ${
                          post.likes.some((like) => like.userId === user?.id)
                            ? "text-[#316cf4] font-bold"
                            : "hover:text-white"
                        }`}
                        aria-label={`Curtir (${post.likes.length})`}
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"
                          fill={
                            post.likes.some((like) => like.userId === user?.id)
                              ? "currentColor"
                              : "none"
                          }
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M14 10h4.708c.94 0 1.667.767 1.607 1.702l-.447 6.998A2 2 0 0117.876 21H6.124a2 2 0 01-1.992-1.3l-.447-6.998C3.625 11.767 4.352 11 5.292 11H10V5a2 2 0 114 0v5z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                        <span className="truncate min-w-0">
                          Curtir {post.likes.length > 0 && post.likes.length}
                        </span>
                      </button>

                      <button
                        onClick={() =>
                          setActiveCommentPostId(
                            post.id === activeCommentPostId ? null : post.id,
                          )
                        }
                        className="flex items-center justify-center gap-[6px] min-w-0 py-1 hover:text-white transition-colors"
                        aria-label={`Comentar (${post.comments?.length || 0})`}
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                        <span className="truncate min-w-0">
                          Comentar{" "}
                          {post.comments && post.comments.length > 0 &&
                            post.comments.length}
                        </span>
                      </button>

                      <button
                        className="flex items-center justify-center gap-[6px] min-w-0 py-1 hover:text-white transition-colors"
                        aria-label="Compartilhar"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                        <span className="truncate min-w-0">Compartilhar</span>
                      </button>
                    </div>

                    {/* Área de Comentário */}
                    {activeCommentPostId === post.id && (
                      <div className="mt-4 flex w-full min-w-0 gap-[8px]">
                        <input
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          disabled={isSubmittingComment}
                          className="min-w-0 flex-1 bg-[#1c1e22] border border-[#2a2d32] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#316cf4] disabled:opacity-50"
                          placeholder="Escreva um comentário..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (!isSubmittingComment) handleComment(post.id);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleComment(post.id)}
                          disabled={isSubmittingComment || !commentContent.trim()}
                          className="shrink-0 bg-[#316cf4] hover:bg-blue-600 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[76px]"
                        >
                          {isSubmittingComment ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            "Enviar"
                          )}
                        </button>
                      </div>
                    )}

                    {/* Lista de Comentários */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-3 border-t border-[#2a2d32] pt-4 mt-4 w-full min-w-0">
                        {post.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="flex w-full min-w-0 gap-2 sm:gap-3 group/comment"
                          >
                            <Link
                              href={`/dashboard/perfil/${comment.userId}`}
                              className="shrink-0"
                            >
                              {comment.user.avatarUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={comment.user.avatarUrl}
                                  alt={comment.user.name}
                                  className="h-8 w-8 rounded-full object-cover border border-[#2a2d32] hover:ring-2 ring-[#316cf4] transition-all"
                                />
                              ) : (
                                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-600 text-[10px] font-bold text-white uppercase hover:ring-2 ring-[#316cf4] transition-all">
                                  {comment.user.name.charAt(0)}
                                </div>
                              )}
                            </Link>

                            <div className="w-full min-w-0 flex-1 rounded-xl bg-[#1c1e22] px-3 py-2 sm:px-4 sm:py-2.5 text-sm text-gray-300 relative overflow-hidden">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1 pr-6 min-w-0">
                                <Link
                                  href={`/dashboard/perfil/${comment.userId}`}
                                  className="hover:underline min-w-0 max-w-full"
                                >
                                  <p className="font-bold text-white text-xs hover:text-[#316cf4] transition-colors truncate">
                                    {comment.user.name}
                                  </p>
                                </Link>
                                {comment.user.isPioneer && (
                                  <div
                                    className="shrink-0 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-linear-to-r from-amber-900/40 via-yellow-900/20 to-amber-900/40 px-1.5 py-0.5 shadow-[0_0_10px_rgba(245,158,11,0.2)] backdrop-blur-sm"
                                    title="Membro Fundador"
                                  >
                                    <FiAward
                                      className="text-amber-400"
                                      size={10}
                                    />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-linear-to-r from-amber-200 to-yellow-500 hidden sm:inline">
                                      Pioneiro
                                    </span>
                                  </div>
                                )}
                              </div>

                              <p className="leading-relaxed break-words whitespace-pre-wrap text-xs sm:text-sm">
                                {comment.content}
                              </p>

                              {comment.userId === user?.id && (
                                <button
                                  onClick={() =>
                                    handleDeleteComment(comment.id)
                                  }
                                  className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover/comment:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-1"
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
                </article>
              ))
            )}

            {/* Sentinel para Infinite Scroll */}
            <div
              id="feed-sentinel"
              className="h-10 w-full flex items-center justify-center p-4 text-sm text-gray-600"
            >
              {isFetching && hasMore && (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2a2d32] border-t-[#316cf4]" />
              )}
              {!hasMore && posts.length > 0 && (
                <span>Você chegou ao fim do feed.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <RightSidebar />
    </>
  );
}
