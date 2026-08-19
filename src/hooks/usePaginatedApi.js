import { useCallback, useEffect, useMemo, useState } from 'react'
import useDebounce from './useDebounce'

const cleanParams = (params) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
)

export default function usePaginatedApi(fetcher, options = {}) {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialSearch = '',
    initialFilters = {},
    sortBy,
    sortOrder
  } = options

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [search, setSearchValue] = useState(initialSearch)
  const debouncedSearch = useDebounce(search, 400)
  const [filters, setFiltersValue] = useState(initialFilters)

  const filterKey = JSON.stringify(filters)

  const params = useMemo(() => cleanParams({
    page,
    limit,
    search: debouncedSearch,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...filters
  }), [page, limit, debouncedSearch, sortBy, sortOrder, filterKey])

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetcher(params)
      setData(res.data?.data || res.data || [])
      // in refetch, replace setPagination line:
      const raw = res.data?.pagination || res.data?.meta || {}
      setPagination({
        page: raw.current_page ?? raw.page,
        totalPages: raw.last_page ?? raw.totalPages ?? raw.total_pages,
        total: raw.total,
        limit: raw.per_page ?? raw.limit,
      })
    } catch (error) {
      setData([])
      // in refetch, replace setPagination line:
      const raw = res.data?.pagination || res.data?.meta || {}
      setPagination({
        page: raw.current_page ?? raw.page,
        totalPages: raw.last_page ?? raw.totalPages ?? raw.total_pages,
        total: raw.total,
        limit: raw.per_page ?? raw.limit,
      })
    } finally {
      setLoading(false)
    }
  }, [fetcher, params])

  useEffect(() => {
    refetch()
  }, [refetch])

  const setSearch = (value) => {
    setPage(1)
    setSearchValue(value)
  }

  const setFilters = (value) => {
    setPage(1)
    setFiltersValue((current) => (typeof value === 'function' ? value(current) : value))
  }

  return {
    data,
    pagination,
    loading,
    page,
    limit,
    search,
    filters,
    setPage,
    setLimit,
    setSearch,
    setFilters,
    refetch
  }
}
