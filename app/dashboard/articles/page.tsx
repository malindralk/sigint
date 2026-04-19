'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import { type ArticleListItem, articlesApi } from '@/app/lib/api/articles';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  // biome-ignore lint/correctness/useExhaustiveDependencies: initial load only
  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      setIsLoading(true);
      const response = await articlesApi.list({ include_unpublished: true });
      setArticles(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      await articlesApi.delete(id);
      await loadArticles();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete article');
    }
  }

  const filteredArticles = articles.filter(
    (article) =>
      article.title?.toLowerCase().includes(filter.toLowerCase()) ||
      article.slug.toLowerCase().includes(filter.toLowerCase()) ||
      article.category.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <ProtectedRoute requiredRole="editor">
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 600,
              color: 'var(--theme-text-primary)',
            }}
          >
            Articles
          </h1>
          <Link
            href="/dashboard/articles/new"
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--theme-accent)',
              color: 'var(--color-ola-leaf)',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            + New Article
          </Link>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(190, 51, 72, 0.1)',
              border: '1px solid rgba(190, 51, 72, 0.3)',
              borderRadius: '4px',
              color: 'var(--color-war-banner)',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            marginBottom: '1rem',
          }}
        >
          <input
            type="text"
            placeholder="Filter articles..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '0.75rem',
              border: '1px solid var(--theme-border)',
              borderRadius: '4px',
              backgroundColor: 'var(--theme-bg-elevated)',
              color: 'var(--theme-text-primary)',
              fontSize: '0.875rem',
            }}
          />
        </div>

        <div
          style={{
            backgroundColor: 'var(--theme-bg-elevated)',
            border: '1px solid var(--theme-border)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--theme-bg-base)',
                  borderBottom: '1px solid var(--theme-border)',
                }}
              >
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  Article
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  Category
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'right',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: 'var(--theme-text-muted)',
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredArticles.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: 'var(--theme-text-muted)',
                    }}
                  >
                    No articles found
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => (
                  <tr
                    key={article.id}
                    style={{
                      borderBottom: '1px solid var(--theme-border)',
                    }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <p
                          style={{
                            fontWeight: 500,
                            color: 'var(--theme-text-primary)',
                          }}
                        >
                          {article.title || article.slug}
                        </p>
                        <p
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--theme-text-muted)',
                          }}
                        >
                          /{article.slug}
                        </p>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        fontSize: '0.875rem',
                        color: 'var(--theme-text-muted)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {article.category}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          backgroundColor: article.is_published ? 'rgba(40, 128, 94, 0.1)' : 'rgba(212, 150, 40, 0.1)',
                          color: article.is_published ? 'var(--color-water-fortress)' : 'var(--color-temple-gold)',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: article.is_published
                              ? 'var(--color-water-fortress)'
                              : 'var(--color-temple-gold)',
                          }}
                        />
                        {article.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <Link
                          href={`/${article.category}/${article.slug}`}
                          target="_blank"
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            color: 'var(--theme-text-primary)',
                            backgroundColor: 'var(--theme-bg-base)',
                            border: '1px solid var(--theme-border)',
                            borderRadius: '4px',
                            textDecoration: 'none',
                          }}
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/articles/${article.id}/edit`}
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            color: 'var(--theme-accent)',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--theme-accent)',
                            borderRadius: '4px',
                            textDecoration: 'none',
                          }}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(article.id)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            color: 'var(--color-war-banner)',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--color-war-banner)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
}
