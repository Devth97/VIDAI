import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface Video {
  _id: Id<"videos">;
  _creationTime: number;
  userId: Id<"users">;
  prompt: string;
  styleId: string;
  status: string;
  inputImageStorageIds: string[];
  inputImageUrls: string[];
  segments?: Array<{ storageId: string; prompt: string; type: string }>;
  segmentUrls?: string[] | null;
  generatedVideoStorageId?: string;
  generatedVideoUrl?: string | null;
  createdAt: number;
  errorMessage?: string;
}

interface VideoListProps {
  limit?: number;
}

export default function VideoList({ limit }: VideoListProps) {
    const videos = useQuery(api.videos.list, { limit }) as Video[] | undefined;
    const [playingVideo, setPlayingVideo] = useState<Video | null>(null);

    // Polling: Re-subscribe periodically when videos are in active states
    useEffect(() => {
        if (!videos) return;
        
        const hasActiveVideos = videos.some(
            v => v.status === "queued" || v.status === "generating" || v.status === "rendering"
        );
        
        if (!hasActiveVideos) return;
        
        const interval = setInterval(() => {
            // Force re-render to trigger fresh query
            window.location.reload();
        }, 3000);
        
        return () => clearInterval(interval);
    }, [videos]);

    const handlePlayVideo = (video: Video) => {
        if (video.generatedVideoUrl) {
            setPlayingVideo(video);
        }
    };

    const closeModal = () => {
        setPlayingVideo(null);
    };

    if (videos === undefined) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    const displayVideos = limit ? videos.slice(0, limit) : videos;

    if (displayVideos.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📁</div>
                <h4 className="empty-state-title">No videos yet</h4>
                <p className="empty-state-description">
                    Create your first video to see it here
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: "grid", gap: "16px" }}>
            {displayVideos.map((video) => (
                <div key={video._id} className="card" style={{ display: "flex", gap: "16px", padding: "16px", alignItems: "center" }}>
                    {/* Thumbnail */}
                    <div className="thumbnail" style={{ width: "120px", height: "80px", flexShrink: 0 }}>
                        {video.status === "completed" && video.generatedVideoUrl ? (
                            <video src={video.generatedVideoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted loop />
                        ) : video.inputImageUrls && video.inputImageUrls.length > 0 ? (
                            <img src={video.inputImageUrls[0]} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <span className="thumbnail-placeholder">
                                {video.status === "failed" ? "❌" : "⏳"}
                            </span>
                        )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                            <h4 style={{ margin: 0, fontSize: "16px" }}>
                                {new Date(video.createdAt).toLocaleDateString(undefined, { 
                                    month: "short", 
                                    day: "numeric", 
                                    year: "numeric" 
                                })}
                            </h4>
                            <StatusBadge status={video.status} />
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)" }}>
                            Style: <span style={{ color: "var(--color-text)" }}>{video.styleId}</span>
                            {video.segments && (
                                <span style={{ marginLeft: "8px" }}>
                                    ({video.segments.length}/3 scenes)
                                </span>
                            )}
                        </p>
                        
                        {/* Show scene generation progress during generating status */}
                        {video.status === "generating" && video.segments && (
                            <div style={{ marginTop: "8px" }}>
                                <div style={{ 
                                    display: "flex", 
                                    gap: "4px",
                                    fontSize: "11px",
                                    color: "var(--color-text-secondary)"
                                }}>
                                    {["intro", "main", "outro"].map((sceneType) => {
                                        const hasScene = video.segments?.some(s => s.type === sceneType);
                                        return (
                                            <span 
                                                key={sceneType}
                                                style={{
                                                    padding: "2px 6px",
                                                    borderRadius: "4px",
                                                    background: hasScene ? "var(--color-success)" : "var(--color-background-hover)",
                                                    color: hasScene ? "white" : "inherit"
                                                }}
                                            >
                                                {hasScene ? "✓" : "○"} {sceneType}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        
                        {video.status === "editing" && (
                            <button className="btn btn-primary btn-sm" style={{ marginTop: "12px" }}>
                                Continue Editing →
                            </button>
                        )}

                        {video.status === "completed" && video.generatedVideoUrl && (
                            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                                <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handlePlayVideo(video)}
                                >
                                    ▶ Play
                                </button>
                                <a
                                    href={video.generatedVideoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary btn-sm"
                                >
                                    Download
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Video Player Modal */}
            {playingVideo && (
                <div 
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0, 0, 0, 0.9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        padding: "20px",
                    }}
                    onClick={closeModal}
                >
                    <div 
                        style={{
                            position: "relative",
                            maxWidth: "90vw",
                            maxHeight: "90vh",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={closeModal}
                            style={{
                                position: "absolute",
                                top: "-40px",
                                right: "0",
                                background: "transparent",
                                border: "none",
                                color: "white",
                                fontSize: "24px",
                                cursor: "pointer",
                                padding: "8px",
                            }}
                        >
                            ×
                        </button>
                        <video
                            src={playingVideo.generatedVideoUrl!}
                            controls
                            autoPlay
                            style={{
                                maxWidth: "100%",
                                maxHeight: "80vh",
                                borderRadius: "8px",
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const getBadgeClass = () => {
        switch (status) {
            case "queued": return "badge badge-queued";
            case "analyzing": return "badge badge-analyzing";
            case "generating": return "badge badge-generating";
            case "editing": return "badge badge-editing";
            case "completed": return "badge badge-completed";
            case "failed": return "badge badge-failed";
            default: return "badge";
        }
    };

    return (
        <span className={getBadgeClass()}>
            {status}
        </span>
    );
}
