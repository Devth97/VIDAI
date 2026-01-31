import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const createJob = mutation({
    args: {
        styleId: v.string(),
        prompt: v.string(),
        inputImageStorageIds: v.array(v.string()),
        logoAssetId: v.optional(v.id("assets")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to createJob");
        }
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        const jobId = await ctx.db.insert("videos", {
            userId: user._id,
            styleId: args.styleId,
            prompt: args.prompt,
            inputImageStorageIds: args.inputImageStorageIds,
            logoAssetId: args.logoAssetId, // New Field
            status: "queued",
            createdAt: Date.now(),
        });

        // In a real app configuration, we would trigger the action here
        // await ctx.scheduler.runAfter(0, internal.actions.processVideoJob, { videoId: jobId });

        return jobId;
    },
});

export const list = query({
    args: { limit: v.optional(v.number()) }, // Added limit support
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) return [];

        const q = ctx.db
            .query("videos")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc");

        if (args.limit) {
            // Convex 'take' is basically limit
            const videos = await q.take(args.limit);
            return await Promise.all(
                videos.map(async (video) => {
                    // Get segment URLs if segments exist
                    const segmentUrls = video.segments 
                        ? await Promise.all(
                            video.segments.map((segment) => ctx.storage.getUrl(segment.storageId))
                          )
                        : null;
                    
                    return {
                        ...video,
                        inputImageUrls: await Promise.all(
                            video.inputImageStorageIds.map((id) => ctx.storage.getUrl(id))
                        ),
                        generatedVideoUrl: video.generatedVideoStorageId
                            ? await ctx.storage.getUrl(video.generatedVideoStorageId)
                            : null,
                        segmentUrls,
                    };
                })
            );
        }

        const videos = await q.take(50);
        return await Promise.all(
            videos.map(async (video) => {
                // Get segment URLs if segments exist
                const segmentUrls = video.segments 
                    ? await Promise.all(
                        video.segments.map((segment) => ctx.storage.getUrl(segment.storageId))
                      )
                    : null;
                
                return {
                    ...video,
                    inputImageUrls: await Promise.all(
                        video.inputImageStorageIds.map((id) => ctx.storage.getUrl(id))
                    ),
                    generatedVideoUrl: video.generatedVideoStorageId
                        ? await ctx.storage.getUrl(video.generatedVideoStorageId)
                        : null,
                    segmentUrls,
                };
            })
        );
    },
});

export const get = query({
    args: { id: v.id("videos") },
    handler: async (ctx, args) => {
        const video = await ctx.db.get(args.id);
        if (!video) return null;
        
        // Get segment URLs if segments exist
        const segmentUrls = video.segments 
            ? await Promise.all(
                video.segments.map((segment) => ctx.storage.getUrl(segment.storageId))
              )
            : null;
        
        return {
            ...video,
            inputImageUrls: await Promise.all(
                video.inputImageStorageIds.map((id) => ctx.storage.getUrl(id))
            ),
            generatedVideoUrl: video.generatedVideoStorageId
                ? await ctx.storage.getUrl(video.generatedVideoStorageId)
                : null,
            segmentUrls,
        };
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("videos"),
        status: v.string(),
        errorMessage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const video = await ctx.db.get(args.id);
        if (!video) throw new Error("Video not found");
        
        await ctx.db.patch(args.id, {
            status: args.status,
            ...(args.errorMessage && { errorMessage: args.errorMessage }),
        });
    },
});

export const updateGeneratedVideo = mutation({
    args: {
        id: v.id("videos"),
        storageId: v.string(),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const video = await ctx.db.get(args.id);
        if (!video) throw new Error("Video not found");
        
        await ctx.db.patch(args.id, {
            generatedVideoStorageId: args.storageId,
            status: args.status,
        });
    },
});

export const updateSegments = mutation({
    args: {
        id: v.id("videos"),
        segments: v.array(v.object({
            storageId: v.string(),
            prompt: v.string(),
            type: v.string(),
        })),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const video = await ctx.db.get(args.id);
        if (!video) throw new Error("Video not found");
        
        await ctx.db.patch(args.id, {
            segments: args.segments,
            status: args.status,
        });
    },
});

export const updateRemotionProps = mutation({
    args: {
        id: v.id("videos"),
        captions: v.optional(v.array(v.object({
            text: v.string(),
            startFrame: v.number(),
            endFrame: v.number(),
        }))),
        musicTrack: v.optional(v.string()),
        logoPosition: v.optional(v.string()),
        primaryColor: v.optional(v.string()),
        remotionProps: v.optional(v.any()), // Allow passing complete props object
    },
    handler: async (ctx, args) => {
        const video = await ctx.db.get(args.id);
        if (!video) throw new Error("Video not found");
        
        if (args.remotionProps) {
            // If complete props object provided, use it directly
            await ctx.db.patch(args.id, {
                remotionProps: args.remotionProps,
            });
        } else {
            // Otherwise, merge individual fields
            const currentProps = video.remotionProps || {};
            
            await ctx.db.patch(args.id, {
                remotionProps: {
                    ...currentProps,
                    ...(args.captions && { captions: args.captions }),
                    ...(args.musicTrack && { musicTrack: args.musicTrack }),
                    ...(args.logoPosition && { logoPosition: args.logoPosition }),
                    ...(args.primaryColor && { primaryColor: args.primaryColor }),
                },
            });
        }
    },
});
