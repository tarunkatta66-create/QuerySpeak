import pymysql

conn = pymysql.connect(
    host="localhost",
    user="root",
    password="rootpassword",
    database="queryspeak_app"
)
cursor = conn.cursor()

cursor.execute(
    "INSERT INTO db_connections (id, user_id, name, host, port, username, encrypted_password, database_name) "
    "VALUES (1, 1, 'Default Shop DB', 'localhost', 3306, 'root', 'dummy', 'queryspeak_demo_shop') "
    "ON DUPLICATE KEY UPDATE id=id;"
)
conn.commit()
cursor.close()
conn.close()
print("Default connection added successfully!")