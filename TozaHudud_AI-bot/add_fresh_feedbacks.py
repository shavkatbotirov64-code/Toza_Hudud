#!/usr/bin/env python3
"""
Yangi test fikrlar qo'shish va web saytda ko'rinishini tekshirish
"""

import sqlite3
import random
from datetime import datetime, timedelta
import json

DB_NAME = "tozahudud.db"

# Yangi test fikrlar
fresh_feedbacks = [
    "Bugun yangi fikr: Tizim juda zo'r ishlayapti! 🎉",
    "Hozirgi vaqt: Telegram bot mukammal, rahmat!",
    "Test fikr - Sayt juda tez yuklanadi va qulay",
    "Yangi xabar: Qutilar holatini real vaqtda ko'rish ajoyib",
    "Bugungi fikr: Mashinalar ham xaritada ko'rinadi, zo'r!",
    "Test: Statistikalar juda batafsil va foydali",
    "Hozir: Tizim orqali ariza berish juda oson",
    "Yangi: Ogohlantirishlar tez keladi, yaxshi xizmat",
    "Test fikr: Interfeys chiroyli va zamonaviy",
    "Bugun: Texnik yordam tez javob beradi, rahmat!"
]

def add_fresh_feedbacks():
    """Yangi fikrlar qo'shish"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Mavjud foydalanuvchilarni olish
    cursor.execute('SELECT user_id, name FROM users ORDER BY RANDOM() LIMIT 5')
    users = cursor.fetchall()
    
    print(f"🆕 {len(users)} ta foydalanuvchi uchun yangi fikrlar qo'shilmoqda...")
    
    added_count = 0
    
    # Har bir foydalanuvchi uchun 1-2 ta yangi fikr
    for user_id, name in users:
        feedback_count = random.randint(1, 2)
        
        for _ in range(feedback_count):
            feedback_text = random.choice(fresh_feedbacks)
            
            # Hozirgi vaqtdan 1-30 daqiqa oldin
            created_time = datetime.now() - timedelta(
                minutes=random.randint(1, 30)
            )
            
            cursor.execute('''
                INSERT INTO feedbacks (user_id, text, created_at)
                VALUES (?, ?, ?)
            ''', (user_id, feedback_text, created_time.strftime("%Y-%m-%d %H:%M:%S")))
            
            added_count += 1
            print(f"   ✅ {name}: {feedback_text[:30]}...")
    
    # Yangi reytinglar ham qo'shish
    print("⭐ Yangi reytinglar qo'shilmoqda...")
    
    for user_id, name in users:
        rating = random.choices([4, 5], weights=[30, 70])[0]  # Ko'proq 5 yulduz
        
        created_time = datetime.now() - timedelta(
            minutes=random.randint(1, 20)
        )
        
        cursor.execute('''
            INSERT INTO ratings (user_id, rating, created_at)
            VALUES (?, ?, ?)
        ''', (user_id, rating, created_time.strftime("%Y-%m-%d %H:%M:%S")))
        
        print(f"   ⭐ {name}: {rating} yulduz")
    
    conn.commit()
    conn.close()
    
    print(f"\n✅ {added_count} ta yangi fikr qo'shildi!")
    
    # Statistikani yangilash
    update_stats()

def update_stats():
    """Statistikani yangilash"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) FROM problems')
    total_problems = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM subscribers')
    total_subscribers = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM feedbacks')
    total_feedbacks = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM ratings')
    total_ratings = cursor.fetchone()[0]
    
    cursor.execute('SELECT AVG(rating) FROM ratings')
    avg_rating = cursor.fetchone()[0] or 0
    
    conn.close()
    
    stats = {
        "total_problems": total_problems,
        "total_subscribers": total_subscribers,
        "total_feedbacks": total_feedbacks,
        "total_ratings": total_ratings,
        "average_rating": round(avg_rating, 1)
    }
    
    with open("stats.json", 'w') as f:
        json.dump(stats, f, indent=2)
    
    print(f"📊 Yangilangan statistika:")
    print(f"   - Jami foydalanuvchilar: {total_subscribers}")
    print(f"   - Jami murojaatlar: {total_problems}")
    print(f"   - Jami fikrlar: {total_feedbacks}")
    print(f"   - Jami reytinglar: {total_ratings}")
    print(f"   - O'rtacha reyting: {avg_rating:.1f}/5")

def show_latest_feedbacks():
    """Eng so'nggi fikrlarni ko'rsatish"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT f.text, u.name, f.created_at
        FROM feedbacks f
        JOIN users u ON f.user_id = u.user_id
        ORDER BY f.created_at DESC
        LIMIT 8
    ''')
    
    feedbacks = cursor.fetchall()
    conn.close()
    
    print("\n📝 Eng so'nggi 8 ta fikr:")
    print("=" * 70)
    
    for i, (text, name, created_at) in enumerate(feedbacks, 1):
        # Vaqtni chiroyli formatda ko'rsatish
        created_dt = datetime.strptime(created_at, "%Y-%m-%d %H:%M:%S")
        time_diff = datetime.now() - created_dt
        
        if time_diff.seconds < 3600:  # 1 soat ichida
            time_str = f"{time_diff.seconds // 60} daqiqa oldin"
        else:
            time_str = created_dt.strftime("%H:%M")
        
        print(f"{i}. 👤 {name}")
        print(f"   🕒 {time_str}")
        print(f"   💬 {text}")
        print("-" * 70)

if __name__ == "__main__":
    print("🚀 Yangi test fikrlar qo'shish boshlandi...")
    add_fresh_feedbacks()
    show_latest_feedbacks()
    print("\n✅ Yangi fikrlar qo'shildi!")
    print("🌐 Endi web saytda Telegram Bot > Fikrlar bo'limini tekshiring")
    print("🔄 Agar ko'rinmasa, sahifani yangilang (F5)")