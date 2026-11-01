function GateLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div
        className="flex flex-col items-center gap-3"
        role="status"
        aria-live="polite"
      >
        <span
          className="h-7 w-7 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-500">
          Checking your access…
        </p>
      </div>
    </div>
  );
}

export default GateLoader;
