import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";
import { PatientProfileAchievements } from "./PatientProfileAchievements";
import { PatientProfileBio } from "./PatientProfileBio";
import { PatientProfilePhoto } from "./PatientProfilePhoto";
import { PatientProfileHealth } from "./PatientProfileHealth";
import { PatientProfileTreatment } from "./PatientProfileTreatment";
import { PatientProfileAnalysis } from "./PatientProfileAnalysis";
import AxiosInstance from "scripts/axioInstance";

const PatientProfile = () => {
  let { patientId } = useParams();
  const navigate = useNavigate();

  const [patientBio, setPatientBio] = useState(null);
  const [patientHealth, setPatientHealth] = useState(null);

  const userId = localStorage.getItem("userId")
    ? localStorage.getItem("userId")
    : null;
  if (patientId === ":patientId") {
    if (userId && userId[0] === "P") patientId = userId;
    else patientId = null;
  }

  useEffect(() => {
    if (patientId === null) {
      return navigate("/");
    }
    AxiosInstance.get(
      `http://localhost:7100/patients/minimal-info/${patientId}`
    )
      .then((response) => {
        console.log(response);
        setPatientBio(response.data);
      })
      .catch((error) => {
        console.error("Error fetching doctors:", error);
      });
  }, [patientId]);

  return (
    <>
      <div
        className="header pb-7 pt-5 pt-lg-8 d-flex align-items-center"
        style={{
          backgroundImage:
            "url(" + require("../../assets/img/cover/patient2.jpg") + ")",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          width: "100%",
        }}
      >
        <span className="mask bg-gradient-default opacity-6" />
      </div>
      <Container className="mt--7" fluid>
        <Row>
          <Col className="order-xl-2 mb-5 mb-xl-0" xl="4">
            {patientBio && (
              <PatientProfilePhoto
                patientId={patientId}
                photo={patientBio.photoURL}
                firstName={patientBio.firstName}
                lastName={patientBio.lastName}
              />
            )}
          </Col>
          <Col className="order-xl-1 mb-2" xl="8">
            <PatientProfileBio patientId={patientId} />
          </Col>
        </Row>
        <Row>
          <Col className="order-xl-2 mb-5 mb-xl-0" xl="4">
            <PatientProfileAchievements patientId={patientId} />
          </Col>
          <Col className="order-xl-1" xl="8">
            <PatientProfileHealth patientId={patientId} />
            <PatientProfileTreatment patientId={patientId} />
            <PatientProfileAnalysis patientId={patientId} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default PatientProfile;
