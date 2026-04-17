"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { articlesApi } from "@/app/lib/api/articles";
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";

export default function NewArticlePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    slug: "",
    category: "sigint",
    title: "",
    description: "",
    content: "",
    is_published: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await articlesApi.create({
        ...formData,
        frontmatter: {},
      });
      router.push("/dashboard/articles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create article");
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="editor">
      <div>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 600,
            marginBottom: "1.5rem",
            color: "var(--theme-text-primary)",
          }}
        >
          New Article
        </h1>

        {error && (
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "4px",
              color: "#ef4444",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: "var(--theme-bg-elevated)",
            border: "1px solid var(--theme-border)",
            borderRadius: "8px",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "1.5rem",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label
                htmlFor="title"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--theme-text-primary)",
                }}
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
                style={{
                  padding: "0.75rem",
                  border: "1px solid var(--theme-border)",
                  borderRadius: "4px",
                  backgroundColor: "var(--theme-bg-base)",
                  color: "var(--theme-text-primary)",
                  fontSize: "1rem",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label
                htmlFor="slug"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--theme-text-primary)",
                }}
              >
                Slug
              </label>
              <input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                required
                placeholder="article-url-slug"
                style={{
                  padding: "0.75rem",
                  border: "1px solid var(--theme-border)",
                  borderRadius: "4px",
                  backgroundColor: "var(--theme-bg-base)",
                  color: "var(--theme-text-primary)",
                  fontSize: "1rem",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label
                htmlFor="category"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--theme-text-primary)",
                }}
              >
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                style={{
                  padding: "0.75rem",
                  border: "1px solid var(--theme-border)",
                  borderRadius: "4px",
                  backgroundColor: "var(--theme-bg-base)",
                  color: "var(--theme-text-primary)",
                  fontSize: "1rem",
                }}
              >
                <option value="sigint">SIGINT</option>
                <option value="em-sca">EM-SCA</option>
                <option value="learning">Learning</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label
                htmlFor="description"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--theme-text-primary)",
                }}
              >
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                style={{
                  padding: "0.75rem",
                  border: "1px solid var(--theme-border)",
                  borderRadius: "4px",
                  backgroundColor: "var(--theme-bg-base)",
                  color: "var(--theme-text-primary)",
                  fontSize: "1rem",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label
                htmlFor="content"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--theme-text-primary)",
                }}
              >
                Content (Markdown)
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={20}
                required
                style={{
                  padding: "0.75rem",
                  border: "1px solid var(--theme-border)",
                  borderRadius: "4px",
                  backgroundColor: "var(--theme-bg-base)",
                  color: "var(--theme-text-primary)",
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                  resize: "vertical",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <input
                id="is_published"
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_published: e.target.checked,
                  }))
                }
                style={{
                  width: "18px",
                  height: "18px",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="is_published"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--theme-text-primary)",
                  cursor: "pointer",
                }}
              >
                Publish immediately
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "var(--theme-accent)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "1rem",
                  fontWeight: 500,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? "Creating..." : "Create Article"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/articles")}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "var(--theme-bg-base)",
                  color: "var(--theme-text-primary)",
                  border: "1px solid var(--theme-border)",
                  borderRadius: "4px",
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
