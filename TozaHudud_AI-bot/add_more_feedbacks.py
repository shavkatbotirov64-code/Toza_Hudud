#!/usr/bin/env python3
"""
Ko'proq test fikrlar qo'shish scripti
"""

import sqlite3
import random
from datetime import datetime, timedelta

DB_NAME = "tozahudud.db"

# Yangi fikrlar ro'yxati
more_feedbacks = [
    "Ajoyib tizim! Shahar tozaligi sezilarli darajada yaxshilandi 👍",
    "Telegram bot juda qulay, har doim foydalanaman",
    "Qutilar to'lganda darhol xabar keladi, zo'r!",
    "Tizim orqali murojaat qilganimdan keyin tez hal qilishdi",
    "Interfeys juda chiroyli va zamonaviy",
    "Mobil versiya ham kerak bo'lardi",
    "Statistikalar juda qiziq va foydali",
    "Xarita funksiyasi mukammal ishlaydi",
    "24/7 ishlaydi, juda yaxshi xizmat",
    "Boshqa shaharlarda ham joriy qilinsa yaxshi bo'lardi",
    "Foydalanish bo'yicha qo'llanma aniq va tushunarli",
    "Tizim tezligi juda yaxshi",
    "Ogohlantirishlar o'z vaqtida keladi",
    "Texnik yordam jamoasi professional",
    "Shahar ekologiyasi yaxshilandi",
    "Qulay va samarali tizim",
    "Barcha funksiyalar ishlaydi",
    "Foydalanuvchi interfeysi intuitivli",
    "Real vaqt ma'lumotlari aniq",
    "Tizim ishonchli va barqaror",
    "Yangilanishlar muntazam keladi",
    "Xavfsizlik darajasi yuqori",
    "Ma'lumotlar himoyalangan",
    "Tez va samarali xizmat",
    "Rahmat, davom eting! 🙏"
]

def add_more_feedbacks():
    """Ko'proq fikrlar qo'shish"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Mavjud foydalanuvchilarni olish
    cursor.execute('SELECT user_id FROM users')
    user_ids = [row[0] for row in cursor.fetchall()]
    
    print(f"📝 {len(user_ids)} ta foydalanuvchi uchun qo'shimcha fikrlar qo'shilmoqda...")
    
    added_count = 0
    
    # Har bir foydalanuvchi uchun 2-4 ta qo'shimcha fikr
    for user_id in user_ids:
        feedback_count = random.randint(2, 4)
        
        for _ in range(feedback_count):
            feedback_text = random.choice(more_feedbacks)
            
            # So'nggi 7 kun ichida tasodifiy vaqt
            created_time = datetime.now() - timedelta(
                days=random.randint(0, 7),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            cursor.execute('''
                INSERT INTO feedbacks (user_id, text, created_at)
                VALUES (?, ?, ?)
            ''', (user_id, feedback_text, created_time.strftime("%Y-%m-%d %H:%M:%S")))
            
            added_count += 1
    
    # Qo'shimcha reytinglar ham qo'shish
    print("⭐ Qo'shimcha reytinglar qo'shilmoqda...")
    
    for user_id in user_ids:
        rating_count = random.randint(1, 3)
        
        for _ in range(rating_count):
            # Ko'proq yuqori reytinglar (4-5 yulduz)
            rating = random.choices([1, 2, 3, 4, 5], weights=[2, 5, 10, 40, 43])[0]
            
            created_time = datetime.now() - timedelta(
                days=random.randint(0, 10),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            cursor.execute('''
                INSERT INTO ratings (user_id, rating, created_at)
                VALUES (?, ?, ?)
            ''', (user_id, rating, created_time.strftime("%Y-%m-%d %H:%M:%S")))
    
    conn.commit()
    conn.close()
    
    print(f"✅ {added_count} ta yangi fikr qo'shildi!")
    
    # Statistikani yangilash
    update_stats()

def update_stats():
    """Statistikani yangilash"""
    import json
    
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

def show_feedback_stats():
    """Fikrlar statistikasini ko'rsatish"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Reytinglar bo'yicha statistika
    cursor.execute('''
        SELECT rating, COUNT(*) as count
        FROM ratings
        GROUP BY rating
        ORDER BY rating
    ''')
    
    rating_stats = cursor.fetchall()
    
    print("\n⭐ Reytinglar statistikasi:")
    print("-" * 30)
    for rating, count in rating_stats:
        stars = "⭐" * rating
        print(f"{stars} ({rating}): {count} ta")
    
    # Eng faol foydalanuvchilar
    cursor.execute('''
        SELECT u.name, COUNT(f.id) as feedback_count
        FROM users u
        LEFT JOIN feedbacks f ON u.user_id = f.user_id
        GROUP BY u.user_id, u.name
        ORDER BY feedback_count DESC
        LIMIT 5
    ''')
    
    active_users = cursor.fetchall()
    
    print("\n👥 Eng faol foydalanuvchilar:")
    print("-" * 40)
    for i, (name, count) in enumerate(active_users, 1):
        print(f"{i}. {name}: {count} ta fikr")
    
    conn.close()

if __name__ == "__main__":
    print("🚀 Ko'proq test fikrlar qo'shish boshlandi...")
    add_more_feedbacks()
    show_feedback_stats()
    print("\n✅ Barcha qo'shimcha ma'lumotlar qo'shildi!")
    print("💡 Endi frontend'da Telegram Bot sahifasini yangilang")