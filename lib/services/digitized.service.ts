import { db } from "@/lib/db";
import {
  parcels,
  ownerships,
  cultivations,
  mutations,
  accountHoldings,
  encumbrances,
  spatialMaps,
  propertyCards,
} from "@/lib/db/schema/canonical";
import { eq, ilike, or, desc, count, and, SQL } from "drizzle-orm";
import {
  type ServiceResult,
  ServiceErrorCode,
  ok,
  fail,
} from "@/lib/services/errors";
import { createLogger } from "@/lib/logger";
import {
  type DocTypeSlug,
  type DigitizedListQuery,
  DOC_TYPE_HAS_STATE_COLUMN,
} from "@/lib/validations/digitized";
import type { IndianState } from "@/lib/constants/states";

const log = createLogger("digitized.service");

// ── Table Resolution ───────────────────────────────────────────────────────
// We cannot store all Drizzle tables in a single generic map because each
// has a distinct column shape. Instead we dispatch per-docType at the query
// boundary, keeping full type safety inside each branch.

// ── Paginated List Response ────────────────────────────────────────────────

export interface DigitizedListMeta {
  docType: DocTypeSlug;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DigitizedListResult {
  data: Record<string, unknown>[];
  meta: DigitizedListMeta;
}

// ── Service Functions ──────────────────────────────────────────────────────

/**
 * List canonical records for a doc type with pagination, optional state
 * restriction (from the API key's allowedState), and optional filters.
 */
export async function list(
  docType: DocTypeSlug,
  query: DigitizedListQuery,
  keyAllowedState: string | null
): Promise<ServiceResult<DigitizedListResult>> {
  try {
    const { page, limit, state, district, q } = query;
    const offset = (page - 1) * limit;

    // If key is state-restricted and a state filter is requested, they must match
    if (state && keyAllowedState && state !== keyAllowedState) {
      return fail(
        ServiceErrorCode.FORBIDDEN,
        `API token is not authorized to access data for state: ${state}`
      );
    }

    // Effective state = explicit query param, or the key's restriction
    const effectiveState = state ?? keyAllowedState ?? undefined;

    const { rows, total } = await queryByDocType({
      docType,
      limit,
      offset,
      state: effectiveState,
      district,
      q,
    });

    return ok({
      data: rows,
      meta: {
        docType,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    log.error({ error, docType }, "Error listing digitized records");
    return fail(
      ServiceErrorCode.DB_ERROR,
      "Unhandled database error during digitized record listing",
      error
    );
  }
}

/**
 * Fetch a single canonical record by UUID, with optional state restriction.
 */
export async function get(
  docType: DocTypeSlug,
  id: string,
  keyAllowedState: string | null
): Promise<ServiceResult<Record<string, unknown>>> {
  try {
    const row = await fetchById(docType, id);

    if (!row) {
      return fail(ServiceErrorCode.NOT_FOUND, `${docType} record not found: ${id}`);
    }

    // Enforce state restriction on the fetched record (only for state-column tables)
    const hasStateCol = DOC_TYPE_HAS_STATE_COLUMN[docType];
    if (hasStateCol && keyAllowedState) {
      const rowState = row["state"];
      if (typeof rowState === "string" && rowState !== keyAllowedState) {
        return fail(
          ServiceErrorCode.FORBIDDEN,
          `API token is not authorized to access data for state: ${rowState}`
        );
      }
    }

    return ok(row);
  } catch (error) {
    log.error({ error, docType, id }, "Error fetching digitized record");
    return fail(
      ServiceErrorCode.DB_ERROR,
      "Unhandled database error during digitized record fetch",
      error
    );
  }
}

// ── Internal Query Dispatcher ──────────────────────────────────────────────

interface QueryOptions {
  docType: DocTypeSlug;
  limit: number;
  offset: number;
  state?: string;
  district?: string;
  q?: string;
}

interface QueryResult {
  rows: Record<string, unknown>[];
  total: number;
}

async function queryByDocType(opts: QueryOptions): Promise<QueryResult> {
  const { docType, limit, offset, state, district, q } = opts;

  switch (docType) {
    case "parcels": {
      const conditions: SQL[] = [];
      if (state) conditions.push(eq(parcels.state, state as IndianState));
      if (district) conditions.push(ilike(parcels.district, `%${district}%`));
      if (q) conditions.push(or(ilike(parcels.village, `%${q}%`), ilike(parcels.parcelId, `%${q}%`), ilike(parcels.district, `%${q}%`)) as SQL);
      const where = conditions.length ? and(...conditions) : undefined;
      const [totalRes, rows] = await Promise.all([
        db.select({ count: count() }).from(parcels).where(where),
        db.select().from(parcels).where(where).orderBy(desc(parcels.createdAt)).limit(limit).offset(offset),
      ]);
      return { rows: rows as Record<string, unknown>[], total: totalRes[0]?.count ?? 0 };
    }

    case "ownerships": {
      const conditions: SQL[] = [];
      if (q) conditions.push(or(ilike(ownerships.ownerName, `%${q}%`), ilike(ownerships.khataNumber, `%${q}%`)) as SQL);
      const where = conditions.length ? and(...conditions) : undefined;
      const [totalRes, rows] = await Promise.all([
        db.select({ count: count() }).from(ownerships).where(where),
        db.select().from(ownerships).where(where).orderBy(desc(ownerships.createdAt)).limit(limit).offset(offset),
      ]);
      return { rows: rows as Record<string, unknown>[], total: totalRes[0]?.count ?? 0 };
    }

    case "cultivations": {
      const conditions: SQL[] = [];
      if (q) conditions.push(ilike(cultivations.cultivatorName, `%${q}%`));
      const where = conditions.length ? and(...conditions) : undefined;
      const [totalRes, rows] = await Promise.all([
        db.select({ count: count() }).from(cultivations).where(where),
        db.select().from(cultivations).where(where).orderBy(desc(cultivations.createdAt)).limit(limit).offset(offset),
      ]);
      return { rows: rows as Record<string, unknown>[], total: totalRes[0]?.count ?? 0 };
    }

    case "mutations": {
      const conditions: SQL[] = [];
      if (q) conditions.push(or(ilike(mutations.mutationNo, `%${q}%`), ilike(mutations.newOwner, `%${q}%`), ilike(mutations.previousOwner, `%${q}%`)) as SQL);
      const where = conditions.length ? and(...conditions) : undefined;
      const [totalRes, rows] = await Promise.all([
        db.select({ count: count() }).from(mutations).where(where),
        db.select().from(mutations).where(where).orderBy(desc(mutations.createdAt)).limit(limit).offset(offset),
      ]);
      return { rows: rows as Record<string, unknown>[], total: totalRes[0]?.count ?? 0 };
    }

    case "account-holdings": {
      const conditions: SQL[] = [];
      if (state) conditions.push(eq(accountHoldings.state, state as IndianState));
      if (q) conditions.push(or(ilike(accountHoldings.ownerName, `%${q}%`), ilike(accountHoldings.accountNumber, `%${q}%`)) as SQL);
      const where = conditions.length ? and(...conditions) : undefined;
      const [totalRes, rows] = await Promise.all([
        db.select({ count: count() }).from(accountHoldings).where(where),
        db.select().from(accountHoldings).where(where).orderBy(desc(accountHoldings.createdAt)).limit(limit).offset(offset),
      ]);
      return { rows: rows as Record<string, unknown>[], total: totalRes[0]?.count ?? 0 };
    }

    case "encumbrances": {
      const conditions: SQL[] = [];
      if (q) conditions.push(ilike(encumbrances.institution, `%${q}%`));
      const where = conditions.length ? and(...conditions) : undefined;
      const [totalRes, rows] = await Promise.all([
        db.select({ count: count() }).from(encumbrances).where(where),
        db.select().from(encumbrances).where(where).orderBy(desc(encumbrances.createdAt)).limit(limit).offset(offset),
      ]);
      return { rows: rows as Record<string, unknown>[], total: totalRes[0]?.count ?? 0 };
    }

    case "spatial-maps": {
      const [totalRes, rows] = await Promise.all([
        db.select({ count: count() }).from(spatialMaps),
        db.select().from(spatialMaps).orderBy(desc(spatialMaps.createdAt)).limit(limit).offset(offset),
      ]);
      return { rows: rows as Record<string, unknown>[], total: totalRes[0]?.count ?? 0 };
    }

    case "property-cards": {
      const conditions: SQL[] = [];
      if (q) conditions.push(or(ilike(propertyCards.ownerName, `%${q}%`), ilike(propertyCards.propertyId, `%${q}%`)) as SQL);
      const where = conditions.length ? and(...conditions) : undefined;
      const [totalRes, rows] = await Promise.all([
        db.select({ count: count() }).from(propertyCards).where(where),
        db.select().from(propertyCards).where(where).orderBy(desc(propertyCards.createdAt)).limit(limit).offset(offset),
      ]);
      return { rows: rows as Record<string, unknown>[], total: totalRes[0]?.count ?? 0 };
    }
  }
}

async function fetchById(
  docType: DocTypeSlug,
  id: string
): Promise<Record<string, unknown> | undefined> {
  switch (docType) {
    case "parcels": {
      const [row] = await db.select().from(parcels).where(eq(parcels.id, id)).limit(1);
      return row as Record<string, unknown> | undefined;
    }
    case "ownerships": {
      const [row] = await db.select().from(ownerships).where(eq(ownerships.id, id)).limit(1);
      return row as Record<string, unknown> | undefined;
    }
    case "cultivations": {
      const [row] = await db.select().from(cultivations).where(eq(cultivations.id, id)).limit(1);
      return row as Record<string, unknown> | undefined;
    }
    case "mutations": {
      const [row] = await db.select().from(mutations).where(eq(mutations.id, id)).limit(1);
      return row as Record<string, unknown> | undefined;
    }
    case "account-holdings": {
      const [row] = await db.select().from(accountHoldings).where(eq(accountHoldings.id, id)).limit(1);
      return row as Record<string, unknown> | undefined;
    }
    case "encumbrances": {
      const [row] = await db.select().from(encumbrances).where(eq(encumbrances.id, id)).limit(1);
      return row as Record<string, unknown> | undefined;
    }
    case "spatial-maps": {
      const [row] = await db.select().from(spatialMaps).where(eq(spatialMaps.id, id)).limit(1);
      return row as Record<string, unknown> | undefined;
    }
    case "property-cards": {
      const [row] = await db.select().from(propertyCards).where(eq(propertyCards.id, id)).limit(1);
      return row as Record<string, unknown> | undefined;
    }
  }
}
