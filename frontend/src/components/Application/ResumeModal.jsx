import { useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";
import { api } from "../../lib/api";
import { Button, Modal, Skeleton } from "../ui";

/**
 * Views a resume stored in GridFS.
 *
 * Fetches as a blob with credentials rather than pointing `src` straight at
 * the API: the endpoint is cookie-authenticated, and a bare `src` only happens
 * to work while the frontend and API share a site. It also lets one component
 * render both PDFs and images off the response's content type.
 */
const ResumeModal = ({ open = true, fileId, contentType, filename, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fileId || !open) return;
    let revoked = false;
    let url = null;

    setBlobUrl(null);
    setError(null);

    api
      .get(`/api/v1/resume/file/${fileId}`, { responseType: "blob" })
      .then((res) => {
        if (revoked) return;
        url = URL.createObjectURL(res.data);
        setBlobUrl(url);
      })
      .catch((err) => {
        if (revoked) return;
        setError(
          err.response?.status === 403
            ? "You are not authorised to view this resume."
            : "Could not load this resume."
        );
      });

    // Without revoking, every open leaks a blob for the lifetime of the page.
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [fileId, open]);

  const isPdf = (contentType || "").includes("pdf");

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={filename || "Resume"}
      footer={
        blobUrl && (
          <Button
            as="a"
            href={blobUrl}
            download={filename || "resume"}
            variant="outline"
            leadingIcon={<FiDownload />}
          >
            Download
          </Button>
        )
      }
    >
      {error && (
        <p className="rounded-[var(--radius-field)] bg-[var(--color-danger-50)] px-4 py-3 text-sm font-medium text-[var(--color-danger-500)]">
          {error}
        </p>
      )}

      {!error && !blobUrl && <Skeleton className="h-[65dvh] w-full" />}

      {!error && blobUrl && isPdf && (
        <object
          data={blobUrl}
          type="application/pdf"
          className="h-[65dvh] w-full rounded-[var(--radius-field)] border border-[var(--border)]"
        >
          {/* Some browsers refuse to embed PDFs; always leave a way out. */}
          <p className="p-4 text-sm text-[var(--text-secondary)]">
            This browser cannot display PDFs inline.{" "}
            <a
              href={blobUrl}
              download={filename || "resume.pdf"}
              className="font-semibold text-[var(--brand)] hover:underline"
            >
              Download {filename || "resume.pdf"}
            </a>
          </p>
        </object>
      )}

      {!error && blobUrl && !isPdf && (
        <img
          src={blobUrl}
          alt={filename || "Resume"}
          className="mx-auto max-h-[65dvh] rounded-[var(--radius-field)] border border-[var(--border)]"
        />
      )}
    </Modal>
  );
};

export default ResumeModal;
