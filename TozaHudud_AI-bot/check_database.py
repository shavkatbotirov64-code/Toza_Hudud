import sqlite3
import json
import os

def check_database():
    """Database ma'lumotlarini tekshirish"""
    
    print("Bot ma'lumotlari saqlanish joylari:")
    print("=" * 50)
    
    # 1. SQLite Database
    if os.path.exists('tozahudud.db'):
        conn = sqlite3.connect('tozahudud.db')
        cursor = conn.cursor()
        
        print("1. SQLite Database (tozahudud.db):")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        for table in tables:
            table_name = table[0]
            cursor.execute(f'SELECT COUNT(*) FROM {table_name}')
            count = cursor.fetchone()[0]
            print(f"   - {table_name}: {count} ta yozuv")
        
        conn.close()
    else:
        print("1. SQLite Database: MAVJUD EMAS")
    
    print()
    
    # 2. Stats JSON
    if os.path.exists('stats.json'):
        print("2. Statistika fayli (stats.json):")
        with open('stats.json', 'r') as f:
            stats = json.load(f)
        for key, value in stats.items():
            print(f"   - {key}: {value}")
    else:
        print("2. Statistika fayli: MAVJUD EMAS")
    
    print()
    
    # 3. Log fayli
    if os.path.exists('bot.log'):
        print("3. Log fayli (bot.log):")
        with open('bot.log', 'r', encoding='utf-8') as f:
            lines = f.readlines()
        print(f"   - Jami log yozuvlar: {len(lines)} ta")
        if lines:
            print(f"   - Oxirgi log: {lines[-1].strip()}")
    else:
        print("3. Log fayli: MAVJUD EMAS")
    
    print()
    
    # 4. Environment fayli
    if os.path.exists('.env'):
        print("4. Environment fayli (.env):")
        with open('.env', 'r') as f:
            lines = f.readlines()
        print(f"   - Sozlamalar soni: {len(lines)} ta")
        for line in lines:
            if line.strip() and not line.startswith('#'):
                key = line.split('=')[0]
                print(f"   - {key}: [CONFIGURED]")
    else:
        print("4. Environment fayli: MAVJUD EMAS")

def show_recent_data():
    """So'nggi ma'lumotlarni ko'rsatish"""
    print("\nSo'nggi bot faoliyati:")
    print("=" * 30)
    
    try:
        conn = sqlite3.connect('tozahudud.db')
        cursor = conn.cursor()
        
        # So'nggi fikrlar
        cursor.execute('''
            SELECT f.text, u.name, f.created_at
            FROM feedbacks f
            JOIN users u ON f.user_id = u.user_id
            ORDER BY f.created_at DESC
            LIMIT 3
        ''')
        
        feedbacks = cursor.fetchall()
        print("So'nggi 3 ta fikr:")
        for i, (text, name, created_at) in enumerate(feedbacks, 1):
            print(f"  {i}. {name}: {text[:40]}...")
            print(f"     Vaqt: {created_at}")
        
        conn.close()
        
    except Exception as e:
        print(f"Database o'qishda xatolik: {e}")

if __name__ == "__main__":
    check_database()
    show_recent_data()