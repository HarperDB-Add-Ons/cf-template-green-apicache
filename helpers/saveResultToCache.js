const saveResultToCache = async ({
  hdbCore,
  hashAttribute,
  result,
  status,
  content_type,
  source,
  duration_ms,
  error = false,
  recordExists,
}) => {
  const cacheRequest = {
    body: {
      operation: recordExists ? "update" : "insert",
      schema: "api_cache",
      table: "request_cache",
      records: [
        {
          id: hashAttribute,
          result,
          error,
          duration_ms,
          content_type,
          url: source,
          status,
          updating: false,
        },
      ],
      hdb_user: {
        role: { permission: { super_user: true } },
        username: "hdbadmin",
      },
    },
  };

  return hdbCore.requestWithoutAuthentication(cacheRequest);
};

export default saveResultToCache;
