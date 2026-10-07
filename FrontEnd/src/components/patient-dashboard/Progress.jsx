import AxiosInstance from "scripts/axioInstance";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Row,
  Col,
  CardTitle,
  Button,
  Container,
  CardFooter,
} from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import MultilineView from "components/graphical/MultilineView";
import ScoreUpdate from "./ScoreUpdate";

const Progress = () => {
  const [achievements, setAchievements] = useState([]);
  const userId = localStorage.getItem("userId");
  const [success, setSuccess] = useState();
  const [warning, setWarning] = useState();

  const patientId = localStorage.getItem("userId");
  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    AxiosInstance.get(`http://localhost:7100/progress/${patientId}`)
      .then((response) => {
        console.log(response);
        setPatientData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching doctors:", error);
      });
  }, []);

  useEffect(() => {
    AxiosInstance.get(`http://localhost:7100/achievements`)
      .then((response) => {
        setAchievements(response.data);
      })
      .catch((error) => {
        console.log("No appointments data.");
        console.log(error);
      });
  }, []);

  const accept = (id) => {
    setSuccess("");
    setWarning("");
    AxiosInstance.put(`http://localhost:7100/progress/accept-challenge/${id}`)
      .then((response) => {
        setSuccess(response.data);
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
        setWarning(error.response.data.message);
      });
  };

  function getLevel(dif) {
    const lowerDif = dif.toLowerCase();

    if (lowerDif === "hard")
      return <span className="text-danger mr-2">{dif.toUpperCase()}</span>;
    else if (lowerDif === "moderate")
      return <span className="text-info mr-2">{dif.toUpperCase()}</span>;
    else return <span className="text-success mr-2">{dif.toUpperCase()}</span>;
  }

  const getData = (scores) => {
    const progressData = [];
    let totalScore = 0;

    scores.forEach((entry) => {
      const { date, point } = entry;
      const formattedDate = new Date(date).toLocaleDateString("en-GB");
      totalScore += point;
      progressData.push({
        name: formattedDate,
        score: totalScore,
      });
    });

    return progressData;
  };

  return (
    <>
      <Container>
        <Row className="mt-4 mb-4 justify-content-center">
          <Col
            style={{
              backgroundColor: "#111155",
              borderRadius: "14px",
              margin: "10px",
            }}
          >
            <h2 className="m-4 text-white">Achievements</h2>
          </Col>
        </Row>
        <div className="text-xl">List of all achievements</div>
        <Row>
          <Col>
            <div
              className="bg-success text-white"
              style={{ borderRadius: "5px", textAlign: "center" }}
            >
              {success}
            </div>
          </Col>
        </Row>
        <Row>
          <Col>
            <div
              className="bg-danger text-white"
              style={{ borderRadius: "5px", textAlign: "center" }}
            >
              {warning}
            </div>
          </Col>
        </Row>
        <Row className="mb-4 m-1 justify-content-center">
          {achievements.map((achievement, index) => (
            <Col key={index} xs="12" md="3" lg="4" xl="3" className="mb-2">
              <Card className="card-stats mt-2 mb-xl-0">
                <CardBody>
                  <Row>
                    <div className="col">
                      <CardTitle tag="h5" className="text-uppercase text mb-0">
                        <b>
                          <i className="ni ni-user-run text-success" />
                        </b>{" "}
                        {achievement.title}
                      </CardTitle>
                    </div>
                    <Col className="col-auto">
                      <a
                        className="avatar avatar-sm"
                        href="#pablo"
                        id="tooltip742438047"
                        onClick={(e) => e.preventDefault()}
                      >
                        <img
                          className="rounded-circle"
                          src={achievement.logoURL}
                        />
                      </a>
                    </Col>
                  </Row>

                  <Row>
                    <Col>
                      {" "}
                      <p>{achievement.goalDescription}</p>
                      <span className="font-weight mb-0">
                        Target score: {achievement.goalScore}
                      </span>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <p className="mt-3 mb-0 text-muted text-sm">
                        {getLevel(achievement.difficulty)}{" "}
                      </p>
                    </Col>
                    <Col>
                      <Button
                        onClick={() => {
                          accept(achievement.id);
                        }}
                      >
                        <i class="fa-solid fa-plus"></i>
                      </Button>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>
        <div className="text-xl">Achievements in progress</div>
        {patientData && (
          <Card className="card-profile shadow m-2">
            <CardBody className="pt-0 pt-md-4">
              {patientData.length === 0 && (
                <div className="container" style={{ textAlign: "center" }}>
                  This patient does not have any achievements yet.
                </div>
              )}
              {patientData.map((achievement, index) => {
                console.log(achievement);
                return (
                  <Row>
                    <Col>
                      <Card className="card-stats mt-2 mb-xl-0">
                        <CardBody>
                          <Row>
                            <div className="col">
                              <CardTitle
                                tag="h5"
                                className="text-uppercase text mb-0"
                              >
                                <b>
                                  <i className="ni ni-user-run text-success" />
                                </b>{" "}
                                {achievement.completionDate ? (
                                  <>
                                    Completed in{" "}
                                    <b>{achievement.completedIn}</b> days
                                  </>
                                ) : (
                                  "In progress " +
                                  "(" +
                                  parseInt(
                                    (achievement.totalScore /
                                      achievement.achievement.goalScore) *
                                      100
                                  ) +
                                  "%)"
                                )}
                              </CardTitle>
                              <span className="h2 font-weight-bold mb-0">
                                {achievement.achievement.title}
                              </span>
                            </div>
                            <Col className="col-auto">
                              <a
                                className="avatar avatar-sm"
                                href="#pablo"
                                id="tooltip742438047"
                                onClick={(e) => e.preventDefault()}
                              >
                                <img
                                  className="rounded-circle"
                                  src={achievement.achievement.logoUrl}
                                />
                              </a>
                            </Col>
                          </Row>
                          <p className="mt-3 mb-0 text-muted text-sm">
                            {getLevel(achievement.achievement.difficulty)}{" "}
                            <span className="text-nowrap">
                              Achievement date:{" "}
                              {achievement.completionDate
                                ? achievement.completionDate
                                : "Not achieved yet."}
                            </span>
                          </p>
                        </CardBody>
                        <CardFooter className="justify-content-center">
                          <ScoreUpdate id={achievement.id} />
                        </CardFooter>
                      </Card>
                    </Col>
                    <Col>
                      <MultilineView
                        title={"Achievement progress"}
                        data={getData(achievement.scores)}
                        key1={"score"}
                        colors={{}}
                        description={"Achivement progress graph"}
                      />
                    </Col>
                  </Row>
                );
              })}
            </CardBody>
          </Card>
        )}
      </Container>
    </>
  );
};

export default Progress;
