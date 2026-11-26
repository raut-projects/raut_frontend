import {
  HEALTH_STATUS_LABELS,
  JOB_STATUS_LABELS,
  type HealthIncident,
  type HealthStatus,
  type IncidentStatus,
  type JobStatus,
} from "@/lib/systemHealth";

const serviceStatusStyles: Record<HealthStatus, string> = {
  healthy: "bg-emerald-50 text-emerald-800",
  degraded: "bg-amber-50 text-amber-800",
  outage: "bg-rose-50 text-rose-800",
};

const serviceDotStyles: Record<HealthStatus, string> = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-500",
  outage: "bg-rose-500",
};

const jobStatusStyles: Record<JobStatus, string> = {
  healthy: "bg-emerald-50 text-emerald-800",
  delayed: "bg-amber-50 text-amber-800",
  attention: "bg-rose-50 text-rose-800",
};

const jobDotStyles: Record<JobStatus, string> = {
  healthy: "bg-emerald-500",
  delayed: "bg-amber-500",
  attention: "bg-rose-500",
};

const incidentStatusStyles: Record<IncidentStatus, string> = {
  Investigating: "bg-rose-50 text-rose-800",
  Monitoring: "bg-amber-50 text-amber-800",
  Resolved: "bg-slate-100 text-slate-600",
};

const incidentDotStyles: Record<IncidentStatus, string> = {
  Investigating: "bg-rose-500",
  Monitoring: "bg-amber-500",
  Resolved: "bg-slate-300",
};

type IncidentSeverity = HealthIncident["severity"];

const severityStyles: Record<IncidentSeverity, string> = {
  Minor: "bg-slate-100 text-slate-600",
  Major: "bg-rose-50 text-rose-800",
};

const severityDotStyles: Record<IncidentSeverity, string> = {
  Minor: "bg-slate-400",
  Major: "bg-rose-500",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${jobStatusStyles[status]}`}
    >
      <span
        className={`size-1.5 rounded-full ${jobDotStyles[status]}`}
        aria-hidden="true"
      />
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-[0.7rem] font-semibold ${incidentStatusStyles[status]}`}
    >
      <span
        className={`size-1.5 rounded-full ${incidentDotStyles[status]}`}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}

export function IncidentSeverityBadge({ severity }: { severity: IncidentSeverity }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-[0.7rem] font-semibold ${severityStyles[severity]}`}
    >
      <span
        className={`size-1.5 rounded-full ${severityDotStyles[severity]}`}
        aria-hidden="true"
      />
      {severity}
    </span>
  );
}

export function ServiceStatusBadge({ status }: { status: HealthStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${serviceStatusStyles[status]}`}
    >
      <span
        className={`size-1.5 rounded-full ${serviceDotStyles[status]}`}
        aria-hidden="true"
      />
      {HEALTH_STATUS_LABELS[status]}
    </span>
  );
}

export function formatHealthSampleTime(value: string) {
  return new Intl.DateTimeFormat("en-TZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Dar_es_Salaam",
  }).format(new Date(value));
}
