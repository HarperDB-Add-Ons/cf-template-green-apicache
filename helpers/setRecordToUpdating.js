const setRecordToUpdating = async ({ hdbCore, hashAttribute }) => {
  const cacheUpdate = {
    body: {
      operation: "update",
      schema: "api_cache",
      table: "request_cache",
      records: [{ id: hashAttribute, updating: true }],
      hdb_user: {
        role: { permission: { super_user: true } },
        username: "hdbadmin",
      },
    },
  };

  return hdbCore.requestWithoutAuthentication(cacheUpdate);
};

export default setRecordToUpdating;
