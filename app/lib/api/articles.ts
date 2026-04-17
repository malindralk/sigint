"use client";

import { api } from "./client";

export interface Article {
  id: string;
  slug: string;
  category: string;
  title: string | null;
  description: string | null;
  content: string;
  metadata: Record<string, unknown>;
  synced_at: string;
  author_id: string | null;
  is_published: boolean;
}

export interface ArticleListItem {
  id: string;
  slug: string;
  category: string;
  title: string | null;
  description: string | null;
  is_published: boolean;
}

export interface CreateArticleRequest {
  slug: string;
  category: string;
  title: string;
  description?: string;
  content: string;
  frontmatter?: Record<string, unknown>;
  is_published?: boolean;
}

export interface UpdateArticleRequest {
  title?: string;
  description?: string;
  content?: string;
  frontmatter?: Record<string, unknown>;
  is_published?: boolean;
}

export const articlesApi = {
  // List articles
  list: (params?: {
    category?: string;
    limit?: number;
    offset?: number;
    include_unpublished?: boolean;
  }) => api.get<ArticleListItem[]>("/articles", { skipAuth: !params?.include_unpublished }),

  // Get single article
  get: (slug: string) => api.get<Article>(`/articles/${slug}`),

  // Create article (requires editor/admin)
  create: (data: CreateArticleRequest) =>
    api.post<Article>("/admin/articles", data),

  // Update article (requires editor/admin)
  update: (id: string, data: UpdateArticleRequest) =>
    api.patch<Article>(`/admin/articles/${id}`, data),

  // Delete article (requires editor/admin)
  delete: (id: string) => api.delete<{ message: string }>(`/admin/articles/${id}`),

  // Sync content from git submodule
  sync: (generateEmbeddings = true) =>
    api.post<{ status: string; stats: Record<string, number> }>(
      `/articles/sync?generate_embeddings=${generateEmbeddings}`,
      {}
    ),

  // Generate embeddings
  generateEmbeddings: (slug?: string) =>
    api.post<{ status: string; stats: Record<string, number> }>(
      `/articles/embeddings/generate${slug ? `?slug=${slug}` : ""}`,
      {}
    ),
};
