cf=green-api-cache

default: dev
cfr: cf_restart

dev: down
	(sleep 15 \
		&& node setup.js http://localhost:9905 EAST_NODE eastus http://host.docker.internal:9906 PRIMARY NO NO) & \
	docker run \
		-v $(shell pwd):/opt/harperdb/hdb/custom_functions/$(cf) \
		-e LOG_LEVEL=error \
		-e HDB_ADMIN_USERNAME=hdbcf \
		-e HDB_ADMIN_PASSWORD=hdbcf \
		-e LOG_TO_STDSTREAMS=true \
		-e RUN_IN_FOREGROUND=true \
		-e CUSTOM_FUNCTIONS=true \
		-e SERVER_PORT=9925 \
		-e CUSTOM_FUNCTIONS_PORT=9926 \
		-e MAX_CUSTOM_FUNCTION_PROCESSES=1 \
		-e CLUSTERING=true \
		-e CLUSTERING_PORT=12345 \
		-e CLUSTERING_USER=hdbcfc \
		-e CLUSTERING_PASSWORD=hdbcfc \
		-e NODE_NAME=EAST_NODE \
		-e CARBON_SDK_URL=http://host.docker.internal:8080 \
		-e TTL=6000 \
		-p 12345:12345 \
		-p 9905:9925 \
		-p 9906:9926 \
		harperdb/harperdb:latest

two:
	(sleep 15 \
		&& node setup.js http://localhost:9915 WEST_NODE westus http://host.docker.internal:9916 http://host.docker.internal:9905 host.docker.internal EAST_NODE) & \
	docker run \
		-v $(shell pwd):/opt/harperdb/hdb/custom_functions/$(cf) \
		-e LOG_LEVEL=error \
		-e HDB_ADMIN_USERNAME=hdbcf \
		-e HDB_ADMIN_PASSWORD=hdbcf \
		-e LOG_TO_STDSTREAMS=true \
		-e RUN_IN_FOREGROUND=true \
		-e CUSTOM_FUNCTIONS=true \
		-e SERVER_PORT=9925 \
		-e CUSTOM_FUNCTIONS_PORT=9926 \
		-e MAX_CUSTOM_FUNCTION_PROCESSES=1 \
		-e CLUSTERING=true \
		-e CLUSTERING_PORT=12345 \
		-e CLUSTERING_USER=hdbcfc \
		-e CLUSTERING_PASSWORD=hdbcfc \
		-e NODE_NAME=WEST_NODE \
		-e CARBON_SDK_URL=http://host.docker.internal:8080 \
		-e TTL=6000 \
		-p 9915:9925 \
		-p 9916:9926 \
		harperdb/harperdb:latest

bash:
	docker run \
		-it \
		-v $(shell pwd):/opt/harperdb/hdb/custom_functions/$(cf) \
		harperdb/harperdb:latest \
		bash

cf_restart:
	curl http://localhost:9905 \
		-X POST \
		-H "Content-Type: application/json" \
		-H "Authorization: Basic aGRiY2Y6aGRiY2Y=" \
		-d '{"operation": "restart_service", "service": "custom_functions"}' && \
	curl http://localhost:9915 \
		-X POST \
		-H "Content-Type: application/json" \
		-H "Authorization: Basic aGRiY2Y6aGRiY2Y=" \
		-d '{"operation": "restart_service", "service": "custom_functions"}'

down:
	docker stop $(shell docker ps -q --filter ancestor=harperdb/harperdb ) || exit 0
