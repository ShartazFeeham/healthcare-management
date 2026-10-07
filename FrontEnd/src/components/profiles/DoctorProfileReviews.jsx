import AxiosInstance from "scripts/axioInstance";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Media, Progress, Table } from "reactstrap";

export const DoctorProfileReviews = ({ doctorId }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  useEffect(() => {
    if (!doctorId) return;
    AxiosInstance.get(`http://localhost:7400/reviews/doctor/${doctorId}`)
      .then((response) =>
        setFeedbacks(
          response.data.map((r) => ({ patientId: r.userId, comment: r.comment, rating: r.rating, date: r.date }))
        )
      )
      .catch(() => setFeedbacks([]));
  }, [doctorId]);

  const calculateAverageRating = () => {
    if (feedbacks.length === 0) return 0;

    const totalRating = feedbacks.reduce(
      (total, feedback) => total + feedback.rating,
      0
    );
    return (totalRating / feedbacks.length).toFixed(1);
  };

  function getRatingColor(rating) {
    if (rating >= 4) {
      return "success";
    } else if (rating === 3) {
      return "info";
    } else if (rating === 2) {
      return "warning";
    } else {
      return "danger";
    }
  }
  return (
    <div
      style={{
        marginTop: "5px",
        border: "1px solid #eee",
        backgroundColor: "white",
        padding: "5px",
      }}
    >
      <h3
        className="mb-0"
        style={{ margin: "5px", padding: "15px", fontWeight: "bold" }}
      >
        <b>
          {feedbacks === null || feedbacks.length > 0 ? (
            <>
              PATIENT REVIEWS ({calculateAverageRating()} ⭐ FROM{" "}
              {feedbacks.length} REVIEWS)
            </>
          ) : (
            <>THERE ARE NO REVIEWS ON THIS DOCTORS TREATMENT</>
          )}
        </b>
      </h3>
      {feedbacks !== null && feedbacks.length > 0 && (
        <Table className="align-items-center table-flush">
          <thead className="thead-light">
            <tr>
              <th scope="col">Patient ID</th>
              <th scope="col">Date</th>
              <th scope="col">Comment</th>
              <th scope="col">Rating</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((review, key) => {
              return (
                <tr>
                  <th scope="row">
                    <Media className="align-items-center">
                      <Link
                        to={`/health/patients/${review.patientId}`}
                        className="rounded-circle mr-3"
                      >
                        <i className="ni ni-single-02"></i>{" "}
                        <span className="mb-0 text-sm">{review.patientId}</span>
                      </Link>
                    </Media>
                  </th>
                  <td>{review.date}</td>
                  <td
                    style={{
                      maxWidth: "200px",
                      wordWrap: "break-word",
                      whiteSpace: "normal",
                    }}
                  >
                    {review.comment}
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <span className="mr-2">⭐ {review.rating}</span>
                      <div>
                        <Progress
                          trans
                          max="5"
                          value={review.rating}
                          barClassName={`bg-${getRatingColor(review.rating)}`}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
};
