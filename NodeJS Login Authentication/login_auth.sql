create table USERS (
id serial primary key not null,
name varchar(255) not null,
email varchar(255) unique not null,
password varchar(64) not null
);

select * from USERS;

insert into users (name, email, password) values (
'Abdullah Zia', 'abdullahkhanzia07@gmail.com', 'skibididob11'
);


insert into users (name, email, password) values (
'Daud Iqbal', 'mdaud002@gmail.com', 'malakand123' 
);

insert into users (name, email, password) values (
'Ahmadyar', 'ahmadyartdur@gmail.com', 'uhcius'
) returning *;

delete from users where id = 4;