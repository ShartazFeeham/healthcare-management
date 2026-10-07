import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AxiosInstance from "scripts/axioInstance";
import LocalCall from "./LocalCall";

// Verifies the user is a participant of the appointment, then opens the local video room.
const CreateCall = () => {
  const { roomId } = useParams();
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    AxiosInstance.get(`http://localhost:7400/tele/verify/${roomId}`)
      .then(() => setLoading(false))
      .catch((error) => {
        setDenied(true);
        setErrorMessage(
          error.response && error.response.data && error.response.data.message
            ? error.response.data.message
            : "Could not verify your access to this appointment."
        );
      });
  }, [roomId]);

  if (!loading) return <LocalCall roomId={roomId} />;
  return (
    <div className="card m-4 p-4">
      {denied ? (
        <div style={{ color: "red" }}>{errorMessage}</div>
      ) : (
        <div>
          Please wait while your access to appointment <b>{roomId}</b> is being verified.
        </div>
      )}
    </div>
  );
};
export default CreateCall;
