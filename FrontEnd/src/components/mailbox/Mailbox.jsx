import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Col, Nav, NavItem, NavLink } from "reactstrap";
import AxiosInstance from "scripts/axioInstance";

const OUTBOX_URL = "http://localhost:5300/v1/outbox";
const CHANNELS = [
  { key: "email", label: "Email", icon: "fa-regular fa-envelope" },
  { key: "sms", label: "SMS", icon: "fa-solid fa-comment-sms" },
  { key: "push", label: "Push", icon: "fa-regular fa-bell" },
];

// Local stand-in for real email / SMS / push providers: every message the platform
// sends is delivered to the integration service's outbox and shown here.
const Mailbox = () => {
  const [channel, setChannel] = useState("email");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    AxiosInstance.get(OUTBOX_URL, { params: { channel } })
      .then((r) => {
        setItems(r.data);
        setError("");
      })
      .catch(() => setError("The integration service is not reachable."));
  }, [channel]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [load]);

  const otpOf = (body) => ((body || "").match(/\b\d{6}\b/) || [])[0];

  return (
    <Col lg="10" md="12">
      <Card className="shadow border-0">
        <CardHeader className="bg-transparent d-flex justify-content-between align-items-center">
          <div>
            <h3 className="mb-0">Local mailbox</h3>
            <small className="text-muted">
              Everything the platform sends (OTP codes, reminders, alerts) lands here, nothing leaves this machine.
            </small>
          </div>
          <Button size="sm" color="secondary" onClick={() => AxiosInstance.delete(OUTBOX_URL).then(load)}>
            Clear
          </Button>
        </CardHeader>
        <CardBody>
          <Nav pills className="mb-3">
            {CHANNELS.map((c) => (
              <NavItem key={c.key}>
                <NavLink href="#" active={channel === c.key} onClick={(e) => { e.preventDefault(); setChannel(c.key); }}>
                  <i className={c.icon + " mr-2"} />
                  {c.label}
                </NavLink>
              </NavItem>
            ))}
          </Nav>
          {error && <div className="alert alert-warning">{error}</div>}
          {!error && items.length === 0 && <div className="text-muted">No {channel} messages yet.</div>}
          {items.map((m) => (
            <div key={m.id} className="border rounded p-3 mb-3 bg-white">
              <div className="d-flex justify-content-between">
                <div>
                  <strong>{m.title || "(no subject)"}</strong>
                  <div className="text-muted small">To: {m.to}</div>
                </div>
                <small className="text-muted">{new Date(m.sentAt).toLocaleTimeString()}</small>
              </div>
              <div className="mt-2" style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
              {otpOf(m.body) && (
                <Badge color="success" className="mt-2" style={{ fontSize: "1.1rem", letterSpacing: 4 }}>
                  {otpOf(m.body)}
                </Badge>
              )}
            </div>
          ))}
        </CardBody>
      </Card>
    </Col>
  );
};

export default Mailbox;
