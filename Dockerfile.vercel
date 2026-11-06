FROM node:20-bookworm-slim AS frontend
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM maven:3.9.9-eclipse-temurin-17 AS backend
WORKDIR /build/backend
COPY backend/pom.xml ./
RUN mvn -B dependency:go-offline
COPY backend/src ./src
COPY --from=frontend /build/frontend/dist/nihongo-trail/browser/ ./src/main/resources/static/
COPY THIRD_PARTY_NOTICES.md ./src/main/resources/static/THIRD_PARTY_NOTICES.md
RUN mvn -B package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
RUN groupadd --system kotoba && useradd --system --gid kotoba kotoba
COPY --from=backend --chown=kotoba:kotoba /build/backend/target/learning-api-*.jar ./app.jar
USER kotoba
ENV PORT=8080 FORWARD_HEADERS_STRATEGY=native
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=65.0", "-jar", "/app/app.jar"]
