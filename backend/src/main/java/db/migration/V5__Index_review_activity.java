package db.migration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nihongo.learning.application.ReviewActivityFields;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

/** Add projections without changing immutable JSON, receipt identities or history cursors. */
public class V5__Index_review_activity extends BaseJavaMigration {
    private static final int BATCH_SIZE = 500;
    private static final class Row {
        final long sequence;
        final ReviewActivityFields fields;
        Row(long sequence, ReviewActivityFields fields) { this.sequence = sequence; this.fields = fields; }
    }

    @Override
    public void migrate(Context context) throws Exception {
        Connection connection = context.getConnection();
        try (Statement statement = connection.createStatement()) {
            statement.execute("alter table review_event add column occurred_at bigint");
            statement.execute("alter table review_event add column skill varchar(12)");
        }
        ObjectMapper json = new ObjectMapper();
        long cursor = 0;
        while (true) {
            List<Row> rows = new ArrayList<>();
            try (PreparedStatement select = connection.prepareStatement(
                    "select sequence_id,event_json from review_event where sequence_id>? order by sequence_id limit ?")) {
                select.setLong(1, cursor);
                select.setInt(2, BATCH_SIZE);
                try (ResultSet result = select.executeQuery()) {
                    while (result.next()) {
                        long sequence = result.getLong("sequence_id");
                        try { rows.add(new Row(sequence, ReviewActivityFields.from(json.readTree(result.getString("event_json"))))); }
                        catch (Exception error) { throw new IllegalStateException("Cannot project review receipt sequence " + sequence, error); }
                    }
                }
            }
            if (rows.isEmpty()) break;
            try (PreparedStatement update = connection.prepareStatement(
                    "update review_event set occurred_at=?,skill=? where sequence_id=?")) {
                for (Row row : rows) {
                    update.setLong(1, row.fields.occurredAt);
                    update.setString(2, row.fields.skill);
                    update.setLong(3, row.sequence);
                    update.addBatch();
                }
                update.executeBatch();
            }
            cursor = rows.get(rows.size() - 1).sequence;
        }
        try (Statement statement = connection.createStatement()) {
            statement.execute("alter table review_event alter column occurred_at set not null");
            statement.execute("alter table review_event alter column skill set not null");
            statement.execute("alter table review_event add constraint review_event_activity_time check (occurred_at between 0 and 8640000000000000)");
            statement.execute("alter table review_event add constraint review_event_activity_skill check (skill in ('meaning','reading','both'))");
            statement.execute("create index review_event_activity_day on review_event(profile_id,kind,occurred_at)");
            statement.execute("create index review_event_activity_skill_day on review_event(profile_id,kind,skill,occurred_at)");
        }
    }
}
