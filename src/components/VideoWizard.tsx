import { useState, useRef } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import BrandKit from "./BrandKit";
import VideoEditor from "./VideoEditor";

type Step = "upload" | "analysis" | "style" | "editing";

interface VideoWizardProps {
  onComplete: () => void;
}

const STYLES = [
  {
    id: "cinematic",
    name: "Cinematic Close-Up",
    description: "Dramatic lighting with shallow depth of field",
    emoji: "🎬",
    gradient: "linear-gradient(135deg, #1a1a2e, #16213e)"
  },
  {
    id: "vibrant",
    name: "Vibrant Product",
    description: "Bright, colorful, and eye-catching visuals",
    emoji: "✨",
    gradient: "linear-gradient(135deg, #2d132c, #801336)"
  },
  {
    id: "slowmo",
    name: "Slow Motion",
    description: "Elegant slow-motion food motion",
    emoji: "🐌",
    gradient: "linear-gradient(135deg, #0f2027, #203a43)"
  },
  {
    id: "minimal",
    name: "Clean & Minimal",
    description: "Simple, modern aesthetic with ample whitespace",
    emoji: "🤍",
    gradient: "linear-gradient(135deg, #232526, #414345)"
  },
  {
    id: "rustic",
    name: "Rustic Kitchen",
    description: "Warm, homemade, artisanal feel",
    emoji: "🌾",
    gradient: "linear-gradient(135deg, #3e2723, #5d4037)"
  },
  {
    id: "luxury",
    name: "Luxury Dining",
    description: "High-end restaurant presentation",
    emoji: "🥂",
    gradient: "linear-gradient(135deg, #0f0c29, #302b63)"
  }
];

export default function VideoWizard({ onComplete }: VideoWizardProps) {
  const [step, setStep] = useState<Step>("upload");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedLogoId, setSelectedLogoId] = useState<Id<"assets"> | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>(STYLES[0].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdVideoId, setCreatedVideoId] = useState<Id<"videos"> | null>(null);

  const generateUploadUrl = useMutation(api.videos.generateUploadUrl);
  const createJob = useMutation(api.videos.createJob);
  const performAnalysis = useAction(api.actions.generateAiVideo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 3);
      setImages(files);

      // Create preview URLs
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleStartAnalysis = () => {
    if (images.length === 0) return;
    setStep("analysis");

    // Simulate analysis delay
    setTimeout(() => {
      setStep("style");
    }, 2500);
  };

  const handleCreateVideo = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    try {
      // Upload images
      const storageIds = await Promise.all(
        images.map(async (image) => {
          const postUrl = await generateUploadUrl();
          const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": image.type },
            body: image,
          });
          const { storageId } = await result.json();
          return storageId;
        })
      );

      // Create job
      const videoId = await createJob({
        styleId: selectedStyle,
        prompt: `Style: ${selectedStyle}`,
        inputImageStorageIds: storageIds,
        logoAssetId: selectedLogoId || undefined,
      });

      // Trigger AI Generation Action
      // We use fetch/API or Convex Action to trigger this. 
      // Since we are inside a component, we can use useAction but we need to initialize it.
      // However, for simplicity in this flow, we will let the backend createJob's internal scheduler handle it
      // OR explicitly call the action here if we want immediate feedback.
      // Given the previous setup, let's call the action explicitly here.

      // Note: We need to add the mutation/action hook at the top level first.
      await performAnalysis({ videoId });

      setCreatedVideoId(videoId);
      setStep("editing");
    } catch (error) {
      console.error("Failed to create video:", error);
      alert("Failed to create video. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepIndicator = () => (
    <div style={{ display: "flex", gap: "16px", marginBottom: "48px" }}>
      {[
        { id: "upload", label: "Upload", icon: "📤" },
        { id: "analysis", label: "Analysis", icon: "🔍" },
        { id: "style", label: "Style", icon: "🎨" },
        { id: "editing", label: "Edit", icon: "✏️" }
      ].map((s, index) => {
        const isActive = step === s.id;
        const isCompleted = [
          "upload", "analysis", "style", "editing"
        ].indexOf(step) > index;

        return (
          <div
            key={s.id}
            className={`wizard-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
            style={{ flex: 1 }}
          >
            <div className="wizard-step-number">
              {isCompleted ? "✓" : index + 1}
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                Step {index + 1}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>
                {s.icon} {s.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Step 1: Upload
  if (step === "upload") {
    return (
      <div>
        <header style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>Create New Video</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "16px" }}>
            Upload your product photos and select your brand logo
          </p>
        </header>

        {renderStepIndicator()}

        <div className="grid grid-2">
          {/* Product Photos Upload */}
          <div className="card">
            <div className="form-section">
              <h3 style={{ marginBottom: "16px" }}>📸 Product Photos</h3>
              <p style={{ fontSize: "14px", marginBottom: "24px", color: "var(--color-text-secondary)" }}>
                Upload up to 3 photos of your food product
              </p>

              {images.length === 0 ? (
                <div
                  className="upload-zone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span style={{ fontSize: "48px" }}>📷</span>
                  <p style={{ margin: "16px 0 8px", fontSize: "16px", fontWeight: 600 }}>
                    Click to upload photos
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-muted)" }}>
                    Supports JPG, PNG (Max 3 files)
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      style={{
                        position: "relative",
                        aspectRatio: "1",
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: "2px solid var(--color-border)"
                      }}
                    >
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        onClick={() => removeImage(index)}
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: "rgba(231, 76, 60, 0.9)",
                          border: "none",
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <div
                      className="upload-zone"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ aspectRatio: "1", padding: "16px" }}
                    >
                      <span style={{ fontSize: "32px" }}>+</span>
                    </div>
                  )}
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                ref={fileInputRef}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* Logo Selection */}
          <div className="card">
            <BrandKit
              mode="select"
              selectedLogoId={selectedLogoId}
              onSelectLogo={setSelectedLogoId}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", marginTop: "32px" }}>
          <button
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleStartAnalysis}
            disabled={images.length === 0}
            style={{ minWidth: "200px" }}
          >
            Continue to Analysis →
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Analysis
  if (step === "analysis") {
    return (
      <div>
        <header style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>Create New Video</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "16px" }}>
            Our AI is analyzing your content
          </p>
        </header>

        {renderStepIndicator()}

        <div className="card" style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="analysis-container">
            <div className="analysis-animation">
              🤖
            </div>
            <h2 className="analysis-text">Analyzing your food...</h2>
            <p className="analysis-subtext">
              AI is detecting ingredients, colors, and optimal video compositions
            </p>
            <div className="progress-bar" style={{ width: "300px", marginTop: "32px" }}>
              <div
                className="progress-fill"
                style={{
                  width: "100%",
                  animation: "progress 2.5s ease-in-out"
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Style Selection
  if (step === "style") {
    return (
      <div>
        <header style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>Create New Video</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "16px" }}>
            Choose a style that matches your brand
          </p>
        </header>

        {renderStepIndicator()}

        <div className="card" style={{ marginBottom: "32px" }}>
          <h3 style={{ marginBottom: "24px" }}>🎨 Select Video Style</h3>

          <div className="grid grid-3">
            {STYLES.map((style) => (
              <div
                key={style.id}
                className={`style-card ${selectedStyle === style.id ? "selected" : ""}`}
                onClick={() => setSelectedStyle(style.id)}
              >
                <div
                  className="style-card-preview"
                  style={{ background: style.gradient }}
                >
                  <span style={{ fontSize: "64px" }}>{style.emoji}</span>
                  {selectedStyle === style.id && (
                    <div style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "var(--color-accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <span style={{ color: "#000", fontSize: "18px" }}>✓</span>
                    </div>
                  )}
                </div>
                <div className="style-card-info">
                  <h4 className="style-card-name">{style.name}</h4>
                  <p className="style-card-description">{style.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
          <button
            className="btn btn-secondary"
            onClick={() => setStep("upload")}
          >
            ← Back
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreateVideo}
            disabled={isProcessing}
            style={{ minWidth: "240px" }}
          >
            {isProcessing ? (
              <>
                <div className="loading-spinner" style={{ width: "20px", height: "20px", borderWidth: "2px" }} />
                Creating...
              </>
            ) : (
              "Create Video & Edit →"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Editing with Remotion
  if (step === "editing" && createdVideoId) {
    return (
      <VideoEditor
        videoId={createdVideoId}
        onComplete={onComplete}
        onBack={() => setStep("style")}
      />
    );
  }

  return null;
}
