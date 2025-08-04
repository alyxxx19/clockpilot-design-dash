import { SQL, and, asc, desc, ilike, or, gte, lte, eq, inArray, count } from "drizzle-orm";
import { PgSelectQueryBuilder } from "drizzle-orm/pg-core";

export interface FilterOptions {
  search?: string;
  searchFields?: string[];
  dateRanges?: Array<{
    field: string;
    from?: string;
    to?: string;
  }>;
  exactMatches?: Array<{
    field: string;
    value: any;
  }>;
  inFilters?: Array<{
    field: string;
    values: any[];
  }>;
  booleanFilters?: Array<{
    field: string;
    value: boolean;
  }>;
}

export interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  multiSort?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export class QueryBuilder {
  /**
   * Apply multiple filters to a query
   */
  applyFilters<T extends PgSelectQueryBuilder<any, any, any, any>>(
    query: T,
    filters: FilterOptions,
    tableColumns: Record<string, any>
  ): T {
    const conditions: SQL[] = [];

    // Apply search across multiple fields
    if (filters.search && filters.searchFields?.length) {
      const searchConditions = filters.searchFields
        .map(field => {
          const column = tableColumns[field];
          return column ? ilike(column, `%${filters.search}%`) : null;
        })
        .filter((condition): condition is SQL => condition !== null);

      if (searchConditions.length > 0) {
        conditions.push(or(...searchConditions) as SQL);
      }
    }

    // Apply date range filters
    if (filters.dateRanges?.length) {
      filters.dateRanges.forEach(({ field, from, to }) => {
        const column = tableColumns[field];
        if (column) {
          if (from) {
            conditions.push(gte(column, from));
          }
          if (to) {
            conditions.push(lte(column, to));
          }
        }
      });
    }

    // Apply exact match filters
    if (filters.exactMatches?.length) {
      filters.exactMatches.forEach(({ field, value }) => {
        const column = tableColumns[field];
        if (column && value !== undefined && value !== null) {
          conditions.push(eq(column, value));
        }
      });
    }

    // Apply IN filters (for multi-select)
    if (filters.inFilters?.length) {
      filters.inFilters.forEach(({ field, values }) => {
        const column = tableColumns[field];
        if (column && values?.length > 0) {
          conditions.push(inArray(column, values));
        }
      });
    }

    // Apply boolean filters
    if (filters.booleanFilters?.length) {
      filters.booleanFilters.forEach(({ field, value }) => {
        const column = tableColumns[field];
        if (column && typeof value === 'boolean') {
          conditions.push(eq(column, value));
        }
      });
    }

    // Combine all conditions
    if (conditions.length > 0) {
      return query.where(and(...conditions)) as T;
    }

    return query;
  }

  /**
   * Apply full-text search with ILIKE across multiple fields
   */
  applySearch<T extends PgSelectQueryBuilder<any, any, any, any>>(
    query: T,
    search: string,
    searchFields: string[],
    tableColumns: Record<string, any>
  ): T {
    if (!search || !searchFields.length) return query;

    const searchConditions = searchFields
      .map(field => {
        const column = tableColumns[field];
        return column ? ilike(column, `%${search}%`) : null;
      })
      .filter((condition): condition is SQL => condition !== null);

    if (searchConditions.length > 0) {
      return query.where(or(...searchConditions)) as T;
    }

    return query;
  }

  /**
   * Apply date range filter to a specific field
   */
  applyDateRange<T extends PgSelectQueryBuilder<any, any, any, any>>(
    query: T,
    field: string,
    from?: string,
    to?: string,
    tableColumns?: Record<string, any>
  ): T {
    if (!tableColumns || !field) return query;

    const column = tableColumns[field];
    if (!column) return query;

    const conditions: SQL[] = [];
    
    if (from) {
      conditions.push(gte(column, from));
    }
    if (to) {
      conditions.push(lte(column, to));
    }

    if (conditions.length > 0) {
      return query.where(and(...conditions)) as T;
    }

    return query;
  }

  /**
   * Apply pagination with offset and limit
   */
  applyPagination<T extends PgSelectQueryBuilder<any, any, any, any>>(
    query: T,
    options: PaginationOptions
  ): T {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    return query.limit(limit).offset(offset) as T;
  }

  /**
   * Apply sorting (single or multiple columns)
   */
  applySort<T extends PgSelectQueryBuilder<any, any, any, any>>(
    query: T,
    options: SortOptions,
    tableColumns: Record<string, any>
  ): T {
    // Handle multi-column sorting
    if (options.multiSort?.length) {
      const orderByExpressions = options.multiSort
        .map(({ field, direction }) => {
          const column = tableColumns[field];
          if (!column) return null;
          return direction === 'asc' ? asc(column) : desc(column);
        })
        .filter((expr): expr is any => expr !== null);

      if (orderByExpressions.length > 0) {
        return query.orderBy(...orderByExpressions) as T;
      }
    }

    // Handle single column sorting
    if (options.sortBy) {
      const column = tableColumns[options.sortBy];
      if (column) {
        const direction = options.sortOrder === 'asc' ? asc : desc;
        return query.orderBy(direction(column)) as T;
      }
    }

    return query;
  }

  /**
   * Get optimized count query for pagination
   */
  buildCountQuery<T extends PgSelectQueryBuilder<any, any, any, any>>(
    baseQuery: T,
    filters: FilterOptions,
    tableColumns: Record<string, any>
  ) {
    // Create a new count query based on the same from clause
    let countQuery = baseQuery.$dynamic().select({ count: count() });

    // Apply same filters to count query
    return this.applyFilters(countQuery, filters, tableColumns);
  }

  /**
   * Execute paginated query with count
   */
  async executePaginatedQuery<T>(
    db: any,
    query: any,
    countQuery: any,
    options: PaginationOptions
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = options;

    // Execute both queries in parallel
    const [data, countResult] = await Promise.all([
      db.execute(query),
      db.execute(countQuery)
    ]);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Build select fields dynamically to optimize queries
   */
  buildSelectFields(
    requestedFields?: string[],
    defaultFields?: Record<string, any>,
    tableColumns?: Record<string, any>
  ): Record<string, any> {
    if (!requestedFields || !tableColumns) {
      return defaultFields || {};
    }

    const selectFields: Record<string, any> = {};
    
    requestedFields.forEach(field => {
      if (tableColumns[field]) {
        selectFields[field] = tableColumns[field];
      }
    });

    // Always include ID if not specified
    if (!selectFields.id && tableColumns.id) {
      selectFields.id = tableColumns.id;
    }

    return Object.keys(selectFields).length > 0 ? selectFields : (defaultFields || {});
  }

  /**
   * Parse query string filters into structured format
   */
  parseQueryFilters(queryParams: Record<string, any>): FilterOptions {
    const filters: FilterOptions = {};

    // Extract search
    if (queryParams.search) {
      filters.search = queryParams.search;
    }

    // Extract date ranges
    const dateRanges: Array<{ field: string; from?: string; to?: string }> = [];
    
    Object.keys(queryParams).forEach(key => {
      if (key.endsWith('From')) {
        const field = key.replace('From', '');
        const existing = dateRanges.find(r => r.field === field);
        if (existing) {
          existing.from = queryParams[key];
        } else {
          dateRanges.push({ field, from: queryParams[key] });
        }
      } else if (key.endsWith('To')) {
        const field = key.replace('To', '');
        const existing = dateRanges.find(r => r.field === field);
        if (existing) {
          existing.to = queryParams[key];
        } else {
          dateRanges.push({ field, to: queryParams[key] });
        }
      }
    });

    if (dateRanges.length > 0) {
      filters.dateRanges = dateRanges;
    }

    return filters;
  }
}

export const queryBuilder = new QueryBuilder();