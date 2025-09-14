FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/

COPY ingest/ ./ingest/
EXPOSE 8000

ENV OPENAI_API_KEY=

CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
