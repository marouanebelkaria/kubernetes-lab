FROM postgres:16-alpine

LABEL org.opencontainers.image.title="kubernetes-lab-postgres"
LABEL org.opencontainers.image.version="1.0.0"

# Le script init.sql sera execute au premier demarrage
COPY init.sql /docker-entrypoint-initdb.d/

# Valeurs par defaut — POSTGRES_PASSWORD sera toujours fourni au runtime
ENV POSTGRES_DB=labdb
ENV POSTGRES_USER=labuser

# Verification que PostgreSQL accepte les connexions
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD ["pg_isready", "-U", "labuser", "-d", "labdb"]

EXPOSE 5432