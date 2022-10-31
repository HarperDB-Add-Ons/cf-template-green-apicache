# HarperDB Green API Cache w/ Carbon Aware API

This repo will relay any API request through a HarperDB Custom Functions endpoint, return a cached version if it has one, or make the API call, store, and return the result if it doesn't.

## GREEN VERSION

This is a twist on the [HarperDB API Cache](https://github.com/HarperDB-Add-Ons/cf-template-apicache) to make it **green**.
This Custom Function uses the Carbon Aware API to determine the carbon impact of the electricity generated for each server location, and routes the request to the server with the lowest amount of impact.

### Green Setup

In addition to the setup steps below, each server needs to be configured with the `setup.js` script.
Run it like so:

`node setup.js [HarperDB_API_URL] [NAME] [LOCATION] [CF_URL] [NAME_OF_PRIMARY] [CLUSTER_HOST_API] [CLUSTER_HOST_NAME]`

Example for the primary:
`node setup.js http://localhost:9905 EAST_NODE eastus http://host.docker.internal:9906 PRIMARY NO NO`

Example for the secondary:
`node setup.js http://localhost:9915 WEST_NODE westus http://host.docker.internal:9916 http://host.docker.internal:9905 host.docker.internal EAST_NODE`

Also, the CARBON_SDK_URL env variable needs to be set to the url of the Carbon Aware API.

---

## Install

To include this project in your custom functions, clone it into your custom_functions folder:

`git clone https://github.com/HarperDB-Add-Ons/cf-template-green-apicache.git [PATH_TO_YOUR_HDB_FOLDER]/custom-functions/api-cache`

## Configure

Next, configure your API Relay's behavior at the top of `[PATH_TO_YOUR_HDB_FOLDER]/custom-functions/api-cache/helpers/handleRequest.js`. Defaults are listed below:

- MAX_AGE_SECONDS = 60
- METHODS_TO_CACHE = `["GET"]`

**After configuring your API Relay, be sure to restart your custom function server so the settings take effect.** You can do this using the `restart_service` operation, or using the `Restart Server` button in the Custom Functions section of [HarperDB Studio](https://studio.harperdb.io).

## Setup

Execute a GET request against `[MY_HDB_CF_SERVER_URL]/api-cache/setup` using Postman, or by just pasting that URL into a browser. This creates a schema and table in your HarperDB instance in which to store your cached replies, if they don't already exist.

## Implement

Finally, modify your application's API calls to hit your HarperDB Api Relay by prepending the API Relay URL to your API URL:

- Old: https://my-api.com/v1/my-endpoint?user=12345
- New: [MY_HDB_CF_SERVER_URL]/api-cache/url?https://my-api.com/v1/my-endpoint?user=12345

---

## @TODO

- Implement a `config filter` to evaluate inbound requests and only allow certain domains or URLs (via Regex) to be relayed.
- Create a `preRequest` handler logic which will modify the inbound request before sending it to the origin API
- Create a `postRequest` handler that will modify the data returned from the API before storing and returning it to the original requestor
- Implement a `Admin UI` to track performance of the origin API endpoints, view cache stats, and manage the configuration details for the app
