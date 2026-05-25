CREATE TABLE persist_messages
(
    id             UUID         NOT NULL,
    data_type      VARCHAR(255) NOT NULL,
    data           TEXT         NOT NULL,
    created        TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    retry_count    INTEGER      NOT NULL,
    message_status VARCHAR(255) NOT NULL,
    delivery_type  VARCHAR(255) NOT NULL,
    version        BIGINT,
    CONSTRAINT pk_persist_messages PRIMARY KEY (id)
);
