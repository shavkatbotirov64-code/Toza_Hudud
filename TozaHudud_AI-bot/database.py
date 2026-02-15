import sqlite3
import logging
import json
import os
from datetime import datetime

logger = logging.getLogger(__name__)

DB_NAME = "tozahudud.db"
STATS_FILE = "stats.json"

def init_db():
    """Initializes the database and creates tables if they don't exist."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            name TEXT,
            phone TEXT,
            created_at TIMESTAMP
        )
    ''')
    
    # Create problems table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS problems (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            description TEXT,
            media_type TEXT,
            file_id TEXT,
            latitude REAL,
            longitude REAL,
            status TEXT DEFAULT 'Kutilmoqda',
            created_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')
    
    # Check if status column exists (for existing databases)
    cursor.execute("PRAGMA table_info(problems)")
    columns = [column[1] for column in cursor.fetchall()]
    if 'status' not in columns:
        cursor.execute("ALTER TABLE problems ADD COLUMN status TEXT DEFAULT 'Kutilmoqda'")
    
    # Create subscribers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subscribers (
            user_id INTEGER PRIMARY KEY,
            created_at TIMESTAMP
        )
    ''')
    
    # Create ratings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            rating INTEGER,
            created_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')
    
    # Create feedbacks table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS feedbacks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            text TEXT,
            created_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized.")
    update_stats_json()

def add_feedback(user_id, text):
    """Adds a new feedback."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute('''
        INSERT INTO feedbacks (user_id, text, created_at)
        VALUES (?, ?, ?)
    ''', (user_id, text, now))
    conn.commit()
    conn.close()

def update_stats_json():
    """Queries the database and updates the stats.json file."""
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM problems')
        total_problems = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM subscribers')
        total_subscribers = cursor.fetchone()[0]
        
        conn.close()
        
        stats = {
            "total_problems": total_problems,
            "total_subscribers": total_subscribers
        }
        
        with open(STATS_FILE, 'w') as f:
            json.dump(stats, f)
        
        logger.info(f"Stats updated in {STATS_FILE}: {stats}")
    except Exception as e:
        logger.error(f"Error updating stats JSON: {e}")

def add_subscriber(user_id):
    """Adds a new subscriber if they don't exist."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute('''
        INSERT OR IGNORE INTO subscribers (user_id, created_at)
        VALUES (?, ?)
    ''', (user_id, now))
    conn.commit()
    conn.close()
    update_stats_json()

def add_user(user_id, name, phone):
    """Adds a new user or updates an existing one."""
    try:
        logger.info(f"💾 Adding/updating user: {name} ({user_id})")
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute('''
            INSERT OR REPLACE INTO users (user_id, name, phone, created_at)
            VALUES (?, ?, ?, ?)
        ''', (user_id, name, phone, now))
        conn.commit()
        conn.close()
        update_stats_json()
        logger.debug(f"✅ User saved successfully: {name} ({user_id})")
    except Exception as e:
        logger.error(f"❌ Error adding user {user_id}: {e}")
        raise

def add_problem(user_id, description, media_type, file_id=None, latitude=None, longitude=None):
    """Adds a new problem report."""
    try:
        logger.info(f"📝 Adding problem report from user {user_id}: {description[:50]}...")
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute('''
            INSERT INTO problems (user_id, description, media_type, file_id, latitude, longitude, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, description, media_type, file_id, latitude, longitude, 'Kutilmoqda', now))
        problem_id = cursor.lastrowid
        conn.commit()
        conn.close()
        update_stats_json()
        logger.debug(f"✅ Problem report saved successfully: ID {problem_id}")
        return problem_id
    except Exception as e:
        logger.error(f"❌ Error adding problem for user {user_id}: {e}")
        raise

def update_problem_status(problem_id, status):
    """Updates the status of a problem."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE problems SET status = ? WHERE id = ?
    ''', (status, problem_id))
    conn.commit()
    conn.close()

def add_rating(user_id, rating):
    """Adds a new rating."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute('''
        INSERT INTO ratings (user_id, rating, created_at)
        VALUES (?, ?, ?)
    ''', (user_id, rating, now))
    conn.commit()
    conn.close()

def get_stats():
    """Returns total number of users and problems from JSON file."""
    if not os.path.exists(STATS_FILE):
        update_stats_json()
    
    try:
        with open(STATS_FILE, 'r') as f:
            stats = json.load(f)
        return (
            stats.get("total_problems", 0),
            stats.get("total_subscribers", 0)
        )
    except Exception as e:
        logger.error(f"Error reading stats JSON: {e}")
        # Fallback to database if JSON fails
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM problems')
        total_problems = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM subscribers')
        total_subscribers = cursor.fetchone()[0]
        conn.close()
        return total_problems, total_subscribers

def get_recent_problems(limit=10):
    """Returns the most recent problem reports with user details."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT p.description, p.media_type, u.name, u.phone, p.created_at, p.latitude, p.longitude, p.status, p.id
        FROM problems p
        JOIN users u ON p.user_id = u.user_id
        ORDER BY p.created_at DESC
        LIMIT ?
    ''', (limit,))
    
    problems = cursor.fetchall()
    conn.close()
    return problems

def get_user_problems(user_id, limit=5):
    """Returns the most recent problem reports for a specific user."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT description, status, created_at
        FROM problems
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    ''', (user_id, limit))
    
    problems = cursor.fetchall()
    conn.close()
    return problems

def get_recent_feedbacks(limit=10):
    """Returns the most recent feedbacks with user details."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT f.text, u.name, u.phone, f.created_at
        FROM feedbacks f
        JOIN users u ON f.user_id = u.user_id
        ORDER BY f.created_at DESC
        LIMIT ?
    ''', (limit,))
    
    feedbacks = cursor.fetchall()
    conn.close()
    return feedbacks

def get_user_info(user_id):
    """Returns user information by user_id."""
    try:
        logger.debug(f"🔍 Getting user info for {user_id}")
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT name, phone
            FROM users
            WHERE user_id = ?
        ''', (user_id,))
        
        user_info = cursor.fetchone()
        conn.close()
        
        if user_info:
            logger.debug(f"✅ User info found for {user_id}: {user_info[0]}")
        else:
            logger.debug(f"❌ No user info found for {user_id}")
            
        return user_info
    except Exception as e:
        logger.error(f"❌ Error getting user info for {user_id}: {e}")
        return None

def get_all_users():
    """Returns all users with their statistics."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT u.user_id, u.name, u.phone, u.created_at,
               COUNT(DISTINCT p.id) as problems_count,
               COUNT(DISTINCT f.id) as feedbacks_count,
               COUNT(DISTINCT r.id) as ratings_count
        FROM users u
        LEFT JOIN problems p ON u.user_id = p.user_id
        LEFT JOIN feedbacks f ON u.user_id = f.user_id
        LEFT JOIN ratings r ON u.user_id = r.user_id
        GROUP BY u.user_id, u.name, u.phone, u.created_at
        ORDER BY u.created_at DESC
    ''')
    
    users = cursor.fetchall()
    conn.close()
    return users

def delete_user_completely(user_id):
    """Completely deletes a user and all their data."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    try:
        # Get user info first
        cursor.execute('SELECT name, phone FROM users WHERE user_id = ?', (user_id,))
        user_info = cursor.fetchone()
        
        if not user_info:
            return False, "Foydalanuvchi topilmadi"
        
        name, phone = user_info
        
        # Delete all related data
        cursor.execute('DELETE FROM problems WHERE user_id = ?', (user_id,))
        problems_deleted = cursor.rowcount
        
        cursor.execute('DELETE FROM feedbacks WHERE user_id = ?', (user_id,))
        feedbacks_deleted = cursor.rowcount
        
        cursor.execute('DELETE FROM ratings WHERE user_id = ?', (user_id,))
        ratings_deleted = cursor.rowcount
        
        cursor.execute('DELETE FROM subscribers WHERE user_id = ?', (user_id,))
        subscribers_deleted = cursor.rowcount
        
        cursor.execute('DELETE FROM users WHERE user_id = ?', (user_id,))
        user_deleted = cursor.rowcount
        
        conn.commit()
        
        # Update stats
        update_stats_json()
        
        return True, f"{name} to'liq o'chirildi (Murojaatlar: {problems_deleted}, Fikrlar: {feedbacks_deleted}, Reytinglar: {ratings_deleted})"
        
    except Exception as e:
        conn.rollback()
        return False, f"Xatolik: {str(e)}"
    finally:
        conn.close()

def search_users(query):
    """Search users by name or phone."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT u.user_id, u.name, u.phone, u.created_at,
               COUNT(DISTINCT p.id) as problems_count,
               COUNT(DISTINCT f.id) as feedbacks_count,
               COUNT(DISTINCT r.id) as ratings_count
        FROM users u
        LEFT JOIN problems p ON u.user_id = p.user_id
        LEFT JOIN feedbacks f ON u.user_id = f.user_id
        LEFT JOIN ratings r ON u.user_id = r.user_id
        WHERE u.name LIKE ? OR u.phone LIKE ? OR u.user_id LIKE ?
        GROUP BY u.user_id, u.name, u.phone, u.created_at
        ORDER BY u.created_at DESC
    ''', (f'%{query}%', f'%{query}%', f'%{query}%'))
    
    users = cursor.fetchall()
    conn.close()
    return users
