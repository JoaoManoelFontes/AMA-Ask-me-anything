CREATE TABLE IF NOT EXISTS answers (
    id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    message_id uuid NOT NULL,
    answer TEXT NOT NULL,
    reaction_count BIGINT NOT NULL DEFAULT 0,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
)

---- create above / drop below ----

DROP TABLE IF EXISTS answers;
