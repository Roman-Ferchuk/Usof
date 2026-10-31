import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';

const LIMIT = 15;

/* Loads one page of an admin list; the page number resets when the filters change. */
export default function useAdminList(kind, filters) {
  const key = JSON.stringify(filters);
  const [paging, setPaging] = useState({ key, page: 1 });
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({
    rows: [], pages: 1, total: 0, status: 'loading', error: '',
  });
  const page = paging.key === key ? paging.page : 1;

  useEffect(() => {
    let stale = false;
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    api.adminList(kind, { ...JSON.parse(key), page, limit: LIMIT })
      .then((res) => {
        if (!stale) {
          setState({
            rows: res.data, pages: res.pages, total: res.total, status: 'done', error: '',
          });
        }
      })
      .catch((e) => { if (!stale) setState((s) => ({ ...s, status: 'failed', error: e.message })); });
    return () => { stale = true; };
  }, [kind, key, page, tick]);

  return {
    ...state,
    page,
    setPage: (n) => setPaging({ key, page: n }),
    reload: useCallback(() => setTick((t) => t + 1), []),
  };
}
