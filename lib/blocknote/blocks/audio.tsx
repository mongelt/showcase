import { createReactBlockSpec } from "@blocknote/react";
import { NodeSelection } from "@tiptap/pm/state";
import { useEffect, useRef, useState } from "react";
import { RiMusic2Line } from "react-icons/ri";

import "./audio.css";

/**
 * Audio Block for BlockNote
 *
 * A custom block that embeds an audio file with a wavesurfer.js waveform player.
 * Supports Cloudinary file upload and direct URL input.
 *
 * Props:
 * - url:     Cloudinary URL or any direct audio URL. Empty = show input form.
 * - caption: Optional text shown below the waveform.
 *
 * Content: "none" — everything is in props; no ProseMirror-managed text.
 *
 * Render states:
 * 1. Input state  (editor, url === "") — URL text input + file upload
 * 2. Editor preview (editor, url !== "") — waveform + controls + invisible
 *    select overlay (required so the formatting toolbar appears on click)
 * 3. Renderer (read-only) — waveform + controls, no overlay
 *
 * wavesurfer is dynamically imported (browser-only API).
 *
 * selectBlock() — mandatory for content:"none" blocks. Without it, clicking
 * the waveform canvas in editor mode never creates a BlockNote selection, so
 * the formatting toolbar never appears. Pattern copied from embed.tsx.
 */
export const createAudio = createReactBlockSpec(
  {
    type: "audio",
    propSchema: {
      url:     { default: "" },
      caption: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => {
      // ── 1. All hooks declared unconditionally (Rules of Hooks) ────────────
      const waveformRef   = useRef<HTMLDivElement>(null);
      const wrapperRef    = useRef<HTMLDivElement>(null);
      const wavesurferRef = useRef<any>(null);
      const lastUrlRef    = useRef<string | null>(null);

      const [waveformReady, setWaveformReady] = useState(false);
      const [isPlaying,    setIsPlaying]      = useState(false);
      const [inputUrl,     setInputUrl]       = useState("");
      const [isUploading,  setIsUploading]    = useState(false);

      // ── 2. selectBlock — creates ProseMirror NodeSelection so toolbar appears
      const selectBlock = (e: React.MouseEvent) => {
        e.stopPropagation();
        const tiptap = (props.editor as any)._tiptapEditor;
        if (!tiptap || !wrapperRef.current) return;
        const view = tiptap.view;
        const pos  = view.posAtDOM(wrapperRef.current, 0);
        if (pos < 1) return;
        const tr = view.state.tr.setSelection(
          NodeSelection.create(view.state.doc, pos - 1)
        );
        view.dispatch(tr);
        view.focus();
      };

      // ── 3. wavesurfer lifecycle ────────────────────────────────────────────
      useEffect(() => {
        const url = props.block.props.url;
        if (!url || typeof window === "undefined") return;

        let isMounted = true;
        setWaveformReady(false);
        setIsPlaying(false);

        const init = async () => {
          // Skip if this URL is already loaded (prevents re-init on unrelated re-renders)
          if (lastUrlRef.current === url && wavesurferRef.current) return;

          const [WaveSurfer, HoverPlugin] = await Promise.all([
            import("wavesurfer.js").then((m) => m.default),
            import("wavesurfer.js/dist/plugins/hover.esm.js").then((m) => m.default),
          ]);

          // Destroy previous instance before creating new one
          if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
            wavesurferRef.current = null;
          }
          if (waveformRef.current) {
            waveformRef.current.innerHTML = "";
          }

          if (!waveformRef.current) return; // guard: container not yet in DOM

          const ws = WaveSurfer.create({
            container:     waveformRef.current,
            waveColor:     "#6B2A2A", // --accent-light
            progressColor: "#A85A5A", // --accent-emerald-300 (played portion)
            cursorColor:   "#1a1a1a",
            barWidth:      2,
            barRadius:     1,
            height:        80,
            normalize:     true,
            plugins: [
              HoverPlugin.create({
                lineColor:       "#6B2A2A",
                lineWidth:       1,
                labelColor:      "#1a1a1a",
                labelBackground: "#E9E3E0",
                labelSize:       11,
              }),
            ],
          });

          ws.on("ready",  () => { if (isMounted) setWaveformReady(true); });
          ws.on("play",   () => { if (isMounted) setIsPlaying(true); });
          ws.on("pause",  () => { if (isMounted) setIsPlaying(false); });
          ws.on("finish", () => { if (isMounted) setIsPlaying(false); });

          await ws.load(url);
          lastUrlRef.current = url;

          if (isMounted) wavesurferRef.current = ws;
          else           ws.destroy();
        };

        init().catch(console.error);

        return () => {
          isMounted = false;
          if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
            wavesurferRef.current = null;
          }
          // Reset so a remount with the same URL creates a fresh instance
          lastUrlRef.current = null;
        };
      }, [props.block.props.url]); // eslint-disable-line react-hooks/exhaustive-deps

      // ── 4. Cloudinary upload ───────────────────────────────────────────────
      const handleUpload = async (file: File) => {
        setIsUploading(true);
        try {
          const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
          const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
          if (!cloudName || !uploadPreset) {
            alert("Upload not configured. Set NEXT_PUBLIC_CLOUDINARY_* env vars.");
            return;
          }
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", uploadPreset);
          const res  = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
            { method: "POST", body: formData }
          );
          const data = await res.json();
          if (data.secure_url) {
            props.editor.updateBlock(props.block, {
              type: "audio",
              props: { url: data.secure_url },
            });
          } else {
            alert("Upload failed — no URL returned.");
          }
        } catch {
          alert("Upload failed. Please try again.");
        } finally {
          setIsUploading(false);
        }
      };

      // ── 5. URL load handler ────────────────────────────────────────────────
      const handleLoadUrl = () => {
        const trimmed = inputUrl.trim();
        if (!trimmed) return;
        props.editor.updateBlock(props.block, {
          type: "audio",
          props: { url: trimmed },
        });
      };

      // ── 6. Playback handlers ───────────────────────────────────────────────
      const handlePlayPause = () => wavesurferRef.current?.playPause();
      const handleStop      = () => {
        wavesurferRef.current?.stop();
        setIsPlaying(false);
      };

      // ── 7. Derived values ──────────────────────────────────────────────────
      const url        = props.block.props.url;
      const caption    = props.block.props.caption;
      const isEditable = props.editor.isEditable;

      // ── 8. Branch 1: Input state ───────────────────────────────────────────
      if (isEditable && !url) {
        return (
          <div className="bn-audio-input-wrapper" contentEditable={false}>
            <RiMusic2Line size={18} className="bn-audio-input-icon" />
            <input
              type="url"
              className="bn-audio-input"
              placeholder="Paste audio URL…"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleLoadUrl();
                }
              }}
              autoFocus
            />
            <button
              type="button"
              className="bn-audio-input-btn"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click
                handleLoadUrl();
              }}
            >
              Load
            </button>
            <label className="bn-audio-upload-btn">
              {isUploading ? "Uploading…" : "Upload"}
              <input
                type="file"
                accept="audio/*"
                style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                disabled={isUploading}
              />
            </label>
          </div>
        );
      }

      // ── 9. Branch 2: Editor preview ────────────────────────────────────────
      if (isEditable) {
        return (
          <div className="bn-audio-block" ref={wrapperRef} contentEditable={false}>
            <div className="bn-audio-waveform" ref={waveformRef} />
            {!waveformReady && (
              <div className="bn-audio-loading">Loading waveform…</div>
            )}
            <div className="bn-audio-controls">
              <button onClick={handlePlayPause} disabled={!waveformReady}>
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button onClick={handleStop} disabled={!waveformReady}>
                Stop
              </button>
            </div>
            {caption && <p className="bn-audio-caption">{caption}</p>}
            {/* Invisible overlay — intercepts waveform canvas clicks so the
                formatting toolbar appears. Controls sit at z-index 6 above it. */}
            <div className="bn-audio-select-overlay" onClick={selectBlock} />
          </div>
        );
      }

      // ── 10. Branch 3: Renderer (read-only) ────────────────────────────────
      return (
        <div className="bn-audio-block" ref={wrapperRef}>
          <div className="bn-audio-waveform" ref={waveformRef} />
          {!waveformReady && (
            <div className="bn-audio-loading">Loading waveform…</div>
          )}
          <div className="bn-audio-controls">
            <button onClick={handlePlayPause} disabled={!waveformReady}>
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button onClick={handleStop} disabled={!waveformReady}>
              Stop
            </button>
          </div>
          {caption && <p className="bn-audio-caption">{caption}</p>}
        </div>
      );
    },
  }
);
