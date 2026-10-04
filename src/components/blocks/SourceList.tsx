export type SourceListItem = {
  _key?: string;
  title?: string;
  url?: string;
};

export type SourceListValue = {
  sources?: SourceListItem[];
};

/**
 * 記事文末の出典一覧。URL はリンクにせず、テキストとしてそのまま表示する。
 */
export function SourceList({ value }: { value?: SourceListValue }) {
  const sources = value?.sources ?? [];
  if (sources.length === 0) return null;

  return (
    <ul className="source-list not-prose">
      {sources.map((item, i) => (
        <li key={item._key ?? i} className="source-list-item">
          <span className="source-list-title">{item.title}</span>
          {item.url ? (
            <span className="source-list-url">{item.url}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
