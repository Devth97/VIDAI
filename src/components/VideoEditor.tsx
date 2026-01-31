import { useState } from "react";
import { Player } from "@remotion/player";
import { useQuery, useMutation, useAction } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { VideoComposition, VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS, TOTAL_DURATION_IN_FRAMES } from "./VideoComposition";

interface VideoEditorProps {
  videoId: Id<"videos">;
  onComplete: () => void;
  onBack: () => void;
}

const MUSIC_TRACKS = [
  { id: "upbeat", name: "Upbeat Energy", emoji: "🎸" },
  { id: "chill", name: "Chill Vibes", emoji: "🎹" },
  { id: "elegant", name: "Elegant Dining", emoji: "🎻" },
  { id: "tropical", name: "Tropical", emoji: "🥁" },
  { id: "none", name: "No Music", emoji: "🔇" },
];

const LOGO_POSITIONS = [
  { id: "top-left", name: "Top Left" },
  { id: "top-right", name: "Top Right" },
  { id: "bottom-left", name: "Bottom Left" },
  { id: "bottom-right", name: "Bottom Right" },
];

export default function VideoEditor({ videoId, onComplete, onBack }: VideoEditorProps) {
  const video = useQuery(api.videos.get, { id: videoId });
  const logoAssetId = video?.logoAssetId;
  const allAssets = useQuery(api.assets.list);
  const logo = allAssets?.find(asset => asset._id === logoAssetId);
  const renderVideo = useAction(api.actions.renderVideo);
  const updateRemotionProps = useMutation(api.videos.updateRemotionProps);
  
  const [captions, setCaptions] = useState([{ text: "Delicious Food", startFrame: 0, endFrame: 90 }]);
  const [musicTrack, setMusicTrack] = useState("upbeat");
  const [logoPosition, setLogoPosition] = useState("bottom-right");
  const [primaryColor, setPrimaryColor] = useState("#6EDC14");
  const [isRendering, setIsRendering] = useState(false);
  const [showRenderCommand, setShowRenderCommand] = useState(false);
  const [serverRenderCommand, setServerRenderCommand] = useState<string | null>(null);

  if (!video) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const handleAddCaption = () => {
    setCaptions(prev => [...prev, { text: "New Caption", startFrame: 0, endFrame: 90 }]);
  };

  const handleRemoveCaption = (index: number) => {
    setCaptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCaption = (index: number, field: string, value: string | number) => {
    setCaptions(prev => prev.map((cap, i) => 
      i === index ? { ...cap, [field]: value } : cap
    ));
  };

  const handleRender = async () => {
    setIsRendering(true);
    try {
      // Save remotion props to video record
      await updateRemotionProps({
        id: videoId,
        captions,
        musicTrack,
        logoPosition,
        primaryColor,
      });
      
      // Call the render action to prepare Remotion props
      const result = await renderVideo({
        videoId,
        captions,
        musicTrack,
        logoPosition,
        primaryColor,
        logoUrl: logo?.url || undefined,
      });
      
      if (result.success && result.remotionProps) {
        // Generate render command with server-provided props (includes segment URLs)
        const props = JSON.stringify(result.remotionProps);
        const command = `npm run video:render -- --props='${props}'`;
        setServerRenderCommand(command);
        setShowRenderCommand(true);
        toast.success("Render command ready! Run it locally to generate the final video with overlays.");
        onComplete(); // Call onComplete after successful render preparation
      } else {
        console.error("Render preparation failed:", result.error);
        toast.error("Failed to prepare render. Please try again.");
      }
    } catch (error) {
      console.error("Render error:", error);
      toast.error("An error occurred while rendering. Please try again.");
    } finally {
      setIsRendering(false);
    }
  };

  const inputProps = {
    segmentUrls: (video.segmentUrls || []).filter((url): url is string => url !== null),
    images: (video.inputImageUrls || []).filter((url): url is string => url !== null),
    logoUrl: logo?.url || null,
    captions,
    musicTrack,
    logoPosition,
    primaryColor,
    secondaryColor: "#FFFFFF",
    styleId: video.styleId,
  };

  return (
    <div>
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>Edit Your Video</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "16px" }}>
          Preview and customize your video before final render
        </p>
      </header>

      <div className="editor-layout">
        {/* Left Sidebar - Controls */}
        <div className="editor-sidebar">
          {/* Captions Section */}
          <div className="form-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h4 className="form-section-title" style={{ margin: 0 }}>Captions</h4>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleAddCaption}
              >
                + Add
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {captions.map((caption, index) => (
                <div key={index} className="card card-elevated" style={{ padding: "12px" }}>
                  <input
                    type="text"
                    value={caption.text}
                    onChange={(e) => handleUpdateCaption(index, "text", e.target.value)}
                    style={{ marginBottom: "8px", fontSize: "13px" }}
                    placeholder="Caption text"
                  />
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="number"
                      value={caption.startFrame}
                      onChange={(e) => handleUpdateCaption(index, "startFrame", parseInt(e.target.value))}
                      style={{ width: "70px", fontSize: "12px" }}
                      placeholder="Start"
                    />
                    <span style={{ color: "var(--color-text-muted)" }}>to</span>
                    <input
                      type="number"
                      value={caption.endFrame}
                      onChange={(e) => handleUpdateCaption(index, "endFrame", parseInt(e.target.value))}
                      style={{ width: "70px", fontSize: "12px" }}
                      placeholder="End"
                    />
                    <button 
                      onClick={() => handleRemoveCaption(index)}
                      style={{ 
                        marginLeft: "auto",
                        background: "transparent",
                        border: "none",
                        color: "#e74c3c",
                        cursor: "pointer",
                        fontSize: "16px"
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Music Section */}
          <div className="form-section">
            <h4 className="form-section-title">Background Music</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {MUSIC_TRACKS.map((track) => (
                <button
                  key={track.id}
                  className={`radio-option ${musicTrack === track.id ? "selected" : ""}`}
                  onClick={() => setMusicTrack(track.id)}
                  style={{ justifyContent: "flex-start" }}
                >
                  <span style={{ marginRight: "8px" }}>{track.emoji}</span>
                  {track.name}
                </button>
              ))}
            </div>
          </div>

          {/* Logo Position */}
          {logo && (
            <div className="form-section">
              <h4 className="form-section-title">Logo Position</h4>
              <div className="radio-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                {LOGO_POSITIONS.map((pos) => (
                  <button
                    key={pos.id}
                    className={`radio-option ${logoPosition === pos.id ? "selected" : ""}`}
                    onClick={() => setLogoPosition(pos.id)}
                    style={{ fontSize: "12px" }}
                  >
                    {pos.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Theme */}
          <div className="form-section">
            <h4 className="form-section-title">Accent Color</h4>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["#6EDC14", "#FF6B6B", "#4ECDC4", "#FFE66D", "#FF9F43", "#FFFFFF"].map((color) => (
                <button
                  key={color}
                  onClick={() => setPrimaryColor(color)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: color,
                    border: primaryColor === color ? "3px solid white" : "2px solid transparent",
                    cursor: "pointer",
                    boxShadow: primaryColor === color ? "0 0 0 2px var(--color-accent)" : "none",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Player */}
        <div className="editor-preview">
          <Player
            component={VideoComposition}
            inputProps={inputProps}
            durationInFrames={TOTAL_DURATION_IN_FRAMES}
            fps={VIDEO_FPS}
            compositionWidth={VIDEO_WIDTH}
            compositionHeight={VIDEO_HEIGHT}
            style={{
              width: "100%",
              height: "100%",
            }}
            controls
            autoPlay
            loop
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
        <button 
          className="btn btn-secondary"
          onClick={onBack}
        >
          ← Back to Style
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleRender}
          disabled={isRendering || !video.segmentUrls || video.segmentUrls.length !== 3}
          style={{ minWidth: "220px" }}
        >
          {isRendering ? (
            <>
              <div className="loading-spinner" style={{ width: "20px", height: "20px", borderWidth: "2px" }} />
              Preparing...
            </>
          ) : (
            "🎬 Generate Render Command"
          )}
        </button>
      </div>

      {!video.segmentUrls || video.segmentUrls.length !== 3 ? (
        <div style={{ marginTop: "16px", padding: "12px", background: "#3e2723", borderRadius: "8px", color: "#ffcc80" }}>
          ⚠️ Waiting for AI video segments to be generated... Please complete the AI generation step first.
        </div>
      ) : null}

      {/* Render Command */}
      {showRenderCommand && serverRenderCommand && (
        <div style={{ marginTop: "24px", padding: "16px", background: "#1a1a2e", borderRadius: "8px" }}>
          <h4 style={{ marginBottom: "12px", color: "var(--color-accent)" }}>🎬 Final Video Render Command</h4>
          <p style={{ marginBottom: "12px", fontSize: "14px", color: "var(--color-text-secondary)" }}>
            This command includes your actual AI-generated video segments and logo. Run it in your terminal:
          </p>
          <code style={{ 
            display: "block", 
            padding: "12px", 
            background: "#0f0f23", 
            borderRadius: "4px",
            fontSize: "12px",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all"
          }}>
            {serverRenderCommand}
          </code>
          <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                navigator.clipboard.writeText(serverRenderCommand);
                toast.success("Command copied to clipboard!");
              }}
            >
              📋 Copy Command
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setShowRenderCommand(false)}
            >
              Hide
            </button>
          </div>
          <p style={{ marginTop: "12px", fontSize: "12px", color: "var(--color-text-muted)", fontStyle: "italic" }}>
            💡 After running, your branded video will be at: out/video.mp4 (18 seconds with logo + captions)
          </p>
        </div>
      )}
    </div>
  );
}
