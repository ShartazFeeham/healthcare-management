import React, { useState } from "react";
import axios from "axios";
import AxiosInstance from "./axioInstance";
import { Input } from "reactstrap";

const PhotoUpload = ({ url, setUrl }) => {
  const alternative =
    "/img/local/photo-placeholder.svg";
  const [display, setDisplay] = useState();
  const [loading, setLoading] = useState(false);
  const loader =
    "/img/local/spinner.svg";
  const [buttonText, setButtonText] = useState("Choose photo");

  const handleUpload = async (e) => {
    setLoading(true);
    setButtonText("Uploading...");
    const selectedFile = e.target.files[0];
    setDisplay(e.target.files[0]);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const response = await axios.post(
        "http://localhost:5200/v1/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Photo uploaded succesfully!", response.data);
      setLoading(false);
      deleteCurrentPhoto(url);
      setUrl(response.data);
      setButtonText("Uploaded! Change again.");
    } catch (error) {
      setLoading(false);
      setDisplay(null);
      console.log(error);
      setButtonText("Failed! Upload again.");
    }
  };

  const deleteCurrentPhoto = async (existingFileUrl) => {
    AxiosInstance.delete(
      `http://localhost:5200/v1/delete?url=${existingFileUrl}`
    )
      .then((response) => {
        console.log("previous file deleted.");
      })
      .catch((error) => {
        console.error("failed to delete previous file");
      });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {display ? (
        <div style={{ textAlign: "center" }}>
          <img
            src={URL.createObjectURL(display)}
            alt="Selected Photo"
            style={{
              width: "150px",
              height: "auto",
              border: "1px solid #ccc",
              padding: "2px",
              marginBottom: "10px",
              borderRadius: "20px",
            }}
          />
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <img
            src={url ? url : alternative}
            alt="Selected Photo"
            style={{
              width: "150px",
              height: "auto",
              border: "1px solid #ccc",
              padding: "2px",
              marginBottom: "10px",
              borderRadius: "20px",
            }}
          />
        </div>
      )}

      <Input
        type="file"
        id="photo"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleUpload}
      />

      <label
        htmlFor="photo"
        style={{
          border: "1px solid #ccc",
          display: "inline-block",
          padding: "6px 12px",
          cursor: "pointer",
          backgroundColor: "#f9f9f9",
          borderRadius: "4px",
          transition: "background-color 0.3s",
          color: "#333",
        }}
      >
        {loading && <img src={loader} style={{ width: "30px" }} />}
        {buttonText}
      </label>
      <div
        className="file-name"
        style={{
          marginLeft: "5px",
          marginTop: "5px",
          color: "#555",
          fontSize: "14px",
        }}
      ></div>
    </div>
  );
};

export default PhotoUpload;
