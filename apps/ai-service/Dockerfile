FROM python:3.12-slim

WORKDIR /app

RUN addgroup --system --gid 1001 pyapp && adduser --system --uid 1001 --ingroup pyapp roamera

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

RUN chown -R roamera:pyapp /app
USER roamera

EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
