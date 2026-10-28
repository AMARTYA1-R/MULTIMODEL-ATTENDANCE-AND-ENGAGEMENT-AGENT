import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Activity,
  Download,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Send,
  Eye,
  Volume2,
  Camera
} from "lucide-react";

const INITIAL_ROSTER = [
  { id: "STU-101", name: "Aarav Sharma", status: "Present", checkIn: "09:00 AM", engagement: 88, posture: "Focused", affect: "Engaged", alert: null },
  { id: "STU-102", name: "Priya Patel", status: "Present", checkIn: "09:01 AM", engagement: 92, posture: "Upright", affect: "Active", alert: null },
  { id: "STU-103", name: "Rohan Verma", status: "Present", checkIn: "09:03 AM", engagement: 64, posture: "Slouching", affect: "Confused", alert: "Low visual focus" },
  { id: "STU-104", name: "Ananya Nair", status: "Present", checkIn: "08:59 AM", engagement: 85, posture: "Focused", affect: "Attentive", alert: null },
  { id: "STU-105", name: "Kabir Singh", status: "Late", checkIn: "09:14 AM", engagement: 52, posture: "Looking Away", affect: "Distracted", alert: "Frequent gaze drift" },
  { id: "STU-106", name: "Meera Joshi", status: "Present", checkIn: "09:00 AM", engagement: 90, posture: "Upright", affect: "Engaged", alert: null }
];

const SCENARIOS = {
  active: {
    label: "Active Discussion",
    transcript: "Instructor: Can anyone explain how attention weights scale with sequence length? Priya: It grows quadratically!",
    audioDb: 62
  },
  confusion: {
    label: "High Confusion Spike",
    transcript: "Instructor: Moving on to backpropagation through time... (long pause, minimal student response)",
    audioDb: 28
  },
  slump: {
    label: "Mid-Session Slump",
    transcript: "Instructor: Let's review slide 42 of the theoretical derivation...",
    audioDb: 22
  }
};

export default function App() {
  const [mode, setMode] = useState("simulation");
  const [scenario, setScenario] = useState("active");
  const [roster, setRoster] = useState(INITIAL_ROSTER);
  const [metrics, setMetrics] = useState({
    overallEngagement: 82,
    visualAttention: 85,
    vocalActivity: 74,
    dominantAffect: "Focused",
    summary: "Class is showing strong visual focus with active Q&A participation.",
    recommendation: "Great momentum! Launch a quick 30-second poll to lock in the concept."
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoMonitor, setAutoMonitor] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      text: "Hello Instructor! I am monitoring multimodal video frames and audio energy. Ask me anything about class attendance or engagement."
    }
  ]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (mode !== "simulation" || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    let animId;
    let tick = 0;

    const renderLoop = () => {
      tick += 0.04;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, 640, 360);

      roster.forEach((student, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const x = 15 + col * 208;
        const y = 15 + row * 170;

        ctx.fillStyle = "#1e293b";
        ctx.fillRect(x, y, 195, 155);

        ctx.strokeStyle = student.engagement > 75 ? "#10b981" : student.engagement > 60 ? "#f59e0b" : "#ef4444";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 195, 155);

        const bob = Math.sin(tick + idx) * 3;
        ctx.fillStyle = "#475569";
        ctx.beginPath();
        ctx.arc(x + 97, y + 65 + bob, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#f8fafc";
        ctx.font = "12px sans-serif";
        ctx.fillText(student.name, x + 12, y + 130);
        ctx.fillStyle = "#38bdf8";
        ctx.fillText(`${student.engagement}% Focus`, x + 12, y + 146);
      });

      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animId);
  }, [mode, roster]);

  useEffect(() => {
    let stream = null;
    if (mode === "webcam") {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((mediaStream) => {
          stream = mediaStream;
          if (videoRef.current) videoRef.current.srcObject = mediaStream;
        })
        .catch(() => {
          alert("Webcam permission denied or unavailable. Switching back to Simulated Classroom.");
          setMode("simulation");
        });
    }
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [mode]);

  useEffect(() => {
    if (!autoMonitor) return;
    const timer = setInterval(() => {
      runMultimodalAnalysis();
    }, 10000);
    return () => clearInterval(timer);
  }, [autoMonitor, scenario, roster, apiKey]);

  const captureFrameBase64 = () => {
    if (mode === "simulation" && canvasRef.current) {
      return canvasRef.current.toDataURL("image/jpeg", 0.7);
    }
    if (mode === "webcam" && videoRef.current) {
      const offscreen = document.createElement("canvas");
      offscreen.width = 640;
      offscreen.height = 360;
      const ctx = offscreen.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, 640, 360);
      return offscreen.toDataURL("image/jpeg", 0.7);
    }
    return null;
  };

  const runMultimodalAnalysis = async () => {
    setIsAnalyzing(true);
    const activeScenario = SCENARIOS[scenario];
    const frameData = captureFrameBase64();

    try {
      if (apiKey.trim()) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Analyze this classroom frame and audio telemetry (${activeScenario.audioDb} dB, transcript: "${activeScenario.transcript}"). Return JSON with keys: overallEngagement (number), visualAttention (number), vocalActivity (number), dominantAffect (string), summary (string), recommendation (string).`
                    },
                    ...(frameData
                      ? [{ inlineData: { mimeType: "image/jpeg", data: frameData.split(",")[1] } }]
                      : [])
                  ]
                }
              ],
              generationConfig: { responseMimeType: "application/json" }
            })
          }
        );
        const data = await res.json();
        const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
        if (parsed.overallEngagement) {
          setMetrics((prev) => ({ ...prev, ...parsed }));
        }
      } else {
        await new Promise((r) => setTimeout(r, 650));
        const delta = scenario === "active" ? 5 : scenario === "confusion" ? -12 : -18;
        const updatedRoster = roster.map((s) => {
          const jitter = Math.floor(Math.random() * 9) - 4 + Math.floor(delta / 3);
          const nextScore = Math.min(98, Math.max(35, s.engagement + jitter));
          return {
            ...s,
            engagement: nextScore,
            affect: nextScore > 75 ? "Engaged" : nextScore > 58 ? "Confused" : "Fatigued",
            alert: nextScore < 60 ? "Attention drop detected" : null
          };
        });
        setRoster(updatedRoster);

        const avg = Math.round(updatedRoster.reduce((acc, s) => acc + s.engagement, 0) / updatedRoster.length);
        setMetrics({
          overallEngagement: avg,
          visualAttention: Math.min(100, avg + 4),
          vocalActivity: activeScenario.audioDb + 18,
          dominantAffect: scenario === "active" ? "Engaged" : scenario === "confusion" ? "Confused" : "Fatigued",
          summary:
            scenario === "active"
              ? "High visual focus and responsive vocal turn-taking across the cohort."
              : scenario === "confusion"
              ? "Multiple participants show furrowed brows and reduced vocal response."
              : "Posture slouching and gaze drift detected after extended lecture segment.",
          recommendation:
            scenario === "active"
              ? "Maintain current pace; invite quieter participants to share thoughts."
              : scenario === "confusion"
              ? "Pause and re-explain the last step using a visual example."
              : "Trigger a 2-minute interactive breakout or quick stretch break."
        });
      }
    } catch (err) {
      console.error("Analysis fallback triggered:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportRosterCSV = () => {
    const headers = ["Student ID,Name,Status,Check-In,Engagement %,Posture,Affect,Alert"];
    const rows = roster.map(
      (s) => `${s.id},"${s.name}",${s.status},${s.checkIn},${s.engagement},${s.posture},${s.affect},"${s.alert || "None"}"`
    );
    const blob = new Blob([headers.concat(rows).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handleChatSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userQ = chatInput;
    setChatInput("");
    const lowFocus = roster.filter((r) => r.engagement < 65).map((r) => r.name);
    const reply =
      lowFocus.length > 0
        ? `Currently ${roster.filter((r) => r.status === "Present").length}/${roster.length} students are on time. Keep an eye on ${lowFocus.join(", ")} as their engagement score dipped below 65%.`
        : `All ${roster.length} students are showing strong engagement (${metrics.overallEngagement}% class average)!`;

    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: userQ },
      { role: "assistant", text: reply }
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AETHER • Multimodal Attendance & Engagement Agent</h1>
            <p className="text-xs text-slate-400">Real-Time Vision + Audio Telemetry & Automated Roster Ledger</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="password"
            placeholder="Optional Gemini API Key..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => setMode(mode === "simulation" ? "webcam" : "simulation")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            {mode === "simulation" ? "Switch to Live Webcam" : "Switch to Simulation"}
          </button>
          <button
            onClick={exportRosterCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" /> Attendance
              </span>
              <p className="text-2xl font-bold mt-1">{roster.length}/6</p>
              <span className="text-[11px] text-emerald-400">100% Checked In</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Engagement
              </span>
              <p className="text-2xl font-bold mt-1">{metrics.overallEngagement}%</p>
              <span className="text-[11px] text-slate-400">Affect: {metrics.dominantAffect}</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-sky-400" /> Visual Focus
              </span>
              <p className="text-2xl font-bold mt-1">{metrics.visualAttention}%</p>
              <span className="text-[11px] text-slate-400">Gaze & Head Pose</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Vocal Energy
              </span>
              <p className="text-2xl font-bold mt-1">{SCENARIOS[scenario].audioDb} dB</p>
              <span className="text-[11px] text-slate-400">Speech Activity</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {mode === "simulation" ? "Simulated Classroom Stream" : "Live Webcam Feed"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {Object.entries(SCENARIOS).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => setScenario(key)}
                    className={`px-2.5 py-1 rounded text-xs transition ${
                      scenario === key
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative bg-slate-950 flex justify-center items-center aspect-video">
              {mode === "simulation" ? (
                <canvas ref={canvasRef} width={640} height={360} className="w-full h-full object-contain" />
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              )}
            </div>

            <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-400 italic truncate max-w-md">
                🎤 {SCENARIOS[scenario].transcript}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoMonitor(!autoMonitor)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    autoMonitor
                      ? "bg-amber-500/20 border-amber-500 text-amber-300"
                      : "bg-slate-800 border-slate-700 text-slate-300"
                  }`}
                >
                  {autoMonitor ? "Auto-Monitor: ON" : "Auto-Monitor (10s)"}
                </button>
                <button
                  onClick={runMultimodalAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                  {isAnalyzing ? "Analyzing Frame..." : "Analyze Frame Now"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Live Participant Roster & Biometric Cues</h2>
              <span className="text-xs text-slate-400">Auto-synced via Vision API</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Check-In</th>
                    <th className="py-2.5 px-3">Engagement</th>
                    <th className="py-2.5 px-3">Posture / Affect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {roster.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-medium">
                        {student.name}
                        <span className="block text-[10px] text-slate-500">{student.id}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            student.status === "Present"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {student.status === "Present" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {student.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{student.checkIn}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                student.engagement > 75
                                  ? "bg-emerald-500"
                                  : student.engagement > 60
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
              ))}
            </div>
          </div>

          <form onSubmit={handleChatSend} className="flex gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Copilot about class focus..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

  
