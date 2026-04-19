"use client";

import { useState } from "react";
import { useAuth } from "@/app/lib/auth/hooks";
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";

export default function UserSettingsPage() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      window.location.href = "/";
    } catch (err) {
      setMessage("Failed to log out. Please try again.");
      setIsLoggingOut(false);
    }
  }

  return (
    <ProtectedRoute>
      <div className="settings-container">
        <h1 className="settings-title">Account Settings</h1>

        {message && (
          <div className={`settings-message ${message.includes("success") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        {/* Profile Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Profile</h2>
          <div className="settings-card">
            <div className="settings-profile">
              <div className="settings-avatar">
                {(user?.username?.[0] ?? user?.email?.[0] ?? "U").toUpperCase()}
              </div>
              <div className="settings-profile-info">
                <div className="settings-profile-name">
                  {user?.username ?? "No username"}
                </div>
                <div className="settings-profile-email">{user?.email}</div>
                <span className="settings-role-badge">{user?.role}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Account Info Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Account Information</h2>
          <div className="settings-card">
            <div className="settings-info-grid">
              <div className="settings-info-item">
                <label>Email</label>
                <span>{user?.email}</span>
              </div>
              <div className="settings-info-item">
                <label>Username</label>
                <span>{user?.username ?? "Not set"}</span>
              </div>
              <div className="settings-info-item">
                <label>Role</label>
                <span className="settings-role">{user?.role}</span>
              </div>
              <div className="settings-info-item">
                <label>Verified</label>
                <span>{user?.isVerified ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Logout Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Session</h2>
          <div className="settings-card">
            <p className="settings-text">
              Sign out of your account on this device.
            </p>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="settings-logout-btn"
            >
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </section>

        {/* Admin Link (if admin) */}
        {user?.role === "admin" && (
          <section className="settings-section">
            <h2 className="settings-section-title">Administration</h2>
            <div className="settings-card">
              <p className="settings-text">
                Access the admin dashboard to manage users, articles, and site settings.
              </p>
              <a href="/dashboard" className="settings-admin-link">
                Go to Admin Dashboard →
              </a>
            </div>
          </section>
        )}

        <style jsx>{`
          .settings-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem 1rem;
          }

          .settings-title {
            font-size: 1.75rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: var(--theme-text-primary);
          }

          .settings-message {
            padding: 0.75rem 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            font-size: 0.875rem;
          }

          .settings-message.success {
            background: rgba(40, 128, 94, 0.1);
            border: 1px solid rgba(40, 128, 94, 0.3);
            color: var(--color-water-fortress);
          }

          .settings-message.error {
            background: rgba(190, 51, 72, 0.1);
            border: 1px solid rgba(190, 51, 72, 0.3);
            color: var(--color-war-banner);
          }

          .settings-section {
            margin-bottom: 2rem;
          }

          .settings-section-title {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--theme-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.75rem;
          }

          .settings-card {
            background: var(--theme-bg-elevated);
            border: 1px solid var(--theme-border);
            border-radius: 8px;
            padding: 1.5rem;
          }

          .settings-profile {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .settings-avatar {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: var(--theme-accent);
            color: var(--color-ola-leaf);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: 600;
            flex-shrink: 0;
          }

          .settings-profile-info {
            flex: 1;
            min-width: 0;
          }

          .settings-profile-name {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--theme-text-primary);
            margin-bottom: 0.25rem;
            word-break: break-word;
          }

          .settings-profile-email {
            font-size: 0.875rem;
            color: var(--theme-text-muted);
            margin-bottom: 0.5rem;
            word-break: break-word;
          }

          .settings-role-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            background: var(--theme-accent);
            color: var(--color-ola-leaf);
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
            border-radius: 9999px;
          }

          .settings-info-grid {
            display: grid;
            gap: 1rem;
          }

          @media (min-width: 640px) {
            .settings-info-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          .settings-info-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .settings-info-item label {
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--theme-text-muted);
            text-transform: uppercase;
          }

          .settings-info-item span {
            font-size: 0.875rem;
            color: var(--theme-text-primary);
          }

          .settings-role {
            display: inline-block;
            width: fit-content;
            padding: 0.125rem 0.5rem;
            background: var(--theme-bg-base);
            border-radius: 4px;
            font-weight: 500;
          }

          .settings-text {
            font-size: 0.875rem;
            color: var(--theme-text-secondary);
            margin-bottom: 1rem;
            line-height: 1.5;
          }

          .settings-logout-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 1.5rem;
            background: var(--color-war-banner);
            color: var(--color-ola-leaf);
            border: none;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
          }

          .settings-logout-btn:hover:not(:disabled) {
            background: var(--color-war-banner);
          }

          .settings-logout-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .settings-admin-link {
            display: inline-flex;
            align-items: center;
            padding: 0.75rem 1rem;
            background: var(--theme-accent);
            color: var(--color-ola-leaf);
            text-decoration: none;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            transition: opacity 0.2s;
          }

          .settings-admin-link:hover {
            opacity: 0.9;
          }

          @media (max-width: 640px) {
            .settings-container {
              padding: 1rem;
            }

            .settings-title {
              font-size: 1.5rem;
            }

            .settings-card {
              padding: 1rem;
            }

            .settings-profile {
              flex-direction: column;
              text-align: center;
            }

            .settings-logout-btn,
            .settings-admin-link {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
