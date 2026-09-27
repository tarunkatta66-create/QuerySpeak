"""
Read-Only MySQL User Creation SQL:
-----------------------------------
CREATE USER IF NOT EXISTS 'queryspeak_ro'@'%' IDENTIFIED BY 'readonly_password';
GRANT SELECT ON queryspeak_demo_shop.* TO 'queryspeak_ro'@'%';
FLUSH PRIVILEGES;
"""

import sys
import os
import random
from datetime import datetime, timedelta
from faker import Faker
import pymysql
from tabulate import tabulate

# Add parent dir to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Database configuration
HOST = os.getenv("MYSQL_HOST", "localhost")
PORT = int(os.getenv("MYSQL_PORT", "3306"))
USER = os.getenv("MYSQL_USER", "root")
PASSWORD = os.getenv("MYSQL_PASSWORD", "rootpassword")
DB_NAME = "queryspeak_demo_shop"

INDIAN_CITIES = [
    "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata",
    "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane",
    "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad",
    "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar"
]

CATEGORY_NAMES = [
    "Electronics & Gadgets",
    "Fashion & Apparel",
    "Home & Kitchen",
    "Beauty & Personal Care",
    "Books & Stationery",
    "Sports & Fitness",
    "Toys & Games",
    "Automotive Accessories",
    "Groceries & Gourmet",
    "Health & Wellness",
    "Footwear",
    "Jewelry & Watches"
]


def seed_database():
    print(f"Connecting to MySQL at {HOST}:{PORT}...")
    # Connect without database first to ensure DB exists
    conn = pymysql.connect(host=HOST, port=PORT, user=USER, password=PASSWORD, autocommit=True)
    with conn.cursor() as cursor:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME};")
    conn.close()

    # Reconnect to target database
    conn = pymysql.connect(
        host=HOST,
        port=PORT,
        user=USER,
        password=PASSWORD,
        database=DB_NAME,
        autocommit=False
    )
    cursor = conn.cursor()

    try:
        print("Creating e-commerce tables...")
        # Create Tables with FK constraints and indexes
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE
        ) ENGINE=InnoDB;
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category_id INT NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            stock_quantity INT NOT NULL,
            CONSTRAINT fk_products_categories FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
            INDEX idx_products_category (category_id)
        ) ENGINE=InnoDB;
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            city VARCHAR(255) NOT NULL,
            signup_date DATE NOT NULL
        ) ENGINE=InnoDB;
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT NOT NULL,
            order_date DATETIME NOT NULL,
            status VARCHAR(50) NOT NULL,
            CONSTRAINT fk_orders_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
            INDEX idx_orders_customer (customer_id)
        ) ENGINE=InnoDB;
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            unit_price DECIMAL(10, 2) NOT NULL,
            CONSTRAINT fk_order_items_orders FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            CONSTRAINT fk_order_items_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            INDEX idx_order_items_order (order_id),
            INDEX idx_order_items_product (product_id)
        ) ENGINE=InnoDB;
        """)

        print("Ensuring idempotency (truncating existing data in reverse FK order)...")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        cursor.execute("TRUNCATE TABLE order_items;")
        cursor.execute("TRUNCATE TABLE orders;")
        cursor.execute("TRUNCATE TABLE customers;")
        cursor.execute("TRUNCATE TABLE products;")
        cursor.execute("TRUNCATE TABLE categories;")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

        fake = Faker("en_IN")
        Faker.seed(42)
        random.seed(42)

        # 1. Seed Categories (12)
        print("Seeding 12 categories...")
        category_ids = []
        for name in CATEGORY_NAMES:
            cursor.execute("INSERT INTO categories (name) VALUES (%s);", (name,))
            category_ids.append(cursor.lastrowid)

        # 2. Seed Products (150)
        print("Seeding 150 products...")
        product_records = []
        for i in range(150):
            cat_id = random.choice(category_ids)
            p_name = f"{fake.company().split()[0]} {fake.word().capitalize()} {random.choice(['Pro', 'Max', 'Ultra', 'Lite', 'Plus', 'Classic'])}"
            price = round(random.uniform(199.00, 25000.00), 2)
            stock = random.randint(10, 500)
            cursor.execute(
                "INSERT INTO products (name, category_id, price, stock_quantity) VALUES (%s, %s, %s, %s);",
                (p_name, cat_id, price, stock)
            )
            product_records.append((cursor.lastrowid, price))

        # 3. Seed Customers (300)
        print("Seeding 300 customers with Indian city names...")
        customer_ids = []
        now = datetime.now()
        start_date = now - timedelta(days=365)
        for _ in range(300):
            name = fake.name()
            email = fake.unique.email()
            city = random.choice(INDIAN_CITIES)
            signup_date = fake.date_between(start_date=start_date, end_date=now)
            cursor.execute(
                "INSERT INTO customers (full_name, email, city, signup_date) VALUES (%s, %s, %s, %s);",
                (name, email, city, signup_date)
            )
            customer_ids.append(cursor.lastrowid)

        # 4. Seed Orders (800) and Order Items
        print("Seeding 800 orders and order items...")
        order_statuses = ["COMPLETED", "COMPLETED", "COMPLETED", "PENDING", "SHIPPED", "CANCELLED"]
        order_ids = []
        for _ in range(800):
            cust_id = random.choice(customer_ids)
            order_date = fake.date_time_between(start_date=start_date, end_date=now)
            status = random.choice(order_statuses)
            cursor.execute(
                "INSERT INTO orders (customer_id, order_date, status) VALUES (%s, %s, %s);",
                (cust_id, order_date, status)
            )
            order_id = cursor.lastrowid
            order_ids.append(order_id)

            # 1-5 order items per order
            item_count = random.randint(1, 5)
            selected_products = random.sample(product_records, item_count)
            for prod_id, prod_price in selected_products:
                qty = random.randint(1, 4)
                cursor.execute(
                    "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (%s, %s, %s, %s);",
                    (order_id, prod_id, qty, prod_price)
                )

        conn.commit()

        # Summary Row Counts
        summary = []
        tables = ["categories", "products", "customers", "orders", "order_items"]
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table};")
            count = cursor.fetchone()[0]
            summary.append([table, count])

        print("\n" + "="*40)
        print(" DEMO SHOP DATABASE SEED SUMMARY ")
        print("="*40)
        print(tabulate(summary, headers=["Table", "Row Count"], tablefmt="grid"))

    except Exception as e:
        conn.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    seed_database()
