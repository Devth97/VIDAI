import React from "react";
import { Composition, getInputProps } from "remotion";
import { VideoComposition } from "./VideoComposition";
import {
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
  VIDEO_FPS,
  TOTAL_DURATION_IN_FRAMES,
} from "./VideoComposition";

// Get input props from CLI or use defaults for preview
const getProps = () => {
  const inputProps = getInputProps();
  
  // If input props provided via CLI, use them
  if (inputProps && Object.keys(inputProps).length > 0) {
    return {
      segmentUrls: inputProps.segmentUrls || [],
      images: inputProps.images || [],
      logoUrl: inputProps.logoUrl || null,
      captions: inputProps.captions || [],
      musicTrack: inputProps.musicTrack || "",
      logoPosition: inputProps.logoPosition || "bottom-right",
      primaryColor: inputProps.primaryColor || "#c72c41",
      secondaryColor: inputProps.secondaryColor || "#801336",
      styleId: inputProps.styleId || "vibrant",
    };
  }
  
  // Default sample data for local preview
  return {
    segmentUrls: [],
    images: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&h=1920&fit=crop",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080&h=1920&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&h=1920&fit=crop",
    ],
    logoUrl: "https://placehold.co/100x100/000000/FFFFFF?text=LOGO",
    captions: [
      { text: "Welcome to Your Brand", startFrame: 0, endFrame: 150 },
      { text: "Amazing Features Await", startFrame: 180, endFrame: 330 },
      { text: "Get Started Today!", startFrame: 360, endFrame: 540 },
    ],
    musicTrack: "",
    logoPosition: "bottom-right",
    primaryColor: "#c72c41",
    secondaryColor: "#801336",
    styleId: "vibrant",
  };
};

export const RemotionRoot: React.FC = () => {
  const props = getProps();
  
  return (
    <>
      <Composition
        id="VideoComposition"
        component={VideoComposition}
        durationInFrames={TOTAL_DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={props}
      />
    </>
  );
};

export default RemotionRoot;
