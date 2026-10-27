import { GridCellKind, type GridCell } from "@glideapps/glide-data-grid";
import type {
  DropdownCellType,
  DatePickerType,
  MultiSelectCellType,
} from "@glideapps/glide-data-grid-cells";

/** 必填但为空时的高亮样式：浅红底 + 红字，提醒用户需要补填 */
const MISSING_THEME = { bgCell: "#fdecea", textDark: "#c0362c" };

/** 普通只读/可编辑文本单元格 */
export function textCell(value: string, readonly = false, isMissing = false): GridCell {
  return {
    kind: GridCellKind.Text,
    data: value ?? "",
    displayData: value ?? "",
    allowOverlay: !readonly,
    readonly,
    ...(isMissing ? { themeOverride: MISSING_THEME } : {}),
  };
}

/** 长文本单元格（备注/要求类，允许多行展示） */
export function longTextCell(value: string, readonly = false, isMissing = false): GridCell {
  return {
    kind: GridCellKind.Text,
    data: value ?? "",
    displayData: value ?? "",
    allowOverlay: !readonly,
    readonly,
    allowWrapping: true,
    ...(isMissing ? { themeOverride: MISSING_THEME } : {}),
  } as GridCell;
}

/** 数字单元格 */
export function numberCell(
  value: number | null | undefined,
  readonly = false,
  isMissing = false
): GridCell {
  return {
    kind: GridCellKind.Number,
    data: value ?? undefined,
    displayData: value === null || value === undefined ? "" : String(value),
    allowOverlay: !readonly,
    readonly,
    ...(isMissing ? { themeOverride: MISSING_THEME } : {}),
  };
}

/** 只读序号单元格 */
export function readonlySeqCell(value: number): GridCell {
  return {
    kind: GridCellKind.Number,
    data: value,
    displayData: String(value),
    allowOverlay: false,
    readonly: true,
    themeOverride: { bgCell: "#f0f1f3" },
  };
}

/** Trade 状态只读单元格：系统维护字段，用颜色区分"未录入/已录入"，禁止用户编辑 */
export function tradeStatusCell(value: "未录入" | "已录入"): GridCell {
  const isDone = value === "已录入";
  return {
    kind: GridCellKind.Text,
    data: value,
    displayData: value,
    allowOverlay: false,
    readonly: true,
    themeOverride: isDone
      ? { textDark: "#0a7a3d", bgCell: "#e6f6ec" }
      : { textDark: "#8a8f98", bgCell: "#f0f1f3" },
  };
}

/** 单选下拉枚举单元格（来自 glide-data-grid-cells 的 DropdownCell） */
export function dropdownCell(
  value: string,
  allowedValues: readonly string[],
  readonly = false,
  isMissing = false
): GridCell {
  const data: DropdownCellType["data"] = {
    kind: "dropdown-cell",
    value: value || undefined,
    allowedValues: allowedValues as string[],
  };
  return {
    kind: GridCellKind.Custom,
    allowOverlay: !readonly,
    copyData: value ?? "",
    data,
    readonly,
    ...(isMissing ? { themeOverride: MISSING_THEME } : {}),
  } as unknown as GridCell;
}

/** 日期选择单元格（格式 YYYY/MM/DD），内部存储为 Date 对象 */
export function dateCell(value: string, readonly = false, isMissing = false): GridCell {
  const date = value ? parseSlashDate(value) : undefined;
  const data: DatePickerType["data"] = {
    kind: "date-picker-cell",
    date,
    displayDate: value || "",
    format: "date",
  };
  return {
    kind: GridCellKind.Custom,
    allowOverlay: !readonly,
    copyData: value ?? "",
    data,
    readonly,
    ...(isMissing ? { themeOverride: MISSING_THEME } : {}),
  } as unknown as GridCell;
}

/** 多选单元格（采购内容等），存储为字符串数组 */
export function multiSelectCell(
  values: string[],
  options: readonly string[],
  readonly = false,
  isMissing = false
): GridCell {
  const data: MultiSelectCellType["data"] = {
    kind: "multi-select-cell",
    values: values ?? [],
    options: options as string[],
    allowCreation: false,
    allowDuplicates: false,
  };
  return {
    kind: GridCellKind.Custom,
    allowOverlay: !readonly,
    copyData: (values ?? []).join(", "),
    data,
    readonly,
    ...(isMissing ? { themeOverride: MISSING_THEME } : {}),
  } as unknown as GridCell;
}

/** 将 YYYY/MM/DD 格式字符串解析为 Date（本地时区，避免时区偏移问题） */
export function parseSlashDate(value: string): Date | undefined {
  if (!value) return undefined;
  const parts = value.split("/").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return undefined;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

/** 将 Date 格式化为 YYYY/MM/DD 字符串 */
export function formatSlashDate(date: Date | null | undefined): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}
