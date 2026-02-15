#!/usr/bin/env python3
"""
SQLite database ma'lumotlarini ko'rish scripti
"""

import sqlite3
from datetime import datetime

def view_all_data():
    """Barcha ma'lumotlarni ko'rsatish"""
    
    conn = sqlite3.connect('tozahudud.db')
    cursor = conn.cursor()
    
    print("=" * 80)
    print("📊 TELEGRAM BOT DATABASE MA'LUMOTLARI")
    print("=" * 80)
    
    # 1. USERS - Foydalanuvchilar
    print("\n👥 FOYDALANUVCHILAR (users):")
    print("-" * 60)
    cursor.execute('SELECT user_id, name, phone, created_at FROM users ORDER BY created_at DESC')
    users = cursor.fetchall()
    
    for i, (user_id, name, phone, created_at) in enumerate(users, 1):
        print(f"{i:2d}. ID: {user_id}")
        print(f"    Ism: {name}")
        print(f"    Tel: {phone}")
        print(f"    Sana: {created_at}")
        print()
    
    # 2. PROBLEMS - Murojaatlar
    print("\n📋 MUROJAATLAR (problems):")
    print("-" * 60)
    cursor.execute('''
        SELECT p.id, p.description, p.status, p.created_at, u.name
        FROM problems p
        JOIN users u ON p.user_id = u.user_id
        ORDER BY p.created_at DESC
        LIMIT 10
    ''')
    problems = cursor.fetchall()
    
    for i, (prob_id, description, status, created_at, user_name) in enumerate(problems, 1):
        print(f"{i:2d}. ID: {prob_id}")
        print(f"    Foydalanuvchi: {user_name}")
        print(f"    Murojaat: {description[:50]}...")
        print(f"    Holat: {status}")
        print(f"    Sana: {created_at}")
        print()
    
    # 3. FEEDBACKS - Fikrlar
    print("\n💬 FIKRLAR (feedbacks):")
    print("-" * 60)
    cursor.execute('''
        SELECT f.id, f.text, f.created_at, u.name
        FROM feedbacks f
        JOIN users u ON f.user_id = u.user_id
        ORDER BY f.created_at DESC
        LIMIT 15
    ''')
    feedbacks = cursor.fetchall()
    
    for i, (fb_id, text, created_at, user_name) in enumerate(feedbacks, 1):
        print(f"{i:2d}. ID: {fb_id}")
        print(f"    Foydalanuvchi: {user_name}")
        print(f"    Fikr: {text}")
        print(f"    Sana: {created_at}")
        print()
    
    # 4. RATINGS - Reytinglar
    print("\n⭐ REYTINGLAR (ratings):")
    print("-" * 60)
    cursor.execute('''
        SELECT r.rating, COUNT(*) as count
        FROM ratings r
        GROUP BY r.rating
        ORDER BY r.rating DESC
    ''')
    rating_stats = cursor.fetchall()
    
    total_ratings = sum(count for _, count in rating_stats)
    avg_rating = sum(rating * count for rating, count in rating_stats) / total_ratings if total_ratings > 0 else 0
    
    print(f"Jami reytinglar: {total_ratings} ta")
    print(f"O'rtacha reyting: {avg_rating:.1f}/5")
    print()
    
    for rating, count in rating_stats:
        stars = "⭐" * rating
        percentage = (count / total_ratings * 100) if total_ratings > 0 else 0
        print(f"{stars} ({rating}): {count:2d} ta ({percentage:4.1f}%)")
    
    # 5. SUBSCRIBERS - Obunachilar
    print(f"\n📢 OBUNACHILAR: {len(users)} ta")
    
    # 6. So'nggi faoliyat
    print("\n🕒 SO'NGGI FAOLIYAT:")
    print("-" * 40)
    
    # So'nggi fikrlar
    cursor.execute('''
        SELECT f.text, u.name, f.created_at
        FROM feedbacks f
        JOIN users u ON f.user_id = u.user_id
        ORDER BY f.created_at DESC
        LIMIT 5
    ''')
    recent_feedbacks = cursor.fetchall()
    
    print("So'nggi 5 ta fikr:")
    for i, (text, name, created_at) in enumerate(recent_feedbacks, 1):
        # Vaqtni hisoblash
        created_dt = datetime.strptime(created_at, "%Y-%m-%d %H:%M:%S")
        time_diff = datetime.now() - created_dt
        
        if time_diff.days > 0:
            time_str = f"{time_diff.days} kun oldin"
        elif time_diff.seconds > 3600:
            hours = time_diff.seconds // 3600
            time_str = f"{hours} soat oldin"
        else:
            minutes = time_diff.seconds // 60
            time_str = f"{minutes} daqiqa oldin"
        
        print(f"  {i}. {name} ({time_str})")
        print(f"     {text}")
    
    conn.close()
    print("\n" + "=" * 80)

def search_user_data(search_term):
    """Foydalanuvchi bo'yicha qidirish"""
    
    conn = sqlite3.connect('tozahudud.db')
    cursor = conn.cursor()
    
    print(f"\n🔍 '{search_term}' bo'yicha qidiruv natijalari:")
    print("-" * 50)
    
    # Foydalanuvchini topish
    cursor.execute('''
        SELECT user_id, name, phone, created_at
        FROM users
        WHERE name LIKE ? OR phone LIKE ?
    ''', (f'%{search_term}%', f'%{search_term}%'))
    
    users = cursor.fetchall()
    
    for user_id, name, phone, created_at in users:
        print(f"\n👤 Foydalanuvchi: {name}")
        print(f"   Tel: {phone}")
        print(f"   ID: {user_id}")
        print(f"   Ro'yxatdan o'tgan: {created_at}")
        
        # Bu foydalanuvchining fikrlari
        cursor.execute('''
            SELECT text, created_at FROM feedbacks
            WHERE user_id = ?
            ORDER BY created_at DESC
        ''', (user_id,))
        
        feedbacks = cursor.fetchall()
        print(f"   Fikrlar soni: {len(feedbacks)} ta")
        
        for i, (text, created_at) in enumerate(feedbacks[:3], 1):
            print(f"     {i}. {text} ({created_at})")
        
        # Bu foydalanuvchining murojaatlari
        cursor.execute('''
            SELECT description, status, created_at FROM problems
            WHERE user_id = ?
            ORDER BY created_at DESC
        ''', (user_id,))
        
        problems = cursor.fetchall()
        print(f"   Murojaatlar soni: {len(problems)} ta")
        
        for i, (desc, status, created_at) in enumerate(problems[:2], 1):
            print(f"     {i}. {desc[:40]}... [{status}] ({created_at})")
    
    conn.close()

def show_statistics():
    """Batafsil statistika"""
    
    conn = sqlite3.connect('tozahudud.db')
    cursor = conn.cursor()
    
    print("\n📊 BATAFSIL STATISTIKA:")
    print("=" * 40)
    
    # Kunlik statistika
    cursor.execute('''
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM feedbacks
        WHERE created_at >= date('now', '-7 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
    ''')
    
    daily_feedbacks = cursor.fetchall()
    print("\nSo'nggi 7 kun fikrlar:")
    for date, count in daily_feedbacks:
        print(f"  {date}: {count} ta fikr")
    
    # Eng faol foydalanuvchilar
    cursor.execute('''
        SELECT u.name, COUNT(f.id) as feedback_count
        FROM users u
        LEFT JOIN feedbacks f ON u.user_id = f.user_id
        GROUP BY u.user_id, u.name
        HAVING feedback_count > 0
        ORDER BY feedback_count DESC
        LIMIT 5
    ''')
    
    active_users = cursor.fetchall()
    print("\nEng faol foydalanuvchilar:")
    for i, (name, count) in enumerate(active_users, 1):
        print(f"  {i}. {name}: {count} ta fikr")
    
    conn.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        # Qidiruv rejimi
        search_term = sys.argv[1]
        search_user_data(search_term)
    else:
        # Barcha ma'lumotlarni ko'rsatish
        view_all_data()
        show_statistics()
    
    print("\n💡 Maslahat:")
    print("   - Qidiruv uchun: python view_database.py 'ism yoki telefon'")
    print("   - Barcha ma'lumotlar uchun: python view_database.py")