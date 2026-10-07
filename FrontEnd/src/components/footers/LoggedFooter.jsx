import { Row, Col, Nav, NavItem, NavLink } from "reactstrap";

const Footer = () => {
  return (
    <footer className="footer">
      <Row className="align-items-center justify-content-xl-between">
        <Col xl="6">
          <div className="copyright text-center text-xl-left text-muted">
            © {new Date().getFullYear()}{" "}
            <a
              className="font-weight-bold ml-1"
              href="http://localhost:3100"
              rel="noopener noreferrer"
              
            >
              EA Healthcare
            </a>
          </div>
        </Col>

        <Col xl="6">
          <Nav className="nav-footer justify-content-center justify-content-xl-end">
            <NavItem>
              <NavLink
                href="http://localhost:3100"
                rel="noopener noreferrer"
                
              >
                EA Healthcare
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink
                href="/common/index"
                rel="noopener noreferrer"
                
              >
                Overview
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink
                href="/common/medicines"
                rel="noopener noreferrer"
                
              >
                Medicines
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink
                href="/common/mailbox"
                rel="noopener noreferrer"
                
              >
                Local mailbox
              </NavLink>
            </NavItem>
          </Nav>
        </Col>
      </Row>
    </footer>
  );
};

export default Footer;
