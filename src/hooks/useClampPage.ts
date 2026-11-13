/**
 * Pagination guard shared by dashboard list screens.
 * Keeps the selected page within the available range after filters shrink the
 * result set. Collaborates with a caller-owned page state setter.
 */
import { useEffect } from "react";

/**
 * Clamps `page` to `totalPages` whenever the current page overshoots.
 *
 * Runs as an effect so it appends a corrective update rather than mutating
 * state during render. It only clamps downward; page selection and lower-bound
 * handling remain with the caller.
 *
 * @param page - Currently selected page.
 * @param totalPages - Last page available for the current result set.
 * @param setPage - State setter used to apply the clamped page.
 */
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
