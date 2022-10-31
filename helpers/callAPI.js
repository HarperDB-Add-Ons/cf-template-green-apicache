import https from 'https';
import http from 'http';

const httpAgent = new http.Agent();
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const callAPI = ({ request, url }) => {
	return new Promise((resolve, reject) => {
		const callback = (response) => {
			let str = '';

			response.on('data', (chunk) => {
				str += chunk;
			});
			response.on('end', () => {
				const content_type =
					response.headers && response.headers['content-type'] ? response.headers['content-type'] : 'text/plain';

				try {
					resolve({
						body: str,
						statusCode: response.statusCode,
						content_type,
					});
				} catch (error) {
					resolve({
						body: str,
						statusCode: response.statusCode,
						content_type,
					});
				}
			});
		};

		const body = request.body ? JSON.stringify(request.body) : false;
		const options = {
			host: url.host,
			port: url.protocol === 'https:' ? 443 : 80,
			protocol: url.protocol,
			path: url.path,
			method: request.method,
			agent: url.protocol === 'https:' ? httpsAgent : httpAgent,
			headers: request.headers,
		};
		delete options.headers.host;

		const req = (options.protocol === 'https:' ? https : http).request(options, callback);
		req.on('error', (error) => {
			reject(error);
		});
		if (body) {
			req.write(body);
		}
		req.end();
	});
};

export default callAPI;
