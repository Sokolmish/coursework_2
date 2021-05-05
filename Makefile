.PHONY: build

build:
	docker build -t cwork2_server -f Dockerfile.server .
	docker build -t cwork2_database -f Dockerfile.database .
