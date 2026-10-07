import { Link, useLocation, useNavigate } from "react-router-dom";
import AxiosInstance from "scripts/axioInstance";
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  FormGroup,
  Form,
  Input,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  Row,
  Col,
} from "reactstrap";

const VerifyAccount = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [warning, setWarning] = useState("");
  const [info, setInfo] = useState("");
  const navigate = useNavigate();

  // A new account stays locked until the emailed one-time code is entered together with the password.
  const handleVerify = () => {
    setWarning("");
    if (!email || !password || !otp) {
      setWarning("Enter your email, password and the code we emailed you.");
      return;
    }
    AxiosInstance.post("http://localhost:5100/access/login", { identity: email, password, otp: Number(otp) })
      .then((result) => {
        const { bearerToken, role, userId } = result.data;
        localStorage.setItem("token", bearerToken);
        localStorage.setItem("role", role);
        localStorage.setItem("email", result.data.email);
        localStorage.setItem("userId", userId);
        navigate(role === "ADMIN" ? "/health/admin" : role === "PATIENT" ? "/health/patient" : "/health/doctor");
      })
      .catch((error) => setWarning(error.response?.data?.message || "Verification failed."));
  };

  const handleResend = () => {
    setWarning("");
    AxiosInstance.post(`http://localhost:5100/access/generate-otp/${encodeURIComponent(email)}`, "")
      .then(() => setInfo("A new code has been sent to your email."))
      .catch((error) => setWarning(error.response?.data?.message || "Could not send a code."));
  };

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [location.search]);

  return (
    <>
      <Col lg="5" md="7">
        <Card className="bg-secondary shadow border-0">
          <CardHeader className="bg-transparent">
            <div className="text-muted text-center mt-2">
              <h3 style={{ textTransform: "uppercase" }}>
                Verify Your Account
              </h3>
            </div>
          </CardHeader>
          <CardBody className="px-lg-5 py-lg-5">
            <Form role="form">
              {warning && <div className="alert alert-danger">{warning}</div>}
              {info && <div className="alert alert-success">{info}</div>}
              <FormGroup className="mb-3">
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText>
                      <i className="ni ni-email-83" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <Input
                    placeholder="Enter your email"
                    type="email"
                    autoComplete="new-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </InputGroup>
              </FormGroup>
              <FormGroup className="mb-3">
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText>
                      <i className="ni ni-lock-circle-open" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <Input
                    placeholder="Enter your password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </InputGroup>
              </FormGroup>
              <InputGroup className="input-group-alternative">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText>
                    <i className="ni ni-key-25" />
                  </InputGroupText>
                </InputGroupAddon>
                <Input
                  placeholder="Enter your OTP"
                  type="number"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </InputGroup>
              <div className="text-right">
                <Button className="my-2" color="link" type="button" onClick={handleResend}>
                  Send a new code
                </Button>
                <Button
                  className="my-2"
                  color="primary"
                  type="button"
                  onClick={handleVerify}
                >
                  Verify
                </Button>
              </div>
            </Form>
            <br></br>
            <small>
              <Link to="/public/login">Go back to login</Link>
            </small>
          </CardBody>
        </Card>
      </Col>
    </>
  );
};

export default VerifyAccount;
