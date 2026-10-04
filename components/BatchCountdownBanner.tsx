"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import type { Company } from "@/lib/types";

type BatchStatusResponse = {
  batch_name: string;
  target_count: number;
  total_listings: number;
  funding_amount: number;
  status: "open" | "countdown" | "completed";
  countdown_started_at: string | null;
  countdown_ends_at: string | null;
  time_remaining_ms: number;
  leading_company: Company | null;
  winner_company: Company | null;
};

// Contenders for simulation demo
const DEMO_CONTENDERS = [
  {
    id: "demo-1",
    slug: "hyperbase-ai",
    company_name: "Hyperbase AI",
    pitch: "Real-time AI database for vector embeddings and search.",
    logo_url: null,
    upvotes_count: 342,
    batch: "Batch 1",
  },
  {
    id: "demo-2",
    slug: "orbit-flow",
    company_name: "Orbit Flow",
    pitch: "Collaborative canvas for distributed engineering workflows.",
    logo_url: null,
    upvotes_count: 338,
    batch: "Batch 1",
  },
  {
    id: "demo-3",
    slug: "pulse-metrics",
    company_name: "Pulse Metrics",
    pitch: "Customer analytics without third-party tracking cookies.",
    logo_url: null,
    upvotes_count: 315,
    batch: "Batch 1",
  },
];

export function BatchCountdownBanner({
  initialTotalListings = 0,
}: {
  initialTotalListings?: number;
}) {
  const [data, setData] = useState<BatchStatusResponse | null>(null);
  const [simMode, setSimMode] = useState<"auto" | "open" | "countdown" | "completed">("auto");
  const [showSimControls, setShowSimControls] = useState(false);

  // Simulation state
  const [simContenders, setSimContenders] = useState(DEMO_CONTENDERS);
  const [simCountdownSeconds, setSimCountdownSeconds] = useState(8 * 3600 - 325); // ~7h 54m left

  // Fetch real status
  useEffect(() => {
    fetch("/api/batch/status")
      .then((r) => r.json())
      .then((res) => {
        if (res && res.status) {
          setData(res);
        }
      })
      .catch(() => {});
  }, []);

  // Timer tick for simulation countdown
  useEffect(() => {
    if (simMode !== "countdown") return;
    const interval = setInterval(() => {
      setSimCountdownSeconds((prev) => {
        if (prev <= 1) {
          setSimMode("completed");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [simMode]);

  // Real countdown timer tick
  useEffect(() => {
    if (simMode !== "auto" || data?.status !== "countdown" || !data.countdown_ends_at) return;
    const interval = setInterval(() => {
      setData((prev) => {
        if (!prev || !prev.countdown_ends_at) return prev;
        const diff = new Date(prev.countdown_ends_at).getTime() - Date.now();
        if (diff <= 0) {
          return { ...prev, status: "completed", time_remaining_ms: 0 };
        }
        return { ...prev, time_remaining_ms: diff };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [simMode, data?.status, data?.countdown_ends_at]);

  // Determine current active mode
  const activeStatus = useMemo(() => {
    if (simMode !== "auto") return simMode;
    return data?.status || "open";
  }, [simMode, data?.status]);

  // Top contender in simulation
  const sortedSimContenders = useMemo(() => {
    return [...simContenders].sort((a, b) => b.upvotes_count - a.upvotes_count);
  }, [simContenders]);

  const currentLeader = useMemo(() => {
    if (simMode !== "auto") {
      return sortedSimContenders[0];
    }
    return data?.leading_company || null;
  }, [simMode, sortedSimContenders, data?.leading_company]);

  // Formatted countdown time
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
    };
  };

  const timeRemainingSeconds = useMemo(() => {
    if (simMode === "countdown") {
      return simCountdownSeconds;
    }
    if (data?.time_remaining_ms) {
      return Math.max(0, Math.floor(data.time_remaining_ms / 1000));
    }
    return 8 * 3600;
  }, [simMode, simCountdownSeconds, data?.time_remaining_ms]);

  const timeParts = formatTime(timeRemainingSeconds);
  const totalListings = simMode === "auto" ? (data?.total_listings ?? initialTotalListings) : 3000;
  const targetCount = 3000;
  const progressPercent = Math.min(100, Math.round((totalListings / targetCount) * 100));

  const handleSimVote = (id: string, delta: number) => {
    setSimContenders((prev) =>
      prev.map((c) => (c.id === id ? { ...c, upvotes_count: Math.max(0, c.upvotes_count + delta) } : c))
    );
  };

  return (
    <section className="batch-milestone-container" aria-label="Batch 1 Milestone & Funding Countdown">
      {/* Simulation / Preview Banner Controls */}
      <div className="sim-toolbar">
        <div className="sim-toolbar-left">
          <span className="sim-badge">
            {simMode === "auto" ? "● PRODUCTION LIVE" : "🧪 PREVIEW SIMULATION"}
          </span>
          <span className="sim-caption">
            {activeStatus === "open" && `Batch 1 Open (${totalListings} / ${targetCount} listed)`}
            {activeStatus === "countdown" && "8-Hour Countdown In Progress — Dynamic Lead Active"}
            {activeStatus === "completed" && "Batch 1 Finalized — Champion Crowned"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowSimControls((p) => !p)}
          className="sim-toggle-btn"
          title="Toggle interactive demo states"
        >
          {showSimControls ? "Hide Preview Controls ▲" : "Preview States (Interactive Demo) ▼"}
        </button>
      </div>

      {showSimControls && (
        <div className="sim-drawer">
          <div className="sim-drawer-content">
            <span className="sim-label">Switch State:</span>
            <div className="sim-btn-group">
              <button
                type="button"
                className={`sim-choice-btn ${simMode === "auto" ? "is-active" : ""}`}
                onClick={() => setSimMode("auto")}
              >
                Production Live
              </button>
              <button
                type="button"
                className={`sim-choice-btn ${simMode === "open" ? "is-active" : ""}`}
                onClick={() => setSimMode("open")}
              >
                1. Batch 1 Open
              </button>
              <button
                type="button"
                className={`sim-choice-btn ${simMode === "countdown" ? "is-active" : ""}`}
                onClick={() => {
                  setSimMode("countdown");
                  setSimCountdownSeconds(8 * 3600 - 325);
                }}
              >
                2. 8-Hour Countdown Running
              </button>
              <button
                type="button"
                className={`sim-choice-btn ${simMode === "completed" ? "is-active" : ""}`}
                onClick={() => setSimMode("completed")}
              >
                3. Countdown Over (Winner Finalized)
              </button>
            </div>
          </div>

          {activeStatus === "countdown" && (
            <div className="sim-vote-tester">
              <span className="sim-sublabel">
                Test Lead Shifts: In countdown, any startup with more upvotes instantly takes the #1 winning lead:
              </span>
              <div className="sim-contenders-row">
                {simContenders.map((c) => {
                  const isLead = currentLeader?.id === c.id;
                  return (
                    <div key={c.id} className={`sim-contender-chip ${isLead ? "is-lead" : ""}`}>
                      <span className="contender-name">
                        {isLead && "👑 "}
                        {c.company_name}
                      </span>
                      <strong className="contender-votes">{c.upvotes_count} votes</strong>
                      <div className="contender-actions">
                        <button
                          type="button"
                          onClick={() => handleSimVote(c.id, 5)}
                          className="vote-add-btn"
                          title="Add 5 votes to test lead shift"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSimVote(c.id, 1)}
                          className="vote-add-btn"
                          title="Add 1 vote"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE 1: BATCH 1 OPEN & FILLING */}
      {activeStatus === "open" && (
        <div className="milestone-card milestone-open">
          <div className="milestone-header">
            <div className="milestone-badge-row">
              <span className="pill pill-batch">Batch 1</span>
              <span className="pill pill-gold" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <span>💰</span>
                <span>$30,000 Equity-Free Funding</span>
              </span>
              <span className="pill" style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
                3,000 Spots Total
              </span>
            </div>
            <div className="milestone-title-wrap">
              <h3 className="milestone-title">Batch 1 Milestone Countdown</h3>
              <p className="milestone-desc">
                When Batch 1 reaches <strong>3,000 listed startups</strong>, an <strong>8-hour countdown</strong> automatically begins. The startup with the most community upvotes when the timer expires wins <strong>$30,000 in equity-free funding</strong> and the permanent Champion badge.
              </p>
            </div>
          </div>

          <div className="milestone-progress-section">
            <div className="progress-labels">
              <span>
                <strong>{totalListings.toLocaleString()}</strong> of {targetCount.toLocaleString()} startups listed
              </span>
              <span className="spots-left">
                <strong>{(targetCount - totalListings).toLocaleString()}</strong> spots remaining
              </span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.max(1, progressPercent)}%` }}
              />
            </div>
          </div>

          <div className="milestone-footer-action">
            <span className="milestone-note">
              Every upvote counts towards the $30,000 prize. Upvotes stay active and carry over into the countdown.
            </span>
            <Link href="/add" className="apply-btn" style={{ height: "36px", padding: "0 18px", fontSize: "13px" }}>
              List your startup in Batch 1 →
            </Link>
          </div>
        </div>
      )}

      {/* STATE 2: 8-HOUR COUNTDOWN ACTIVE */}
      {activeStatus === "countdown" && (
        <div className="milestone-card milestone-countdown">
          <div className="countdown-glow-bar" />
          <div className="countdown-inner">
            <div className="countdown-top-row">
              <div className="countdown-indicator">
                <span className="pulsing-dot" />
                <span className="countdown-heading-tag">BATCH 1 COUNTDOWN ACTIVE</span>
              </div>
              <span className="countdown-prize-pill">
                🏆 Winner Receives $30,000 Equity-Free
              </span>
            </div>

            <div className="countdown-main-grid">
              {/* Ticking Clock */}
              <div className="countdown-timer-box">
                <span className="timer-label">TIME REMAINING TILL WINNER FINALIZED</span>
                <div className="timer-digits-row">
                  <div className="timer-digit-block">
                    <span className="timer-number">{timeParts.hours}</span>
                    <span className="timer-unit">HOURS</span>
                  </div>
                  <span className="timer-sep">:</span>
                  <div className="timer-digit-block">
                    <span className="timer-number">{timeParts.minutes}</span>
                    <span className="timer-unit">MINS</span>
                  </div>
                  <span className="timer-sep">:</span>
                  <div className="timer-digit-block">
                    <span className="timer-number">{timeParts.seconds}</span>
                    <span className="timer-unit">SECS</span>
                  </div>
                </div>
                <p className="timer-subtext">
                  Votes are live. The company leading when the clock hits 00:00:00 wins automatically.
                </p>
              </div>

              {/* Dynamic Leader Box */}
              <div className="countdown-leader-box">
                <div className="leader-box-header">
                  <span className="leader-pill">👑 CURRENT #1 LEADER</span>
                  <span className="leader-live-tag">Live Standing</span>
                </div>

                {currentLeader ? (
                  <div className="leader-card-body">
                    <div className="leader-info">
                      <div className="leader-avatar">
                        {currentLeader.company_name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="leader-details">
                        <Link
                          href={`/companies/${currentLeader.slug || currentLeader.id}`}
                          className="leader-name-link"
                        >
                          {currentLeader.company_name}
                        </Link>
                        <p className="leader-pitch">
                          {currentLeader.pitch}
                        </p>
                      </div>
                    </div>

                    <div className="leader-vote-stat">
                      <div className="vote-stat-num">
                        <span className="vote-arrow">▲</span>
                        <span>{currentLeader.upvotes_count || 0}</span>
                      </div>
                      <span className="vote-stat-label">Total Upvotes</span>
                    </div>
                  </div>
                ) : (
                  <div className="leader-empty">
                    <span>Vote for your favorite startup to take the lead!</span>
                  </div>
                )}

                <div className="leader-dynamic-notice">
                  ⚡ <strong>Dynamic Lead:</strong> If another startup overtakes with more upvotes before the timer runs out, they immediately take the winning position.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: COUNTDOWN COMPLETED / WINNER CROWNED */}
      {activeStatus === "completed" && (
        <div className="milestone-card milestone-winner">
          <div className="winner-confetti-accent" />
          <div className="winner-inner">
            <div className="winner-badge-pill">
              <span>🏆 OFFICIAL BATCH 1 CHAMPION FINALIZED</span>
            </div>

            <h3 className="winner-title">
              Congratulations to the Batch 1 Winner!
            </h3>
            <p className="winner-subtitle">
              The 8-hour countdown has concluded. The highest upvoted startup in Batch 1 has won the <strong>$30,000 Equity-Free Grant</strong> and the permanent Champion designation.
            </p>

            {currentLeader && (
              <div className="winner-spotlight-card">
                <div className="winner-avatar">
                  {currentLeader.company_name.slice(0, 1).toUpperCase()}
                </div>
                <div className="winner-info">
                  <div className="winner-tag-row">
                    <span className="pill pill-gold" style={{ fontWeight: 700 }}>
                      🏆 Batch 1 Winner • $30,000 Equity-Free
                    </span>
                    <span className="pill pill-batch">Batch 1</span>
                  </div>
                  <h4 className="winner-comp-name">{currentLeader.company_name}</h4>
                  <p className="winner-comp-pitch">{currentLeader.pitch}</p>
                </div>
                <div className="winner-final-votes">
                  <span className="winner-votes-number">▲ {currentLeader.upvotes_count}</span>
                  <span className="winner-votes-text">Winning Upvotes</span>
                </div>
              </div>
            )}

            <div className="winner-next-batch">
              <span>🚀 <strong>Batch 2 is opening soon:</strong> Submit your startup early to secure your priority spot for the next milestone.</span>
              <Link href="/add" className="apply-btn" style={{ height: "36px", padding: "0 18px", fontSize: "13px" }}>
                Add your startup for Batch 2 →
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
