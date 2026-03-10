.PHONY: help up down build restart logs test lint fmt clean seed superuser migrate shell

help:
	@echo "NeoCore - Available Commands:"
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make build       - Build all containers"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - View logs (all services)"
	@echo "  make test        - Run all tests"
	@echo "  make lint        - Run linters"
	@echo "  make fmt         - Format code"
	@echo "  make clean       - Clean up containers and volumes"
	@echo "  make seed        - Load seed data"
	@echo "  make superuser   - Create Django superuser"
	@echo "  make migrate     - Run Django migrations"
	@echo "  make shell       - Open Django shell"

up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

restart:
	docker-compose restart

logs:
	docker-compose logs -f

logs-web:
	docker-compose logs -f web

logs-frontend:
	docker-compose logs -f frontend

test:
	docker-compose exec web pytest
	docker-compose exec frontend npm run test

lint:
	docker-compose exec web ruff check .
	docker-compose exec frontend npm run lint

fmt:
	docker-compose exec web ruff format .
	docker-compose exec web ruff check --fix .
	docker-compose exec frontend npm run format

clean:
	docker-compose down -v
	rm -rf backend/__pycache__
	rm -rf frontend/.next
	rm -rf frontend/node_modules

seed:
	docker-compose exec web python manage.py loaddata seed_data

superuser:
	docker-compose exec web python manage.py createsuperuser

migrate:
	docker-compose exec web python manage.py makemigrations
	docker-compose exec web python manage.py migrate

shell:
	docker-compose exec web python manage.py shell

migrations:
	docker-compose exec web python manage.py makemigrations

psql:
	docker-compose exec db psql -U neocore_user -d neocore_db

redis-cli:
	docker-compose exec redis redis-cli
