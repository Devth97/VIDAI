// Remotion configuration for server-side rendering
import { Config } from "remotion";

export const config: Config = {
  // Video settings
  videoWidth: 1080,
  videoHeight: 1920, // 9:16 aspect ratio for social media
  fps: 30,
  
  // Lambda-specific settings
  // These can be overridden per-render
  defaults: {
    composition: "VideoComposition",
  },
  
  // Log level
  logLevel: "info",
  
  // For development
  previewServer: {
    port: 3000,
  },
};

export default config;
