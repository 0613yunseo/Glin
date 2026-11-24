import os
from logging.config import fileConfig

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool

# --- Alembic Config ---
config = context.config

# --- Logging ---
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- Load .env from backend/.env (absolute path, UTF-8) ---
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))  # backend/
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(dotenv_path=ENV_PATH, override=False, encoding="utf-8")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check backend/.env")

from app.core.database import Base, normalize_db_url  # noqa: E402

# Force Alembic to use DATABASE_URL (postgres:// 형식도 허용, % 는 configparser 때문에 이스케이프)
config.set_main_option("sqlalchemy.url", normalize_db_url(DATABASE_URL).replace("%", "%%"))

# --- Import models for autogenerate ---
from app.domains.documents import models as _document_models  # noqa: F401, E402
from app.domains.summaries import models as _summary_models  # noqa: F401, E402

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in offline mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in online mode."""
    connectable = engine_from_config(
        {"sqlalchemy.url": config.get_main_option("sqlalchemy.url")},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
