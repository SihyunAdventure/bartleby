// Product analytics for the Bartleby macOS app (PostHog).
//
// PRIVACY CONTRACT — this app records meetings. NOTHING about meeting
// content may ever reach PostHog: no audio, no transcript, no summary, no
// meeting title, no API keys. This module enforces that structurally —
// call sites cannot pass free-form properties. Each tracked event is a
// dedicated function that builds its own safe, enumerated properties from
// preferences only. If you need a new event, add a new function here; never
// add a generic `track(name, props)` escape hatch.
//
// The project API key below is a PUBLIC key (safe to ship in the binary; it
// only allows event ingestion). It is hardcoded rather than read from
// import.meta.env so production `tauri build` can't silently ship without it.
import posthog from "posthog-js";
import { getVersion } from "@tauri-apps/api/app";
import { loadPrefs, type ProviderMode, type AppLanguage } from "../settings/prefs";

const POSTHOG_KEY = "phc_zGxcMQbRAsX6rhTesDGwBJ5KEsp7JuVj7y7Nx8gHmCgC";
const POSTHOG_HOST = "https://us.i.posthog.com";

let started = false;

function keyIsReal(): boolean {
  return !!POSTHOG_KEY && POSTHOG_KEY.indexOf("REPLACE") === -1;
}

/** Boot PostHog once on app start. Safe to call before the key is set
 *  (no-ops) and respects the user's opt-out preference. */
export async function initAnalytics(): Promise<void> {
  if (started || !keyIsReal()) return;
  started = true;

  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      defaults: "2025-05-24",
      person_profiles: "identified_only",
      // Desktop app: capture ONLY the explicit events below. Autocapture and
      // pageviews would scrape DOM text (meeting titles in Sidebar/Library),
      // so they stay off. Session recording is never enabled.
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      disable_surveys: true,
      // Honour the OS/browser Do-Not-Track signal in addition to our toggle.
      respect_dnt: true,
    });

    // Reflect the saved opt-out state immediately.
    if (!loadPrefs().analytics_enabled) {
      posthog.opt_out_capturing();
    }

    // App version as a super property on every event (no PII).
    try {
      const version = await getVersion();
      posthog.register({ app_version: version });
    } catch {
      // getVersion only resolves inside the Tauri runtime; ignore in dev web.
    }
  } catch {
    // Never let analytics break app startup.
    started = false;
  }
}

/** Toggle capturing at runtime when the Settings switch changes. */
export function setAnalyticsEnabled(enabled: boolean): void {
  if (!keyIsReal()) return;
  try {
    if (enabled) posthog.opt_in_capturing();
    else posthog.opt_out_capturing();
  } catch {
    // ignore
  }
}

function capture(event: string, props: Record<string, string | number>): void {
  if (!started || !keyIsReal()) return;
  try {
    posthog.capture(event, props);
  } catch {
    // ignore
  }
}

function providerMode(): ProviderMode {
  return loadPrefs().provider_mode;
}

// Bucket raw seconds so we learn session-length distribution without storing
// a precise fingerprint of any single meeting.
function durationBucket(sec: number): string {
  if (sec < 60) return "lt_1m";
  if (sec < 5 * 60) return "1_5m";
  if (sec < 15 * 60) return "5_15m";
  if (sec < 30 * 60) return "15_30m";
  if (sec < 60 * 60) return "30_60m";
  return "gt_60m";
}

// ── Tracked events (the complete, allowed set) ──────────────────────────────

export function trackAppOpened(): void {
  capture("app_opened", { provider_mode: providerMode() });
}

export function trackOnboardingCompleted(language: AppLanguage): void {
  capture("onboarding_completed", {
    language,
    provider_mode: providerMode(),
  });
}

export function trackRecordingStarted(): void {
  capture("recording_started", { provider_mode: providerMode() });
}

export function trackRecordingStopped(durationSec: number): void {
  capture("recording_stopped", {
    duration_bucket: durationBucket(durationSec),
    provider_mode: providerMode(),
  });
}

export function trackNoteGenerated(): void {
  capture("note_generated", { provider_mode: providerMode() });
}
