"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/toastContext";
import { useLiveRides } from "@/hooks/useLiveRides";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { LiveRidesFilters } from "@/components/liveRides/LiveRidesFilters";
import LiveMap from "@/components/liveRides/LiveMap";
import LiveRidesList from "@/components/liveRides/LiveRidesList";
import LiveRideDetailPanel from "@/components/liveRides/LiveRideDetailPanel";
import ContactDialog from "@/components/liveRides/ContactDialog";
import {
  FlagIssueDialog,
  OverrideFareDialog,
  EscalateDialog,
  AddNoteDialog,
} from "@/components/liveRides/actionDialogs";
import RideHistoryTimeline from "@/components/liveRides/RideHistoryTimeline";

import { useLiveRidesStore } from "@/store/liveRidesStore";
import { Map, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatAgo } from "@/lib/liveRides";
import { AlertTriangle } from "lucide-react";
import SidePanel from "@/components/SidePanel";

type RefundOption = "full" | "partial" | "none";

const REASONS: Array<{ value: string; label: string }> = [
  { value: "driver_unavailable", label: "Driver unavailable" },
  { value: "rider_request", label: "Customer request" },
  { value: "safety_concern", label: "Safety concern" },
  { value: "system_error", label: "System error" },
  { value: "other", label: "Other" },
];

const REFUND_OPTIONS: RefundOption[] = ["full", "partial", "none"];

export default function LiveRidesPage() {
  const toast = useToast();
  const {
    permissions,
    status,
    type,
    driverQuery,
    customerQuery,
    rideId,
    issuesOnly,
    viewMode,
    setStatus,
    setType,
    setDriverQuery,
    setCustomerQuery,
    setRideId,
    setIssuesOnly,
    setViewMode,
    filtered,
    visible,
    containerRef,
    offsetY,
    totalHeight,
    itemHeight,
    onScroll,
    selectRide,
    selectedRideId,
    connection,
    lastUpdatedAt,
    cancelRide,
    flagRide,
    addNote,
    escalate,
    overrideFare,
    getHistory,
  } = useLiveRides();

  // Cancel ride consts
  const { status: mapsStatus, google } = useGoogleMaps();
  const mapsReady = mapsStatus === "ready" && !!google;
  const [detailOpen, setDetailOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [hoveredRideId, setHoveredRideId] = useState<string | null>(null);

  const [cancelRideId, setCancelRideId] = useState<string | null>(null);
  const [cancelPending, setCancelPending] = useState(false);
  const [flagPending, setFlagPending] = useState(false);
  const [overridePending, setOverridePending] = useState(false);
  const [escalatePending, setEscalatePending] = useState(false);
  const [notePending, setNotePending] = useState(false);

  const selectedRide = filtered.find((r) => r.id === selectedRideId);

  const handleViewDetails = useCallback((ride) => {
    selectRide(ride.id);
    setDetailOpen(true);
  }, [selectRide]);

  const handleContact = useCallback((ride) => {
    setContactOpen(true);
  }, []);

  const handleCancel = useCallback((ride) => {
    setCancelRideId(ride.id);
    setCancelOpen(true);
  }, []);

  const handleFlag = useCallback((ride) => {
    setFlagOpen(true);
  }, []);

  const handleConfirmCancel = useCallback(
    (reason, refund, partialPercent, penalize) => {
      if (!cancelRideId) return;
      setCancelPending(true);
      cancelRide(cancelRideId, reason, refund, partialPercent, penalize);
      toast.success("Ride cancelled.");
      setCancelOpen(false);
      setCancelRideId(null);
      setCancelPending(false);
    },
    [cancelRideId, cancelRide, toast],
  );

  const handleConfirmFlag = useCallback(
    (reason, severity) => {
      if (!selectedRideId) return;
      setFlagPending(true);
      flagRide(selectedRideId, reason);
      toast.success(`Ride flagged (${severity}).`);
      setFlagOpen(false);
      setFlagPending(false);
    },
    [selectedRideId, flagRide, toast],
  );

  const handleConfirmOverride = useCallback(
    (amount, reason) => {
      if (!selectedRideId) return;
      setOverridePending(true);
      overrideFare(selectedRideId, amount, reason);
      toast.success("Fare overridden.");
      setOverrideOpen(false);
      setOverridePending(false);
    },
    [selectedRideId, overrideFare, toast],
  );

  const handleConfirmEscalate = useCallback(
    (note) => {
      if (!selectedRideId) return;
      setEscalatePending(true);
      escalate(selectedRideId, note);
      toast.success("Escalated to Platform Manager.");
      setEscalateOpen(false);
      setEscalatePending(false);
    },
    [selectedRideId, escalate, toast],
  );

  const handleConfirmAddNote = useCallback(
    (text) => {
      if (!selectedRideId) return;
      setNotePending(true);
      addNote(selectedRideId, text);
      toast.success("Note added.");
      setNoteOpen(false);
      setNotePending(false);
    },
    [selectedRideId, addNote, toast],
  );

  const showMap = viewMode === "map" || viewMode === "both";
  const showList = viewMode === "list" || viewMode === "both";

  const [refreshing, setRefreshing] = useState(false);
  const rides = useLiveRidesStore((s) => s.rides);
  const setConn = useLiveRidesStore((s) => s.setConnection);
  const activeCount = rides.filter((r) => r.status !== "completed").length;
  const issueCount = rides.filter((r) => r.hasIssue).length;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setConn("connecting");
      await new Promise((r) => setTimeout(r, 800));
      setConn("connected");
    } finally {
      setRefreshing(false);
    }
  };

  const [reason, setReason] = useState<"driver_unavailable" | "rider_request" | "safety_concern" | "system_error" | "other">("driver_unavailable");
  const [otherReason, setOtherReason] = useState("");
  const [refund, setRefund] = useState<RefundOption>("full");
  const [partialPercent, setPartialPercent] = useState(50);
  const [penalizeDriver, setPenalizeDriver] = useState(false);

  const full = reason === "other" ? otherReason : REASONS.find((r) => r.value === reason)?.label || reason;

  const closeCancelPanel = useCallback(() => {
    setCancelOpen(false);
    setCancelRideId(null);
    setReason("driver_unavailable");
    setOtherReason("");
    setRefund("full");
    setPartialPercent(50);
    setPenalizeDriver(false);
  }, []);

  return (
    <div className="space-y-0">
      <section className="header">
        <div className="liveRideHeader flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-slate-500" />
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Live Rides Monitor</h2>
            </div>
            <div className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600" />
              </span>
              <span className="text-sm font-semibold text-slate-900">Live</span>
            </div>
            <p className="text-sm text-slate-500">
              { activeCount } active ride{ activeCount !== 1 ? "s" : "" }{ issueCount ? ` · ${issueCount} issue${issueCount !== 1 ? "s" : ""}` : "" }
            </p>
          </div>

          <Separator orientation="vertical" className="hidden sm:block mx-1 h-5" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-900">{ activeCount }</span>
              <span className="text-xs text-slate-500">active rides</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-900">{ formatAgo(lastUpdatedAt) }</span>
              <span className="text-xs text-slate-500">updated</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <Button
              size="sm"
              onClick={ handleRefresh }
              disabled={ refreshing }
              className="text-xs"
            >
              <RefreshCw className={ `w-3 h-3 ${refreshing ? "animate-spin" : ""}` } />
              { refreshing ? "Refreshing…" : "Refresh" }
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={ () => {
                    setConn(connection === "connected" ? "disconnected" : "connected");
                  } }
                  className="text-xs"
                >
                  { connection === "connected" ? "Online" : "Offline" }
                </Button>
              </TooltipTrigger>
              <TooltipContent>Connection</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </section>

      <LiveRidesFilters
        status={ status }
        type={ type }
        driverQuery={ driverQuery }
        customerQuery={ customerQuery }
        rideId={ rideId }
        issuesOnly={ issuesOnly }
        viewMode={ viewMode }
        rides={ filtered }
        onStatusChange={ setStatus }
        onTypeChange={ setType }
        onDriverChange={ setDriverQuery }
        onCustomerChange={ setCustomerQuery }
        onRideIdChange={ setRideId }
        onIssuesToggle={ setIssuesOnly }
        onViewModeChange={ setViewMode }
        onDriverSelect={ (name) => setDriverQuery(name) }
        onCustomerSelect={ (name) => setCustomerQuery(name) }
      />

      <div
        className={ `flex gap-3 ${viewMode === "both" ? "" : "flex-col"
          } min-h-[calc(100vh-300px)]` }
      >
        { showMap && (
          <div
            className={ `rounded-xl border border-slate-200 overflow-hidden ${viewMode === "both" ? "w-3/5 h-full shrink-0" : "w-full h-full"
              }` }
          >
            <LiveMap
              rides={ filtered }
              selectedRideId={ selectedRideId }
              hoveredRideId={ hoveredRideId }
              onRideClick={ handleViewDetails }
              onRideHover={ setHoveredRideId }
              google={ google }
              hasGoogleMaps={ mapsReady }
            />
          </div>
        ) }
        { showList && (
          <div
            className={ `flex-1 min-w-0 rounded-xl border border-slate-200 overflow-hidden ${viewMode === "both" ? "w-2/5 h-full shrink-0" : "w-full h-full"
              }` }
          >
            <LiveRidesList
              rides={ visible }
              containerRef={ containerRef }
              offsetY={ offsetY }
              totalHeight={ totalHeight }
              itemHeight={ itemHeight }
              onScroll={ onScroll }
              selectedRideId={ selectedRideId }
              hoveredRideId={ hoveredRideId }
              onViewDetails={ handleViewDetails }
              onContact={ handleContact }
              onHover={ setHoveredRideId }
            />
          </div>
        ) }
      </div>

      { selectedRide && (
        <LiveRideDetailPanel
          ride={ selectedRide }
          open={ detailOpen }
          onClose={ () => {
            setDetailOpen(false);
            selectRide(null);
          } }
          canManage={ permissions.canManage }
          canEscalateNote={ permissions.canEscalateNote }
          onCancel={ () => handleCancel(selectedRide) }
          onContactBoth={ () => handleContact(selectedRide) }
          onFlag={ () => handleFlag(selectedRide) }
          onOverrideFare={ () => setOverrideOpen(true) }
          onEscalate={ () => setEscalateOpen(true) }
          onAddNote={ () => setNoteOpen(true) }
          onViewHistory={ () => setHistoryOpen(true) }
        />
      ) }

      { cancelOpen && cancelRideId && selectedRide && (
        <section className="cancelRideDialogue">
          <SidePanel
            open={ cancelOpen }
            onClose={ closeCancelPanel }
            title={ `Cancel ride ${cancelRideId}` }
            description="Provide a reason and refund options. This action cannot be undone."
            footer={
              <div className="flex items-center justify-between gap-2">
                <Button variant="outline" onClick={ closeCancelPanel } disabled={ cancelPending }>
                  Back
                </Button>
                <Button
                  variant="destructive"
                  disabled={ cancelPending || (reason === "other" && !otherReason) }
                  onClick={ () => handleConfirmCancel(full, refund, partialPercent, penalizeDriver) }
                >
                  { cancelPending ? "Cancelling…" : "Confirm cancellation" }
                </Button>
              </div>
            }
          >
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-900 mb-2">Reason</p>
                <div className="space-y-1.5">
                  { REASONS.map((r) => (
                    <button
                      key={ r.value }
                      onClick={ () => setReason(r.value as any) }
                      className={ `w-full text-left rounded-lg border px-3 py-2 text-sm text-left transition-colors ${reason === r.value
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }` }
                    >
                      { r.label }
                    </button>
                  )) }
                  { reason === "other" && (
                    <div className="mt-2">
                      <input
                        value={ otherReason }
                        onChange={ (e) => setOtherReason(e.target.value) }
                        placeholder="Specify the reason…"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  ) }
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-900 mb-2">Refund option</p>
                <div className="space-y-1.5">
                  { REFUND_OPTIONS.map((opt) => (
                    <button
                      key={ opt }
                      onClick={ () => setRefund(opt) }
                      className={ `w-full text-left rounded-lg border px-3 py-2 text-sm text-left transition-colors ${refund === opt
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }` }
                    >
                      { opt === "full" ? "Full refund to customer" : opt === "partial" ? `Partial refund: ${partialPercent}%` : "No refund" }
                    </button>
                  )) }
                  { refund === "partial" && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={ 0 }
                        max={ 100 }
                        value={ partialPercent }
                        onChange={ (e) => setPartialPercent(Math.min(100, Math.max(0, Number(e.target.value || 0)))) }
                        className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none"
                      />
                      <span className="text-xs text-slate-500">percent</span>
                    </div>
                  ) }
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  id="penalize"
                  type="checkbox"
                  checked={ penalizeDriver }
                  onChange={ (e) => setPenalizeDriver(e.target.checked) }
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 mt-0.5"
                />
                <label htmlFor="penalize" className="text-sm text-slate-700">
                  Penalize driver (if at fault)
                </label>
              </div>

              <Separator />
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5" />
                <p className="text-xs text-rose-600">
                  Cancelling a ride notifies the driver and customer and triggers the selected refund.
                </p>
              </div>
            </div>
          </SidePanel>
        </section>
      ) }
      { contactOpen && selectedRide && (
        <ContactDialog open={ contactOpen } onClose={ () => setContactOpen(false) } ride={ selectedRide } />
      ) }
      { flagOpen && selectedRide && (
        <FlagIssueDialog
          open={ flagOpen }
          onClose={ () => setFlagOpen(false) }
          pending={ flagPending }
          onConfirm={ handleConfirmFlag }
        />
      ) }
      { overrideOpen && selectedRide && (
        <OverrideFareDialog
          open={ overrideOpen }
          onClose={ () => setOverrideOpen(false) }
          pending={ overridePending }
          currentFare={ selectedRide.fare.total }
          onConfirm={ handleConfirmOverride }
        />
      ) }
      { escalateOpen && selectedRide && (
        <EscalateDialog
          open={ escalateOpen }
          onClose={ () => setEscalateOpen(false) }
          pending={ escalatePending }
          onConfirm={ handleConfirmEscalate }
        />
      ) }
      { noteOpen && selectedRide && (
        <AddNoteDialog
          open={ noteOpen }
          onClose={ () => setNoteOpen(false) }
          pending={ notePending }
          onConfirm={ handleConfirmAddNote }
        />
      ) }
      { historyOpen && selectedRide && (
        <RideHistoryTimeline
          open={ historyOpen }
          onClose={ () => setHistoryOpen(false) }
          rideId={ selectedRide.id }
          getHistory={ getHistory }
        />
      ) }
    </div>
  );
}
