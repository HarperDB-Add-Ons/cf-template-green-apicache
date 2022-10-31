import axios from 'axios';

const { CARBON_SDK_URL, TTL } = process.env;

export const findGreenestNode = async ({ hdbCore, logger, schema, table }) => {
	const nodes = await hdbCore.requestWithoutAuthentication({
		body: {
			operation: 'search_by_value',
			schema,
			table,
			search_attribute: 'id',
			search_value: '*',
			get_attributes: ['*'],
		},
	});

	const missingImpact = nodes.filter((n) => n.impact === -1).length > 0;
	if (Date.now() - nodes[0].__updatedtime__ > TTL || missingImpact) {
		const locations = nodes.map((n) => 'location=' + n.location).join('&');
		const url = `${CARBON_SDK_URL}/emissions/bylocations?${locations}`;
		const { data: emissions } = await axios(url);

		const emissionsMap = emissions.reduce((a, b) => {
			a[b.location] = b.rating;
			return a;
		}, {});

		nodes.forEach((node) => {
			node.impact = emissionsMap[node.sdkLocation];
		});
		const records = nodes.map((node) => ({ id: node.id, impact: node.impact }));
		try {
			await hdbCore.requestWithoutAuthentication({
				body: {
					operation: 'update',
					schema,
					table,
					records,
				},
			});
		} catch (error) {
			console.log('error22', error);
		}
	}

	nodes.sort((a, b) => (a.impact > b.impact ? 1 : -1));
	return nodes[0];
};
