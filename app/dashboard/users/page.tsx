'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import { type User, usersApi } from '@/app/lib/api/users';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadUsers uses page which is in deps
  useEffect(() => {
    loadUsers();
  }, [page]);

  async function loadUsers() {
    try {
      setIsLoading(true);
      const response = await usersApi.list({ page, limit: 20 });
      setUsers(response.users);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      await usersApi.update(userId, { role: newRole as 'user' | 'editor' | 'admin' });
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user');
    }
  }

  async function handleDeactivate(userId: string) {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      await usersApi.deactivate(userId);
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to deactivate user');
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <ProtectedRoute requiredRole="admin">
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
            Users
          </h1>
          <span
            style={{
              color: 'var(--theme-text-muted)',
              fontSize: '0.875rem',
            }}
          >
            {total} total users
          </span>
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
                  User
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
                  Role
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
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  Last Login
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
                    colSpan={5}
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: 'var(--theme-text-muted)',
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: 'var(--theme-text-muted)',
                    }}
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
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
                          {user.username || 'No username'}
                        </p>
                        <p
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--theme-text-muted)',
                          }}
                        >
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '4px',
                          border: '1px solid var(--theme-border)',
                          backgroundColor: 'var(--theme-bg-base)',
                          color: 'var(--theme-text-primary)',
                          fontSize: '0.875rem',
                        }}
                      >
                        <option value="user">User</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
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
                          backgroundColor: user.is_active ? 'rgba(40, 128, 94, 0.1)' : 'rgba(190, 51, 72, 0.1)',
                          color: user.is_active ? 'var(--color-water-fortress)' : 'var(--color-war-banner)',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: user.is_active ? 'var(--color-water-fortress)' : 'var(--color-war-banner)',
                          }}
                        />
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {!user.is_verified && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            marginLeft: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            backgroundColor: 'rgba(212, 150, 40, 0.1)',
                            color: 'var(--color-temple-gold)',
                          }}
                        >
                          Unverified
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        fontSize: '0.875rem',
                        color: 'var(--theme-text-muted)',
                      }}
                    >
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleDeactivate(user.id)}
                        disabled={!user.is_active}
                        style={{
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.875rem',
                          color: 'var(--color-war-banner)',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--color-war-banner)',
                          borderRadius: '4px',
                          cursor: user.is_active ? 'pointer' : 'not-allowed',
                          opacity: user.is_active ? 1 : 0.5,
                        }}
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '1.5rem',
            }}
          >
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--theme-bg-elevated)',
                border: '1px solid var(--theme-border)',
                borderRadius: '4px',
                color: 'var(--theme-text-primary)',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              Previous
            </button>
            <span
              style={{
                padding: '0.5rem 1rem',
                color: 'var(--theme-text-muted)',
              }}
            >
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--theme-bg-elevated)',
                border: '1px solid var(--theme-border)',
                borderRadius: '4px',
                color: 'var(--theme-text-primary)',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                opacity: page === totalPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
