import { useEffect } from "react";

export function useClampPage(
  page: number,
  totalPages: number,
  setPage: (value: number | ((previous: number) => number)) => void,
) {
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages, setPage]);
}
