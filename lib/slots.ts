// 1コマの長さ（分）：60分セッション + 15分バッファ = 75分刻み
const SLOT_INTERVAL_MINUTES = 75;
const SESSION_MINUTES = 60;

export type Slot = {
  start: Date;
  end: Date;
};

// "HH:MM" 形式の文字列を、その日の分数に変換（例 "10:00" → 600）
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// 指定した1日分の候補枠を、シフトの開始〜終了から75分刻みで生成する
export function generateSlotsForDay(
  date: Date,
  startTime: string,
  endTime: string
): Slot[] {
  const slots: Slot[] = [];
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  // その枠のセッション(60分)が営業終了までに収まる範囲で刻む
  for (let m = startMin; m + SESSION_MINUTES <= endMin; m += SLOT_INTERVAL_MINUTES) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setMinutes(m);

    const end = new Date(start);
    end.setMinutes(start.getMinutes() + SESSION_MINUTES);

    slots.push({ start, end });
  }

  return slots;
}