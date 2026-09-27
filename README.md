# QuerySpeak

Natural language query engine and analytics platform.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start infrastructure services (MySQL & Redis):
   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```

3. Run App Metadata Database Migrations (Alembic):
   ```bash
   cd apps/api
   alembic upgrade head
   ```

4. Seed Target Demo Database (`queryspeak_demo_shop`):
   ```bash
   cd apps/api
   python scripts/seed_demo_db.py
   ```

5. Run the Web frontend application:
   ```bash
   pnpm --filter web dev
   ```

6. Run the API backend application:
   ```bash
   cd apps/api
   uvicorn app.main:app --reload
   ```
