/**
 * 通用的"保存 / 放弃改动"操作条，配合 useDraftState 使用。
 * isDirty 为 true 时才会显示"有未保存的改动"提示，且按钮才可点击。
 */
export default function SaveBar({
  isDirty,
  onSave,
  onDiscard,
}: {
  isDirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {isDirty && (
        <span style={{ color: "#9a6400", fontSize: 12 }}>● 有未保存的改动</span>
      )}
      <button
        onClick={onDiscard}
        disabled={!isDirty}
        style={{
          border: "1px solid #d0d5dd",
          background: "#fff",
          color: isDirty ? "#333" : "#b7bcc4",
          borderRadius: 4,
          padding: "6px 14px",
          fontSize: 13,
          cursor: isDirty ? "pointer" : "not-allowed",
        }}
      >
        放弃改动
      </button>
      <button
        onClick={onSave}
        disabled={!isDirty}
        style={{
          border: "1px solid #2f6fed",
          background: isDirty ? "#2f6fed" : "#f0f1f3",
          color: isDirty ? "#fff" : "#9aa1ac",
          borderRadius: 4,
          padding: "6px 14px",
          fontSize: 13,
          cursor: isDirty ? "pointer" : "not-allowed",
        }}
      >
        保存
      </button>
    </div>
  );
}
