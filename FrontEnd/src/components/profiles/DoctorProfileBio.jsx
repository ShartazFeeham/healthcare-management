import { Card, CardHeader, CardBody, Row, Col } from "reactstrap";
import DoctorProfileAvailability from "./DoctorProfileAvailability";
import { useEffect, useState } from "react";
import doctorTreatmentsCount from "assets/data/doctorprofile/doctorTreatmentCount";
import doctoReviewCount from "assets/data/doctorprofile/doctorReviewsCount";
import Translate from "components/internationalization/Translate";
import AxiosInstance from "scripts/axioInstance";

export const DoctorProfileBio = ({ doctorData }) => {
  const [reviewCount, setReviewCount] = useState(0);
  const [treatmentsCount, setTreatmentsCount] = useState(0);

  useEffect(() => {
    if (!doctorData.doctorId) return; // profile still loading
    AxiosInstance.get(
      `http://localhost:7400/reviews/doctor/count/${doctorData.doctorId}`
    )
      .then((response) => {
        setReviewCount(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
    AxiosInstance.get(
      `http://localhost:7400/appointments/total/${doctorData.doctorId}`
    )
      .then((response) => {
        setTreatmentsCount(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [doctorData.doctorId]);

  return (
    <>
      <Card className="card-profile shadow">
        <Row className="justify-content-center">
          <Col className="order-lg-2" lg="6">
            <div className="card-profile-image">
              <a href="#pablo" onClick={(e) => e.preventDefault()}>
                <img
                  className="rounded-circle"
                  style={{
                    height: "200px",
                    width: "200px",
                    backgroundImage: `url(${doctorData.profilePhoto})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </a>
            </div>
          </Col>
        </Row>
        <CardHeader className="text-center border-0 pt-8 pt-md-4 pb-0 pb-md-4"></CardHeader>
        <CardBody className="pt-0 pt-md-4">
          <Row>
            <div className="col">
              <div className="card-profile-stats d-flex justify-content-center mt-md-5">
                <div>
                  <span className="heading">{treatmentsCount}</span>
                  <span className="description">Treatments</span>
                </div>
                <div>
                  <span className="heading">{doctorData.experience}</span>
                  <span className="description">Years of Experience</span>
                </div>
                <div>
                  <span className="heading">{reviewCount}</span>
                  <span className="description">Feedbacks</span>
                </div>
              </div>
            </div>
          </Row>
          <div className="text-center">
            <h3>{`Dr. ${doctorData.firstName} ${doctorData.lastName}`}</h3>
            <div>
              <i className="fa-solid fa-hotel" /> {doctorData.room}
            </div>
            <div className="h5 mt-4">
              <i className="ni business_briefcase-24 mr-2" />
              {doctorData.specializations} specialist
            </div>
            <div>
              <i className="ni education_hat mr-2" />@
              {doctorData.qualifications[0].institution}
            </div>
            <hr className="my-4" />
            <p>
              <Translate text={doctorData.bio} />
            </p>
            <hr className="my-4" />
            <h6 className="heading-small text-muted">Upcoming availability</h6>
            <DoctorProfileAvailability doctorId={doctorData.doctorId} />
          </div>
        </CardBody>
      </Card>
    </>
  );
};
