create table study_profile (
    id varchar(36) primary key,
    revision bigint not null default 0,
    state_json text not null
);
