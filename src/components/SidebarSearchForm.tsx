export function SidebarSearchForm() {
  return (
    <div className="sidebar-search">
      <form
        action="/search"
        method="get"
        role="search"
        className="sidebar-search-form"
      >
        <label htmlFor="sidebar-search-input" className="sr-only">
          検索
        </label>
        <input
          id="sidebar-search-input"
          type="search"
          name="s"
          placeholder="検索"
          className="sidebar-search-input"
          autoComplete="off"
        />
        <button
          type="submit"
          className="sidebar-search-submit"
          aria-label="検索を実行する"
        >
          <svg
            viewBox="0 0 24 24"
            width={18}
            height={18}
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
