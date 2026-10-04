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

export function BatchCountdownBanner({
  initialTotalListings = 0,
}: {
  initialTotalListings?: number;
}) {
  const [data, setData] = useState<BatchStatusResponse | null>(null);

  // Fetch real status from API
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

  // Real countdown timer tick when countdown is active
  useEffect(() => {
    if (data?.status !== "countdown" || !data.countdown_ends_at) return;
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
  }, [data?.status, data?.countdown_ends_at]);

  const activeStatus = data?.status || "open";
  const currentLeader =
    activeStatus === "completed"
      ? data?.winner_company || data?.leading_company || null
      : data?.leading_company || null;

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
    if (data?.time_remaining_ms) {
      return Math.max(0, Math.floor(data.time_remaining_ms / 1000));
    }
    return 8 * 3600;
  }, [data?.time_remaining_ms]);

  const timeParts = formatTime(timeRemainingSeconds);
  const totalListings = data?.total_listings ?? initialTotalListings;
  const targetCount = data?.target_count ?? 3000;
  const progressPercent = Math.min(100, Math.round((totalListings / targetCount) * 100));

  return (
    <section className="batch-milestone-container" aria-label="Batch 1 Milestone and Funding Countdown">
      {/* STATE 1: BATCH 1 OPEN & FILLING */}
      {activeStatus === "open" && (
        <div className="milestone-card milestone-open">
          <div className="milestone-header">
            <div className="milestone-badge-row">
              <span className="pill pill-batch">Batch 1</span>
              <span className="pill pill-gold" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <span>💰</span>
                <span>$30,000 Equity-Free Milestone Grant</span>
              </span>
              <span className="pill" style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
                3,000 Spots Total
              </span>
            </div>
            <div className="milestone-title-wrap">
              <h3 className="milestone-title">Batch 1 Milestone & Founder Discovery</h3>
              <p className="milestone-desc">
                List your startup to gain valuable dofollow backlinks, reach early customers, and connect with angel investors. Once Batch 1 reaches <strong>3,000 listed startups</strong>, an 8-hour community countdown begins and the top-voted startup receives <strong>$30,000 in equity-free funding</strong>.
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
              Every upvote counts toward community ranking. Upvotes remain active and carry directly into the countdown.
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
