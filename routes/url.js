import axios from 'axios';
const SCHEMA = 'hdb_green';
const { LOCATION, NODE_NAME } = process.env;

import { findGreenestNode } from '../helpers/greenHelper.js';
import handleRequest from '../helpers/handleRequest.js';
import handleResponse from '../helpers/handleResponse.js';

export default async (server, { hdbCore, logger }) => {
	server.route({
		url: '/url',
		method: ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT', 'OPTIONS'],
		preValidation: async (request, reply, done) => {
			// FIND BEST LOCATION
			if (request.query.green === 'GREEN') {
				return done();
			}
			const node = await findGreenestNode({ hdbCore, logger, schema: SCHEMA, table: 'nodes' });
			reply.header('hdb-greenest-node', node.id);
			if (node.id === NODE_NAME) return done();
			reply.header('hdb-rerouted', 'true');
			const { data } = await axios(`${node.url}${request.url}?green=GREEN`);
			return reply.code(200).send(data);
		},
		handler: async (request, reply) => {
			const result = await handleRequest({
				hdbCore,
				request,
				reply,
				logger,
			});

			const response = { reply, ...result };

			return handleResponse(response);
		},
	});
};
