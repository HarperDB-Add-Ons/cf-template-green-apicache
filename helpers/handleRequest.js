import { parse } from 'url';

import md5 from '../helpers/md5.js';
import makeCacheRequest from '../helpers/makeCacheRequest.js';
import saveResultToCache from '../helpers/saveResultToCache.js';
import setRecordToUpdating from '../helpers/setRecordToUpdating.js';
import callAPI from '../helpers/callAPI.js';

const MAX_AGE_SECONDS = 60;
const METHODS_TO_CACHE = ['GET'];

const handleRequest = async ({
	hdbCore,
	request,
	reply,
	logger,
	headers,
	reqShouldCache,
	max_age_seconds = MAX_AGE_SECONDS,
}) => {
	const url = parse(request.req.url.substr(request.req.url.indexOf('?')).replace('?', ''));
	const method = request.method;
	const start = Date.now();
	const minCreatedDate = start - max_age_seconds * 1000;
	let shouldCache;
	if (reqShouldCache === undefined) shouldCache = METHODS_TO_CACHE.includes(method);
	else shouldCache = reqShouldCache;
	let cacheResult = false;
	const hashAttribute = md5(`${method}${url.href}`);
	const source = request.hostname;

	if (shouldCache) {
		cacheResult = await makeCacheRequest({
			hdbCore,
			hashAttribute,
			minCreatedDate,
		});
	}

	if (cacheResult?.length) {
		reply.header('hdb-from-cache', true);

		const { result, content_type, status } = cacheResult[0];

		reply.header('content-type', content_type);

		return { status_code: status, response_body: result };
	} else {
		reply.header('hdb-from-cache', false);

		try {
			let recordExists = false;
			if (shouldCache) {
				const result = await setRecordToUpdating({ hdbCore, hashAttribute });
				recordExists = result.update_hashes.length > 0;
			}

			const response = await callAPI({ request, url, headers });
			const { content_type } = response;
			const result = response.body;
			const status = response.statusCode;
			const error = response.statusCode < 200 || response.statusCode > 299;
			const duration_ms = Date.now() - start;

			reply.header('content-type', content_type);

			if (shouldCache) {
				await saveResultToCache({
					hdbCore,
					hashAttribute,
					result,
					error,
					status,
					content_type,
					source,
					duration_ms,
					recordExists,
				});
			}

			return { status_code: response.statusCode, response_body: response.body };
		} catch (error) {
			const result = error.message;

			reply.header('content-type', 'application/json; charset=utf-8');

			await saveResultToCache({ hdbCore, hashAttribute, result, error: true });

			return { status_code: 500, response_body: error.message };
		}
	}
};

export default handleRequest;
