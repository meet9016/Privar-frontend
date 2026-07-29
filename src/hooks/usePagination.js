import { useState, useCallback } from 'react';

export default function usePagination(defaultLimit = 10) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const setPaginationData = useCallback((pg) => {
    if (!pg) return;
    if (pg.page) setPage(Number(pg.page));
    if (pg.limit) setLimit(Number(pg.limit));
    if (pg.totalPages || pg.total_pages || pg.last_page) {
      setTotalPages(Number(pg.totalPages || pg.total_pages || pg.last_page));
    }
    if (pg.total !== undefined) setTotal(Number(pg.total));
  }, []);

  const getParams = useCallback((additionalFilters = {}) => {
    return {
      page,
      limit,
      ...additionalFilters,
    };
  }, [page, limit]);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    limit,
    totalPages: Math.max(totalPages, 1),
    total,
    setPage,
    setLimit,
    setPaginationData,
    getParams,
    resetPage,
  };
}
