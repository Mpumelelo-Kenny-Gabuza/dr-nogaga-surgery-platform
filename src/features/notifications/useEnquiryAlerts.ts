import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/features/toast/useToast";
import type { Database } from "@/types/database.types";

type EnquiryRow = Database["public"]["Tables"]["enquiries"]["Row"];

const MUTE_KEY = "admin:enquiry-alerts-muted";

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    // Private-browsing/storage-blocked — default to sound on rather than
    // fail the whole alert over a per-viewer convenience setting.
    return false;
  }
}

function writeMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Same as above — losing the saved preference is fine, it just resets
    // to "on" next visit rather than breaking anything.
  }
}

/**
 * A short two-tone chime, synthesized with the Web Audio API rather than
 * shipped as an audio file — nothing to license, host, or go missing from
 * the build. Failures here (an unsupported browser, or the autoplay
 * restriction every browser applies before the person has interacted with
 * the page at all) are swallowed on purpose: the toast below still fires
 * either way, so a missing chime is a quieter miss, not a broken alert.
 */
function playChime() {
  try {
    // Unprefixed AudioContext has been available in every browser this
    // project otherwise supports for years now — no webkit-prefixed
    // fallback needed (and skipping it avoids reaching for `any`).
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;

      const start = now + i * 0.14;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });

    setTimeout(() => ctx.close(), 700);
  } catch {
    // See comment above — never let this block the toast.
  }
}

/**
 * Subscribes to real INSERTs on public.enquiries (migration
 * 20261007090000_realtime_enquiries.sql) for as long as the calling
 * component — AdminLayout, so it's active across every admin page — stays
 * mounted. RLS decides what this connection actually receives; see that
 * migration's header for why that's safe to rely on here, same as every
 * other read in this app.
 */
export function useEnquiryAlerts() {
  const toast = useToast();
  const [muted, setMutedState] = useState(readMuted);
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-enquiry-alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "enquiries" },
        (payload) => {
          const row = payload.new as EnquiryRow;
          if (!mutedRef.current) playChime();
          toast.show(
            "success",
            `New enquiry from ${row.first_name} ${row.surname} (${row.reference})`
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // toast.show is stable (useCallback, see ToastProvider.tsx) — this
    // subscribes exactly once per AdminLayout mount, not once per toast.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setMuted(next: boolean) {
    setMutedState(next);
    writeMuted(next);
  }

  return { muted, setMuted };
}
