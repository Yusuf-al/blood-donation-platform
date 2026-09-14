export interface IPaginationOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface IPaginationResult {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const DEFAULT_SORT_BY = "createdAt";
const DEFAULT_SORT_ORDER: "asc" | "desc" = "desc";

export const calculatePagination = (
  options: IPaginationOptions,
): IPaginationResult => {
  const rawPage = Number(options.page);
  const rawLimit = Number(options.limit);

  const page =
    Number.isFinite(rawPage) && rawPage > 0
      ? Math.floor(rawPage)
      : DEFAULT_PAGE;

  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
      : DEFAULT_LIMIT;

  const skip = (page - 1) * limit;

  const sortBy = options.sortBy?.trim() || DEFAULT_SORT_BY;
  const sortOrder =
    options.sortOrder === "asc" || options.sortOrder === "desc"
      ? options.sortOrder
      : DEFAULT_SORT_ORDER;

  return { page, limit, skip, sortBy, sortOrder };
};

export const buildPaginationMeta = (
  total: number,
  { page, limit }: Pick<IPaginationResult, "page" | "limit">,
) => ({
  page,
  limit,
  total,
  totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
});
