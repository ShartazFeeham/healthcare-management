import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  CardText,
  Button,
} from "reactstrap";
import {
  FaMedkit,
  FaPrescriptionBottle,
  FaTags,
  FaInfo,
  FaExclamationTriangle,
  FaThumbsDown,
  FaIndustry,
  FaBarcode,
  FaCalendar,
  FaImage,
  FaWeightHanging,
  FaFlask,
  FaFingerprint,
  FaKey,
} from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import AxiosInstance from "scripts/axioInstance";
import { isAdmin } from "scripts/accountInfo";
import { isDoctor } from "scripts/accountInfo";

const EquipmentDetails = () => {
  const navigate = useNavigate();
  const [medicineDetails, setEquipmentDetails] = useState({});
  let { equId } = useParams();
  const url = `http://localhost:7400/equipments/${equId}`;

  useEffect(() => {
    AxiosInstance.get(url)
      .then((result) => {
        console.log(result);
        setEquipmentDetails(result.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [equId]);
  return (
    <>
      <div>
        <Container className="d-flex align-items-center" fluid>
          <Row>
            <Col lg="7" md="10"></Col>
          </Row>
        </Container>
      </div>
      <Container className="mt-2" fluid>
        <Row>
          <Col sm="4">
            <Card
              style={{
                backgroundColor: "#111144",
                borderRadius: "20px",
              }}
            >
              <CardBody>
                <img
                  src={
                    medicineDetails.photoURL !== null
                      ? medicineDetails.photoURL
                      : "/img/local/equipment-default.svg"
                  }
                  alt={medicineDetails.name}
                  style={{
                    borderRadius: "15px",
                    width: "100%",
                  }}
                />
              </CardBody>
            </Card>
          </Col>
          <Col sm="8">
            <Card
              style={{
                color: "white",
                backgroundColor: "#111144",
                borderRadius: "20px",
              }}
            >
              <CardBody>
                <CardTitle tag="h1" style={{ color: "white" }}>
                  <Row>
                    <Col>Equipments Details</Col>
                    <Col>
                      {isAdmin() && (
                        <Button
                          color="info"
                          onClick={() => {
                            navigate("/health/equipments/update/" + equId);
                          }}
                        >
                          Edit Equipment
                        </Button>
                      )}
                    </Col>
                  </Row>
                </CardTitle>
                <CardText>
                  <CardText>
                    <FaKey /> <strong>Equipment ID:</strong>{" "}
                    {medicineDetails.id}
                  </CardText>
                  <CardText>
                    <i class="fa-solid fa-stethoscope"></i>{" "}
                    <strong>Name:</strong> {medicineDetails.name}
                  </CardText>
                  <CardText>
                    <FaTags /> <strong>Usage:</strong>{" "}
                    {medicineDetails.useCases}
                  </CardText>
                  <i class="fa-solid fa-receipt"></i> <strong>Details:</strong>{" "}
                  {medicineDetails.details}
                </CardText>
                <CardText>
                  <i className="fa fa-exclamation-triangle" />{" "}
                  <strong>Warning:</strong> {medicineDetails.warning}
                </CardText>
                <CardText>
                  <i class="fa-solid fa-dollar-sign"></i>{" "}
                  <strong>Costing:</strong> {medicineDetails.costing}
                </CardText>

                <CardText>
                  <i class="fa-solid fa-clock"></i>{" "}
                  <strong>Availability:</strong> {medicineDetails.availability}
                </CardText>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default EquipmentDetails;
