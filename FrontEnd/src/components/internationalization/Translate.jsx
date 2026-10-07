import { useEffect, useState } from "react";
import AxiosInstance from "scripts/axioInstance";

const Translate = ({ text }) => {
  let language = localStorage.getItem("language");
  if (!language) {
    language = "Bengali";
    localStorage.setItem("language", "Bengali");
  }

  const [display, setDisplay] = useState(text);
  const [translated, setTranslated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [original, setOriginal] = useState(text);

  // The text prop can change after the first render (data loaded later); keep the view in sync.
  useEffect(() => {
    setDisplay(text);
    setOriginal(text);
    setTranslated(false);
  }, [text]);

  const langCodes = {
    Chinese: "zh",
    Spanish: "es",
    English: "en",
    Hindi: "hi",
    Arabic: "ar",
    Bengali: "bn",
    Portuguese: "pt",
    Russian: "ru",
    Japanese: "ja",
    German: "de",
  };

  const toggle = (event) => {
    event.stopPropagation();
    if (translated) {
      setDisplay(original);
      setTranslated(false);
      return;
    } else {
      setLoading(true);
      AxiosInstance.post("http://localhost:5300/v1/translation/translate", {
        from: "auto",
        to: langCodes[language],
        text: text.replace(/\./g, ".."),
      })
        .then((result) => {
          console.log("received new translation", result);
          setTranslated(true);
          setDisplay(result.data);
          setLoading(false);
        })
        .catch((error) => {
          console.log("error on request", error);
          setLoading(false);
          // The translator is the one online-only feature; fail with a clear message instead of silently.
          setOffline(true);
        });
      return;
    }
  };

  return (
    <div>
      <div
        dangerouslySetInnerHTML={{
          __html: display.replace(/\n/g, "<br>"),
        }}
      />
      <div>
        {loading === false && translated === false ? (
          <div
            // onClick={toggle(event)}
            onClick={(event) => toggle(event)}
            style={{ fontSize: "small", cursor: "pointer" }}
          >
            <i class="fa fa-language" aria-hidden="true"></i> See translation
            {offline && (
              <span style={{ color: "#fb6340", marginLeft: 8 }}>
                (translator is unreachable while offline)
              </span>
            )}
          </div>
        ) : (
          ""
        )}
        {loading === true ? (
          <div style={{ fontSize: "small", cursor: "progress" }}>
            <i class="fas fa-spinner fa-pulse"></i> Translating...
          </div>
        ) : (
          ""
        )}
        {loading === false && translated === true ? (
          <div
            onClick={(event) => toggle(event)}
            style={{ fontSize: "small", cursor: "pointer" }}
          >
            <i class="fa fa-undo" aria-hidden="true"></i> See original text
          </div>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};
export default Translate;
