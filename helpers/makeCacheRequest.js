const makeCacheRequest = async ({ hdbCore, hashAttribute, minCreatedDate }) => {
	const cacheRequest = {
		body: {
			operation: 'search_by_hash',
			schema: 'api_cache',
			table: 'request_cache',
			hash_values: [hashAttribute],
			get_attributes: ['*'],
			hdb_user: {
				role: { permission: { super_user: true } },
				username: 'hdbadmin',
			},
		},
	};

	try {
		const result = await hdbCore.requestWithoutAuthentication(cacheRequest);

		if (result) {
			const theRecord = result[0];

			// there is already an origin request in process, do not trigger another one
			if (theRecord.updating) {
				return result;
			}

			// the cache value is expired, trigger new request
			if (
				theRecord.error ||
				theRecord.__updatedtime__ < minCreatedDate ||
				!theRecord.result ||
				!theRecord.content_type ||
				!theRecord.status
			) {
				return false;
			}

			// the cache value is not expired
			return result;
		}
	} catch (e) {
		return false;
	}
};

export default makeCacheRequest;
