---
title: MySql 基本指令
date: 2020-05-31 10:32:42
categories:
- 开发
- 数据库
---

不做后端开发，不常操作数据库，很容易忘记。记录下自己用到过几条数据库命令。（持续）

连上数据库
```bash
// -u 指向用户， -p 需要密码
mysql -u root -p
```

显示数据库
```bash
show databases;
```

创建数据库
```bash
create database 数据库名字;
```

删除数据库
```bash
drop table 数据库名字;
```

选择数据库
```bash
use 数据库名字;
```

显示表
```bash
show tables;
```

创建表
```bash
create table 表名字;
```

删除表
```bash
drop table 表名字;
```

查看表结构
```bash
show create table 表名字;
```

查看表内容
```bash
select * from 表名字;
```

查看表条数
```bash
select count(*) from 表名字;
```

查看表索引
```bash
show index table 表名字;
```

清空表
```bash
truncate table 表名字;
```

更新数据，注意搜索的值字符串的话要加引号
```bash
update url set 要更新的字段=要更新的值 where 搜索的字段=搜索的值;
```
