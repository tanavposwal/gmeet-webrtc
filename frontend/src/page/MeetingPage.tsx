import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socketIO, { Socket } from "socket.io-client";
import { Button, Grid, Typography } from "@mui/material";
import { CentralizedCard } from "../components/CentralizedCard";
import { Video } from "../components/Video";

let pc = new RTCPeerConnection({
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
});

export function MeetingPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [meetingJoined, setMeetingJoined] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | undefined>(undefined);
  const [remoteVideoStream, setRemoteVideoStream] = useState<MediaStream | undefined>(undefined);

  const params = useParams();
  const roomId = params.roomId;

  useEffect(() => {
    const s = socketIO("http://localhost:3000");
    s.on("connect", () => {
      setSocket(s);
      s.emit("join", {
        roomId,
      });

      window.navigator.mediaDevices
        .getUserMedia({
          video: true,
        })
        .then(async (stream) => {
          return setVideoStream(stream);
        });

      s.on("localDescription", async ({ description }) => {
        // Receiving video -
        console.log({ description });
        pc.setRemoteDescription(description);
        pc.ontrack = (e) => {
          setRemoteVideoStream(new MediaStream([e.track]));
        };

        s.on("iceCandidate", ({ candidate }: { candidate: RTCIceCandidate }) => {
          pc.addIceCandidate(candidate);
        });

        pc.onicecandidate = ({ candidate }) => {
          s.emit("iceCandidateReply", { candidate });
        };
        await pc.setLocalDescription(await pc.createAnswer());
        s.emit("remoteDescription", { description: pc.localDescription });
      });
      s.on("remoteDescription", async ({ description }) => {
        // Receiving video -
        console.log({ description });
        pc.setRemoteDescription(description);
        pc.ontrack = (e) => {
          setRemoteVideoStream(new MediaStream([e.track]));
        };

        s.on("iceCandidate", ({ candidate }) => {
          pc.addIceCandidate(candidate);
        });

        pc.onicecandidate = ({ candidate }) => {
          s.emit("iceCandidateReply", { candidate });
        };

        //s.emit("remoteDescription", { description: pc.localDescription });
      });
    });
  }, []);

  if (!videoStream) {
    return <div>Loading...</div>;
  }

  if (!meetingJoined) {
    return (
      <div style={{ minHeight: "100vh" }}>
        <CentralizedCard>
          <div>
            <Typography textAlign={"center"} variant="h5">
              Hi welcome to meeting {roomId}.
            </Typography>
          </div>
          <br />
          <br />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button
              onClick={async () => {
                // sending pc
                pc.onicecandidate = ({ candidate }) => {
                  socket?.emit("iceCandidate", { candidate });
                };
                pc.addTrack(videoStream.getVideoTracks()[0]);
                try {
                  await pc.setLocalDescription(await pc.createOffer());
                  console.log({ aa: pc.localDescription });
                  socket?.emit("localDescription", {
                    description: pc.localDescription,
                  });
                } catch (err: any) {
                  console.log({ msg: err.message });
                  console.error(err);
                }

                // socket.on("remoteDescription", async ({description}) => {
                //     await pc.setRemoteDescription(description);
                // });
                // socket.on("iceCandidateReply", ({candidate}) => {
                //     pc.addIceCandidate(candidate)
                // });
                setMeetingJoined(true);
              }}
              disabled={!socket}
              variant="contained"
            >
              Join meeting
            </Button>
          </div>
        </CentralizedCard>
      </div>
    );
  }

  return (
    <Grid
      container
      spacing={2}
      alignContent={"center"}
      justifyContent={"center"}
    >
      <Grid item xs={12} md={6} lg={4}>
        <Video stream={videoStream} />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        {remoteVideoStream && <Video stream={remoteVideoStream} />}
      </Grid>
    </Grid>
  );
}
