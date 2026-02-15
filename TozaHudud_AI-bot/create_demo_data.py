#!/usr/bin/env python3
"""
Demo ma'lumotlar yaratish skripti
"""

import sqlite3
import json
from datetime import datetime, timedelta
import random

DB_NAME = "tozahudud.db"
STATS_FILE = "stats.json"

def create_demo_data():
    """Demo ma'lumotlar yaratish"""
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    try:
        print("🔄 Demo ma'lumotlar yaratilmoqda...")
        
        # Demo foydalanuvchilar
        demo_users = [
            (1001, "Alisher Karimov", "+998901234567"),
            (1002, "Malika Toshmatova", "+998902345678"),
            (1003, "Bobur Rahimov", "+998903456789"),
            (1004, "Nilufar Saidova", "+998904567890"),
            (1005, "Jasur Abdullayev", "+998905678901"),
        ]
        
        for user_id, name, phone in demo_users:
            created_at = (datetime.now() - timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute('''
                INSERT OR REPLACE INTO users (user_id, name, phone, created_at)
                VALUES (?, ?, ?, ?)
            ''', (user_id, name, phone, created_at))
            
            # Subscribers jadvaliga ham qo'shish
            cursor.execute('''
                INSERT OR IGNORE INTO subscribers (user_id, created_at)
                VALUES (?, ?)
            ''', (user_id, created_at))
        
        print("✅ Demo foydalanuvchilar yaratildi")
        
        # Demo murojaatlar
        demo_problems = [
            "Chiqindi qutisi to'lib ketgan, tozalash kerak",
            "Quti buzilgan, yangi quti o'rnatish kerak", 
            "Atrofdagi qutilar juda kam, ko'proq kerak",
            "Quti yonida iflos hid bor, tozalash kerak",
            "Chiqindi quti yo'q, yangi joy kerak",
            "Quti juda kichik, kattaroq kerak",
            "Organik chiqindi uchun alohida quti kerak"
        ]
        
        locations = [
            (41.311081, 69.240562),  # Toshkent markazi
            (41.326418, 69.228268),  # Amir Temur maydoni
            (41.299496, 69.240074),  # Chorsu bozori
            (41.338107, 69.289932),  # Yunusobod
            (41.285230, 69.203644),  # Chilonzor
        ]
        
        for i in range(15):
            user_id = random.choice([u[0] for u in demo_users])
            description = random.choice(demo_problems)
            media_type = random.choice(["Rasm", "Video", "Mavjud emas"])
            lat, lon = random.choice(locations)
            # Lokatsiyani biroz o'zgartirish
            lat += random.uniform(-0.01, 0.01)
            lon += random.uniform(-0.01, 0.01)
            status = random.choice(["Kutilmoqda", "ko'rib chiqildi", "hal qilindi"])
            created_at = (datetime.now() - timedelta(days=random.randint(0, 7))).strftime("%Y-%m-%d %H:%M:%S")
            
            cursor.execute('''
                INSERT INTO problems (user_id, description, media_type, latitude, longitude, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, description, media_type, lat, lon, status, created_at))
        
        print("✅ Demo murojaatlar yaratildi")
        
        # Demo baholashlar
        for i in range(25):
            user_id = random.choice([u[0] for u in demo_users])
            rating = random.choices([1, 2, 3, 4, 5], weights=[2, 3, 8, 15, 22])[0]  # Ko'proq yuqori baho
            created_at = (datetime.now() - timedelta(days=random.randint(0, 14))).strftime("%Y-%m-%d %H:%M:%S")
            
            cursor.execute('''
                INSERT INTO ratings (user_id, rating, created_at)
                VALUES (?, ?, ?)
            ''', (user_id, rating, created_at))
        
        print("✅ Demo baholashlar yaratildi")
        
        # Demo fikrlar
        demo_feedbacks = [
            "Tizim juda qulay, rahmat!",
            "Qutilar tez to'ldi, ko'proq quti kerak",
            "Yaxshi ishlayapti, davom eting",
            "Bot juda foydali, rahmat ishlab chiquvchilarga",
            "Tez javob berishadi, zo'r",
            "Yangi quti o'rnatildi, juda yaxshi",
            "Xizmat sifati yaxshi, lekin tezroq bo'lsa yaxshi edi",
            "Barcha muammolar hal qilindi, rahmat",
            "Juda professional yondashuv",
            "Davom eting, zo'r loyiha"
        ]
        
        for i in range(20):
            user_id = random.choice([u[0] for u in demo_users])
            text = random.choice(demo_feedbacks)
            created_at = (datetime.now() - timedelta(days=random.randint(0, 10))).strftime("%Y-%m-%d %H:%M:%S")
            
            cursor.execute('''
                INSERT INTO feedbacks (user_id, text, created_at)
                VALUES (?, ?, ?)
            ''', (user_id, text, created_at))
        
        print("✅ Demo fikrlar yaratildi")
        
        conn.commit()
        
        # Statistikani yangilash
        cursor.execute('SELECT COUNT(*) FROM problems')
        total_problems = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM subscribers')
        total_subscribers = cursor.fetchone()[0]
        
        stats = {
            "total_problems": total_problems,
            "total_subscribers": total_subscribers
        }
        
        with open(STATS_FILE, 'w') as f:
            json.dump(stats, f)
        
        print(f"✅ Statistika yangilandi: {stats}")
        
        # Ma'lumotlarni ko'rsatish
        print("\n📊 Yaratilgan ma'lumotlar:")
        print(f"👥 Foydalanuvchilar: {total_subscribers}")
        print(f"📝 Murojaatlar: {total_problems}")
        
        cursor.execute('SELECT COUNT(*) FROM ratings')
        total_ratings = cursor.fetchone()[0]
        print(f"⭐ Baholashlar: {total_ratings}")
        
        cursor.execute('SELECT COUNT(*) FROM feedbacks')
        total_feedbacks = cursor.fetchone()[0]
        print(f"💬 Fikrlar: {total_feedbacks}")
        
        # O'rtacha reyting
        cursor.execute('SELECT AVG(rating) FROM ratings')
        avg_rating = cursor.fetchone()[0]
        print(f"📈 O'rtacha reyting: {avg_rating:.1f}/5")
        
    except Exception as e:
        print(f"❌ Xatolik: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🤖 TozaHudud Bot - Demo Ma'lumotlar Yaratish")
    print("=" * 50)
    create_demo_data()
    print("=" * 50)
    print("🎉 Demo ma'lumotlar tayyor!")
    print("💡 Endi botni ishga tushiring: python bot.py")