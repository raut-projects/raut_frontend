"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Check,
  Download,
  FileText,
  RotateCw,
  X,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toastContext";

const qualityOptions = [
  { value: "clear", label: "Clear" },
  { value: "blurry", label: "Blurry" },
  { value: "poor", label: "Poor" },
];

const detailOptions = [
  ["name", "Name"],
  ["idNumber", "ID number"],
  ["photo", "Photo"],
  ["expiryDate", "Expiry date"],
];

const matchingOptions = [
  ["nameMatches", "Name matches registration"],
  ["idFormatValid", "ID format is valid"],
];

const choiceClass =
  "flex min-h-9 items-center gap-2 rounded-md border border-slate-200 px-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 has-[:checked]:border-brand-300 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-800";

const inputClass =
  "h-4 w-4 accent-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";

function checklistNotes({ quality, details, matches, authenticity, notes }) {
  const lines = [
    "Document review checklist",
    `Photo quality: ${quality}`,
    `Visible details: ${detailOptions
      .filter(([key]) => details[key])
      .map(([, label]) => label)
      .join(", ") || "None marked"}`,
    `Information matches: ${matchingOptions
      .filter(([key]) => matches[key])
      .map(([, label]) => label)
      .join(", ") || "None marked"}`,
    `Authenticity: ${authenticity}`,
  ];

  if (notes.trim()) lines.push(`Reviewer notes: ${notes.trim()}`);
  return lines.join("\n");
}

export default function DocumentReviewDialog({
  open,
  document,
  onClose,
  onApprove,
  onReject,
  pending = false,
}) {
  const headingId = useId();
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const pendingRef = useRef(pending);
  const toast = useToast();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [quality, setQuality] = useState("");
  const [details, setDetails] = useState({});
  const [matches, setMatches] = useState({});
  const [authenticity, setAuthenticity] = useState("");
  const [notes, setNotes] = useState("");
  const [downloading, setDownloading] = useState(false);
  const touchStartDistance = useRef(null);
  const touchStartZoom = useRef(1);

  useEffect(() => {
    onCloseRef.current = onClose;
    pendingRef.current = pending;
  }, [onClose, pending]);

  useEffect(() => {
    if (!open) return undefined;

    const browserDocument = window.document;
    const previousFocus = browserDocument.activeElement;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !pendingRef.current) {
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), iframe',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && browserDocument.activeElement === first) {
        event.preventDefault();
        (last as HTMLElement).focus();
      } else if (!event.shiftKey && browserDocument.activeElement === last) {
        event.preventDefault();
        (first as HTMLElement).focus();
      }
    };
    const previousOverflow = browserDocument.body.style.overflow;
    browserDocument.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      browserDocument.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open]);

  if (!open || !document) return null;

  const isImage =
    document.isImage ||
    String(document.contentType ?? "").startsWith("image/");
  const isPdf =
    String(document.contentType ?? "").toLowerCase() === "application/pdf" ||
    String(document.fileName ?? "").toLowerCase().endsWith(".pdf");

  const downloadDocument = async () => {
    if (!document.fileUrl || downloading) return;

    setDownloading(true);
    try {
      const response = await fetch(document.fileUrl);
      if (!response.ok) {
        throw new Error(`Download failed (${response.status}).`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = objectUrl;
      link.download = document.fileName || "driver-document";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      toast.error(error?.message ?? "Could not download the document.");
    } finally {
      setDownloading(false);
    }
  };

  const approve = () => {
    if (!quality || !authenticity || pending) return;
    onApprove(document.id, checklistNotes({ quality, details, matches, authenticity, notes }));
  };

  const handleTouchStart = (event) => {
    if (event.touches.length !== 2) return;

    const [first, second] = event.touches;
    touchStartDistance.current = Math.hypot(
      first.clientX - second.clientX,
      first.clientY - second.clientY,
    );
    touchStartZoom.current = zoom;
  };

  const handleTouchMove = (event) => {
    if (event.touches.length !== 2 || !touchStartDistance.current) return;

    const [first, second] = event.touches;
    const distance = Math.hypot(
      first.clientX - second.clientX,
      first.clientY - second.clientY,
    );
    event.preventDefault();
    setZoom(
      Math.min(4, Math.max(1, touchStartZoom.current * (distance / touchStartDistance.current))),
    );
  };

  const handleTouchEnd = (event) => {
    if (event.touches.length < 2) touchStartDistance.current = null;
  };

  const imageTransform = `scale(${zoom}) rotate(${rotation}deg)`;

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/60 p-0 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="flex h-full max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl sm:rounded-xl"
      >
        <header className="flex shrink-0 items-center gap-4 border-b border-slate-200 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2
              id={headingId}
              className="truncate text-base font-semibold text-slate-900"
            >
              Document Review · {document.typeLabel}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {document.fileName}
            </p>
          </div>
          {document.isApproved && (
            <span className="ml-auto shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Approved
            </span>
          )}
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            className={document.isApproved ? "" : "ml-auto"}
            onClick={onClose}
            disabled={pending}
            aria-label="Close document review"
          >
            <X aria-hidden="true" />
          </Button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] lg:overflow-hidden">
          <section
            aria-label="Document viewer"
            className="flex min-h-88 flex-col border-b border-slate-200 bg-slate-50 p-4 sm:p-5 lg:min-h-0 lg:border-b-0 lg:border-r"
          >
            <div
              className="flex min-h-64 flex-1 items-center justify-center overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-4 sm:min-h-88"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {document.fileUrl && isImage ? (
                <img
                  src={document.fileUrl}
                  alt={`${document.typeLabel} document`}
                  draggable={false}
                  className="max-h-full max-w-full select-none object-contain transition-transform duration-200"
                  style={{ transform: imageTransform }}
                />
              ) : document.fileUrl && isPdf ? (
                <iframe
                  src={document.fileUrl}
                  title={`${document.typeLabel} PDF`}
                  className="h-full min-h-88 w-full self-stretch bg-white"
                  style={{ transform: imageTransform }}
                />
              ) : document.fileUrl ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <FileText
                    className="h-10 w-10 text-slate-400"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-slate-600">
                    Preview isn’t available for this file type.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void downloadDocument()}
                    disabled={downloading}
                  >
                    <Download aria-hidden="true" />
                    {downloading ? "Downloading…" : "Download original"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No document file was attached.
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium text-slate-500">
                Zoom
              </span>
              {[2, 4].map((factor) => (
                <Button
                  key={factor}
                  type="button"
                  size="sm"
                  variant={zoom === factor ? "secondary" : "outline"}
                  onClick={() => setZoom(factor)}
                  disabled={!isImage && !isPdf}
                  aria-pressed={zoom === factor}
                >
                  <ZoomIn aria-hidden="true" />
                  {factor}×
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant={zoom === 1 ? "secondary" : "outline"}
                onClick={() => setZoom(1)}
                disabled={!isImage && !isPdf}
                aria-pressed={zoom === 1}
              >
                Reset
              </Button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium text-slate-500">
                Rotate
              </span>
              {[90, 180, 270].map((degrees) => (
                <Button
                  key={degrees}
                  type="button"
                  size="sm"
                  variant={rotation === degrees ? "secondary" : "outline"}
                  onClick={() => setRotation(degrees)}
                  disabled={!isImage && !isPdf}
                  aria-pressed={rotation === degrees}
                >
                  <RotateCw aria-hidden="true" />
                  {degrees}°
                </Button>
              ))}
              {document.fileUrl && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="sm:ml-auto"
                  onClick={() => void downloadDocument()}
                  disabled={downloading}
                >
                  <Download aria-hidden="true" />
                  {downloading ? "Downloading…" : "Download"}
                </Button>
              )}
            </div>
            {(isImage || isPdf) && (
              <p className="mt-2 text-xs text-slate-500">
                Scroll to pan when zoomed; pinch to zoom on touch screens.
              </p>
            )}
          </section>

          <form
            className="flex min-h-0 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              approve();
            }}
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Check
                    className="h-4 w-4 text-emerald-600"
                    aria-hidden="true"
                  />
                  Verification checklist
                </h3>
                {document.reviewNotes && (
                  <p className="mt-2 whitespace-pre-wrap rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Previous review: {document.reviewNotes}
                  </p>
                )}
              </div>

              <fieldset disabled={pending}>
                <legend className="mb-2 text-xs font-semibold text-slate-700">
                  Photo quality
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {qualityOptions.map((option) => (
                    <label className={choiceClass} key={option.value}>
                      <input
                        className={inputClass}
                        type="radio"
                        name="photo-quality"
                        value={option.value}
                        checked={quality === option.value}
                        onChange={() => setQuality(option.value)}
                        required
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset disabled={pending}>
                <legend className="mb-2 text-xs font-semibold text-slate-700">
                  ID details visible
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {detailOptions.map(([key, label]) => (
                    <label className={choiceClass} key={key}>
                      <input
                        className={inputClass}
                        type="checkbox"
                        checked={Boolean(details[key])}
                        onChange={(event) =>
                          setDetails((current) => ({
                            ...current,
                            [key]: event.target.checked,
                          }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset disabled={pending}>
                <legend className="mb-2 text-xs font-semibold text-slate-700">
                  Information matches
                </legend>
                <div className="space-y-2">
                  {matchingOptions.map(([key, label]) => (
                    <label className={choiceClass} key={key}>
                      <input
                        className={inputClass}
                        type="checkbox"
                        checked={Boolean(matches[key])}
                        onChange={(event) =>
                          setMatches((current) => ({
                            ...current,
                            [key]: event.target.checked,
                          }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset disabled={pending}>
                <legend className="mb-2 text-xs font-semibold text-slate-700">
                  Authenticity
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["genuine", "Genuine"],
                    ["suspicious", "Suspicious"],
                  ].map(([value, label]) => (
                    <label className={choiceClass} key={value}>
                      <input
                        className={inputClass}
                        type="radio"
                        name="authenticity"
                        value={value}
                        checked={authenticity === value}
                        onChange={() => setAuthenticity(value)}
                        required
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-700">
                  Reviewer notes
                </span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  maxLength={1000}
                  disabled={pending}
                  placeholder="Add context for this review…"
                  className="w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50"
                />
                <span className="mt-1 block text-right text-xs text-slate-500">
                  {notes.length}/1000
                </span>
              </label>
            </div>

            <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
              <>
                  <Button
                    type="submit"
                    disabled={pending || !quality || !authenticity}
                  >
                    <Check aria-hidden="true" />
                    {pending ? "Approving…" : "Approve"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => onReject(document)}
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    title="Requesting more information is not supported by the current API."
                  >
                    Request More Info
                  </Button>
                </>
              {document.isApproved && (
                <p className="text-xs text-slate-500">
                  This document has already been approved.
                </p>
              )}

            </footer>
          </form>
        </div>
      </section>
    </div>
  );
}
