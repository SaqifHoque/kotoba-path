# Dataset staging

Only reading-oriented language data and radical character images are staged here. Stroke-order SVGs, stroke timing, video animations, audio, handwriting, and drawing material are intentionally excluded.

## Included sources

- `kanji-alive/ka_data.csv`: 1,235 kanji, readings, meanings, primary radicals, and example words.
- `kanji-alive/japanese-radicals.csv`: 322 radical and variant records.
- `kanji-alive/radical-characters/`: 247 static radical character SVGs.
- `nihongo/components-kc.csv`: kanji-to-component relationships.
- `nihongo/wordlex-2011.txt`: source ordering used to derive frequency ranks.
- `nihongo/dictionary-word-data.json`: staged for future richer JMdict imports; it is not required by the current startup importer.

The deterministic Java importer is `CatalogDatasetImporter`. Flyway creates the normalized relational model before the importer runs. Re-import into a clean database by removing the Docker volume:

```bash
docker compose down -v
docker compose up --build
```

See the source attribution files in each directory and `THIRD_PARTY_NOTICES.md` at the project root before redistributing data or derived databases.
