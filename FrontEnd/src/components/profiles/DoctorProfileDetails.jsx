import AxiosInstance from "scripts/axioInstance";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardBody, Row, Col } from "reactstrap";

export const DoctorProfileDetails = ({ doctorData }) => {
  const [personal, setPersonal] = useState(null);
  useEffect(() => {
    if (!doctorData.doctorId) return;
    AxiosInstance.get(`http://localhost:7200/doctors/${doctorData.doctorId}/personal-info`)
      .then((response) => setPersonal(response.data))
      .catch(() => setPersonal(null));
  }, [doctorData.doctorId]);

  // National ID numbers are only shown to the doctor themselves and to administrators.
  const canSeeNid = ["ADMIN"].includes(localStorage.getItem("role")) || doctorData.doctorId === localStorage.getItem("userId");

  return (
    <>
      <Card className="bg-secondary shadow">
        <CardHeader className="bg-white border-0">
          <Row className="align-items-center">
            <Col xs="8">
              <h3 className="mb-0">
                <b className="text-uppercase">Dr. {" "+doctorData.firstName + " " + doctorData.lastName} </b>
              </h3>
            </Col>
            {doctorData &&
            localStorage.getItem("userId") &&
            doctorData.doctorId === localStorage.getItem("userId") ? (
              <Col className="text-right" xs="4">
                <Link
                  to={"/health/doctors/edit-profile"}
                  className="btn btn-primary"
                >
                  Edit profile
                </Link>
              </Col>
            ) : (
              ""
            )}
          </Row>
        </CardHeader>
        <CardBody>
          <h6 className="heading-small text-muted mb-4">Primary Info</h6>
          <div className="pl-lg-4">
            <Row>
              <Col lg="6">
                <b>Doctor ID: {doctorData.doctorId}</b>
              </Col>
              <Col lg="6">
                Email: <b>{doctorData.email}</b>
              </Col>
            </Row>
            <Row>
              <Col lg="6">
                First Name: <b>{doctorData.firstName}</b>
              </Col>
              <Col lg="6">
                Last Name: <b>{doctorData.lastName}</b>
              </Col>
            </Row>
            <Row>
              <Col lg="6">
                Gender: <b>{doctorData.gender}</b>
              </Col>
              <Col lg="6">
                <span style={{ color: "green" }}>
                  <i className="ni ni-check-bold" />
                </span>{" "}
                Medical License Number: {doctorData.license}
              </Col>
            </Row>
          </div>
          <hr className="my-4" />
          <h6 className="heading-small text-muted mb-4">
            Qualifications and Certifications
          </h6>
          <div className="pl-lg-4">
            {doctorData.qualifications.map((qualification) => {
              return (
                <>
                  <i className="ni ni-hat-3" /> <b>{qualification.name}</b>{" "}
                  <br></br>
                  <Row>
                    <Col lg="6">
                      <i className="ni ni-building" /> Institute:{" "}
                      {qualification.institution} <br></br>
                    </Col>
                    <Col lg="6">
                      <i className="ni ni-calendar-grid-58" /> Year:{" "}
                      {qualification.year} <br></br>
                    </Col>
                  </Row>
                  <hr></hr>
                </>
              );
            })}
            {doctorData.certifications.map((certification) => {
              return (
                <>
                  <i className="ni ni-badge" /> <b>{certification.name}</b>{" "}
                  <br></br>
                  <Row>
                    <Col lg="6">
                      <i className="ni ni-building" /> Institute:{" "}
                      {certification.issuingOrganization} <br></br>
                    </Col>
                    <Col lg="6">
                      <i className="ni ni-calendar-grid-58" /> Year:{" "}
                      {certification.year} <br></br>
                    </Col>
                  </Row>
                  <hr></hr>
                </>
              );
            })}
          </div>
          {personal && (
            <>
              <h6 className="heading-small text-muted mb-4">Personal Info</h6>
              <div className="pl-lg-4">
                <Row>
                  <Col md="6">Date of Birth: {personal.dateOfBirth}</Col>
                  <Col md="6">Phone no: {personal.phone}</Col>
                </Row>
                <Row>
                  <Col md="6">NID No: {canSeeNid ? personal.nidNo : "••••••••••"}</Col>
                  <Col md="6">Residence: {personal.residence}</Col>
                </Row>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </>
  );
};
