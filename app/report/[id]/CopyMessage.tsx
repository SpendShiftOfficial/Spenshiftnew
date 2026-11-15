"use client";

import { useState } from "react";
import styles from "./simple-report.module.css";

export default function CopyMessage({ message }: { message: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <button type="button" className={styles.copyButton} onClick={copy}>
      {copied ? "Copied — paste into a message" : "Copy this message"}
    </button>
  );
}
