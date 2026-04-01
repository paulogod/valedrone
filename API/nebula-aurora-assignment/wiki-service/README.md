# Wiki Service - FastAPI Application

This is the FastAPI service that implements the business logic for the Wikipedia-like API.

## Structure

- `app/` - Application source code
  - `main.py` - FastAPI endpoints
  - `models.py` - SQLAlchemy models
  - `schemas.py` - Pydantic schemas
  - `database.py` - Database configuration
  - `metrics.py` - Prometheus metrics

## Docker Image Build

To build the Docker image:

```bash
docker build -t wiki-service:latest .
```

## Environment Variables

- `DATABASE_URL`: PostgreSQL database connection URL (default: SQLite for local development)

## Local Execution

```bash
# With SQLite (development)
uvicorn app.main:app --reload

# With PostgreSQL
export DATABASE_URL="postgresql+asyncpg://user:password@localhost:5432/wiki_db"
uvicorn app.main:app --reload
```
