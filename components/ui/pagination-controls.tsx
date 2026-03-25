import { Button } from "@/components/ui/button";

type PaginationControlsProps = {
  pathname: string;
  page: number;
  pageSize: number;
  totalCount: number;
  pageParam: string;
  searchParams?: Record<string, string | string[] | undefined>;
};

export function PaginationControls({
  pathname,
  page,
  pageSize,
  totalCount,
  pageParam,
  searchParams = {}
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  if (totalCount <= pageSize) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-sm text-[var(--muted)]">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        {hasPrevious ? (
          <Button asChild variant="secondary">
            <a
              href={buildPageHref({
                pathname,
                page: page - 1,
                pageParam,
                searchParams
              })}
            >
              Previous
            </a>
          </Button>
        ) : (
          <Button variant="secondary" disabled>
            Previous
          </Button>
        )}
        {hasNext ? (
          <Button asChild variant="secondary">
            <a
              href={buildPageHref({
                pathname,
                page: page + 1,
                pageParam,
                searchParams
              })}
            >
              Next
            </a>
          </Button>
        ) : (
          <Button variant="secondary" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

function buildPageHref({
  pathname,
  page,
  pageParam,
  searchParams
}: {
  pathname: string;
  page: number;
  pageParam: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined || key === pageParam) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
    } else {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set(pageParam, String(page));
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
