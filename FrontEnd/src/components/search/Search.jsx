import useI18N from "components/internationalization/i18n";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button, Card, Col, Container, Row } from "reactstrap";
import AxiosInstance from "scripts/axioInstance";

const Search = () => {
  const location = useLocation();
  const { text, isBaseReady } = useI18N();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const loader =
    "/img/local/spinner.svg";
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get("query");
    setSearchQuery(query);
    search(query);
  }, [location.search]);

  const search = (query) => {
    if (query === undefined || query === null || query.length === 0) return;
    setSearched(true);
    setLoading(true);
    const url = `http://localhost:7700/search/${query}`;
    AxiosInstance.get(url)
      .then((result) => {
        setResults(result.data);
        console.log(result);
      })
      .catch((error) => {
        console.log(error);
      });
    setLoading(false);
  };

  return (
    <>
      <div style={{ width: "100%", textAlign: "center" }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Need help? Search anything!"
          style={{
            width: "80%",
            maxWidth: "700px",
            padding: "10px",
            fontSize: "16px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            boxSizing: "border-box",
          }}
        />
        <Button
          className="m-3"
          onClick={() => {
            search(searchQuery);
          }}
        >
          {text("search-search-button", "Search")}
        </Button>
      </div>
      <hr></hr>
      {loading && (
        <p
          style={{
            backgroundColor: "white",
            borderRadius: "50%",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <img src={loader} height={100}></img>
          <h4>Searching...</h4>
        </p>
      )}

      {searched && (
        <Container
          className="mt-4"
          fluid
          style={{ display: "flex", justifyContent: "center" }}
        >
          <Card
            style={{
              width: "100%",
              maxWidth: "800px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              padding: "15px",
            }}
          >
            {results.length === 0 && searched && !loading ? (
              <h3>{text("search-no-result", "No results found!")}</h3>
            ) : (
              ""
            )}

            {results.length > 0 && searched && !loading ? (
              <h2 className="text-primary">
                <b
                  style={{
                    borderRadius: "40%",
                    color: "white",
                    padding: "10px",
                  }}
                  className="bg-success"
                >
                  {results.length}
                </b>{" "}
                {text("search-found-count", "results found!")}
              </h2>
            ) : (
              ""
            )}

            {results.map((result) => (
              <div
                key={result.resultId}
                style={{
                  cursor: result.url ? "pointer" : "default",
                  padding: "15px",
                  paddingBottom: "10px",
                  marginBottom: "10px",
                  borderRadius: "5px",
                  backgroundColor: "transparent",
                  display: "flex",
                  flexDirection: "column",
                  borderBottom: "1px solid #eee",
                  boxShadow: "1px 1px 2px #eee",
                }}
                onClick={() => {
                  if (result.url) {
                    window.location.href = result.url;
                  }
                }}
              >
                <Row className="justify-content-between">
                  <Col xs={9} sm={9} md={9} lg={9}>
                    <Row>
                      <Col>
                        {result.params[0] && (
                          <strong>{result.params[0]}: </strong>
                        )}
                        {result.values[0] && (
                          <strong>{result.values[0]} </strong>
                        )}
                      </Col>
                    </Row>
                    <div>
                      {result.params[1] && (
                        <span style={{ color: "#555" }}>
                          {result.params[1]}:
                        </span>
                      )}
                      <span
                        style={{
                          color: "#333",
                          backgroundColor: "#eee",
                          padding: "2px",
                          borderRadius: "5px",
                          marginRight: "5px",
                        }}
                      >
                        {result.values[1] && result.values[1]}
                      </span>

                      {result.params[2] && (
                        <span style={{ color: "#555" }}>
                          {result.params[2]}:
                        </span>
                      )}
                      {result.values[2] && result.values[2]}

                      {result.params[3] && (
                        <span style={{ color: "#555" }}>
                          {result.params[3]}:
                        </span>
                      )}
                      {result.values[3] && result.values[3]}

                      {result.params[4] && (
                        <span style={{ color: "#555" }}>
                          {result.params[4]}:
                        </span>
                      )}
                      {result.values[4] && result.values[4]}

                      {result.params[5] && (
                        <span style={{ color: "#555" }}>
                          {result.params[5]}:
                        </span>
                      )}
                      {result.values[5] && result.values[5]}

                      {result.params[6] && (
                        <span style={{ color: "#555" }}>
                          {result.params[6]}:
                        </span>
                      )}
                      {result.values[6] && result.values[6]}
                    </div>
                  </Col>
                  {result.photo && (
                    <Col xs="auto" sm="auto" md="auto" lg="auto">
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "5px",
                          overflow: "hidden",
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <img
                          src={result.photo}
                          alt="result"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    </Col>
                  )}
                </Row>
                <Row className="mt-2">
                  <Col xs={8}>
                    <p>{result.timeCreate}</p>
                  </Col>
                  <Col xs={4} className="text-right">
                    {result.type && (
                      <span
                        className="bg-primary text-white p-1 rounded"
                        style={{ fontSize: "0.8rem" }}
                      >
                        {result.type.toUpperCase()}
                      </span>
                    )}
                  </Col>
                </Row>
              </div>
            ))}
          </Card>
        </Container>
      )}
    </>
  );
};

export default Search;
