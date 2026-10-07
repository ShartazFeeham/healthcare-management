import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col } from "reactstrap";
import { DoctorProfileDetails } from "./DoctorProfileDetails";
import { DoctorProfileBio } from "./DoctorProfileBio";
import doctorProfileData from "assets/data/doctorprofile/doctorProfile";
import { DoctorProfileReviews } from "./DoctorProfileReviews";
import AxiosInstance from "scripts/axioInstance";

const DoctorProfile = () => {
  let { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctorData, setDoctorData] = useState({ ...doctorProfileData, doctorId: "" }); // placeholder until the real profile loads

  // console.log(doctorId);

  const userId = localStorage.getItem("userId")
    ? localStorage.getItem("userId")
    : null;
  if (doctorId === ":doctorId") {
    if (userId && userId[0] === "D") doctorId = userId;
    else doctorId = null;
  }
  console.log(doctorId);
  useEffect(() => {
    if (doctorId === null) {
      return navigate("/");
    }
    AxiosInstance.get(`http://localhost:7200/doctors/${doctorId}/profile-info`)
      .then((response) => {
        console.log(response);
        setDoctorData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching doctors:", error);
      });
  }, [doctorId]);

  return (
    <>
      <>
        <div
          className="header pb-7 pt-5 pt-lg-8 d-flex align-items-center"
          style={{
            backgroundImage:
              "url(" + require("../../assets/img/cover/health5.jpg") + ")",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            width: "100%",
          }}
        >
          <span className="mask bg-gradient-default opacity-6" />
        </div>
      </>
      <Container className="mt--7" fluid>
        <Row>
          <Col className="order-xl-2 mb-5 mb-xl-0" xl="4">
            <DoctorProfileBio doctorData={doctorData} />
          </Col>
          <Col className="order-xl-1" xl="8">
            <DoctorProfileDetails doctorData={doctorData} />
            <DoctorProfileReviews doctorId={doctorData.doctorId} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default DoctorProfile;
