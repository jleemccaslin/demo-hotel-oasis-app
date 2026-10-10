// A stand-in for the Supabase client, shared by every API test.
//
// Instead of rebuilding each call chain by hand, tests queue the result a
// query should resolve to, run the function under test, then inspect what was
// asked of Supabase:
//
//   supabaseFake.resolveNext({ data: [{ id: "1" }] });
//   await getCabins();
//   const [query] = supabaseFake.queries;
//   expect(query.table).toBe("cabins");
//   expect(query.calls).toContainEqual(["select", "*"]);

export const FAKE_SUPABASE_URL = "https://test.supabase.co";

interface QueryResult {
  data?: unknown;
  error?: unknown;
  count?: number | null;
}

interface UploadResult {
  error?: unknown;
}

interface AuthResult {
  data?: unknown;
  error?: unknown;
}

// One supabase.from(table) chain. Each call is stored as [method, ...args]
export interface RecordedQuery {
  table: string;
  calls: unknown[][];
}

export interface RecordedUpload {
  bucket: string;
  path: string;
  file: unknown;
}

// Every query builder method the app uses. A method missing from this list
// throws "is not a function", which is the prompt to add it here
const CHAIN_METHODS = [
  "select",
  "insert",
  "update",
  "delete",
  "eq",
  "gte",
  "lte",
  "or",
  "order",
  "range",
  "single",
];

const WRITE_METHODS = ["insert", "update", "delete"];

// Every supabase.auth method the app uses
const AUTH_METHODS = [
  "signUp",
  "signInWithPassword",
  "setSession",
  "getSession",
  "getUser",
  "signOut",
  "updateUser",
];

function createSupabaseFake() {
  let queries: RecordedQuery[] = [];
  let uploads: RecordedUpload[] = [];
  let queuedResults: QueryResult[] = [];
  let queuedUploadResults: UploadResult[] = [];
  // Each supabase.auth call is stored as [method, ...args], like query calls
  let authCalls: unknown[][] = [];
  let queuedAuthResults: AuthResult[] = [];

  function resolveQuery(query: RecordedQuery) {
    const { data = null, error = null, count = null } =
      queuedResults.shift() ?? {};

    // Like the real client, a write only hands rows back when .select() is chained
    const methods = query.calls.map(([method]) => method);
    const isWrite = methods.some((method) =>
      WRITE_METHODS.includes(method as string),
    );
    const returnsRows = !isWrite || methods.includes("select");

    return { data: returnsRows ? data : null, error, count };
  }

  function from(table: string) {
    const query: RecordedQuery = { table, calls: [] };
    queries.push(query);

    // Awaiting the builder at any point in the chain resolves the query
    const builder: Record<string, unknown> = {
      then: (
        onFulfilled: (result: QueryResult) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve(resolveQuery(query)).then(onFulfilled, onRejected),
    };

    for (const method of CHAIN_METHODS) {
      builder[method] = (...args: unknown[]) => {
        query.calls.push([method, ...args]);
        return builder;
      };
    }

    return builder;
  }

  const storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: unknown) => {
        uploads.push({ bucket, path, file });
        const { error = null } = queuedUploadResults.shift() ?? {};
        return { data: null, error };
      },
    }),
  };

  const auth: Record<string, unknown> = {};

  for (const method of AUTH_METHODS) {
    auth[method] = async (...args: unknown[]) => {
      authCalls.push([method, ...args]);
      const { data = {}, error = null } = queuedAuthResults.shift() ?? {};
      return { data, error };
    };
  }

  return {
    // What the code under test receives as `supabase`
    client: { from, storage, auth },

    // Results are handed out in the order queries are awaited. A query with
    // nothing queued resolves to { data: null, error: null, count: null }
    resolveNext(result: QueryResult) {
      queuedResults.push(result);
    },
    resolveNextUpload(result: UploadResult) {
      queuedUploadResults.push(result);
    },
    // An auth call with nothing queued resolves to { data: {}, error: null }
    resolveNextAuth(result: AuthResult) {
      queuedAuthResults.push(result);
    },

    get queries() {
      return queries;
    },
    get uploads() {
      return uploads;
    },
    get authCalls() {
      return authCalls;
    },

    reset() {
      queries = [];
      uploads = [];
      queuedResults = [];
      queuedUploadResults = [];
      authCalls = [];
      queuedAuthResults = [];
    },
  };
}

export const supabaseFake = createSupabaseFake();

// Arguments of the first call to `method` in a query, e.g. the payload passed
// to .update()
export function argsOf(query: RecordedQuery, method: string) {
  const call = query.calls.find(([name]) => name === method);
  if (!call) throw new Error(`.${method}() was never called on ${query.table}`);

  return call.slice(1);
}
