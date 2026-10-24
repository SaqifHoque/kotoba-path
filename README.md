# Kotoba Path — Japanese Kanji & Reading Tutor

## Live demo

**[Open the interactive demo](https://kotoba-path.vercel.app/)** — no installation or sign-in required.

Try the learning path, reviews, Kanji Forge, and review history. Progress is saved on this browser. The demo does not provide accounts, cloud synchronization, or the Java-backed encyclopedia and text reader. Self-host the complete stack for those features.

### Build the public demo

```sh
cd frontend
npm ci
npm run build:demo
```

Static output: `frontend/dist/nihongo-trail/browser/`. Deploy that directory to a static host. Demo deployments are snapshots and must be rebuilt and redeployed after source changes.


> Learn Japanese kanji from radicals and visual components, then progress naturally to vocabulary, sentences, and passages. Built with Angular, Java Spring Boot, PostgreSQL, and Docker.

Kotoba Path is a gradual, reading-first Japanese learning web app. It explains how kanji are assembled from radicals and real visual components before asking the learner to use them in context. The included beginner path moves through:

1. radicals and visual mnemonics;
2. kanji assembled from familiar parts;
3. short sentences with reading support;
4. a small passage using learned characters.

Progress is sequential: the API unlocks the next lesson after the current one is completed. The Angular client mirrors the starter curriculum and uses local storage as a demo fallback when the API is offline.

## Features

- a daily study home with guided setup, due-first suggestions, and direct session shortcuts; see [Today](docs/study-home.md);
- optional username/password accounts with recovery keys and cross-device progress; see [learning accounts](docs/accounts.md);
- append-only kanji, vocabulary, and Forge [review history](docs/review-history.md), with offline queuing and duplicate-safe sync;
- gradual radical → kanji → vocabulary → sentence → passage learning path;
- 1,235 frequency-ranked kanji and 321 unique radicals;
- 800 visual components and 8,529 vocabulary entries;
- on'yomi, kun'yomi, meanings, mnemonic stories, and radical explanations;
- search by character, meaning, reading, or estimated JLPT level;
- related-kanji discovery through shared components;
- interactive reader that makes recognized kanji in pasted Japanese text clickable;
- responsive Angular interface and REST API;
- reproducible Docker environment with PostgreSQL persistence.

The catalog is imported from the staged Kanji Alive and Nihongo datasets. The original radical file contains 322 rows, which normalize to 321 unique radical glyphs. Dataset licensing, attribution, and derived-field notes are documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | Angular 17, TypeScript, SCSS, Nginx |
| Backend | Java 11, Spring Boot 2.7, JDBC |
| Database | PostgreSQL 16, Flyway migrations |
| Development | Maven, npm, Docker Compose |

## Architecture

The backend follows SOLID and ports-and-adapters boundaries:

- `domain/model`: immutable learning concepts;
- `domain/port`: repository abstractions;
- `application`: curriculum progression and encyclopedia use cases;
- `infrastructure`: replaceable persistence, dataset importing, and lesson catalog;
- `web`: HTTP controllers and transport concerns.

The frontend separates models, data services, shared UI, and feature components. `LearningService` owns remote/fallback data access while presentation components only render state and emit user intent.

## Run

Requirements: Java 11+, Maven 3.8+, Node 18+, npm 9+.

```bash
cd backend
mvn spring-boot:run
```

In another terminal:

```bash
cd frontend
npm install
npm start
```

Open <http://localhost:4200>. The API runs at <http://localhost:8080>.

## Run with Docker

Build and start the complete application from the project root:

```bash
docker compose up --build
```

Open <http://localhost:4200>. Nginx serves the Angular application and forwards `/api` requests to the Java container. PostgreSQL stores the normalized catalog and imports the staged datasets on the first startup. The backend is also exposed directly at <http://localhost:8080> for API development.

Check container status:

```bash
docker compose ps
```

Stop the application:

```bash
docker compose down
```

Both images use multi-stage builds. Only the Spring Boot JAR and the compiled Angular assets are included in the final runtime images; Maven, Node, source files, and local dependencies remain outside them.

## Verify

```bash
mvn --file backend/pom.xml test
npm --prefix frontend run test:engines
npm --prefix frontend run build
```

GitHub Actions runs both verification paths for every pull request and every
push to `main`. The workflow installs dependencies from the committed lockfile,
validates the generated curriculum, exercises every learning engine, and builds
the production frontend bundle.

Lesson progress is intentionally in-memory and hidden behind `ProgressRepository`. Encyclopedia content uses normalized PostgreSQL tables managed by Flyway and a repository port, keeping data import, persistence, application logic, and HTTP transport separate.

## Content snapshot

| Content | Current total |
| --- | ---: |
| Kanji | 1,235 |
| Unique radicals | 321 |
| Visual components | 800 |
| Vocabulary entries | 8,529 |
| Radical illustrations | 247 |
| Starter lessons | 8 |
| Starter example sentences | 3 |

The encyclopedia can be expanded through the importer without coupling source-data parsing to the learning domain or HTTP layer.

## License and attribution

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [datasets/README.md](datasets/README.md) before redistributing the included datasets or derived database content.

Forge and vocabulary now provide clearer answer feedback, with synced personal Forge meaning synonyms. See [answer checking](docs/answer-checking.md).

Plan your study time with Today’s [review forecast](docs/review-forecast.md): upcoming kanji, vocabulary, and Forge questions over 24 hours or seven days.

Learning progress saves automatically. Use Settings for account access and [progress downloads/imports](docs/saving-and-imports.md), with a preview before applying a file.
