#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sqlite3
import os
from datetime import datetime

def clean_test_data():
    """Test ma'lumotlarini o'chirish"""
    
    db_path = 'tozahudud.db'
    
    if not os.path.exists(db_path):
        print("❌ Database fayli topilmadi!")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🧹 TELEGRAM BOT DATABASE'NI TOZALASH")
        print("=" * 50)
        
        # Avval mavjud ma'lumotlar sonini ko'rsatish
        cursor.execute("SELECT COUNT(*) FROM users")
        users_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM problems")
        problems_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM feedbacks")
        feedbacks_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM ratings")
        ratings_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM subscribers")
        subscribers_count = cursor.fetchone()[0]
        
        print(f"📊 HOZIRGI HOLAT:")
        print(f"   👥 Foydalanuvchilar: {users_count}")
        print(f"   📋 Murojaatlar: {problems_count}")
        print(f"   💬 Fikrlar: {feedbacks_count}")
        print(f"   ⭐ Reytinglar: {ratings_count}")
        print(f"   📢 Obunachilar: {subscribers_count}")
        print()
        
        # Tasdiqlash
        confirm = input("❓ Barcha test ma'lumotlarini o'chirishni xohlaysizmi? (ha/yo): ").lower().strip()
        
        if confirm not in ['ha', 'yes', 'y']:
            print("❌ Bekor qilindi.")
            return
        
        print("\n🗑️ Ma'lumotlarni o'chirish...")
        
        # Barcha test ma'lumotlarni o'chirish
        cursor.execute("DELETE FROM feedbacks")
        deleted_feedbacks = cursor.rowcount
        
        cursor.execute("DELETE FROM ratings")
        deleted_ratings = cursor.rowcount
        
        cursor.execute("DELETE FROM problems")
        deleted_problems = cursor.rowcount
        
        cursor.execute("DELETE FROM users")
        deleted_users = cursor.rowcount
        
        cursor.execute("DELETE FROM subscribers")
        deleted_subscribers = cursor.rowcount
        
        # Auto-increment ID'larni qayta boshlash
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='users'")
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='problems'")
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='feedbacks'")
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='ratings'")
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='subscribers'")
        
        # O'zgarishlarni saqlash
        conn.commit()
        
        print("✅ MUVAFFAQIYATLI O'CHIRILDI!")
        print("=" * 50)
        print(f"🗑️ O'chirilgan ma'lumotlar:")
        print(f"   👥 Foydalanuvchilar: {deleted_users}")
        print(f"   📋 Murojaatlar: {deleted_problems}")
        print(f"   💬 Fikrlar: {deleted_feedbacks}")
        print(f"   ⭐ Reytinglar: {deleted_ratings}")
        print(f"   📢 Obunachilar: {deleted_subscribers}")
        print()
        
        # Yangi holat
        cursor.execute("SELECT COUNT(*) FROM users")
        new_users = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM problems")
        new_problems = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM feedbacks")
        new_feedbacks = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM ratings")
        new_ratings = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM subscribers")
        new_subscribers = cursor.fetchone()[0]
        
        print(f"📊 YANGI HOLAT:")
        print(f"   👥 Foydalanuvchilar: {new_users}")
        print(f"   📋 Murojaatlar: {new_problems}")
        print(f"   💬 Fikrlar: {new_feedbacks}")
        print(f"   ⭐ Reytinglar: {new_ratings}")
        print(f"   📢 Obunachilar: {new_subscribers}")
        print()
        print("🎉 Database tozalandi! Endi faqat haqiqiy foydalanuvchi ma'lumotlari qoladi.")
        
    except sqlite3.Error as e:
        print(f"❌ Database xatosi: {e}")
    except Exception as e:
        print(f"❌ Xatolik: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    clean_test_data()