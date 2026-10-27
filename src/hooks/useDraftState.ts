import { useCallback, useState } from "react";

/**
 * 通用的"草稿 / 已保存"状态管理。
 *
 * 表格的编辑不会直接提交，而是先写入 draft（草稿），只有点击"保存"才会把
 * draft 同步为新的 committed（已保存）基准；点击"放弃改动"则把 draft 还原
 * 成当前 committed 的值，撤销所有未保存的编辑。
 *
 * isDirty 表示 draft 相对 committed 是否发生了变化，用于在界面上提示"有未保存的改动"
 * 并控制保存/放弃按钮的可用状态。
 */
export function useDraftState<T>(initialValue: T) {
  const [committed, setCommitted] = useState<T>(initialValue);
  const [draft, setDraft] = useState<T>(initialValue);

  const isDirty = draft !== committed;

  const save = useCallback(() => {
    setCommitted(draft);
  }, [draft]);

  const discard = useCallback(() => {
    setDraft(committed);
  }, [committed]);

  /**
   * 跳过草稿机制，直接把更新同时写入 committed 和 draft。
   * 用于"录Trade"这类系统操作：点击按钮即调用接口、立即生效，
   * 不应该被用户之后点击"放弃改动"撤销，否则会出现"接口已经成功，
   * 但界面显示失败"的数据不一致。
   */
  const commitDirectly = useCallback((updater: (current: T) => T) => {
    setCommitted((current) => {
      const next = updater(current);
      setDraft(next);
      return next;
    });
  }, []);

  return { draft, setDraft, isDirty, save, discard, commitDirectly };
}
