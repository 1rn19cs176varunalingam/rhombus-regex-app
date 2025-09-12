FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/

COPY ingest/ ./ingest/
EXPOSE 8000

ENV OPENAI_API_KEY=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

CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
