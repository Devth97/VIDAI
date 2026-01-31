import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface BrandKitProps {
    onSelectLogo?: (assetId: Id<"assets"> | null) => void;
    selectedLogoId?: Id<"assets"> | null;
    mode?: "manage" | "select";
}

interface Asset {
    _id: Id<"assets">;
    _creationTime: number;
    userId: Id<"users">;
    name: string;
    type: string;
    storageId: string;
    createdAt: number;
    url: string;
}

export default function BrandKit({ onSelectLogo, selectedLogoId, mode = "manage" }: BrandKitProps) {
    const assets = useQuery(api.assets.list) as Asset[] | undefined;
    const logos = useQuery(api.assets.listByType, { type: "logo" }) as Asset[] | undefined;
    const generateUploadUrl = useMutation(api.assets.generateUploadUrl);
    const createAsset = useMutation(api.assets.create);
    const deleteAsset = useMutation(api.assets.remove);
    
    const [isUploading, setIsUploading] = useState(false);
    const [uploadType, setUploadType] = useState<"logo" | "product">("logo");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();
            
            await createAsset({
                name: file.name,
                type: uploadType,
                storageId,
            });
            toast.success(`${uploadType === "logo" ? "Logo" : "Product shot"} uploaded successfully`);
        } catch (error) {
            console.error("Failed to upload asset:", error);
            toast.error("Failed to upload asset. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: Id<"assets">) => {
        if (!confirm("Are you sure you want to delete this asset?")) return;
        
        try {
            await deleteAsset({ id });
            toast.success("Asset deleted successfully");
        } catch (error) {
            console.error("Failed to delete asset:", error);
            toast.error("Failed to delete asset");
        }
    };

    if (assets === undefined || logos === undefined) {
        return (
            <div className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" }}>
                    <div className="loading-spinner" />
                </div>
            </div>
        );
    }

    // Selection mode - just show logos to select
    if (mode === "select") {
        return (
            <div>
                <div className="form-section">
                    <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>Select Logo from Brand Kit</h3>
                    
                    {logos.length === 0 ? (
                        <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                            <span style={{ fontSize: "32px" }}>🏷️</span>
                            <p style={{ margin: "12px 0 0", color: "var(--color-text-secondary)" }}>
                                No logos yet. Click to upload your first logo
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleUpload}
                                ref={fileInputRef}
                                style={{ display: "none" }}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-4">
                            {logos.map((logo) => (
                                <div
                                    key={logo._id}
                                    className={`asset-card ${selectedLogoId === logo._id ? "selected" : ""}`}
                                    onClick={() => onSelectLogo?.(logo._id)}
                                >
                                    <img src={logo.url} alt={logo.name} />
                                    <div className="asset-card-info">
                                        <p className="asset-card-name">{logo.name}</p>
                                    </div>
                                    {selectedLogoId === logo._id && (
                                        <div style={{
                                            position: "absolute",
                                            top: "8px",
                                            right: "8px",
                                            width: "24px",
                                            height: "24px",
                                            borderRadius: "50%",
                                            background: "var(--color-accent)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}>
                                            <span style={{ color: "#000", fontSize: "14px" }}>✓</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div
                                className="asset-card"
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    aspectRatio: "1",
                                    cursor: "pointer",
                                }}
                            >
                                <span style={{ fontSize: "32px", marginBottom: "8px" }}>+</span>
                                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Upload New</span>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleUpload}
                                ref={fileInputRef}
                                style={{ display: "none" }}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Management mode - show all assets
    return (
        <div>
            <div className="form-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px" }}>Brand Assets</h3>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <>
                                <div className="loading-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <span>+</span> Upload Asset
                            </>
                        )}
                    </button>
                </div>

                <div className="form-group">
                    <label className="form-label">Asset Type</label>
                    <div className="radio-group">
                        <label className={`radio-option ${uploadType === "logo" ? "selected" : ""}`}>
                            <input
                                type="radio"
                                name="assetType"
                                value="logo"
                                checked={uploadType === "logo"}
                                onChange={() => setUploadType("logo")}
                            />
                            <span>🏷️ Logo</span>
                        </label>
                        <label className={`radio-option ${uploadType === "product" ? "selected" : ""}`}>
                            <input
                                type="radio"
                                name="assetType"
                                value="product"
                                checked={uploadType === "product"}
                                onChange={() => setUploadType("product")}
                            />
                            <span>📦 Product Shot</span>
                        </label>
                    </div>
                </div>

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    ref={fileInputRef}
                    style={{ display: "none" }}
                />
            </div>

            {assets.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📁</div>
                    <h4 className="empty-state-title">No assets yet</h4>
                    <p className="empty-state-description">
                        Upload your logo and product photos to use in your videos
                    </p>
                </div>
            ) : (
                <div className="grid grid-4">
                    {assets.map((asset) => (
                        <div key={asset._id} className="asset-card">
                            <img src={asset.url} alt={asset.name} />
                            <div className="asset-card-info">
                                <p className="asset-card-name">{asset.name}</p>
                                <span className="asset-card-type">{asset.type}</span>
                            </div>
                            <button
                                onClick={() => handleDelete(asset._id)}
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
                                    fontSize: "14px",
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
