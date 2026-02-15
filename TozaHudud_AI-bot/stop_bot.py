#!/usr/bin/env python3
"""
Telegram bot'ni to'xtatish va webhook'ni o'chirish
"""

import requests
import os
from dotenv import load_dotenv

# .env faylini yuklash
load_dotenv()

BOT_TOKEN = os.getenv('BOT_TOKEN')

def stop_bot():
    """Bot'ni to'xtatish va webhook'ni o'chirish"""
    
    if not BOT_TOKEN:
        print("❌ BOT_TOKEN topilmadi!")
        return
    
    print("🛑 Bot'ni to'xtatish...")
    print("=" * 50)
    
    # 1. Webhook'ni o'chirish
    try:
        webhook_url = f"https://api.telegram.org/bot{BOT_TOKEN}/deleteWebhook"
        response = requests.post(webhook_url)
        result = response.json()
        
        if result.get('ok'):
            print("✅ Webhook o'chirildi")
        else:
            print(f"❌ Webhook o'chirishda xatolik: {result.get('description')}")
    except Exception as e:
        print(f"❌ Webhook o'chirishda xatolik: {e}")
    
    # 2. Bot ma'lumotlarini tekshirish
    try:
        bot_url = f"https://api.telegram.org/bot{BOT_TOKEN}/getMe"
        response = requests.get(bot_url)
        result = response.json()
        
        if result.get('ok'):
            bot_info = result['result']
            print(f"🤖 Bot: {bot_info['first_name']} (@{bot_info['username']})")
            print(f"📱 ID: {bot_info['id']}")
            print("✅ Bot API hali ham faol (faqat webhook o'chirildi)")
        else:
            print(f"❌ Bot ma'lumotlarini olishda xatolik: {result.get('description')}")
    except Exception as e:
        print(f"❌ Bot ma'lumotlarini olishda xatolik: {e}")
    
    print("=" * 50)
    print("ℹ️  ESLATMA:")
    print("- Webhook o'chirildi, lekin bot API hali ham faol")
    print("- Bot'ni to'liq o'chirish uchun @BotFather ga murojaat qiling")
    print("- Yoki yangi webhook o'rnatib, boshqa serverga ulang")
    print("=" * 50)

if __name__ == "__main__":
    stop_bot()