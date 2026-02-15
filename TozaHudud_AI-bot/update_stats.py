import sqlite3
import json

conn = sqlite3.connect('tozahudud.db')
cursor = conn.cursor()

cursor.execute('SELECT COUNT(*) FROM feedbacks')
total_feedbacks = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM ratings')
total_ratings = cursor.fetchone()[0]

cursor.execute('SELECT AVG(rating) FROM ratings')
avg_rating = cursor.fetchone()[0] or 0

cursor.execute('SELECT COUNT(*) FROM problems')
total_problems = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM subscribers')
total_subscribers = cursor.fetchone()[0]

conn.close()

# Stats.json yangilash
stats = {
    'total_problems': total_problems,
    'total_subscribers': total_subscribers,
    'total_feedbacks': total_feedbacks,
    'total_ratings': total_ratings,
    'average_rating': round(avg_rating, 1)
}

with open('stats.json', 'w') as f:
    json.dump(stats, f, indent=2)

print(f'Oxirgi statistika:')
print(f'   - Jami foydalanuvchilar: {total_subscribers}')
print(f'   - Jami murojaatlar: {total_problems}')
print(f'   - Jami fikrlar: {total_feedbacks}')
print(f'   - Jami reytinglar: {total_ratings}')
print(f'   - Ortacha reyting: {avg_rating:.1f}/5')