import React, { useState } from "react";
import axios from "axios";
import AxiosInstance from "./axioInstance";
import { Col, FormGroup, Input, InputGroup, InputGroupAddon, InputGroupText, Row } from "reactstrap";

const PhotoUpload2 = ({ url, setUrl }) => {
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
      <Row className="col-12 p-0">
      <FormGroup>
              <InputGroup className="input-group-alternative">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText>
                    <i className="ni ni-image" style={{color: "#555"}} />
                  </InputGroupText>
                </InputGroupAddon>
                <Input
        type="file"
        id="photo"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleUpload}
      />
      <div
        className="file-name"
        style={{
          marginLeft: "5px",
          marginTop: "5px",
          color: "#555",
          fontSize: "14px",
        }}
      ></div>
      

                <label
                  htmlFor="photo"
                  style={{
                    display: "inline-block",
                    padding: "6px 12px",
                    cursor: "pointer",
                    backgroundColor: "#f9f9f9",
                    borderRadius: "4px",
                    transition: "background-color 0.3s",
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
              </InputGroup>
            </FormGroup>
      </Row>
    </div>
  );
};

export default PhotoUpload2;
