import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    pictureUrl: v.optional(v.string()),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),

  // Assets table for Brand Kit (logos, product shots)
  assets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.string(), // "logo", "product", "other"
    storageId: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "type"]),

  videos: defineTable({
    userId: v.id("users"),
    prompt: v.string(),
    styleId: v.string(),
    status: v.string(), // "uploading", "queued", "generating", "completed", "failed"
    inputImageStorageIds: v.array(v.string()),
    logoAssetId: v.optional(v.id("assets")),

    // Remotion properties
    remotionProps: v.optional(v.object({
      segmentUrls: v.optional(v.array(v.string())),
      images: v.optional(v.array(v.string())),
      logoUrl: v.optional(v.string()),
      captions: v.optional(v.array(v.object({
        text: v.string(),
        startFrame: v.number(),
        endFrame: v.number(),
      }))),
      musicTrack: v.optional(v.string()),
      logoPosition: v.optional(v.string()), // "top-left", "top-right", "bottom-left", "bottom-right"
      primaryColor: v.optional(v.string()),
      secondaryColor: v.optional(v.string()),
      styleId: v.optional(v.string()),
    })),

    segments: v.optional(v.array(v.object({
      storageId: v.string(),
      prompt: v.string(),
      type: v.string(), // "intro", "main", "outro"
    }))),
    generatedVideoStorageId: v.optional(v.string()), // Keeps the final stitched output
    createdAt: v.number(),
    errorMessage: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  presets: defineTable({
    name: v.string(),
    videoStyleId: v.string(),
    description: v.string(),
    thumbnail: v.optional(v.string()),
    promptTemplate: v.string(),
  }),
});
