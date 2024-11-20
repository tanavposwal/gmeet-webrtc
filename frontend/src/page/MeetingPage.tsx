import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socketIO, { Socket } from "socket.io-client";
import { Video } from "../components/Video";

const iceServers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function MeetingPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [meetingJoined, setMeetingJoined] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [remoteVideoStream, setRemoteVideoStream] = useState<MediaStream | null>(null);
  const [remoteAudioStream, setRemoteAudioStream] = useState<MediaStream | null>(null);

  const { roomId } = useParams();
  const pc = new RTCPeerConnection(iceServers);

  useEffect(() => {
    const s = socketIO("http://localhost:3000");
    setSocket(s);

    s.on("connect", () => {
      s.emit("join", { roomId });
      console.log("Connected to socket server.");
    });

    s.on("localDescription", handleLocalDescription);
    s.on("remoteDescription", handleRemoteDescription);
    s.on("iceCandidate", handleIceCandidate);

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setVideoStream(stream);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      })
      .catch((err) => console.error("Error accessing media devices:", err));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        s.emit("iceCandidate", { candidate });
      }
    };

    pc.ontrack = (e) => {
      const track = e.track;
      if (track.kind === "video") {
        setRemoteVideoStream((prev) => {
          const stream = prev || new MediaStream();
          stream.addTrack(track);
          return stream;
        });
      } else if (track.kind === "audio") {
        setRemoteAudioStream((prev) => {
          const stream = prev || new MediaStream();
          stream.addTrack(track);
          return stream;
        });
      }
    };

    return () => {
      s.disconnect();
      pc.close();
    };
  }, [roomId]);

  const handleLocalDescription = async ({ description, senderId }: any) => {
    if (senderId === socket?.id) return;
    if (pc.signalingState === "stable") {
      await pc.setRemoteDescription(description);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket?.emit("remoteDescription", { description: pc.localDescription });
    }
  };

  const handleRemoteDescription = async ({ description, senderId }: any) => {
    if (senderId === socket?.id) return;
    await pc.setRemoteDescription(description);
  };

  const handleIceCandidate = ({ candidate, senderId }: any) => {
    if (senderId === socket?.id) return;
    if (pc.remoteDescription) {
      pc.addIceCandidate(candidate).catch((err) =>
        console.error("Error adding ICE candidate:", err)
      );
    }
  };

  const joinMeeting = async () => {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.emit("localDescription", { description: pc.localDescription });
      setMeetingJoined(true);
    } catch (err) {
      console.error("Error joining meeting:", err);
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center">
      {!meetingJoined ? (
        <button
          onClick={joinMeeting}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Join Meeting
        </button>
      ) : (
        <div className="flex gap-4">
          user
          {videoStream && <Video stream={videoStream} />}
          remote
          {remoteVideoStream && <Video stream={remoteVideoStream} />}
          {/* {remoteAudioStream && (
            <audio
              ref={(audio) => {
                if (audio) audio.srcObject = remoteAudioStream;
              }}
              autoPlay
            />
          )} */}
        </div>
      )}
    </div>
  );
}
