#!/usr/bin/env python3
"""
Real vaqt test - yangi fikr qo'shib, frontend'da ko'rinishini tekshirish
"""

import sqlite3
import json
from datetime import datetime
import time

def add_realtime_feedback():
    """Real vaqt uchun yangi fikr qo'shish"""
    
    conn = sqlite3.connect('tozahudud.db')
    cursor = conn.cursor()
    
    # Hozirgi vaqt
    now = datetime.now()
    timestamp = now.strftime("%Y-%m-%d %H:%M:%S")
    
    # Yangi test fikr
    test_feedback = f"🔴 REAL VAQT TEST - {now.strftime('%H:%M:%S')} da qo'shildi!"
    
    # Tasodifiy foydalanuvchi tanlash
    cursor.execute('SELECT user_id, name FROM users ORDER BY RANDOM() LIMIT 1')
    user = cursor.fetchone()
    
    if user:
        user_id, user_name = user
        
        # Yangi fikr qo'shish
        cursor.execute('''
            INSERT INTO feedbacks (user_id, text, created_at)
            VALUES (?, ?, ?)
        ''', (user_id, test_feedback, timestamp))
        
        # Yangi reyting ham qo'shish
        cursor.execute('''
            INSERT INTO ratings (user_id, rating, created_at)
            VALUES (?, ?, ?)
        ''', (user_id, 5, timestamp))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Yangi fikr qo'shildi:")
        print(f"   Foydalanuvchi: {user_name}")
        print(f"   Fikr: {test_feedback}")
        print(f"   Vaqt: {timestamp}")
        
        # Statistikani yangilash
        update_stats()
        
        return True
    else:
        print("❌ Foydalanuvchi topilmadi")
        conn.close()
        return False

def update_stats():
    """Statistikani yangilash"""
    conn = sqlite3.connect('tozahudud.db')
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
    
    print(f"📊 Statistika yangilandi:")
    print(f"   - Jami fikrlar: {total_feedbacks}")
    print(f"   - Jami reytinglar: {total_ratings}")
    print(f"   - O'rtacha reyting: {avg_rating:.1f}/5")

def show_latest_feedback():
    """Eng so'nggi fikrni ko'rsatish"""
    conn = sqlite3.connect('tozahudud.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT f.text, u.name, f.created_at
        FROM feedbacks f
        JOIN users u ON f.user_id = u.user_id
        ORDER BY f.created_at DESC
        LIMIT 1
    ''')
    
    result = cursor.fetchone()
    conn.close()
    
    if result:
        text, name, created_at = result
        print(f"\n📝 Eng so'nggi fikr:")
        print(f"   Foydalanuvchi: {name}")
        print(f"   Fikr: {text}")
        print(f"   Vaqt: {created_at}")
    
def test_api_connection():
    """Backend API ulanishini tekshirish"""
    import urllib.request
    import urllib.error
    
    try:
        # Backend API test
        response = urllib.request.urlopen('http://localhost:3002/api/health')
        if response.getcode() == 200:
            print("✅ Backend API ishlayapti")
        
        # Telegram API test
        response = urllib.request.urlopen('http://localhost:3002/api/telegram/stats')
        if response.getcode() == 200:
            print("✅ Telegram API ishlayapti")
            
        return True
    except urllib.error.URLError as e:
        print(f"❌ API ulanish xatoligi: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Real vaqt test boshlandi...")
    print("=" * 50)
    
    # API ulanishini tekshirish
    if test_api_connection():
        print()
        
        # Yangi fikr qo'shish
        if add_realtime_feedback():
            print()
            show_latest_feedback()
            
            print("\n" + "=" * 50)
            print("🌐 FRONTEND'DA TEKSHIRISH:")
            print("1. http://localhost:3000 ga o'ting")
            print("2. Telegram Bot sahifasiga o'ting")
            print("3. 'Fikrlar' tab'ini bosing")
            print("4. Yangi fikr ko'rinadimi tekshiring")
            print("5. Agar ko'rinmasa, sahifani yangilang (F5)")
            print("=" * 50)
    else:
        print("\n❌ Avval barcha servicelarni ishga tushiring:")
        print("   - Backend: npm run start:dev")
        print("   - Frontend: npm run dev") 
        print("   - Bot: python bot.py")