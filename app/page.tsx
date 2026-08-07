"use client";

import { useEffect, useMemo, useState } from "react";

type Scene = {
  id: number;
  label: string;
  role: string;
  title: string;
  visual: string;
  narration: string;
  prompt: string;
  duration: number;
  accent: string;
};

type Project = {
  title: string;
  style: string;
  duration: number;
  scenes: Scene[];
};

const DEFAULT_SCRIPT = `학교 텃밭에서 시작된 작은 약속이 우리 반의 분위기를 바꾸었습니다.
처음에는 아무도 눈여겨보지 않던 화분 하나를 한 학생이 매일 돌보기 시작했습니다.
친구들은 물을 나누고 흙을 고르며 자연스럽게 함께하는 방법을 배웠습니다.
며칠 뒤, 교실 창가에는 새싹과 서로를 응원하는 목소리가 함께 자라고 있었습니다.
작은 관심은 혼자 끝나지 않고 모두의 행동을 바꾸는 힘이 됩니다.`;

const INITIAL_SCENES: Scene[] = [
  {
    id: 1,
    label: "OPEN",
    role: "도입",
    title: "시선을 여는 첫 장면",
    visual: "아침 햇살이 들어오는 교실 창가, 작은 화분과 조용한 책상이 한눈에 보입니다.",
    narration: "학교 텃밭에서 시작된 작은 약속이 우리 반의 분위기를 바꾸었습니다.",
    prompt: "따뜻한 자연광의 한국 초등학교 교실, 창가의 작은 화분, 차분한 와이드샷, 화면 하단 자막 여백, 16:9",
    duration: 5,
    accent: "linear-gradient(135deg, #d7f7e8 0%, #b6defb 100%)",
  },
  {
    id: 2,
    label: "NOTICE",
    role: "발견",
    title: "작은 신호를 포착",
    visual: "한 학생이 화분의 흙을 살피고, 창가로 들어오는 빛 속에서 새싹을 발견합니다.",
    narration: "처음에는 아무도 눈여겨보지 않던 화분 하나를 한 학생이 매일 돌보기 시작했습니다.",
    prompt: "한국 학생이 창가 화분의 새싹을 살피는 장면, 눈높이 미디엄샷, 따뜻한 색감, 자연스러운 표정, 16:9",
    duration: 5,
    accent: "linear-gradient(135deg, #ffe2bd 0%, #ffd0db 100%)",
  },
  {
    id: 3,
    label: "MOVE",
    role: "행동",
    title: "변화를 만드는 움직임",
    visual: "친구들이 물을 나누고 흙을 고르며 한 화분 앞에 자연스럽게 모입니다.",
    narration: "친구들은 물을 나누고 흙을 고르며 자연스럽게 함께하는 방법을 배웠습니다.",
    prompt: "한국 학생들이 교실 창가에서 함께 화분을 돌보는 모습, 손과 행동 중심 클로즈업, 밝고 친근한 분위기, 16:9",
    duration: 6,
    accent: "linear-gradient(135deg, #d9d7ff 0%, #b9eff1 100%)",
  },
  {
    id: 4,
    label: "SHIFT",
    role: "전환",
    title: "함께 달라지는 풍경",
    visual: "며칠 뒤, 창가에 자란 새싹과 서로를 바라보며 웃는 친구들의 모습이 이어집니다.",
    narration: "며칠 뒤, 교실 창가에는 새싹과 서로를 응원하는 목소리가 함께 자라고 있었습니다.",
    prompt: "햇살이 가득한 한국 교실, 자란 새싹과 서로 응원하는 학생들, 부드러운 팬 이동, 현실적인 사진 스타일, 16:9",
    duration: 6,
    accent: "linear-gradient(135deg, #ffdcac 0%, #c9efcb 100%)",
  },
  {
    id: 5,
    label: "CLOSE",
    role: "마무리",
    title: "다음 장면으로 이어지는 한마디",
    visual: "교실 전체가 보이는 넓은 화면, 창가의 화분과 아이들의 활기찬 움직임이 여운을 남깁니다.",
    narration: "작은 관심은 혼자 끝나지 않고 모두의 행동을 바꾸는 힘이 됩니다.",
    prompt: "활기찬 한국 초등학교 교실의 넓은 화면, 창가 화분과 함께 웃는 학생들, 여운 있는 마무리, 자막 여백, 16:9",
    duration: 6,
    accent: "linear-gradient(135deg, #d4e3ff 0%, #efdcff 100%)",
  },
];

const STYLE_OPTIONS = [
  { value: "documentary", label: "따뜻한 다큐", detail: "현실적인 인물과 자연광" },
  { value: "vlog", label: "친근한 브이로그", detail: "가볍고 생생한 카메라" },
  { value: "motion", label: "깔끔한 모션", detail: "도형과 리듬감 있는 전환" },
];

function formatTime(seconds: number) {
  return `00:${String(Math.max(0, Math.round(seconds))).padStart(2, "0")}`;
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const character of text) {
    const next = line + character;
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = character;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function getNow() {
  return window.performance.now();
}

export default function Home() {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [style, setStyle] = useState("documentary");
  const [duration, setDuration] = useState(28);
  const [project, setProject] = useState<Project>({
    title: "학교 텃밭에서 시작된 작은 약속",
    style: "따뜻한 다큐멘터리",
    duration: 28,
    scenes: INITIAL_SCENES,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [notice, setNotice] = useState("");

  const selectedScene = project.scenes[selectedIndex] ?? project.scenes[0];
  const currentTime = useMemo(() => (project.duration * progress) / 100, [project.duration, progress]);

  useEffect(() => {
    const stored = window.localStorage.getItem("cutmaker-draft");
    if (!stored) return;
    const timer = window.setTimeout(() => {
      try {
        const parsed = JSON.parse(stored) as { script?: string; project?: Project };
        if (parsed.script) setScript(parsed.script);
        if (parsed.project?.scenes?.length) setProject(parsed.project);
      } catch {
        window.localStorage.removeItem("cutmaker-draft");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 100) {
          setIsPlaying(false);
          return 0;
        }
        return value + 1.25;
      });
    }, 350);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  async function generateStoryboard() {
    setIsGenerating(true);
    setNotice("");
    try {
      const response = await fetch("/api/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, style, duration }),
      });
      const data = (await response.json()) as { project?: Project; error?: string };
      if (!response.ok || !data.project) throw new Error(data.error ?? "스토리보드를 만들 수 없습니다.");
      setProject(data.project);
      setSelectedIndex(0);
      setProgress(0);
      setNotice("5장면 스토리보드가 준비되었습니다.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setIsGenerating(false);
    }
  }

  function saveDraft() {
    window.localStorage.setItem("cutmaker-draft", JSON.stringify({ script, project }));
    setNotice("이 브라우저에 초안을 저장했습니다.");
  }

  function resetProject() {
    setScript(DEFAULT_SCRIPT);
    setProject({ title: "학교 텃밭에서 시작된 작은 약속", style: "따뜻한 다큐멘터리", duration: 28, scenes: INITIAL_SCENES });
    setSelectedIndex(0);
    setProgress(0);
    setNotice("샘플 프로젝트로 돌아왔습니다.");
  }

  async function copyPrompts() {
    try {
      await navigator.clipboard.writeText(project.scenes.map((scene) => `${scene.id}. ${scene.prompt}`).join("\n\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice("브라우저에서 복사를 허용해 주세요.");
    }
  }

  function downloadPlan() {
    const blob = new Blob([JSON.stringify({ ...project, script }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.title.replace(/\s+/g, "-")}-storyboard.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("스토리보드 JSON을 내려받았습니다.");
  }

  async function exportVideo() {
    if (typeof window === "undefined" || !window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
      setNotice("이 브라우저에서는 WebM 내보내기를 지원하지 않습니다.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const context = canvas.getContext("2d");
    if (!context) return;

    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });

    setExporting(true);
    setExportProgress(0);
    recorder.start();

    for (let index = 0; index < project.scenes.length; index += 1) {
      const scene = project.scenes[index];
      const sceneStart = getNow();
      const sceneLength = scene.duration * 1000;
      while (getNow() - sceneStart < sceneLength) {
        const elapsed = getNow() - sceneStart;
        drawVideoFrame(context, scene, elapsed / sceneLength, index);
        setExportProgress(Math.min(99, Math.round(((index + elapsed / sceneLength) / project.scenes.length) * 100)));
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      }
    }

    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.title.replace(/\s+/g, "-")}.webm`;
    link.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    setExportProgress(100);
    setNotice("영상 파일을 내려받았습니다.");
  }

  function drawVideoFrame(context: CanvasRenderingContext2D, scene: Scene, sceneProgress: number, index: number) {
    const width = 1280;
    const height = 720;
    const gradient = context.createLinearGradient(0, 0, width, height);
    const palettes = [
      ["#d7f7e8", "#b6defb"],
      ["#ffe2bd", "#ffd0db"],
      ["#d9d7ff", "#b9eff1"],
      ["#ffdcac", "#c9efcb"],
      ["#d4e3ff", "#efdcff"],
    ][index] ?? ["#d7f7e8", "#b6defb"];
    gradient.addColorStop(0, palettes[0]);
    gradient.addColorStop(1, palettes[1]);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    const drift = Math.sin(sceneProgress * Math.PI) * 20;
    context.fillStyle = "rgba(255, 255, 255, 0.42)";
    context.beginPath();
    context.arc(1060 + drift, 120, 150, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(255, 255, 255, 0.28)";
    context.beginPath();
    context.arc(170 - drift, 590, 210, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(18, 37, 48, 0.68)";
    context.font = "700 22px Arial";
    context.fillText(`CUTMAKER  /  ${scene.label}`, 76, 78);
    context.fillStyle = "#162530";
    context.font = "700 56px Arial";
    context.fillText(scene.title, 76, 270);
    context.font = "400 30px Arial";
    const visualLines = wrapText(context, scene.visual, 740).slice(0, 3);
    visualLines.forEach((line, lineIndex) => context.fillText(line, 78, 340 + lineIndex * 46));
    context.fillStyle = "rgba(255,255,255,0.84)";
    context.fillRect(76, 610, 1128, 2);
    context.fillStyle = "#162530";
    context.font = "600 26px Arial";
    const subtitle = wrapText(context, scene.narration, 1080).slice(0, 2);
    subtitle.forEach((line, lineIndex) => context.fillText(line, 78, 654 + lineIndex * 32));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={resetProject} aria-label="컷메이커 홈으로 이동">
          <span className="brand-symbol">K</span>
          <span>
            <span className="brand-kicker">STORY → MOTION</span>
            <span className="brand-name">컷메이커</span>
          </span>
        </button>
        <div className="topbar-actions">
          <span className="autosave"><span className="status-dot" /> 브라우저 초안</span>
          <button className="ghost-button" onClick={resetProject}>새 프로젝트</button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">TEXT-TO-VIDEO STUDIO <span>✦</span></p>
          <h1>한 문단이<br /><em>장면이 되는</em> 순간.</h1>
          <p className="hero-description">글을 붙여 넣으면 5장면 스토리보드, 내레이션, 이미지 프롬프트까지 한 번에 정리됩니다. 마지막에는 바로 재생 가능한 영상 파일로 내보낼 수 있어요.</p>
        </div>
        <div className="hero-notes">
          <div className="note-card note-card-yellow"><span className="note-number">01</span><strong>글 입력</strong><span>핵심 메시지를 그대로 붙여 넣어요.</span></div>
          <div className="note-card note-card-blue"><span className="note-number">02</span><strong>장면 구성</strong><span>도입부터 마무리까지 흐름을 잡아요.</span></div>
          <div className="note-card note-card-mint"><span className="note-number">03</span><strong>영상 출력</strong><span>WebM으로 저장해 바로 공유해요.</span></div>
        </div>
      </section>

      <section className="studio-layout">
        <aside className="script-panel panel-card">
          <div className="panel-heading">
            <div><span className="section-index">01</span><h2>스크립트</h2></div>
            <span className="tiny-label">INPUT</span>
          </div>
          <label className="input-label" htmlFor="script">영상으로 만들 글</label>
          <textarea id="script" value={script} onChange={(event) => setScript(event.target.value)} placeholder="글을 입력해 주세요." />
          <div className="input-meta"><span>{script.length}자</span><span>한국어</span></div>

          <div className="control-block">
            <div className="control-title"><span>영상 분위기</span><span className="muted">스타일</span></div>
            <div className="style-options">
              {STYLE_OPTIONS.map((option) => (
                <button key={option.value} className={`style-option ${style === option.value ? "is-selected" : ""}`} onClick={() => setStyle(option.value)}>
                  <span className="style-radio" />
                  <span><strong>{option.label}</strong><small>{option.detail}</small></span>
                </button>
              ))}
            </div>
          </div>

          <div className="control-block duration-row">
            <div className="control-title"><span>영상 길이</span><span className="muted">권장 25–30초</span></div>
            <div className="duration-buttons">
              {[25, 28, 30].map((value) => <button key={value} className={duration === value ? "is-selected" : ""} onClick={() => setDuration(value)}>{value}초</button>)}
            </div>
          </div>

          <button className="generate-button" onClick={generateStoryboard} disabled={isGenerating}>
            <span>{isGenerating ? "장면을 구성하는 중…" : "스토리보드 자동 생성"}</span><span className="button-arrow">↗</span>
          </button>
          <p className="helper-copy">입력한 글은 이 브라우저에서만 초안 생성에 사용됩니다.</p>
        </aside>

        <div className="workspace">
          <div className="workspace-header">
            <div><span className="section-index">02</span><span className="workspace-label">PROJECT BOARD</span><h2>{project.title}</h2></div>
            <div className="workspace-actions"><button className="icon-button" onClick={saveDraft} aria-label="초안 저장">저장</button><button className="icon-button" onClick={downloadPlan} aria-label="스토리보드 다운로드">JSON ↓</button></div>
          </div>

          <div className="preview-card panel-card">
            <div className="preview-topline"><span><span className="live-dot" /> LIVE PREVIEW</span><span>{project.style} · 16:9</span></div>
            {selectedScene && <div className="scene-preview" style={{ background: selectedScene.accent }}>
              <div className="preview-orbit orbit-one" /><div className="preview-orbit orbit-two" />
              <div className="preview-copy"><span className="preview-scene-label">{String(selectedScene.id).padStart(2, "0")} / {selectedScene.label}</span><h3>{selectedScene.title}</h3><p>{selectedScene.visual}</p></div>
              <button className="play-button" onClick={() => setIsPlaying((value) => !value)} aria-label={isPlaying ? "미리보기 일시정지" : "미리보기 재생"}>{isPlaying ? "Ⅱ" : "▶"}</button>
              <div className="preview-subtitle">{selectedScene.narration}</div>
            </div>}
            <div className="player-controls"><button className="play-small" onClick={() => setIsPlaying((value) => !value)}>{isPlaying ? "일시정지" : "재생"}</button><span>{formatTime(currentTime)} <i>/</i> {formatTime(project.duration)}</span><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><span className="ratio-badge">{selectedScene?.duration ?? 0}s</span></div>
          </div>

          <div className="timeline-section">
            <div className="subsection-heading"><div><span className="section-index">03</span><h2>장면 타임라인</h2></div><span>{project.scenes.length} scenes · {formatTime(project.duration)}</span></div>
            <div className="scene-list">
              {project.scenes.map((scene, index) => {
                const start = project.scenes.slice(0, index).reduce((sum, item) => sum + item.duration, 0);
                return <button key={scene.id} className={`scene-card ${index === selectedIndex ? "is-active" : ""}`} onClick={() => { setSelectedIndex(index); setProgress((start / project.duration) * 100); }}>
                  <span className="scene-number">{String(scene.id).padStart(2, "0")}</span><span className="scene-thumb" style={{ background: scene.accent }}><span>{scene.label}</span></span><span className="scene-card-copy"><strong>{scene.title}</strong><small>{scene.role} · {scene.duration}초</small></span><span className="scene-time">{formatTime(start)}</span>
                </button>;
              })}
            </div>
          </div>

          <div className="bottom-grid">
            <div className="prompt-card panel-card"><div className="subsection-heading"><div><span className="section-index">04</span><h2>장면 프롬프트</h2></div><button className="text-button" onClick={copyPrompts}>{copied ? "복사 완료" : "전체 복사 ↗"}</button></div><p className="prompt-text">{selectedScene?.prompt}</p><div className="prompt-tags"><span>자막 여백</span><span>16:9</span><span>no logo</span></div></div>
            <div className="export-card"><div><span className="export-kicker">READY TO SHARE</span><h2>이제 영상으로<br />내보내 볼까요?</h2><p>현재 스토리보드를 1280×720 WebM으로 녹화합니다.</p></div><button className="export-button" onClick={exportVideo} disabled={exporting}><span>{exporting ? `내보내는 중 ${exportProgress}%` : "영상 파일 만들기"}</span><span>↗</span></button>{exporting && <div className="export-progress"><span style={{ width: `${exportProgress}%` }} /></div>}</div>
          </div>
          {notice && <p className="notice" role="status">✦ {notice}</p>}
        </div>
      </section>

      <footer className="footer"><span>컷메이커 / 텍스트 비디오 스튜디오</span><span>과제용 프로토타입 · API 키 없이 실행</span></footer>
    </main>
  );
}
