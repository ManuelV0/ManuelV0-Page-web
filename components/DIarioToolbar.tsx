'use client';

export default function DiarioToolbar({
  onSearch,
  onFilter
}: {
  onSearch: (v: string) => void;
  onFilter: (v: string) => void;
}) {
  return (
    <div className="diario-toolbar" role="toolbar" aria-label="Toolbar per la ricerca e il filtro">
      <label htmlFor="searchInput" className="visually-hidden">Cerca autore o descrizione</label>
      <input
        id="searchInput"
        className="search-input"
        placeholder="Cerca autore o descrizione"
        onChange={(e) => onSearch(e.target.value)}
        aria-label="Cerca autore o descrizione"
      />
      <label htmlFor="filterSelect" className="visually-hidden">Filtra per</label>
      <select
        id="filterSelect"
        className="filter-select"
        onChange={(e) => onFilter(e.target.value)}
        defaultValue="recenti"
        aria-label="Seleziona filtro"
      >
        <option value="recenti">Più recenti</option>
        <option value="piu-poesie">Più poesie</option>
      </select>
    </div>
  );
}