export default async (server, { hdbCore, logger }) => {
  server.route({
    url: "/setup",
    method: "GET",
    handler: async (request) => {
      const results = {};

      request.body = {
        operation: "create_schema",
        schema: "api_cache",
      };

      try {
        results.schema_result = await hdbCore.requestWithoutAuthentication(
          request
        );
      } catch (e) {
        results.schema_result = e;
      }

      request.body = {
        operation: "create_table",
        schema: "api_cache",
        table: "request_cache",
        hash_attribute: "id",
      };

      try {
        results.cache_table_result = await hdbCore.requestWithoutAuthentication(
          request
        );
      } catch (e) {
        results.cache_table_result = e;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      request.body = {
        operation: "create_attribute",
        schema: "api_cache",
        table: "request_cache",
        attribute: "error",
      };

      try {
        results.cache_table_attribute_error_result =
          await hdbCore.requestWithoutAuthentication(request);
      } catch (e) {
        results.cache_table_attribute_error_result = e;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      request.body = {
        operation: "create_attribute",
        schema: "api_cache",
        table: "request_cache",
        attribute: "updating",
      };

      try {
        results.cache_table_attribute_updating_result =
          await hdbCore.requestWithoutAuthentication(request);
      } catch (e) {
        results.cache_table_attribute_updating_result = e;
      }

      return results;
    },
  });
};
