"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/lib/api/client";
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";

interface SiteSettings {
  site_name: string;
  site_description: string;
  maintenance_mode: boolean;
  allow_registration: boolean;
  default_article_category: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: "SIGINT Wiki",
    site_description: "",
    maintenance_mode: false,
    allow_registration: true,
    default_article_category: "em-sca",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await api.get<{ settings: Record<string, string> }>(
        "/admin/settings"
      );
      // Convert string values to appropriate types
      setSettings({
        site_name: response.settings.site_name || "SIGINT Wiki",
        site_description: response.settings.site_description || "",
        maintenance_mode: response.settings.maintenance_mode === "true",
        allow_registration: response.settings.allow_registration !== "false",
        default_article_category:
          response.settings.default_article_category || "em-sca",
      });
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      await api.patch("/admin/settings", {
        settings: {
          site_name: settings.site_name,
          site_description: settings.site_description,
          maintenance_mode: String(settings.maintenance_mode),
          allow_registration: String(settings.allow_registration),
          default_article_category: settings.default_article_category,
        },
      });
      setMessage("Settings saved successfully");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div>Loading...</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 600,
            marginBottom: "1.5rem",
            color: "var(--theme-text-primary)",
          }}
        >
          Site Settings
        </h1>

        {message && (
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: message.includes("success")
                ? "rgba(34, 197, 94, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${
                message.includes("success")
                  ? "rgba(34, 197, 94, 0.3)"
                  : "rgba(239, 68, 68, 0.3)"
              }`,
              borderRadius: "4px",
              color: message.includes("success") ? "#22c55e" : "#ef4444",
              marginBottom: "1rem",
            }}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: "var(--theme-bg-elevated)",
            border: "1px solid var(--theme-border)",
            borderRadius: "8px",
            padding: "1.5rem",
            maxWidth: "600px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label
                htmlFor="site_name"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--theme-text-primary)",
                }}
              >
                Site Name
              </label>
              <input
                id="site_name"
                type="text"
                value={settings.site_name}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, site_name: e.target.value }))
                }
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
                htmlFor="site_description"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--theme-text-primary)",
                }}
              >
                Site Description
              </label>
              <textarea
                id="site_description"
                value={settings.site_description}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    site_description: e.target.value,
                  }))
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
                htmlFor="default_article_category"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--theme-text-primary)",
                }}
              >
                Default Article Category
              </label>
              <select
                id="default_article_category"
                value={settings.default_article_category}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    default_article_category: e.target.value,
                  }))
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1rem",
                backgroundColor: "var(--theme-bg-base)",
                borderRadius: "4px",
              }}
            >
              <input
                id="allow_registration"
                type="checkbox"
                checked={settings.allow_registration}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    allow_registration: e.target.checked,
                  }))
                }
                style={{
                  width: "18px",
                  height: "18px",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="allow_registration"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--theme-text-primary)",
                  cursor: "pointer",
                }}
              >
                Allow new user registration
              </label>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1rem",
                backgroundColor: "rgba(239, 68, 68, 0.05)",
                borderRadius: "4px",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              <input
                id="maintenance_mode"
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    maintenance_mode: e.target.checked,
                  }))
                }
                style={{
                  width: "18px",
                  height: "18px",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="maintenance_mode"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--theme-text-primary)",
                  cursor: "pointer",
                }}
              >
                Maintenance Mode (disable public access)
              </label>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "var(--theme-accent)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "1rem",
                fontWeight: 500,
                cursor: isSaving ? "not-allowed" : "pointer",
                opacity: isSaving ? 0.7 : 1,
                marginTop: "0.5rem",
              }}
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
