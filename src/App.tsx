import { Authenticated, Unauthenticated, useMutation } from "convex/react";
import { UserButton } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { api } from "../convex/_generated/api";
import BrandKit from "./components/BrandKit";
import VideoList from "./components/VideoList";
import VideoWizard from "./components/VideoWizard";

type View = "dashboard" | "create" | "brand-kit" | "history";

export default function App() {
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    // Sync user to Convex on load if authenticated
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)" }}>
      <Toaster position="top-right" richColors />
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>

      <Authenticated>
        <UserSync storeUser={storeUser} />
        <Dashboard />
      </Authenticated>
    </div>
  );
}

function UserSync({ storeUser }: { storeUser: () => Promise<void> }) {
  useEffect(() => {
    storeUser();
  }, [storeUser]);
  return null;
}

function LandingPage() {
  return (
    <div className="container" style={{ justifyContent: "center", alignItems: "center" }}>
      <div className="card" style={{ textAlign: "center", maxWidth: "600px", padding: "64px 48px" }}>
        <div style={{
          width: "80px",
          height: "80px",
          background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))",
          borderRadius: "20px",
          margin: "0 auto 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "36px",
          boxShadow: "var(--shadow-glow)"
        }}>
          🎬
        </div>
        <h1 style={{ fontSize: "42px", marginBottom: "16px" }}>
          VidAI
        </h1>
        <p style={{ fontSize: "18px", marginBottom: "32px", color: "var(--color-text-secondary)" }}>
          Create professional food videos with AI. Upload your product photos, add your logo,
          and generate cinematic social media content in seconds.
        </p>
        <button
          onClick={() => {
            // If the user is somehow already signed in (but Convex hasn't caught up), 
            // this forces a refresh or redirects, avoiding the "modal" error.
            window.location.href = "/";
          }}
          className="btn btn-primary"
          style={{ fontSize: "16px", padding: "0 48px", height: "56px", cursor: "pointer" }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [view, setView] = useState<View>("dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar Navigation */}
      <nav style={{
        width: "240px",
        backgroundColor: "var(--color-bg-elevated)",
        borderRight: "1px solid var(--color-border)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "48px",
          padding: "0 8px"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px"
          }}>
            🎬
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700 }}>VidAI</span>
        </div>

        {/* Navigation Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          <button
            onClick={() => setView("dashboard")}
            className={`nav-link ${view === "dashboard" ? "active" : ""}`}
            style={{ justifyContent: "flex-start" }}
          >
            <span>📊</span> Dashboard
          </button>
          <button
            onClick={() => setView("create")}
            className={`nav-link ${view === "create" ? "active" : ""}`}
            style={{ justifyContent: "flex-start" }}
          >
            <span>➕</span> New Video
          </button>
          <button
            onClick={() => setView("brand-kit")}
            className={`nav-link ${view === "brand-kit" ? "active" : ""}`}
            style={{ justifyContent: "flex-start" }}
          >
            <span>🏷️</span> Brand Kit
          </button>
          <button
            onClick={() => setView("history")}
            className={`nav-link ${view === "history" ? "active" : ""}`}
            style={{ justifyContent: "flex-start" }}
          >
            <span>📁</span> History
          </button>
        </div>

        {/* User Section */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px",
          background: "var(--glass-bg)",
          borderRadius: "12px",
          border: "var(--glass-border)"
        }}>
          <UserButton afterSignOutUrl="#" />
          <span style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>Account</span>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: "32px",
        minHeight: "100vh"
      }}>
        {view === "dashboard" && <DashboardHome onNavigate={setView} />}
        {view === "create" && <VideoWizard onComplete={() => setView("history")} />}
        {view === "brand-kit" && <BrandKitPage />}
        {view === "history" && <HistoryPage />}
      </main>
    </div>
  );
}

function DashboardHome({ onNavigate }: { onNavigate: (view: View) => void }) {
  return (
    <div>
      <header style={{ marginBottom: "48px" }}>
        <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>Welcome back</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "16px" }}>
          Ready to create your next viral food video?
        </p>
      </header>

      <div className="grid grid-3" style={{ marginBottom: "48px" }}>
        {/* Quick Actions */}
        <div
          className="card card-elevated"
          onClick={() => onNavigate("create")}
          style={{ cursor: "pointer" }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>➕</div>
          <h3 style={{ marginBottom: "8px" }}>Create New Video</h3>
          <p style={{ fontSize: "14px" }}>Upload photos and generate a professional video</p>
        </div>

        <div
          className="card card-elevated"
          onClick={() => onNavigate("brand-kit")}
          style={{ cursor: "pointer" }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏷️</div>
          <h3 style={{ marginBottom: "8px" }}>Update Brand Kit</h3>
          <p style={{ fontSize: "14px" }}>Manage your logo and product assets</p>
        </div>

        <div
          className="card card-elevated"
          onClick={() => onNavigate("history")}
          style={{ cursor: "pointer" }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📁</div>
          <h3 style={{ marginBottom: "8px" }}>View History</h3>
          <p style={{ fontSize: "14px" }}>Access and download your generated videos</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 style={{ marginBottom: "24px" }}>Recent Videos</h3>
        <VideoList limit={3} />
      </div>
    </div>
  );
}

function BrandKitPage() {
  return (
    <div>
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>Brand Kit</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "16px" }}>
          Manage your logos and product assets for use in video generation
        </p>
      </header>

      <div className="card">
        <BrandKit mode="manage" />
      </div>
    </div>
  );
}

function HistoryPage() {
  return (
    <div>
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>Video History</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "16px" }}>
          View and download all your generated videos
        </p>
      </header>

      <VideoList />
    </div>
  );
}
