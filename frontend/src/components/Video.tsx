import { useEffect, useRef } from "react";

interface VideoProps {
  stream: MediaStream;
}

export const Video = ({ stream }: VideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [videoRef, stream]);

  return (
    <div>
      <div>
        <video
          style={{ borderRadius: 10 }}
          ref={videoRef}
          muted
          width="100%"
          autoPlay={true}
          playsInline={true}
        />
      </div>
    </div>
  );
};
