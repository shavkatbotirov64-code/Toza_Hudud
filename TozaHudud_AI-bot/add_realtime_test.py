#!/usr/bin/env python3
"""
Real vaqt test uchun yangi xabar qo'shish
"""

import sqlite3
from datetime import datetime

def add_realtime_test():
    """Real vaqt test xabari qo'shish"""
    
    conn = sqlite3.connect('tozahudud.db')
    cursor = conn.cursor()
    
    # Hozirgi vaqt
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Test foydalanuvchi (mavjud foydalanuvchi)
    user_id = 1001  # Aziz Karimov
    
    # Yangi test murojaat
    test_description = f"🔴 REAL VAQT TEST - {datetime.now().strftime('%H:%M:%S')} da qo'shildi!"
    
    cursor.execute('''
        INSERT INTO problems (user_id, description, media_type, latitude, longitude, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id,
        test_description,
        "Test",
        41.311081,  # Toshkent koordinatalari
        69.240562,
        "Kutilmoqda",
        current_time
    ))
    
    problem_id = cursor.lastrowid
    
    # Yangi test fikr ham qo'shamiz
    test_feedback = f"🔴 REAL VAQT TEST FIKR - {datetime.now().strftime('%H:%M:%S')} da qo'shildi!"
    
    cursor.execute('''
        INSERT INTO feedbacks (user_id, text, created_at)
        VALUES (?, ?, ?)
    ''', (
        user_id,
        test_feedback,
        current_time
    ))
    
    feedback_id = cursor.lastrowid
    
    # Yangi reyting ham qo'shamiz
    cursor.execute('''
        INSERT INTO ratings (user_id, rating, created_at)
        VALUES (?, ?, ?)
    ''', (
        user_id,
        5,  # 5 yulduz
        current_time
    ))
    
    conn.commit()
    conn.close()
    
    print("=" * 60)
    print("🔴 REAL VAQT TEST MA'LUMOTLARI QO'SHILDI!")
    print("=" * 60)
    print(f"📋 Yangi murojaat ID: {problem_id}")
    print(f"📝 Matn: {test_description}")
    print(f"💬 Yangi fikr ID: {feedback_id}")
    print(f"📝 Fikr: {test_feedback}")
    print(f"⏰ Vaqt: {current_time}")
    print("=" * 60)
    print("✅ Endi frontend'da 'Yangilash' tugmasini bosing!")
    print("📱 Yoki 30 soniya kuting - avtomatik yangilanadi")
    print("=" * 60)

if __name__ == "__main__":
    add_realtime_test()