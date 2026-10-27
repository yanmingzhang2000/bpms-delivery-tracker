import type { MainRow } from "./types";

/**
 * 模拟 BPMS 侧"单条录入 Trade"接口。
 *
 * 真实接入时，这个函数应该替换成实际的网络请求，例如：
 *   const res = await fetch(`/api/trade/record`, { method: "POST", body: JSON.stringify({ seq: row.seq }) });
 *   if (!res.ok) throw new Error(await res.text());
 *
 * 当前实现用于演示"批量勾选 + 前端循环调用单条接口"的交互效果：
 * - 模拟真实网络延迟（随机 300~900ms）
 * - 有一定概率（15%）模拟业务侧失败，比如 Offer 编号在 BPMS 侧查不到
 */
export interface RecordTradeResult {
  seq: number;
  success: boolean;
  /** 失败时的原因说明，success=true 时为空 */
  errorMessage?: string;
}

const SIMULATED_FAILURE_RATE = 0.15;

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export async function mockRecordTradeApi(row: MainRow): Promise<RecordTradeResult> {
  await randomDelay(300, 900);

  if (Math.random() < SIMULATED_FAILURE_RATE) {
    const reasons = [
      `Offer 编号 ${row.offerNo || "(空)"} 在 BPMS 侧未找到匹配记录`,
      `收款主体编号 ${row.payeeEntityNo || "(空)"} 未通过财务侧校验`,
      "BPMS 侧接口超时，请稍后重试",
    ];
    const errorMessage = reasons[Math.floor(Math.random() * reasons.length)];
    return { seq: row.seq, success: false, errorMessage };
  }

  return { seq: row.seq, success: true };
}
