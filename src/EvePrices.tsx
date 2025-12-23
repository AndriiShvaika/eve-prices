import { useEffect, useState } from 'react';
import './EvePrices.css';

type EvePrice = {
  adjusted_price?: number;
  average_price?: number;
  type_id: number;
};

type EveTypeInfo = {
  type_id: number;
  name: string;
};

const ITEMS_PER_PAGE = 15;

export function EvePrices() {
  const [prices, setPrices] = useState<EvePrice[]>([]);
  const [names, setNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [namesLoading, setNamesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          'https://esi.evetech.net/latest/markets/prices/'
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: EvePrice[] = await res.json();
        setPrices(data);
      } catch (e: any) {
        setError(e.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const totalPages = Math.max(1, Math.ceil(prices.length / ITEMS_PER_PAGE));
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = prices.slice(start, end);

  useEffect(() => {
    async function loadNames() {
      if (pageItems.length === 0) return;

      const missingIds = pageItems
        .map((p) => p.type_id)
        .filter((id) => names[id] === undefined);

      if (missingIds.length === 0) return;

      setNamesLoading(true);
      try {
        const fetched: Record<number, string> = {};

        for (const id of missingIds) {
          const res = await fetch(
            `https://esi.evetech.net/latest/universe/types/${id}/`
          );
          if (!res.ok) continue;
          const info: EveTypeInfo = await res.json();
          fetched[id] = info.name;
        }

        setNames((prev) => ({ ...prev, ...fetched }));
      } finally {
        setNamesLoading(false);
      }
    }

    loadNames();
  }, [pageItems, names]);

  if (loading) {
    return (
      <div className="eve-app">
        <div className="eve-card">
          <p className="eve-muted">Loading prices…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="eve-app">
        <div className="eve-card">
          <p className="eve-error">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="eve-app">
      <div className="eve-card">
        <header className="eve-header">
          <div>
            <h1 className="eve-title">EVE Online Market</h1>
            <p className="eve-subtitle">
              {ITEMS_PER_PAGE} items per page from /markets/prices/.
            </p>
          </div>
          {namesLoading && (
            <span className="eve-badge">Loading item names…</span>
          )}
        </header>

        <div className="eve-table-wrapper">
          <table className="eve-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type ID</th>
                <th>Average price</th>
                <th>Adjusted price</th>
              </tr>
            </thead>
            <tbody key={page} className="eve-page">
              {pageItems.map((p) => {
                const name = names[p.type_id] ?? '…';
                return (
                  <tr key={p.type_id}>
                    <td className="eve-td-primary">{name}</td>
                    <td className="eve-td-mono">{p.type_id}</td>
                    <td>
                      {p.average_price !== undefined
                        ? p.average_price.toFixed(2)
                        : 'n/a'}
                    </td>
                    <td>
                      {p.adjusted_price !== undefined
                        ? p.adjusted_price.toFixed(2)
                        : 'n/a'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className="eve-footer">
          <button
            className="eve-button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Prev
          </button>
          <span className="eve-page-info">
            Page {page} / {totalPages}
          </span>
          <button
            className="eve-button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next →
          </button>
        </footer>
      </div>
    </div>
  );
}
