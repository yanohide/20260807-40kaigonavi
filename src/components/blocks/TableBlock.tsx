export type TableRow = { _key?: string; cells?: string[] };
export type TableValue = { rows?: TableRow[] };

/**
 * 数字セル判定（中央寄せ用）。
 * 例: 5% / 15％ / 1,000 / 100万円
 * 「194.9万円以下」「総合課税」など文言付きはテキスト扱い。
 */
export function isNumericCell(raw: string | undefined | null): boolean {
  const t = String(raw ?? "")
    .replace(/\*\*/g, "")
    .replace(/[,，]/g, "")
    .trim();
  if (!t) return false;
  return /^[+-]?[\d０-９.．]+(%|％|円|万円|億円|兆円)?$/.test(t);
}

function cellAlignClass(cell: string | undefined): string {
  return isNumericCell(cell) ? "is-num" : "is-text";
}

/**
 * 記事用テーブル。
 * - セル：約 12 文字幅で折り返し（編集目安 8〜12／上限 16）
 * - 多列：ラッパーで横スクロール、左端列は sticky 固定
 * - 配置：数字は中央、テキストは左寄せ
 */
export function TableBlock({ value }: { value?: TableValue }) {
  const rows = value?.rows ?? [];
  if (rows.length === 0) return null;

  const [headRow, ...bodyRows] = rows;
  const colCount = headRow?.cells?.length ?? rows[0]?.cells?.length ?? 0;

  return (
    <figure
      className="article-table-wrap"
      data-cols={colCount > 0 ? String(colCount) : undefined}
    >
      {colCount >= 5 ? (
        <p className="article-table-scroll-hint" aria-hidden="true">
          横にスクロールできます
        </p>
      ) : null}
      <table className="article-table">
        {headRow ? (
          <thead>
            <tr>
              {(headRow.cells ?? []).map((cell, i) => (
                <th key={i} scope="col" className={cellAlignClass(cell)}>
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {bodyRows.map((row, ri) => (
            <tr key={row._key ?? ri}>
              {(row.cells ?? []).map((cell, ci) =>
                ci === 0 ? (
                  <th key={ci} scope="row" className={cellAlignClass(cell)}>
                    {cell}
                  </th>
                ) : (
                  <td key={ci} className={cellAlignClass(cell)}>
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
