const paths: Record<string, string> = {
  View: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  Role: "M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-7 2-7 4h14c0-2-3-4-7-4ZM19 8V3m-2.5 2.5h5",
  Deactivate: "M12 3v9m-6.4-6.4a9 9 0 1 0 12.8 0",
  Reactivate: "M20 7v5h-5M20 12a8 8 0 1 1-2.3-5.7L20 9",
  Delete: "M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6",
  Verify: "m5 12 4 4L19 6",
  Reject: "m6 6 12 12M18 6 6 18",
  Suspend: "M8 5v14m8-14v14",
  Unsuspend: "m7 5 12 7-12 7z",
  Cancel: "m6 6 12 12M18 6 6 18",
};

export default function ActionIcon({ label }: { label: string }) {
  return (
    <>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <title>{label}</title>
        <path d={paths[label] ?? paths.View} />
      </svg>
      <span className="sr-only">{label}</span>
    </>
  );
}
