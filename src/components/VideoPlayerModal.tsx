import { useRef, useState, useEffect, useCallback } from "react";
import { Box, Modal } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import FullscreenIcon from "@mui/icons-material/Fullscreen";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayerModal({
  open,
  src,
  onClose,
}: {
  open: boolean;
  src: string;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRaf = useCallback(() => {
    const tick = () => {
      const v = videoRef.current;
      if (!v) return;
      const pct = v.duration ? (v.currentTime / v.duration) * 100 : 0;
      if (trackRef.current) trackRef.current.style.width = `${pct}%`;
      if (thumbRef.current) thumbRef.current.style.left = `${pct}%`;
      if (timeRef.current) timeRef.current.textContent = `${fmt(v.currentTime)} / ${fmt(v.duration || 0)}`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  useEffect(() => {
    if (!open) { stopRaf(); return; }
    setPlaying(false);
    setLoading(true);
    setControlsVisible(true);
    return () => {
      stopRaf();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [open, stopRaf]);

  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2500);
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
    resetHideTimer();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    resetHideTimer();
  };

  const handleFullscreen = () => {
    videoRef.current?.requestFullscreen?.();
    resetHideTimer();
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const bar = e.currentTarget;
    if (!v || !v.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
    resetHideTimer();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        onClick={onClose}
        onMouseMove={resetHideTimer}
        sx={{
          position: "fixed", inset: 0,
          bgcolor: "#000",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {/* 닫기 */}
        <Box
          onClick={onClose}
          sx={{
            position: "absolute", top: 16, right: 16,
            width: 36, height: 36, borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: 10,
            "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
          }}
        >
          <CloseIcon sx={{ color: "#fff", fontSize: 18 }} />
        </Box>

        {/* 피젯 스피너 — 로딩 중에만 표시 */}
        {loading && (
          <Box
            sx={{
              position: "absolute",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 5, pointerEvents: "none",
            }}
          >
            <Box
              sx={{
                width: 48, height: 48,
                borderRadius: "50%",
                border: "4px solid rgba(255,255,255,0.15)",
                borderTopColor: "#fff",
                animation: "spin 0.8s linear infinite",
                "@keyframes spin": { to: { transform: "rotate(360deg)" } },
              }}
            />
          </Box>
        )}

        {/* 비디오 + 컨트롤 */}
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {open && (
            <video
              ref={videoRef}
              src={src}
              autoPlay
              onClick={togglePlay}
              onLoadedMetadata={() => {
                setDuration(videoRef.current?.duration ?? 0);
                setLoading(false);
              }}
              onCanPlay={() => setLoading(false)}
              onWaiting={() => setLoading(true)}
              onPlaying={() => setLoading(false)}
              onPlay={() => { setPlaying(true); startRaf(); resetHideTimer(); }}
              onPause={() => { setPlaying(false); stopRaf(); }}
              onEnded={() => { setPlaying(false); stopRaf(); }}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                cursor: "pointer",
                outline: "none",
              }}
            />
          )}

          {/* 컨트롤 바 */}
          <Box
            sx={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              px: "12px", pt: "20px", pb: "10px",
              background: "linear-gradient(transparent, rgba(0,0,0,0.55))",
              display: "flex", flexDirection: "column", gap: "4px",
              opacity: controlsVisible ? 1 : 0,
              transition: "opacity 0.3s",
              pointerEvents: controlsVisible ? "auto" : "none",
            }}
          >
            {/* 시크 바 */}
            <Box
              onClick={handleTrackClick}
              sx={{ position: "relative", width: "100%", height: 14, display: "flex", alignItems: "center", cursor: "pointer" }}
            >
              <Box sx={{ position: "absolute", left: 0, right: 0, height: 3, borderRadius: 2, bgcolor: "rgba(255,255,255,0.25)" }} />
              <Box ref={trackRef} sx={{ position: "absolute", left: 0, width: "0%", height: 3, borderRadius: 2, bgcolor: "#fff", pointerEvents: "none" }} />
              <Box
                ref={thumbRef}
                sx={{ position: "absolute", left: "0%", transform: "translateX(-50%)", width: 10, height: 10, borderRadius: "50%", bgcolor: "#fff", pointerEvents: "none" }}
              />
            </Box>

            {/* 버튼 행 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Box onClick={togglePlay} sx={{ cursor: "pointer", display: "flex", p: "4px", borderRadius: "50%", "&:hover": { bgcolor: "rgba(255,255,255,0.12)" } }}>
                {playing ? <PauseIcon sx={{ color: "#fff", fontSize: 18 }} /> : <PlayArrowIcon sx={{ color: "#fff", fontSize: 18 }} />}
              </Box>
              <Box onClick={toggleMute} sx={{ cursor: "pointer", display: "flex", p: "4px", borderRadius: "50%", "&:hover": { bgcolor: "rgba(255,255,255,0.12)" } }}>
                {muted ? <VolumeOffIcon sx={{ color: "#fff", fontSize: 16 }} /> : <VolumeUpIcon sx={{ color: "#fff", fontSize: 16 }} />}
              </Box>
              <Box sx={{ flex: 1 }} />
              <Box component="span" ref={timeRef} sx={{ color: "rgba(255,255,255,0.65)", fontSize: 11, lineHeight: 1, fontFamily: "monospace" }}>
                {`0:00 / ${fmt(duration)}`}
              </Box>
              <Box onClick={handleFullscreen} sx={{ cursor: "pointer", display: "flex", p: "4px", borderRadius: "50%", "&:hover": { bgcolor: "rgba(255,255,255,0.12)" } }}>
                <FullscreenIcon sx={{ color: "#fff", fontSize: 16 }} />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
