#!/usr/bin/env python3
"""
SQLite dan PostgreSQL ga ma'lumotlarni ko'chirish skripti
"""

import sqlite3
import psycopg2
import json
import os
from datetime import datetime

# PostgreSQL connection settings
PG_CONFIG = {
    'host': 'localhost',
    'database': 'smart_trash_system',
    'user': 'postgres',
    'password': 'password123'
}

def migrate_data():
    """SQLite dan PostgreSQL ga ma'lumotlarni ko'chirish"""
    
    # SQLite connection
    sqlite_conn = sqlite3.connect('tozahudud.db')
    sqlite_cursor = sqlite_conn.cursor()
    
    # PostgreSQL connection
    pg_conn = psycopg2.connect(**PG_CONFIG)
    pg_cursor = pg_conn.cursor()
    
    try:
        print("🔄 Ma'lumotlar ko'chirilmoqda...")
        
        # 1. Users migration
        print("👥 Foydalanuvchilar ko'chirilmoqda...")
        sqlite_cursor.execute("SELECT user_id, name, phone, created_at FROM users")
        users = sqlite_cursor.fetchall()
        
        for user_id, name, phone, created_at in users:
            pg_cursor.execute("""
                INSERT INTO telegram_users (telegram_id, name, phone, created_at) 
                VALUES (%s, %s, %s, %s) 
                ON CONFLICT (telegram_id) DO UPDATE SET 
                name = EXCLUDED.name, phone = EXCLUDED.phone
            """, (user_id, name, phone, created_at))
        
        # 2. Problems migration
        print("📝 Murojaatlar ko'chirilmoqda...")
        sqlite_cursor.execute("""
            SELECT user_id, description, media_type, file_id, latitude, longitude, status, created_at 
            FROM problems
        """)
        problems = sqlite_cursor.fetchall()
        
        for user_id, desc, media_type, file_id, lat, lon, status, created_at in problems:
            pg_cursor.execute("""
                INSERT INTO telegram_reports (telegram_user_id, description, media_type, file_id, 
                                            latitude, longitude, status, created_at) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (user_id, desc, media_type, file_id, lat, lon, status, created_at))
        
        # 3. Ratings migration
        print("⭐ Baholashlar ko'chirilmoqda...")
        sqlite_cursor.execute("SELECT user_id, rating, created_at FROM ratings")
        ratings = sqlite_cursor.fetchall()
        
        for user_id, rating, created_at in ratings:
            pg_cursor.execute("""
                INSERT INTO telegram_ratings (telegram_user_id, rating, created_at) 
                VALUES (%s, %s, %s)
            """, (user_id, rating, created_at))
        
        # 4. Feedbacks migration
        print("💬 Fikrlar ko'chirilmoqda...")
        sqlite_cursor.execute("SELECT user_id, text, created_at FROM feedbacks")
        feedbacks = sqlite_cursor.fetchall()
        
        for user_id, text, created_at in feedbacks:
            pg_cursor.execute("""
                INSERT INTO telegram_feedbacks (telegram_user_id, feedback_text, created_at) 
                VALUES (%s, %s, %s)
            """, (user_id, text, created_at))
        
        pg_conn.commit()
        print("✅ Barcha ma'lumotlar muvaffaqiyatli ko'chirildi!")
        
    except Exception as e:
        print(f"❌ Xatolik: {e}")
        pg_conn.rollback()
    finally:
        sqlite_conn.close()
        pg_conn.close()

def create_telegram_tables():
    """PostgreSQL da Telegram uchun jadvallar yaratish"""
    
    pg_conn = psycopg2.connect(**PG_CONFIG)
    pg_cursor = pg_conn.cursor()
    
    try:
        # Telegram users table
        pg_cursor.execute("""
            CREATE TABLE IF NOT EXISTS telegram_users (
                id SERIAL PRIMARY KEY,
                telegram_id BIGINT UNIQUE NOT NULL,
                name VARCHAR(255),
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Telegram reports table
        pg_cursor.execute("""
            CREATE TABLE IF NOT EXISTS telegram_reports (
                id SERIAL PRIMARY KEY,
                telegram_user_id BIGINT REFERENCES telegram_users(telegram_id),
                description TEXT NOT NULL,
                media_type VARCHAR(50),
                file_id VARCHAR(255),
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                status VARCHAR(50) DEFAULT 'Kutilmoqda',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Telegram ratings table
        pg_cursor.execute("""
            CREATE TABLE IF NOT EXISTS telegram_ratings (
                id SERIAL PRIMARY KEY,
                telegram_user_id BIGINT REFERENCES telegram_users(telegram_id),
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Telegram feedbacks table
        pg_cursor.execute("""
            CREATE TABLE IF NOT EXISTS telegram_feedbacks (
                id SERIAL PRIMARY KEY,
                telegram_user_id BIGINT REFERENCES telegram_users(telegram_id),
                feedback_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        pg_conn.commit()
        print("✅ PostgreSQL jadvallar yaratildi!")
        
    except Exception as e:
        print(f"❌ Jadval yaratishda xatolik: {e}")
        pg_conn.rollback()
    finally:
        pg_conn.close()

if __name__ == "__main__":
    print("🚀 Telegram Bot ma'lumotlarini PostgreSQL ga ko'chirish")
    print("=" * 50)
    
    # 1. PostgreSQL jadvallar yaratish
    create_telegram_tables()
    
    # 2. Ma'lumotlarni ko'chirish
    migrate_data()
    
    print("=" * 50)
    print("🎉 Jarayon yakunlandi!")