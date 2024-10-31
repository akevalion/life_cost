FROM python:3.10-alpine

RUN apk add --no-cache \
    gcc \
    musl-dev \
    mariadb-dev \
    linux-headers \
    libffi-dev \
    pkgconfig

WORKDIR /app
COPY . /app
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

EXPOSE 3000
CMD ["python", "./index.py"]