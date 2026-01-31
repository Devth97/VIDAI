import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const create = mutation({
    args: {
        name: v.string(),
        type: v.string(),
        storageId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        return await ctx.db.insert("assets", {
            userId: user._id,
            name: args.name,
            type: args.type,
            storageId: args.storageId,
            createdAt: Date.now(),
        });
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return [];

        const assets = await ctx.db
            .query("assets")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        return await Promise.all(
            assets.map(async (asset) => ({
                ...asset,
                url: await ctx.storage.getUrl(asset.storageId),
            }))
        );
    },
});

export const listByType = query({
    args: { type: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return [];

        const assets = await ctx.db
            .query("assets")
            .withIndex("by_user_and_type", (q) => q.eq("userId", user._id).eq("type", args.type))
            .collect();

        return await Promise.all(
            assets.map(async (asset) => ({
                ...asset,
                url: await ctx.storage.getUrl(asset.storageId),
            }))
        );
    },
});

export const remove = mutation({
    args: { id: v.id("assets") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // In real app, verify ownership
        await ctx.db.delete(args.id);
    },
});
