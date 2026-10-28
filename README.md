# Multimodal Attendance & Engagement Agent

A real-time attendance tracker and classroom engagement analyzer built with React, WebRTC/Web Audio APIs, and the Gemini Multimodal API.

Instead of relying solely on manual roll calls or basic login timestamps, this agent combines **visual frames** (posture, gaze direction, screen presence) with **audio telemetry** (voice activity and speech context) to log student attendance and estimate cognitive engagement during live sessions.

## Key Features
- **Dual Input Pipeline:** Supports live Webcam + Microphone streams as well as a built-in simulated classroom canvas for testing without a camera.
- **Multimodal Inference:** Combines base64 frame snapshots with live audio decibel readings using `gemini-2.5-flash` for structured JSON evaluation.
- **Automated Attendance Ledger:** Tracks check-in timestamps, presence status (`Present`, `Away`, `Late`), and individual engagement scores with one-click CSV/JSON export.
- **Instructor Copilot:** Generates real-time nudges when class attention drops below a threshold.

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons
- **AI Engine:** Google Gemini API (`gemini-2.5-flash`)
- **Media APIs:** WebRTC (`getUserMedia`), HTML5 Canvas API, Web Audio API

## Local Setup
1. Clone the repository:
   ```bash
   git clone [https://github.com/YOUR_USERNAME/multimodal-attendance-agent.git](https://github.com/YOUR_USERNAME/multimodal-attendance-agent.git)
