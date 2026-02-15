#!/usr/bin/env python3
"""
Test uchun yangi fikrlar qo'shish scripti
"""

import sqlite3
import random
from datetime import datetime, timedelta

DB_NAME = "tozahudud.db"

# Test fikrlar ro'yxati
test_feedbacks = [
    "Tizim juda qulay va tez ishlaydi! Rahmat!",
    "Qutilar holatini real vaqtda ko'rish imkoniyati ajoyib",
    "Telegram bot orqali murojaat qilish juda oson",
    "Toza Hudud tizimi shahar tozaligini yaxshilashda katta yordam bermoqda",
    "Mobil ilova ham bo'lsa yaxshi bo'lardi",
    "Xarita funksiyasi juda foydali, yaqin qutilarni topish oson",
    "Tizim ba'zan sekin ishlaydi, tezligini oshirish kerak",
    "Ogohlantirishlar o'z vaqtida keladi, juda yaxshi",
    "Interfeys sodda va tushunarli",
    "Qo'shimcha tillar qo'shilsa yaxshi bo'lardi",
    "Statistika bo'limi juda batafsil va foydali",
    "Mashinalar holatini ham ko'rish mumkin, ajoyib!",
    "Tizim ishonchli va barqaror ishlaydi",
    "Yangi funksiyalar qo'shilishini kutaman",
    "Foydalanish juda oson, hamma tushunadi",
    "Shahar hokimiyati bilan integratsiya yaxshi",
    "Real vaqt yangilanishlar juda foydali",
    "Tizim orqali shahar tozaligi yaxshilandi",
    "Texnik yordam tez javob beradi",
    "Umumiy baholash: 5 yulduz!"
]

# Test foydalanuvchilar
test_users = [
    (1001, "Aziz Karimov", "+998901234567"),
    (1002, "Malika Tosheva", "+998902345678"),
    (1003, "Bobur Alimov", "+998903456789"),
    (1004, "Nigora Rahimova", "+998904567890"),
    (1005, "Jasur Nazarov", "+998905678901"),
    (1006, "Dilnoza Yusupova", "+998906789012"),
    (1007, "Sardor Mirzaev", "+998907890123"),
    (1008, "Gulnora Abdullayeva", "+998908901234"),
    (1009, "Otabek Saidov", "+998909012345"),
    (1010, "Feruza Karimova", "+998900123456")
]

def add_test_data():
    """Test ma'lumotlarini qo'shish"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    print("Test foydalanuvchilarini qo'shish...")
    
    # Foydalanuvchilarni qo'shish
    for user_id, name, phone in test_users:
        now = datetime.now() - timedelta(days=random.randint(1, 30))
        cursor.execute('''
            INSERT OR REPLACE INTO users (user_id, name, phone, created_at)
            VALUES (?, ?, ?, ?)
        ''', (user_id, name, phone, now.strftime("%Y-%m-%d %H:%M:%S")))
        
        # Subscriber sifatida ham qo'shish
        cursor.execute('''
            INSERT OR IGNORE INTO subscribers (user_id, created_at)
            VALUES (?, ?)
        ''', (user_id, now.strftime("%Y-%m-%d %H:%M:%S")))
    
    print("Test fikrlarini qo'shish...")
    
    # Har bir foydalanuvchi uchun 1-3 ta fikr qo'shish
    for user_id, name, phone in test_users:
        feedback_count = random.randint(1, 3)
        
        for _ in range(feedback_count):
            feedback_text = random.choice(test_feedbacks)
            created_time = datetime.now() - timedelta(
                days=random.randint(0, 15),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            cursor.execute('''
                INSERT INTO feedbacks (user_id, text, created_at)
                VALUES (?, ?, ?)
            ''', (user_id, feedback_text, created_time.strftime("%Y-%m-%d %H:%M:%S")))
    
    print("Test reytinglarini qo'shish...")
    
    # Har bir foydalanuvchi uchun 1-2 ta reyting qo'shish
    for user_id, name, phone in test_users:
        rating_count = random.randint(1, 2)
        
        for _ in range(rating_count):
            rating = random.choices([1, 2, 3, 4, 5], weights=[5, 10, 15, 35, 35])[0]  # Ko'proq yuqori reytinglar
            created_time = datetime.now() - timedelta(
                days=random.randint(0, 20),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            cursor.execute('''
                INSERT INTO ratings (user_id, rating, created_at)
                VALUES (?, ?, ?)
            ''', (user_id, rating, created_time.strftime("%Y-%m-%d %H:%M:%S")))
    
    conn.commit()
    conn.close()
    
    print("✅ Test ma'lumotlari muvaffaqiyatli qo'shildi!")
    
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

def show_recent_feedbacks():
    """So'nggi fikrlarni ko'rsatish"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT f.text, u.name, u.phone, f.created_at
        FROM feedbacks f
        JOIN users u ON f.user_id = u.user_id
        ORDER BY f.created_at DESC
        LIMIT 10
    ''')
    
    feedbacks = cursor.fetchall()
    conn.close()
    
    print("\n📝 So'nggi 10 ta fikr:")
    print("-" * 80)
    
    for i, (text, name, phone, created_at) in enumerate(feedbacks, 1):
        print(f"{i}. {name} ({phone})")
        print(f"   Vaqt: {created_at}")
        print(f"   Fikr: {text}")
        print("-" * 80)

if __name__ == "__main__":
    print("🚀 Test fikrlarini qo'shish boshlandi...")
    add_test_data()
    show_recent_feedbacks()
    print("\n✅ Barcha test ma'lumotlari qo'shildi!")
    print("💡 Endi frontend'da Telegram Bot > Fikrlar bo'limini tekshiring")