import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, CardBody, Col, Row } from "reactstrap";
import AxiosInstance from "scripts/axioInstance";

const CDSS = "http://localhost:7800";

// Splits the analysis text the CDSS service produces into its three numbered sections.
const sectionsOf = (content) =>
  (content || "")
    .split(/\n(?=\d\.\s)/)
    .map((block) => {
      const [title, ...rest] = block.split("\n");
      return { title: title.replace(/^\d\.\s*/, ""), body: rest.join("\n").trim() };
    })
    .filter((s) => s.title);

const ICONS = ["fa-solid fa-notes-medical", "fa-solid fa-people-arrows", "fa-solid fa-route"];

// Clinical decision support: AI health report plus the anonymised cases it was compared against.
export const PatientProfileAnalysis = ({ patientId }) => {
  const [reports, setReports] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const isOwner = localStorage.getItem("userId") === patientId;

  const load = useCallback(() => {
    AxiosInstance.get(`${CDSS}/cdss/report/list/${patientId}`)
      .then((r) => setReports([...r.data].reverse()))
      .catch(() => setReports([]));
    AxiosInstance.get(`${CDSS}/cdss/similar/${patientId}`)
      .then((r) => setSimilar(r.data))
      .catch(() => setSimilar([]));
  }, [patientId]);

  useEffect(load, [load]);

  const generate = () => {
    setBusy(true);
    setMessage("");
    AxiosInstance.get(`${CDSS}/cdss/report/generate/${patientId}`)
      .then((r) => {
        if (isOwner) { load(); setActive(0); }
        else setReports([{ id: "preview", content: r.data, generationTime: new Date().toISOString() }, ...reports]);
      })
      .catch((e) => setMessage(e.response?.data?.message || "The analysis could not be generated."))
      .finally(() => setBusy(false));
  };

  const current = reports[active];
  const sections = sectionsOf(current?.content);

  return (
    <Card className="bg-secondary shadow mt-2" id="ai-analysis">
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-3 pl-lg-4">
          <h6 className="heading-small text-muted mb-0">
            <i className="fa-solid fa-wand-magic-sparkles mr-2" />
            AI health analysis
          </h6>
          <Button color="primary" size="sm" onClick={generate} disabled={busy}>
            {busy ? "Analysing..." : reports.length ? "Generate new report" : "Generate report"}
          </Button>
        </div>
        {message && <div className="alert alert-warning">{message}</div>}
        {!current && !message && (
          <p className="text-muted pl-lg-4 mb-0">
            Generate a personalised overview of the treatment history and how comparable anonymised cases progressed. The
            analysis runs on this platform's own server.
          </p>
        )}
        {current && (
          <>
            <div className="pl-lg-4 mb-3 d-flex flex-wrap" style={{ gap: 8 }}>
              {reports.slice(0, 6).map((r, i) => (
                <Button key={r.id} size="sm" outline={i !== active} color="info" onClick={() => setActive(i)}>
                  {new Date(r.generationTime).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                </Button>
              ))}
            </div>
            {sections.map((s, i) => (
              <Card className="mb-3" key={i}>
                <CardBody>
                  <h4 className="text-primary">
                    <i className={ICONS[i % 3] + " mr-2"} />
                    {s.title}
                  </h4>
                  <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{s.body}</p>
                </CardBody>
              </Card>
            ))}
          </>
        )}
        {similar.length > 0 && (
          <div className="mt-4">
            <h6 className="heading-small text-muted pl-lg-4 mb-3">Most similar anonymised cases</h6>
            <Row>
              {similar.map((t, i) => (
                <Col lg="6" key={i}>
                  <Card className="mb-2">
                    <CardBody>
                      <h5 style={{ textTransform: "uppercase" }}>{t.condition}</h5>
                      <p className="mb-1 small"><b>Medicines:</b> {t.medicines}</p>
                      <p className="mb-1 small"><b>Diagnostics:</b> {t.diagnoses}</p>
                      <p className="mb-0 small"><b>Course:</b> {t.progression}</p>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
