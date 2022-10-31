import axios from 'axios';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('config.json'));

const SCHEMA = 'hdb_green';
const TABLES = ['nodes'];
const token = Buffer.from(`${config.username}:${config.password}`).toString('base64');
const [hdbUrl, nodeName, location, url, primaryHost, clusterHost, clusterNodeName] = process.argv.slice(2);
console.log('hdbUrl', hdbUrl);
console.log('nodeName', nodeName);
console.log('location', location);
console.log('url', url);
console.log('primaryHost', primaryHost);
console.log('clusterHost', clusterHost);
console.log('clusterNodeName', clusterNodeName);
let carbonLocation = '';

///
// CREATE SCHEMA
///
if (primaryHost === 'PRIMARY') {
	try {
		await axios({
			url: hdbUrl,
			method: 'POST',
			headers: {
				authorization: `Basic ${token}`,
			},
			data: {
				operation: 'create_schema',
				schema: SCHEMA,
			},
		});
		console.log('SCHEMA CREATED!');
	} catch (error) {
		console.log('ERROR: UNABLE TO CREATE SCHEMA!');
	}
}

///
// CREATE TABLES
///
if (primaryHost === 'PRIMARY') {
	for (const table of TABLES) {
		try {
			await axios({
				url: hdbUrl,
				method: 'POST',
				headers: {
					authorization: `Basic ${token}`,
				},
				data: {
					operation: 'create_table',
					schema: SCHEMA,
					table,
					hash_attribute: 'id',
				},
			});
			console.log('TABLE CREATED!', table);
		} catch (error) {
			console.log('ERROR: UNABLE TO CREATE TABLE!', table);
		}
	}
	await new Promise((r) => setTimeout(r, 1500));
}

///
// CLUSTERING
///
if (clusterHost !== 'NO') {
	try {
		const { data } = await axios({
			url: hdbUrl,
			method: 'POST',
			headers: {
				authorization: `Basic ${token}`,
			},
			data: {
				operation: 'add_node',
				name: clusterNodeName,
				host: clusterHost,
				port: 12345,
				subscriptions: [
					{
						channel: 'hdb_green:nodes',
						subscribe: true,
						publish: true,
					},
					{
						channel: 'hdb_green:models',
						subscribe: true,
						publish: true,
					},
				],
			},
		});
		console.log('data', data);
	} catch (error) {
		console.log('ERROR: CLUSTERING!');
	}
}
await new Promise((r) => setTimeout(r, 5000));

///
// GET LOCATION
///
try {
	console.log('GETTING LOCATION');
	const time = new Date();
	time.setMinutes(time.getMinutes() + 10);
	const url = `${config.carbonSdkUrl}/emissions/forecasts/current?location=${location}&dataEndAt=${time.toISOString()}`;
	const { data: forecast } = await axios(url);
	carbonLocation = forecast[0].forecastData[0].location;
	console.log('LOCATION FOUND', carbonLocation);
} catch (error) {
	console.log('ERROR: CARBON LOCATION');
}

///
// ADD NODE
///
let nodes = [];
if (primaryHost !== 'PRIMARY') {
	console.log('RETRIEVING NODES DATA!');
	try {
		const { data } = await axios({
			url: primaryHost,
			method: 'POST',
			headers: {
				authorization: `Basic ${token}`,
			},
			data: {
				operation: 'search_by_value',
				schema: SCHEMA,
				table: 'nodes',
				search_attribute: 'id',
				search_value: '*',
				get_attributes: ['*'],
			},
		});
		nodes = data;
		console.log('RETRIEVED NODES DATA!');
	} catch (error) {
		console.log('ERROR: RETRIEVING NODES DATA');
	}
}
// ADD THIS NODE
nodes.push({
	id: nodeName,
	location,
	url,
	sdkLocation: carbonLocation,
	impact: -1,
});

try {
	console.log('ADDING NODE');
	await axios({
		url: hdbUrl,
		method: 'POST',
		headers: {
			authorization: `Basic ${token}`,
		},
		data: {
			operation: 'insert',
			schema: SCHEMA,
			table: 'nodes',
			records: nodes,
		},
	});
	console.log('NODE ADDED!');
} catch (error) {
	console.log('ERROR: UNABLE TO ADD NODE!');
}
