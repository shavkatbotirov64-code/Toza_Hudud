#!/usr/bin/env python3
"""
Test foydalanuvchi qo'shish skripti
"""

import sqlite3
from datetime import datetime

DB_NAME = "tozahudud.db"

def add_test_user():
    """Test foydalanuvchi qo'shish"""
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    try:
        # Yangi test foydalanuvchi
        user_id = 1006
        name = "Test Foydalanuvchi"
        phone = "+998906789012"
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Foydalanuvchini qo'shish
        cursor.execute('''
            INSERT OR REPLACE INTO users (user_id, name, phone, created_at)
            VALUES (?, ?, ?, ?)
        ''', (user_id, name, phone, created_at))
        
        # Subscribers jadvaliga ham qo'shish
        cursor.execute('''
            INSERT OR IGNORE INTO subscribers (user_id, created_at)
            VALUES (?, ?)
        ''', (user_id, created_at))
        
        # Yangi murojaat qo'shish
        cursor.execute('''
            INSERT INTO problems (user_id, description, media_type, latitude, longitude, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, "Yangi test murojaat - quti to'ldi", "Rasm", 41.311081, 69.240562, "Kutilmoqda", created_at))
        
        # Yangi baho qo'shish
        cursor.execute('''
            INSERT INTO ratings (user_id, rating, created_at)
            VALUES (?, ?, ?)
        ''', (user_id, 5, created_at))
        
        # Yangi fikr qo'shish
        cursor.execute('''
            INSERT INTO feedbacks (user_id, text, created_at)
            VALUES (?, ?, ?)
        ''', (user_id, "Test fikr - tizim juda yaxshi ishlayapti!", created_at))
        
        conn.commit()
        
        # Statistikani yangilash
        import database
        database.update_stats_json()
        
        print("✅ Test foydalanuvchi muvaffaqiyatli qo'shildi!")
        print(f"👤 Ism: {name}")
        print(f"📞 Telefon: {phone}")
        print(f"🆔 ID: {user_id}")
        
        # Yangi statistikani ko'rsatish
        cursor.execute('SELECT COUNT(*) FROM subscribers')
        total_users = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM problems')
        total_problems = cursor.fetchone()[0]
        
        print(f"\n📊 Yangi statistika:")
        print(f"👥 Jami foydalanuvchilar: {total_users}")
        print(f"📝 Jami murojaatlar: {total_problems}")
        
    except Exception as e:
        print(f"❌ Xatolik: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🤖 Test Foydalanuvchi Qo'shish")
    print("=" * 40)
    add_test_user()
    print("=" * 40)
    print("🎉 Tayyor!")