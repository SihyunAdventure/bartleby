import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import ReactMarkdown from "react-markdown";
import type { MeetingSession, FinalSummary } from "./types";
import { formatDuration, formatRelativeDay, formatTime } from "./types";
import Segmented from "../components/Segmented";
import AudioPlayer from "./AudioPlayer";
import { loadPrefs } from "../settings/prefs";
import { trackNoteGenerated } from "../analytics/analytics";
import styles from "./SessionDetail.module.css";

interface Props {
  session: MeetingSession;
  onBack: () => void;
  /** Phase 5 S3 — when finalize returns we lift the summary back into the
   *  parent's `sessions` state so it persists to localStorage. */
  onSessionUpdate: (s: MeetingSession) => void;
}

type FinalizeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; summary: FinalSummary }
  | { status: "error"; msg: string };

export default function SessionDetail({
  session,
  onBack,
  onSessionUpdate,
}: Props) {
  const [finalize, setFinalize] = useState<FinalizeState>(
    session.finalSummary
      ? { status: "ok", summary: session.finalSummary }
      : { status: "idle" }
  );
  const [middleView, setMiddleView] = useState<"outline" | "onepager">(
    "outline"
  );
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [highlightRange, setHighlightRange] = useState<
    [number, number] | null
  >(null);
  const utteranceRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  // Guard against StrictMode double-mount + Strict-mode-friendly: only one
  // finalize per session per SessionDetail lifecycle.
  const flightedFor = useRef<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function copyText(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1200);
    } catch (e) {
      console.warn("[copy] failed:", e);
    }
  }

  function outlineAsMarkdown(): string {
    if (!summary) return "";
    const parts: string[] = [];
    if (summary.quote) parts.push(`> ${summary.quote}`, "");
    if (summary.tldr) parts.push(summary.tldr, "");
    for (const c of summary.outline) {
      parts.push(`## ${c.topic_title}`, "");
      for (const b of c.bullets) parts.push(`- ${b}`);
      parts.push("");
    }
    return parts.join("\n").trim();
  }

  function onepagerAsMarkdown(): string {
    if (!summary) return "";
    const parts: string[] = [];
    if (summary.quote) parts.push(`> ${summary.quote}`, "");
    parts.push(summary.onepager);
    return parts.join("\n").trim();
  }

  function transcriptAsText(): string {
    return session.transcript
      .map((u) => `[${u.time}] ${u.speaker}: ${u.enText}`)
      .join("\n");
  }

  // Auto-finalize on first mount if missing and we actually have content.
  useEffect(() => {
    if (session.finalSummary) {
      setFinalize({ status: "ok", summary: session.finalSummary });
      return;
    }
    if (flightedFor.current === session.id) return;
    if (session.transcript.length === 0) return;
    if (!loadPrefs().auto_summarize) return;
    flightedFor.current = session.id;
    void runFinalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  async function runFinalize() {
    setFinalize({ status: "loading" });
    try {
      const result = await invoke<Omit<FinalSummary, "generatedAt">>(
        "finalize_session",
        { transcript: session.transcript, providerMode: loadPrefs().provider_mode }
      );
      const stamped: FinalSummary = {
        ...result,
        generatedAt: new Date().toISOString(),
      };
      setFinalize({ status: "ok", summary: stamped });
      trackNoteGenerated();
      onSessionUpdate({ ...session, finalSummary: stamped });
    } catch (e) {
      setFinalize({ status: "error", msg: String(e) });
    }
  }

  function handleOutlineClick(range: number[]) {
    if (range.length !== 2) return;
    if (range[0] === 0 && range[1] === 0) return;
    setTranscriptOpen(true);
    setHighlightRange([range[0], range[1]]);
    requestAnimationFrame(() => {
      const el = utteranceRefs.current.get(range[0]);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    window.setTimeout(() => setHighlightRange(null), 1500);
  }

  const day = formatRelativeDay(session.startedAt);
  const start = formatTime(session.startedAt);
  const dur = formatDuration(session.durationSec);

  const summary = finalize.status === "ok" ? finalize.summary : null;
  const middleHasContent =
    !!summary &&
    (summary.outline.length > 0 || summary.onepager.trim().length > 0);

  return (
    <div className={styles.shell}>
      <div className={styles.toolbar}>
        <button className="btn btn-ghost" onClick={onBack}>
          ← Back
        </button>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{session.title}</h1>
          <div className={styles.eyebrow}>
            {day} · {start} · {dur} · {session.transcript.length} utterances
          </div>
        </div>
      </div>
      <hr className="hr" />

      <div className={styles.body}>
        {/* Top — Quote + TL;DR */}
        <section className={styles.topRow}>
          {finalize.status === "loading" && (
            <p className={styles.loading}>
              <em>
                Bartleby is finalising the note, would prefer not to be hurried.
              </em>
            </p>
          )}
          {finalize.status === "error" && (
            <p className={styles.errorRow}>
              <span>Finalize failed — {finalize.msg}</span>
              <button
                className="btn btn-ghost"
                onClick={runFinalize}
                style={{ marginLeft: 8 }}
              >
                Regenerate
              </button>
            </p>
          )}
          {finalize.status === "idle" &&
            !summary &&
            session.transcript.length > 0 && (
              <button className="btn" onClick={runFinalize}>
                Generate note
              </button>
            )}
          {summary?.quote && (
            <blockquote className={styles.quote}>{summary.quote}</blockquote>
          )}
          {summary?.tldr && <p className={styles.tldr}>{summary.tldr}</p>}
        </section>

        {/* Middle — Outline ⇄ One-pager */}
        {middleHasContent && summary && (
          <section className={styles.middleSection}>
            <div className={styles.middleHeader}>
              <Segmented
                options={[
                  { value: "outline", label: "Outline" },
                  { value: "onepager", label: "One-pager" },
                ]}
                value={middleView}
                onChange={(v) => setMiddleView(v)}
              />
              <div className={styles.middleHeaderRight}>
                {summary.generatedAt && (
                  <span className={styles.generatedAt}>
                    Bartleby · {new Date(summary.generatedAt).toLocaleTimeString(
                      "en-US",
                      { hour: "2-digit", minute: "2-digit", hour12: false }
                    )}
                  </span>
                )}
                <button
                  className={styles.copyBtn}
                  onClick={() =>
                    copyText(
                      middleView,
                      middleView === "outline"
                        ? outlineAsMarkdown()
                        : onepagerAsMarkdown()
                    )
                  }
                  title={`${middleView === "outline" ? "Outline" : "One-pager"} 복사`}
                >
                  {copiedKey === middleView ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>
            {middleView === "outline" ? (
              <div className={styles.outline}>
                {summary.outline.length === 0 ? (
                  <p className={styles.empty}>
                    <em>Bartleby found no organising theme.</em>
                  </p>
                ) : (
                  summary.outline.map((c, i) => {
                    const jumpable =
                      c.ref_utterance_ids.length === 2 &&
                      !(
                        c.ref_utterance_ids[0] === 0 &&
                        c.ref_utterance_ids[1] === 0
                      );
                    return (
                      <article key={i} className={styles.outlineChunk}>
                        <h3
                          className={styles.outlineTitle}
                          data-jumpable={jumpable ? "true" : "false"}
                          onClick={
                            jumpable
                              ? () => handleOutlineClick(c.ref_utterance_ids)
                              : undefined
                          }
                          title={
                            jumpable
                              ? "transcript 의 해당 위치로 이동"
                              : undefined
                          }
                        >
                          {c.topic_title}
                        </h3>
                        <ul className={styles.outlineBullets}>
                          {c.bullets.map((b, j) => (
                            <li key={j}>{b}</li>
                          ))}
                        </ul>
                      </article>
                    );
                  })
                )}
              </div>
            ) : (
              <div className={styles.onepager}>
                {summary.onepager.trim() ? (
                  <ReactMarkdown>{summary.onepager}</ReactMarkdown>
                ) : (
                  <p className={styles.empty}>
                    <em>Bartleby preferred not to compose a narrative.</em>
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Audio player — sys + mic Opus segments, asset:// served */}
        <section className={styles.transcriptSection}>
          <div className={styles.transcriptHeader}>
            <span className={styles.transcriptToggle} aria-disabled="true">
              ◷ Audio
            </span>
          </div>
          <AudioPlayer audioDir={session.stats.audio_dir ?? ""} />
        </section>

        {/* Bottom — Transcript collapsible */}
        <section className={styles.transcriptSection}>
          <div className={styles.transcriptHeader}>
            <button
              className={styles.transcriptToggle}
              onClick={() => setTranscriptOpen((v) => !v)}
              aria-expanded={transcriptOpen}
            >
              {transcriptOpen ? "▾" : "▸"} Full transcript (
              {session.transcript.length})
            </button>
            {session.transcript.length > 0 && (
              <button
                className={styles.copyBtn}
                onClick={() => copyText("transcript", transcriptAsText())}
                title="Transcript 복사"
              >
                {copiedKey === "transcript" ? "Copied ✓" : "Copy"}
              </button>
            )}
          </div>
          {transcriptOpen && (
            <div className={styles.transcript}>
              {session.transcript.length === 0 ? (
                <p className={styles.empty}>
                  <em>
                    Bartleby was listening, would prefer not to speak.
                  </em>
                </p>
              ) : (
                session.transcript.map((u) => {
                  const inRange =
                    !!highlightRange &&
                    u.id >= highlightRange[0] &&
                    u.id <= highlightRange[1];
                  return (
                    <div
                      key={u.id}
                      ref={(el) => {
                        if (el) utteranceRefs.current.set(u.id, el);
                        else utteranceRefs.current.delete(u.id);
                      }}
                      className="tbl-utt"
                      data-highlight={inRange ? "true" : undefined}
                    >
                      <div className="ts tabular">{u.time}</div>
                      <div>
                        <div className="speaker">{u.speaker}</div>
                        <div
                          className={`speech${
                            u.speaker === "user" ? " kr" : ""
                          }`}
                        >
                          {u.enText}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
