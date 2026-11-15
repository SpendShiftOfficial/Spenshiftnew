"use client";

import { useState, type FormEvent } from "react";
import styles from "./simple-report.module.css";

type Rating = "helpful" | "needs_work";

export default function ReportFeedback({ reportId }: { reportId: string }) {
  const demo = reportId.startsWith("demo-");
  const [rating, setRating] = useState<Rating | "">("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rating || sending || sent) return;
    setError("");
    if (demo) {
      setError("This is a sample report. No feedback was sent.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/report-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, rating, comment: comment.trim() }),
      });
      const payload = await response.json();
      if (!response.ok || payload.ok !== true) {
        throw new Error(payload.error || "We couldn't send your feedback. Please try again.");
      }
      setSent(true);
      setComment("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't send your feedback. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className={styles.feedback} aria-labelledby="report-feedback-title">
      <h2 id="report-feedback-title">How was your plan?</h2>
      {sent ? (
        <p className={styles.feedbackThanks} role="status">Thanks for your feedback. It helps us improve SpendShift.</p>
      ) : (
        <>
          <p>Good or bad, we'd love to hear what you think.</p>
          <form onSubmit={submit} className={styles.feedbackForm}>
            <fieldset className={styles.feedbackChoices}>
              <legend>Was this helpful?</legend>
              <label>
                <input type="radio" name="report-feedback" value="helpful" checked={rating === "helpful"}
                  onChange={() => setRating("helpful")} />
                <span>Helpful</span>
              </label>
              <label>
                <input type="radio" name="report-feedback" value="needs_work" checked={rating === "needs_work"}
                  onChange={() => setRating("needs_work")} />
                <span>Needs work</span>
              </label>
            </fieldset>
            <label className={styles.feedbackComment} htmlFor="report-feedback-comment">
              Tell us more (optional)
              <textarea id="report-feedback-comment" rows={3} maxLength={600} value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="What was good, or what could we do better?" />
            </label>
            <p className={styles.feedbackPrivacy}>Please don't share bank or account details. Your feedback is private. We won't publish it without asking you first.</p>
            <button className={styles.feedbackSend} type="submit" disabled={!rating || sending}>
              {sending ? "Sending..." : "Send feedback"}
            </button>
            {error && <p className={styles.feedbackError} role="alert">{error}</p>}
          </form>
        </>
      )}
    </section>
  );
}
