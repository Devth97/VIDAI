import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { GoogleGenerativeAI, type GenerateContentResponse } from "@google/generative-ai";

// Helper function to extract video data from Gemini response
function extractVideoFromResponse(response: GenerateContentResponse): { data: Uint8Array; mimeType: string } | null {
    try {
        // Check for inline video data in candidates
        if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        // Decode base64 to Uint8Array
                        const binaryString = atob(part.inlineData.data);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        return {
                            data: bytes,
                            mimeType: part.inlineData.mimeType || 'video/mp4'
                        };
                    }
                }
            }
        }

        return null;
    } catch (error) {
        console.error("Error extracting video from response:", error);
        return null;
    }
}

export const generateAiVideo = action({
    args: {
        videoId: v.id("videos")
    },
    handler: async (ctx, args) => {
        const video = await ctx.runQuery(api.videos.get, {
            id: args.videoId
        });
        if (!video) throw new Error("Video not found");

        console.log(`Starting multi-scene AI generation for ${args.videoId}...`);

        try {
            // Update status to generating
            await ctx.runMutation(api.videos.updateStatus, {
                id: args.videoId,
                status: "generating"
            });

            if (video.inputImageStorageIds.length === 0) {
                throw new Error("No input images found");
            }

            const imageUrl = await ctx.storage.getUrl(video.inputImageStorageIds[0]);
            if (!imageUrl) throw new Error("Could not generate URL for image");

            // Define base style prompt based on styleId
            let baseStylePrompt = "Cinematic, warm lighting, reduced noise, 8k resolution, 1080x1920 vertical format, 6 seconds duration.";
            switch (video.styleId) {
                case "cinematic":
                    baseStylePrompt = "Cinematic film look, shallow depth of field, dramatic lighting, 1080x1920 vertical format, 6 seconds duration.";
                    break;
                case "vibrant":
                    baseStylePrompt = "Vibrant and colorful, saturated colors, dynamic lighting, 1080x1920 vertical format, 6 seconds duration.";
                    break;
                case "slowmo":
                    baseStylePrompt = "Slow motion effect, smooth and fluid, soft lighting, 1080x1920 vertical format, 6 seconds duration.";
                    break;
                case "minimal":
                    baseStylePrompt = "Minimal and clean, neutral tones, soft natural lighting, 1080x1920 vertical format, 6 seconds duration.";
                    break;
                case "rustic":
                    baseStylePrompt = "Rustic and warm, earthy tones, golden hour lighting, 1080x1920 vertical format, 6 seconds duration.";
                    break;
                case "luxury":
                    baseStylePrompt = "Luxury and elegant, rich colors, sophisticated lighting, 1080x1920 vertical format, 6 seconds duration.";
                    break;
            }

            // Extract product name from prompt or use a default
            const productName = video.prompt.split(" ").slice(0, 3).join(" ") || "product";

            const segments: Array<{ storageId: string; prompt: string; type: string }> = [];

            // Check if API key is configured
            if (!process.env.GOOGLE_GENAI_API_KEY) {
                const errorMsg =
                    "❌ GOOGLE_GENAI_API_KEY is not configured in Convex environment variables!\n" +
                    "📋 To fix this:\n" +
                    "1. Go to: https://dashboard.convex.dev (search for your deployment)\n" +
                    "2. Navigate to: Settings → Environment Variables\n" +
                    "3. Add variable: GOOGLE_GENAI_API_KEY = AIzaSyC6HE0uncr9ciKGAaGrZsqSlrceKf3mZFw\n" +
                    "4. Save and restart 'npx convex dev'";
                console.error(errorMsg);
                throw new Error("GOOGLE_GENAI_API_KEY not configured in Convex environment variables. Please add it in the Convex Dashboard.");
            }

            console.log("✓ GOOGLE_GENAI_API_KEY found, calling Gemini Veo API for 3 scenes in parallel...");
            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

            // Define scenes
                const scenes: ("intro" | "main" | "outro")[] = ["intro", "main", "outro"];

                // Generate all 3 scenes in parallel
                const sceneResults = await Promise.all(
                    scenes.map(async (sceneType) => {
                        const model = genAI.getGenerativeModel({ model: "veo-001-preview" });
                        const imageResponse = await fetch(imageUrl);
                        const imageBuffer = await imageResponse.arrayBuffer();

                        let scenePrompt = "";
                        switch (sceneType) {
                            case "intro":
                                scenePrompt = `Close-up hero shot of ${productName}, static camera, focus pull. `;
                                break;
                            case "main":
                                scenePrompt = `Slow panning shot around ${productName} revealing details. `;
                                break;
                            case "outro":
                                scenePrompt = `Wide shot of ${productName} with lifestyle elements, fade out vibe. `;
                                break;
                        }
                        const fullPrompt = scenePrompt + baseStylePrompt;

                        console.log(`Generating ${sceneType} scene with prompt: ${fullPrompt}`);

                        const genResult = await model.generateContent([
                            { inlineData: { data: Buffer.from(imageBuffer).toString("base64"), mimeType: "image/jpeg" } },
                            fullPrompt
                        ]);
                        const response = await genResult.response;
                        const videoData = extractVideoFromResponse(response);

                        if (!videoData) {
                            throw new Error(`No video data in ${sceneType} response`);
                        }

                        // Convert and store
                        const uint8Array = new Uint8Array(videoData.data);
                        const videoBlob = new Blob([uint8Array], { type: videoData.mimeType });
                        const storageId = await ctx.storage.store(videoBlob);

                        console.log(`${sceneType} scene saved with ID: ${storageId}`);

                        return {
                            storageId,
                            prompt: fullPrompt,
                            type: sceneType
                        };
                    })
                );

                segments.push(...sceneResults);

            if (segments.length !== 3) {
                throw new Error(`Expected 3 segments but got ${segments.length}`);
            }

            // Update video record with segments
            await ctx.runMutation(api.videos.updateSegments, {
                id: args.videoId,
                segments,
                status: "editing"
            });

            console.log(`Multi-scene generation completed for ${args.videoId}`);

            return {
                success: true,
                segments
            };
        } catch (error) {
            console.error("AI Generation failed:", error);

            // Update video status to failed
            await ctx.runMutation(api.videos.updateStatus, {
                id: args.videoId,
                status: "failed",
                errorMessage: (error as Error).message
            });

            return {
                success: false,
                error: (error as Error).message
            };
        }
    },
});

// Type definitions for Remotion props
interface RemotionProps {
    segmentUrls: string[];
    images: string[];
    logoUrl: string | null;
    captions: Array<{
        text: string;
        startFrame: number;
        endFrame: number;
    }>;
    musicTrack: string;
    logoPosition: string;
    primaryColor: string;
    secondaryColor: string;
    styleId: string;
}

// Return type for renderVideo action
interface RenderVideoResult {
    success: boolean;
    segmentUrls?: string[];
    remotionProps?: RemotionProps;
    message?: string;
    error?: string;
}

export const renderVideo = action({
    args: {
        videoId: v.id("videos"),
        captions: v.array(v.object({
            text: v.string(),
            startFrame: v.number(),
            endFrame: v.number(),
        })),
        musicTrack: v.optional(v.string()),
        logoPosition: v.optional(v.string()),
        primaryColor: v.optional(v.string()),
        logoUrl: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<RenderVideoResult> => {
        console.log(`Preparing Remotion render for video ${args.videoId}...`);

        try {
            // Get the video with segments
            const video: {
                segments?: Array<{ storageId: string }> | null;
                styleId?: string;
            } | null = await ctx.runQuery(api.videos.get, { id: args.videoId });

            if (!video) throw new Error("Video not found");

            // Check if we have generated segments
            if (!video.segments || video.segments.length === 0) {
                throw new Error("No video segments found. Please generate AI video first.");
            }

            // Update status to rendering
            await ctx.runMutation(api.videos.updateStatus, {
                id: args.videoId,
                status: "ready_to_render"
            });

            // Get URLs for all segments
            const segmentUrls: (string | null)[] = await Promise.all(
                video.segments.map(async (segment: { storageId: string }) => {
                    const url = await ctx.storage.getUrl(segment.storageId);
                    return url;
                })
            );

            // Filter out any null URLs
            const validSegmentUrls: string[] = segmentUrls.filter((url): url is string => url !== null);

            if (validSegmentUrls.length === 0) {
                throw new Error("No valid video segment URLs found");
            }

            console.log("Segment URLs for Remotion:", validSegmentUrls);

            // Prepare Remotion input props
            const remotionProps: RemotionProps = {
                segmentUrls: validSegmentUrls,
                images: [], // Using video segments instead of images
                logoUrl: args.logoUrl || null,
                captions: args.captions,
                musicTrack: args.musicTrack || "",
                logoPosition: args.logoPosition || "bottom-right",
                primaryColor: args.primaryColor || "#c72c41",
                secondaryColor: "#FFFFFF",
                styleId: video.styleId || "vibrant",
            };

            // Store the props for later use
            await ctx.runMutation(api.videos.updateRemotionProps, {
                id: args.videoId,
                remotionProps: remotionProps,
            });

            console.log(`Remotion props prepared for video ${args.videoId}`);

            return {
                success: true,
                segmentUrls: validSegmentUrls,
                remotionProps: remotionProps,
                message: "Video segments ready. Use the Local Render button to generate final video with Remotion."
            };
        } catch (error) {
            console.error("Render preparation failed:", error);

            // Update status to failed
            await ctx.runMutation(api.videos.updateStatus, {
                id: args.videoId,
                status: "failed",
                errorMessage: (error as Error).message
            });

            return {
                success: false,
                error: (error as Error).message
            };
        }
    }
});

// Action to upload locally rendered video back to Convex
export const uploadRenderedVideo = action({
    args: {
        videoId: v.id("videos"),
        videoUrl: v.string(), // URL to the locally rendered video (must be accessible)
    },
    handler: async (ctx, args): Promise<{ success: boolean; storageId?: string; error?: string }> => {
        console.log(`Uploading rendered video for ${args.videoId}...`);

        try {
            // Download the rendered video from the provided URL
            const response = await fetch(args.videoUrl);
            if (!response.ok) {
                throw new Error(`Failed to download rendered video: ${response.status}`);
            }

            const videoBuffer = await response.arrayBuffer();
            const videoBlob = new Blob([videoBuffer], { type: "video/mp4" });

            // Store in Convex storage
            const storageId = await ctx.storage.store(videoBlob);

            // Update video record
            await ctx.runMutation(api.videos.updateGeneratedVideo, {
                id: args.videoId,
                storageId: storageId,
                status: "completed"
            });

            console.log(`Rendered video uploaded with ID: ${storageId}`);

            return {
                success: true,
                storageId: storageId
            };
        } catch (error) {
            console.error("Upload failed:", error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }
});
