'use client';

export default function DiarioToolbar({
  onSearch,
  onFilter
}: {
  onSearch: (v: string) => void;
  onFilter: (v: string) => void;
}) {
  return (
    <div className="diario-toolbar">
      <input
        id="searchInput"
        className="search-input"
        placeholder="Cerca autore o descrizione"
        onChange={(e) => onSearch(e.target.value)}
      />
      <select
        id="filterSelect"
        className="filter-select"
        onChange={(e) => onFilter(e.target.value)}
        defaultValue="recenti"
      >
        <option value="recenti">Più recenti</option>
        <option value="piu-poesie">Più poesie</option>
      </select>
    </div>
  );
}
