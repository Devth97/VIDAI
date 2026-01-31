import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, Easing, Video as RemotionVideo, Img } from "remotion";

// Video configuration for multi-scene (18 seconds total: 6s x 3 scenes)
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920; // 9:16 aspect ratio for social media
export const VIDEO_FPS = 30;
export const SCENE_DURATION_IN_FRAMES = 180; // 6 seconds per scene
export const TOTAL_DURATION_IN_FRAMES = 540; // 18 seconds total (6s x 3)

interface Caption {
  text: string;
  startFrame: number;
  endFrame: number;
}

interface VideoCompositionProps {
  segmentUrls: string[]; // Array of 3 video URLs (intro, main, outro)
  images?: string[]; // Fallback images if no segments
  logoUrl: string | null;
  captions: Caption[];
  musicTrack: string;
  logoPosition: string;
  primaryColor: string;
  secondaryColor: string;
  styleId: string;
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  segmentUrls,
  images = [],
  logoUrl,
  captions,
  logoPosition,
  primaryColor,
  styleId,
}) => {
  const frame = useCurrentFrame();
  
  // Background animation based on style
  const getBackgroundStyle = () => {
    switch (styleId) {
      case "cinematic":
        return { background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" };
      case "vibrant":
        return { background: "linear-gradient(135deg, #2d132c 0%, #801336 50%, #c72c41 100%)" };
      case "slowmo":
        return { background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)" };
      case "minimal":
        return { background: "linear-gradient(135deg, #232526 0%, #414345 100%)" };
      case "rustic":
        return { background: "linear-gradient(135deg, #3e2723 0%, #5d4037 50%, #8d6e63 100%)" };
      case "luxury":
        return { background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" };
      default:
        return { background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" };
    }
  };

  // Logo position styles
  const getLogoPosition = () => {
    const padding = 40;
    switch (logoPosition) {
      case "top-left":
        return { top: padding, left: padding };
      case "top-right":
        return { top: padding, right: padding };
      case "bottom-left":
        return { bottom: padding, left: padding };
      case "bottom-right":
        return { bottom: padding, right: padding };
      default:
        return { bottom: padding, right: padding };
    }
  };

  // Check if we have video segments
  const hasSegments = segmentUrls && segmentUrls.length === 3;

  return (
    <AbsoluteFill style={getBackgroundStyle()}>
      {/* Background pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Scene 1: Intro (0-6s) */}
      {hasSegments ? (
        <Sequence from={0} durationInFrames={SCENE_DURATION_IN_FRAMES}>
          <RemotionVideo
            src={segmentUrls[0]}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Sequence>
      ) : (
        images.length > 0 && (
          <Sequence from={0} durationInFrames={SCENE_DURATION_IN_FRAMES}>
            <FallbackImage 
              src={images[0]} 
              frame={frame} 
              styleId={styleId}
            />
          </Sequence>
        )
      )}

      {/* Scene 2: Main (6-12s) */}
      {hasSegments ? (
        <Sequence from={SCENE_DURATION_IN_FRAMES} durationInFrames={SCENE_DURATION_IN_FRAMES}>
          <RemotionVideo
            src={segmentUrls[1]}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Sequence>
      ) : (
        images.length > 1 && (
          <Sequence from={SCENE_DURATION_IN_FRAMES} durationInFrames={SCENE_DURATION_IN_FRAMES}>
            <FallbackImage 
              src={images[1]} 
              frame={frame} 
              styleId={styleId}
            />
          </Sequence>
        )
      )}

      {/* Scene 3: Outro (12-18s) */}
      {hasSegments ? (
        <Sequence from={SCENE_DURATION_IN_FRAMES * 2} durationInFrames={SCENE_DURATION_IN_FRAMES}>
          <RemotionVideo
            src={segmentUrls[2]}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Sequence>
      ) : (
        images.length > 2 && (
          <Sequence from={SCENE_DURATION_IN_FRAMES * 2} durationInFrames={SCENE_DURATION_IN_FRAMES}>
            <FallbackImage 
              src={images[2]} 
              frame={frame} 
              styleId={styleId}
            />
          </Sequence>
        )
      )}

      {/* Gradient overlay across all scenes */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.4) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo - visible across all scenes */}
      {logoUrl && (
        <div
          style={{
            position: "absolute",
            ...getLogoPosition(),
            width: 180,
            height: 180,
            background: "rgba(0, 0, 0, 0.6)",
            borderRadius: 24,
            padding: 16,
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          <Img
            src={logoUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      )}

      {/* Captions - visible across all scenes */}
      {captions.map((caption, index) => {
        const isVisible = frame >= caption.startFrame && frame <= caption.endFrame;
        const captionProgress = (frame - caption.startFrame) / (caption.endFrame - caption.startFrame);
        
        const captionY = interpolate(
          captionProgress,
          [0, 0.1, 0.9, 1],
          [50, 0, 0, -50],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        
        const captionOpacity = interpolate(
          captionProgress,
          [0, 0.1, 0.9, 1],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        if (!isVisible) return null;

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              bottom: 200,
              left: 80,
              right: 80,
              textAlign: "center",
              transform: `translateY(${captionY}px)`,
              opacity: captionOpacity,
            }}
          >
            <h2
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: "white",
                textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                margin: 0,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {caption.text}
            </h2>
          </div>
        );
      })}

      {/* Top and bottom bars */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: primaryColor,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 8,
          background: primaryColor,
        }}
      />

      {/* Corner accents */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          width: 40,
          height: 40,
          borderTop: `4px solid ${primaryColor}`,
          borderLeft: `4px solid ${primaryColor}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 40,
          height: 40,
          borderTop: `4px solid ${primaryColor}`,
          borderRight: `4px solid ${primaryColor}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          width: 40,
          height: 40,
          borderBottom: `4px solid ${primaryColor}`,
          borderLeft: `4px solid ${primaryColor}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          width: 40,
          height: 40,
          borderBottom: `4px solid ${primaryColor}`,
          borderRight: `4px solid ${primaryColor}`,
        }}
      />
    </AbsoluteFill>
  );
};

// Fallback image component with Ken Burns effect
interface FallbackImageProps {
  src: string;
  frame: number;
  styleId: string;
}

const FallbackImage: React.FC<FallbackImageProps> = ({ src, frame }) => {
  // Ken Burns effect (slow zoom and pan)
  const scale = interpolate(frame % SCENE_DURATION_IN_FRAMES / SCENE_DURATION_IN_FRAMES, [0, 1], [1, 1.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });
  
  const translateX = interpolate(frame % SCENE_DURATION_IN_FRAMES / SCENE_DURATION_IN_FRAMES, [0, 1], [0, 20], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 60,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      }}
    >
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translateX(${translateX}px)`,
        }}
      />
      
      {/* Gradient overlay on image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </div>
  );
};

export default VideoComposition;
