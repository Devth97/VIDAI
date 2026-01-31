import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const STYLES = [
    { id: "cinematic", name: "Cinematic Close-Up", img: "🎬" },
    { id: "vibrant", name: "Vibrant Product", img: "✨" },
    { id: "slowmo", name: "Slow Motion", img: "🐌" },
];

export default function CreateVideo({ onSuccess }: { onSuccess: () => void }) {
    const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
    const [images, setImages] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const generateUploadUrl = useMutation(api.videos.generateUploadUrl);
    const createJob = useMutation(api.videos.createJob);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(Array.from(e.target.files).slice(0, 3)); // Max 3
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (images.length === 0) return;

        setIsUploading(true);
        try {
            // 1. Upload Images
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

            // 2. Create Job
            await createJob({
                styleId: selectedStyle,
                prompt: `Style: ${selectedStyle}`, // Simplification for now
                inputImageStorageIds: storageIds,
            });

            onSuccess();
        } catch (error) {
            console.error("Failed to create video", error);
            alert("Failed to create video job. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="card">
            <h2>Create New Video</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                        1. Upload Photos (Max 3)
                    </label>
                    <div
                        style={{
                            border: "2px dashed var(--color-border)",
                            padding: "32px",
                            textAlign: "center",
                            borderRadius: "8px",
                            cursor: "pointer",
                            background: "#FAFAFA"
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {images.length > 0 ? (
                            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                                {images.map((img, idx) => (
                                    <div key={idx} style={{ width: "64px", height: "64px", background: "#eee", overflow: "hidden", borderRadius: "4px" }}>
                                        {/* Preview would go here, skipping for brevity */}
                                        <div style={{ fontSize: "10px", padding: "4px" }}>{img.name}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div>
                                <span style={{ fontSize: "24px" }}>📷</span>
                                <p style={{ margin: "8px 0 0" }}>Click to upload photos</p>
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

                <div style={{ marginBottom: "32px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                        2. Select Style
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "12px" }}>
                        {STYLES.map((style) => (
                            <div
                                key={style.id}
                                onClick={() => setSelectedStyle(style.id)}
                                style={{
                                    border: selectedStyle === style.id ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                                    borderRadius: "8px",
                                    padding: "12px",
                                    cursor: "pointer",
                                    textAlign: "center",
                                    background: selectedStyle === style.id ? "rgba(110, 220, 20, 0.05)" : "white"
                                }}
                            >
                                <div style={{ fontSize: "24px", marginBottom: "4px" }}>{style.img}</div>
                                <div style={{ fontSize: "12px", fontWeight: "bold" }}>{style.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isUploading || images.length === 0}
                    style={{ width: "100%" }}
                >
                    {isUploading ? "Uploading..." : "Generate Video"}
                </button>
            </form>
        </div>
    );
}
