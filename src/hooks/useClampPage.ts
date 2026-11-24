/**
 * Pagination guard shared by dashboard list screens.
 * Keeps the selected page within the available range after filters shrink the
 * result set. Collaborates with a caller-owned page state setter.
 */
import { useEffect } from "react";

/**
 * Clamps `page` into the valid range `[1, totalPages]`.
 *
 * Runs as an effect so it appends a corrective update rather than mutating
 * state during render. Guards against non-finite values and a total page
 * count below 1.
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
    const safeTotalPages =
      Number.isFinite(totalPages) && totalPages >= 1
        ? Math.trunc(totalPages)
        : 1;

    if (!Number.isFinite(page) || page < 1) {
      setPage(1);
      return;
    }

    if (page > safeTotalPages) {
      setPage(safeTotalPages);
    }
  }, [page, totalPages, setPage]);
}
