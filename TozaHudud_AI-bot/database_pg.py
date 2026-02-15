import psycopg2
import logging
import json
import os
from datetime import datetime
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

# PostgreSQL connection from environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    """Get PostgreSQL connection"""
    return psycopg2.connect(DATABASE_URL)

def init_db():
    """Initializes the database and creates tables if they don't exist."""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS telegram_users (
                user_id BIGINT PRIMARY KEY,
                name TEXT,
                phone TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create problems table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS telegram_problems (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES telegram_users(user_id),
                description TEXT,
                media_type TEXT,
                file_id TEXT,
                latitude REAL,
                longitude REAL,
                status TEXT DEFAULT 'Kutilmoqda',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create subscribers table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS telegram_subscribers (
                user_id BIGINT PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create ratings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS telegram_ratings (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES telegram_users(user_id),
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create feedbacks table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS telegram_feedbacks (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES telegram_users(user_id),
                text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        logger.info("PostgreSQL database initialized.")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

def add_subscriber(user_id):
    """Adds a new subscriber if they don't exist."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO telegram_subscribers (user_id)
            VALUES (%s)
            ON CONFLICT (user_id) DO NOTHING
        ''', (user_id,))
        conn.commit()
    except Exception as e:
        logger.error(f"Error adding subscriber: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

def add_user(user_id, name, phone):
    """Adds a new user or updates an existing one."""
    try:
        logger.info(f"💾 Adding/updating user: {name} ({user_id})")
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO telegram_users (user_id, name, phone)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone
        ''', (user_id, name, phone))
        conn.commit()
        logger.debug(f"✅ User saved successfully: {name} ({user_id})")
    except Exception as e:
        logger.error(f"❌ Error adding user {user_id}: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

def add_problem(user_id, description, media_type, file_id=None, latitude=None, longitude=None):
    """Adds a new problem report."""
    try:
        logger.info(f"📝 Adding problem report from user {user_id}: {description[:50]}...")
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO telegram_problems (user_id, description, media_type, file_id, latitude, longitude, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (user_id, description, media_type, file_id, latitude, longitude, 'Kutilmoqda'))
        problem_id = cursor.fetchone()[0]
        conn.commit()
        logger.debug(f"✅ Problem report saved successfully: ID {problem_id}")
        return problem_id
    except Exception as e:
        logger.error(f"❌ Error adding problem for user {user_id}: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

def update_problem_status(problem_id, status):
    """Updates the status of a problem."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            UPDATE telegram_problems SET status = %s WHERE id = %s
        ''', (status, problem_id))
        conn.commit()
    except Exception as e:
        logger.error(f"Error updating problem status: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

def add_rating(user_id, rating):
    """Adds a new rating."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO telegram_ratings (user_id, rating)
            VALUES (%s, %s)
        ''', (user_id, rating))
        conn.commit()
    except Exception as e:
        logger.error(f"Error adding rating: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

def add_feedback(user_id, text):
    """Adds a new feedback."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO telegram_feedbacks (user_id, text)
            VALUES (%s, %s)
        ''', (user_id, text))
        conn.commit()
    except Exception as e:
        logger.error(f"Error adding feedback: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

def get_stats():
    """Returns total number of users and problems."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT COUNT(*) FROM telegram_problems')
        total_problems = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM telegram_subscribers')
        total_subscribers = cursor.fetchone()[0]
        return total_problems, total_subscribers
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return 0, 0
    finally:
        cursor.close()
        conn.close()

def get_recent_problems(limit=10):
    """Returns the most recent problem reports with user details."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT p.description, p.media_type, u.name, u.phone, p.created_at, 
                   p.latitude, p.longitude, p.status, p.id
            FROM telegram_problems p
            JOIN telegram_users u ON p.user_id = u.user_id
            ORDER BY p.created_at DESC
            LIMIT %s
        ''', (limit,))
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Error getting recent problems: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

def get_user_problems(user_id, limit=5):
    """Returns the most recent problem reports for a specific user."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT description, status, created_at
            FROM telegram_problems
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s
        ''', (user_id, limit))
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Error getting user problems: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

def get_recent_feedbacks(limit=10):
    """Returns the most recent feedbacks with user details."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT f.text, u.name, u.phone, f.created_at
            FROM telegram_feedbacks f
            JOIN telegram_users u ON f.user_id = u.user_id
            ORDER BY f.created_at DESC
            LIMIT %s
        ''', (limit,))
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Error getting recent feedbacks: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

def get_user_info(user_id):
    """Returns user information by user_id."""
    try:
        logger.debug(f"🔍 Getting user info for {user_id}")
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT name, phone
            FROM telegram_users
            WHERE user_id = %s
        ''', (user_id,))
        user_info = cursor.fetchone()
        if user_info:
            logger.debug(f"✅ User info found for {user_id}: {user_info[0]}")
        else:
            logger.debug(f"❌ No user info found for {user_id}")
        return user_info
    except Exception as e:
        logger.error(f"❌ Error getting user info for {user_id}: {e}")
        return None
    finally:
        cursor.close()
        conn.close()

def get_all_users():
    """Returns all users with their statistics."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT u.user_id, u.name, u.phone, u.created_at,
                   COUNT(DISTINCT p.id) as problems_count,
                   COUNT(DISTINCT f.id) as feedbacks_count,
                   COUNT(DISTINCT r.id) as ratings_count
            FROM telegram_users u
            LEFT JOIN telegram_problems p ON u.user_id = p.user_id
            LEFT JOIN telegram_feedbacks f ON u.user_id = f.user_id
            LEFT JOIN telegram_ratings r ON u.user_id = r.user_id
            GROUP BY u.user_id, u.name, u.phone, u.created_at
            ORDER BY u.created_at DESC
        ''')
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Error getting all users: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

def delete_user_completely(user_id):
    """Completely deletes a user and all their data."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT name, phone FROM telegram_users WHERE user_id = %s', (user_id,))
        user_info = cursor.fetchone()
        
        if not user_info:
            return False, "Foydalanuvchi topilmadi"
        
        name, phone = user_info
        
        cursor.execute('DELETE FROM telegram_problems WHERE user_id = %s', (user_id,))
        problems_deleted = cursor.rowcount
        
        cursor.execute('DELETE FROM telegram_feedbacks WHERE user_id = %s', (user_id,))
        feedbacks_deleted = cursor.rowcount
        
        cursor.execute('DELETE FROM telegram_ratings WHERE user_id = %s', (user_id,))
        ratings_deleted = cursor.rowcount
        
        cursor.execute('DELETE FROM telegram_subscribers WHERE user_id = %s', (user_id,))
        
        cursor.execute('DELETE FROM telegram_users WHERE user_id = %s', (user_id,))
        
        conn.commit()
        
        return True, f"{name} to'liq o'chirildi (Murojaatlar: {problems_deleted}, Fikrlar: {feedbacks_deleted}, Reytinglar: {ratings_deleted})"
        
    except Exception as e:
        conn.rollback()
        return False, f"Xatolik: {str(e)}"
    finally:
        cursor.close()
        conn.close()

def search_users(query):
    """Search users by name or phone."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT u.user_id, u.name, u.phone, u.created_at,
                   COUNT(DISTINCT p.id) as problems_count,
                   COUNT(DISTINCT f.id) as feedbacks_count,
                   COUNT(DISTINCT r.id) as ratings_count
            FROM telegram_users u
            LEFT JOIN telegram_problems p ON u.user_id = p.user_id
            LEFT JOIN telegram_feedbacks f ON u.user_id = f.user_id
            LEFT JOIN telegram_ratings r ON u.user_id = r.user_id
            WHERE u.name LIKE %s OR u.phone LIKE %s OR CAST(u.user_id AS TEXT) LIKE %s
            GROUP BY u.user_id, u.name, u.phone, u.created_at
            ORDER BY u.created_at DESC
        ''', (f'%{query}%', f'%{query}%', f'%{query}%'))
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Error searching users: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

# Backward compatibility - stats.json uchun
def update_stats_json():
    """Dummy function for backward compatibility"""
    pass
