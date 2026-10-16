create table learner_account (
    id varchar(36) primary key,
    username varchar(40) not null unique,
    password_hash varchar(256) not null,
    recovery_hash varchar(64) not null,
    profile_id varchar(36) not null unique references study_profile(id)
);

create table account_session (
    token_hash varchar(64) primary key,
    account_id varchar(36) not null references learner_account(id),
    expires_at bigint not null
);
create index account_session_expiry on account_session(expires_at);

create table account_rate_limit (
    address_hash varchar(64) primary key,
    window_start bigint not null,
    attempts integer not null
);
