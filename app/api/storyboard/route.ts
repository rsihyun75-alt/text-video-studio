import { NextResponse } from "next/server";

type StyleKey = "documentary" | "vlog" | "motion";

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

const STYLE_LABELS: Record<StyleKey, string> = {
  documentary: "따뜻한 다큐멘터리",
  vlog: "친근한 브이로그",
  motion: "깔끔한 모션그래픽",
};

const STYLE_DETAILS: Record<StyleKey, string> = {
  documentary: "자연스러운 한국인 인물, 따뜻한 자연광, 차분한 카메라",
  vlog: "눈높이 미디엄샷, 밝은 표정, 손으로 직접 찍은 듯한 생동감",
  motion: "간결한 도형, 선명한 컬러, 텍스트가 돋보이는 리듬감 있는 전환",
};

const ACCENTS = [
  "linear-gradient(135deg, #d7f7e8 0%, #b6defb 100%)",
  "linear-gradient(135deg, #ffe2bd 0%, #ffd0db 100%)",
  "linear-gradient(135deg, #d9d7ff 0%, #b9eff1 100%)",
  "linear-gradient(135deg, #ffdcac 0%, #c9efcb 100%)",
  "linear-gradient(135deg, #d4e3ff 0%, #efdcff 100%)",
];

const FALLBACK_LINES = [
  "평범한 하루에도 우리가 놓치고 있던 이야기가 있습니다.",
  "작은 신호를 발견하는 순간, 장면의 방향이 달라집니다.",
  "누군가 먼저 움직이면 주변의 사람들도 자연스럽게 반응합니다.",
  "함께 만든 변화는 눈에 보이는 결과보다 오래 남습니다.",
  "오늘의 작은 선택이 내일의 분위기를 바꿉니다.",
];

function cleanText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function splitSentences(script: string) {
  const normalized = script.replace(/\r/g, "\n").trim();
  const pieces = normalized
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map((piece) => piece.trim())
    .filter(Boolean);

  if (pieces.length >= 5) return pieces.slice(0, 5);

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length < 5) return [...pieces, ...FALLBACK_LINES].slice(0, 5);

  const chunkSize = Math.ceil(words.length / 5);
  return Array.from({ length: 5 }, (_, index) => {
    const chunk = words.slice(index * chunkSize, (index + 1) * chunkSize).join(" ");
    return chunk || FALLBACK_LINES[index];
  });
}

function shorten(value: string, maxLength: number) {
  const text = value.trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function getTitle(script: string) {
  const firstLine = script.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? "";
  const title = firstLine.replace(/[.!?。！？].*$/, "").trim();
  return shorten(title || "작은 변화가 시작되는 곳", 24);
}

function getDuration(total: number) {
  const base = [5, 5, 6, 6, 6];
  const safeTotal = Math.min(30, Math.max(25, Math.round(total || 28)));
  base[4] += safeTotal - base.reduce((sum, value) => sum + value, 0);
  return base;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    script?: unknown;
    style?: unknown;
    duration?: unknown;
  };
  const script = cleanText(body.script);
  const style = (body.style === "vlog" || body.style === "motion" ? body.style : "documentary") as StyleKey;
  const duration = getDuration(Number(body.duration));

  if (script.length < 12) {
    return NextResponse.json({ error: "12자 이상 입력해 주세요." }, { status: 400 });
  }

  const lines = splitSentences(script);
  const frameInfo = [
    { label: "OPEN", role: "도입", title: "시선을 여는 첫 장면", visual: "장소와 주인공을 한 번에 보여주며 이야기를 시작합니다." },
    { label: "NOTICE", role: "발견", title: "작은 신호를 포착", visual: "인물의 표정과 손끝, 주변의 디테일을 가까이 담습니다." },
    { label: "MOVE", role: "행동", title: "변화를 만드는 움직임", visual: "주인공이 직접 행동하고 주변 인물이 자연스럽게 반응합니다." },
    { label: "SHIFT", role: "전환", title: "함께 달라지는 풍경", visual: "앞선 행동이 공간의 분위기와 관계를 바꾸는 순간입니다." },
    { label: "CLOSE", role: "마무리", title: "다음 장면으로 이어지는 한마디", visual: "여운이 남는 넓은 화면과 핵심 메시지로 마무리합니다." },
  ];

  const scenes: Scene[] = frameInfo.map((frame, index) => ({
    id: index + 1,
    label: frame.label,
    role: frame.role,
    title: frame.title,
    visual: `${frame.visual} ${shorten(lines[index] ?? FALLBACK_LINES[index], 70)}`,
    narration: shorten(lines[index] ?? FALLBACK_LINES[index], 94),
    prompt: `${STYLE_DETAILS[style]}, ${shorten(lines[index] ?? FALLBACK_LINES[index], 76)}, ${frame.role} 장면, 화면 하단 자막 여백, 가로형 16:9, 텍스트·로고·워터마크 없음`,
    duration: duration[index],
    accent: ACCENTS[index],
  }));

  return NextResponse.json({
    project: {
      title: getTitle(script),
      style: STYLE_LABELS[style],
      duration: duration.reduce((sum, value) => sum + value, 0),
      scenes,
    },
  });
}
