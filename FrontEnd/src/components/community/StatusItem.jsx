import { faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Translate from "components/internationalization/Translate";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Col, Row } from "reactstrap";
import AxiosInstance from "scripts/axioInstance";

const StatusItem = ({ st }) => {
  const [status, setStatus] = useState(st);
  const [name, setName] = useState("Not Available");
  const [photo, setPhoto] = useState("");

  const getUser = () => {
    const authorId = st.authorId;
    const adminUrl = `http://localhost:5100/access/minimal-info/${authorId}`;
    const patientUrl = `http://localhost:7100/patients/minimal-info/${authorId}`;
    const doctorUrl = `http://localhost:7200/doctors/minimal-info/${authorId}`;

    let link = "/health/";

    let apiUrl = "";
    if (authorId[0] === "P") {
      link += "patients/" + authorId;
      apiUrl = patientUrl;
    } else if (authorId[0] === "D") {
      link += "doctors/" + authorId;
      apiUrl = doctorUrl;
    } else if (authorId[0] === "A") {
      link = "#";
      apiUrl = adminUrl;
    } else {
      link = "#";
    }

    AxiosInstance.get(apiUrl)
      .then((response) => {
        const fullName = response.data.firstName + " " + response.data.lastName;
        setName(fullName);
        setPhoto(response.data.photoURL);
      })
      .catch((error) => {
        console.log(error);
      });

    return (
      <div className="container" style={{ margin: "10px" }}>
        <div className="row no-gutters">
          <div className="col-auto">
            {photo ? (
              <span className="avatar avatar-sm rounded-circle">
                <img alt="User" src={photo} />
              </span>
            ) : (
              <FontAwesomeIcon icon={faUserCircle} size="lg" className="mr-2" />
            )}
          </div>
          <div className="col m-2">
            <Link to={link} style={{ fontWeight: "bold" }}>
              {name}
            </Link>
          </div>
        </div>
      </div>
    );
  };

  function getReaction(r) {
    // Like default
    let icon = "fas fa-thumbs-up";
    let color = "#4287f5";

    // Dislike
    if (r == 2) {
      icon = "fa fa-thumbs-down";
      color = "#f542ec";
    }

    // Love
    if (r == 3) {
      icon = "fa-solid fa-heart";
      color = "#dd0202";
    }

    // Haha
    if (r == 4) {
      icon = "fa-solid fa-face-grin-squint";
      color = "#18a103";
    }

    // Wow
    if (r == 5) {
      icon = "fa-solid fa-face-surprise";
      color = "#5c03a1";
    }

    // Sad
    if (r == 6) {
      icon = "fa-regular fa-face-sad-tear";
      color = "#111";
    }

    // Angry
    if (r == 7) {
      icon = "fas fa-angry";
      color = "#ff0000";
    }

    return <i className={icon} style={{ color: color, margin: "4px" }}></i>;
  }

  const [showReactions, setShowReactions] = useState(false);

  const toggleReactions = () => {
    setShowReactions(!showReactions);
  };

  const reactPost = (r) => {
    setShowReactions(false);
    AxiosInstance.post("http://localhost:7500/posts/react", {
      postId: status.postId,
      type: r + 1,
    })
      .then(() => AxiosInstance.get(`http://localhost:7500/posts/${status.postId}`))
      .then((response) => {
        // Rebuild the summary shown on the card: reaction types ordered by frequency.
        const all = response.data.reactions || [];
        const counts = {};
        all.forEach((x) => (counts[x.type] = (counts[x.type] || 0) + 1));
        const ordered = Object.keys(counts)
          .sort((a, b) => counts[b] - counts[a])
          .map(Number);
        setStatus((prev) => ({
          ...prev,
          reactions: ordered,
          reactionsCount: all.length,
        }));
      })
      .catch((error) => console.error("Could not react to the post", error));
  };

  const renderReactions = () => {
    if (showReactions) {
      return (
        <div
          style={{
            position: "absolute",
            backgroundColor: "white",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
            zIndex: 1,
            display: "flex", // Display the reactions horizontally
            alignItems: "center", // Center the reactions vertically
          }}
        >
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              style={{
                cursor: "pointer",
                marginRight: "5px",
                fontSize: "large",
              }}
              onClick={(e) => {
                reactPost(i);
              }}
            >
              {getReaction(i + 1)}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (status !== null) {
    return (
      <div
        style={{
          border: "1px solid #ddf",
          margin: "5px",
          padding: "5px",
          borderRadius: "5px",
          boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
          backgroundColor: "white",
        }}
      >
        {getUser()}
        {status.photo && (
          <Link to={`/health/posts/${status.postId}`}>
            <img
              src={status.photo}
              alt="Status Photo"
              style={{
                maxWidth: "98%",
                display: "block",
                margin: "0 auto",
                maxHeight: "600px",
                borderRadius: "5px",
              }}
            />
          </Link>
        )}
        <div
          style={{
            padding: "10px",
            borderBottom: "1px solid #eee",
          }}
        >
          <Link
            style={{ color: "#555", cursor: "text" }}
            to={`/health/posts/${status.postId}`}
          >
            {status.content.length > 200 ? (
              <>
                <Translate
                  text={status.content.substring(0, 200) + "...See more"}
                />
              </>
            ) : (
              <Translate text={status.content} />
            )}
          </Link>
          <div style={{ marginTop: "10px" }}>{status.date}</div>
        </div>
        <div style={{ marginLeft: "10px" }}></div>
        <Row
          style={{
            borderBottom: "1px solid #eee",
            marginLeft: "5px",
            marginRight: "5px",
          }}
        >
          <Col style={{}}>
            <div>
              {status.reactions.map((r) => getReaction(r))}
              {status.reactionsCount === 0
                ? "No reactions yet"
                : status.reactionsCount + " reactions"}
            </div>
          </Col>
          <Col style={{ textAlign: "right" }}>
            <div>
              {status.commentsCount === 0
                ? "No comments yet"
                : status.commentsCount + " comments"}
            </div>
          </Col>
        </Row>
        <Row style={{ justifyContent: "center", textAlign: "center" }}>
          <Col
            style={{
              padding: "10px",
              fontWeight: "bold",
              borderRight: "1px solid #eee",
              cursor: "pointer",
            }}
            onMouseEnter={toggleReactions}
            onMouseLeave={toggleReactions}
          >
            Like
            {showReactions && renderReactions()}
          </Col>
          <Col
            style={{ padding: "10px", fontWeight: "bold", cursor: "pointer" }}
          >
            <Link to={`/health/posts/${status.postId}`}>Comment</Link>
          </Col>
        </Row>
      </div>
    );
  } else {
    return <div>Loading...</div>;
  }
};

export default StatusItem;
