import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Square, Loader2, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '/api';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function VoiceRecorder({ onResult, language = 'en' }) {
  const token = useAuthStore((s) => s.token);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = useCallback(async () => {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunksRef.current.length === 0) { setError('No audio recorded.'); return; }
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await sendToTranscribe(blob);
      };
      mr.start(250);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permissions.');
    }
  }, [token, language]);

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const sendToTranscribe = async (blob) => {
    setIsProcessing(true);
    try {
      const audio_base64 = await blobToBase64(blob);
      const res = await fetch(`${API}/ai/transcribe/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ audio_base64, language, generate_notes: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Transcription failed');
      setResult(data);
      onResult?.(data);
      toast.success('Voice transcribed successfully');
    } catch (err) {
      setError(err.message || 'Transcription failed. Ensure OPENAI_API_KEY is set.');
    } finally {
      setIsProcessing(false);
    }
  };

  const fmtDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Mic className="h-4 w-4 text-teal-600" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Voice-to-Medical-Notes</h3>
        <span className="ml-auto text-xs text-slate-400">Powered by Whisper AI</span>
      </div>

      <div className="p-4">
        {/* Recorder Controls */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60">
          {!isRecording && !isProcessing ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 h-10 px-5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors"
            >
              <Mic className="h-4 w-4" /> Start Recording
            </button>
          ) : isRecording ? (
            <>
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-mono text-red-600 dark:text-red-400">{fmtDuration(duration)}</span>
              <span className="text-xs text-slate-500">Recording…</span>
              <button
                type="button"
                onClick={stopRecording}
                className="ml-auto flex items-center gap-2 h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                <Square className="h-3.5 w-3.5" /> Stop
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-teal-600" /> Transcribing…
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs font-semibold text-green-700 dark:text-green-400">Transcription Complete</span>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs font-semibold text-slate-500 mb-1">Raw Transcription</p>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{result.transcription}</p>
            </div>

            {result.medical_notes && (
              <div className="rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20 p-3 space-y-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <FileText className="h-3.5 w-3.5 text-teal-600" />
                  <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">AI Generated SOAP Notes</p>
                </div>
                {['subjective', 'objective', 'assessment', 'plan'].map((field) =>
                  result.medical_notes[field] ? (
                    <div key={field}>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-teal-600 dark:text-teal-400">{field}</p>
                      <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">{result.medical_notes[field]}</p>
                    </div>
                  ) : null
                )}
                <p className="text-[10px] text-amber-600 dark:text-amber-400 border-t border-teal-200 dark:border-teal-800 pt-2 mt-2">
                  ⚠️ AI Generated — Clinician must review before adding to patient record.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
