import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * Views a resume stored in GridFS.
 *
 * Fetches as a blob with credentials rather than pointing `src` straight at the
 * API: the endpoint is cookie-authenticated, and a bare `src` only happens to
 * work while the frontend and API share a site. It also lets one component
 * render both PDFs and images off the response's content type.
 */
const ResumeModal = ({ fileId, contentType, filename, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fileId) return;
    let revoked = false;
    let url = null;

    axios
      .get(`/api/v1/resume/file/${fileId}`, {
        withCredentials: true,
        responseType: "blob",
      })
      .then((res) => {
        if (revoked) return;
        url = URL.createObjectURL(res.data);
        setBlobUrl(url);
      })
      .catch((err) => {
        if (!revoked) {
          setError(
            err.response?.status === 403
              ? "You are not authorised to view this resume."
              : "Could not load this resume."
          );
        }
      });

    // Without revoking, every open leaks a blob for the lifetime of the page.
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [fileId]);

  const isPdf = (contentType || "").includes("pdf");

  return (
    <div className="resume-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>
          &times;
        </span>

        {error && <p className="resume-error">{error}</p>}

        {!error && !blobUrl && <p className="resume-loading">Loading resume…</p>}

        {!error && blobUrl && isPdf && (
          <object data={blobUrl} type="application/pdf" className="resume-pdf">
            {/* Some browsers refuse to embed PDFs; always leave a way out. */}
            <p>
              This browser cannot display PDFs inline.{" "}
              <a href={blobUrl} download={filename || "resume.pdf"}>
                Download {filename || "resume.pdf"}
              </a>
            </p>
          </object>
        )}

        {!error && blobUrl && !isPdf && <img src={blobUrl} alt="resume" />}

        {blobUrl && (
          <a className="resume-download" href={blobUrl} download={filename || "resume"}>
            Download
          </a>
        )}
      </div>
    </div>
  );
};

export default ResumeModal;
