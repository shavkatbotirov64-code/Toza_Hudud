import os
import logging
import asyncio
import sys
from dotenv import load_dotenv
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove, BotCommand
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    filters,
    ConversationHandler,
    ContextTypes,
)

# Load env early so database backend selection can use DATABASE_URL.
load_dotenv()

DB_BACKEND = "sqlite"
if os.getenv("DATABASE_URL"):
    try:
        import database_pg as database
        DB_BACKEND = "postgres"
    except Exception:
        import database
        DB_BACKEND = "sqlite-fallback"
else:
    import database

# Fix for Windows asyncio policy - Python 3.14 compatible
if sys.platform == 'win32':
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    except AttributeError:
        pass  # Python 3.14+ doesn't need this

BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_ID_RAW = os.getenv("ADMIN_ID", "")
ADMIN_IDS = [int(i.strip()) for i in ADMIN_ID_RAW.split(",") if i.strip()]

# Enable logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("bot.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# States for ConversationHandler
NAME, PHONE, MENU, MUAMMO, MEDIA, LOCATION, RATING, ADMIN_MENU, FEEDBACK, USER_MANAGEMENT, USER_DELETE_CONFIRM = range(11)

def get_main_menu_keyboard():
    """Returns the main menu keyboard."""
    menu_buttons = [
        [KeyboardButton(text="🗑 Chiqindi bor")],
        [KeyboardButton(text="🔍 Holatni tekshirish"), KeyboardButton(text="⭐ Baholash")],
        [KeyboardButton(text="💬 Fikr bildirish")]
    ]
    return ReplyKeyboardMarkup(menu_buttons, resize_keyboard=True)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Starts the conversation and asks the user for their name."""
    try:
        user_id = update.effective_user.id
        logger.info(f"🚀 Start command received from user {user_id}")
        
        # Track subscriber
        database.add_subscriber(user_id)
        logger.debug(f"📊 Subscriber added/updated: {user_id}")
        
        # Foydalanuvchi allaqachon ro'yxatdan o'tganmi tekshirish
        user_info = database.get_user_info(user_id)
        logger.debug(f"👤 User info check for {user_id}: {user_info is not None}")
        
        if user_info:
            # Agar ro'yxatdan o'tgan bo'lsa, context'ni yangilash va menyuga o'tish
            context.user_data["name"] = user_info[0]
            context.user_data["phone"] = user_info[1]
            logger.info(f"✅ Returning user: {user_info[0]} ({user_id})")
            
            reply_markup = get_main_menu_keyboard()
            await update.message.reply_text(
                f"Salom, {user_info[0]}! TozaHudud botiga qaytib kelganingiz uchun rahmat.\n\n"
                "Quyidagi xizmatlardan birini tanlang:",
                reply_markup=reply_markup,
            )
            return MENU
        
        # Agar ro'yxatdan o'tmagan bo'lsa, ro'yxatdan o'tishni boshlash
        logger.info(f"🆕 New user registration started: {user_id}")
        await update.message.reply_text(
            "Assalomu alaykum! TozaHudud botiga xush kelibsiz.\n\n"
            "Ro'yxatdan o'tish uchun iltimos, F.I.SH (Familiya Ism)ingizni kiriting:",
            reply_markup=ReplyKeyboardRemove(),
        )
        return NAME
        
    except Exception as e:
        logger.error(f"❌ Error in start command for user {update.effective_user.id}: {e}")
        await update.message.reply_text(
            "Kechirasiz, xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.\n"
            "/start buyrug'ini bosing."
        )
        return ConversationHandler.END

async def auto_clean_chat(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Automatically cleans the chat by deleting previous messages."""
    chat_id = update.effective_chat.id
    message_id = update.message.message_id
    
    # So'nggi 20 ta xabarni o'chirishga harakat qilish (tezroq ishlashi uchun)
    deleted_count = 0
    failed_count = 0
    
    # Joriy xabardan boshlab orqaga qarab xabarlarni o'chirish
    for i in range(message_id - 1, max(1, message_id - 20), -1):
        try:
            await context.bot.delete_message(chat_id=chat_id, message_id=i)
            deleted_count += 1
        except Exception:
            failed_count += 1
            # Agar ketma-ket 5 ta xabar o'chirilmasa, to'xtatish
            if failed_count > 5:
                break

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Shows help information."""
    help_text = (
        "🤖 TozaHudud Bot - Yordam\n\n"
        "📋 Mavjud buyruqlar:\n\n"
        "/start - Botni ishga tushirish va asosiy menyu\n"
        "/help - Yordam va qo'llanma\n"
        "/status - Yaqin qutilar holati\n"
        "/report - Muammo haqida xabar berish\n"
        "/feedback - Fikr va taklif yuborish\n"
        "/admin - Admin panel (faqat adminlar uchun)\n"
        "/cancel - Joriy amalni bekor qilish\n\n"
        "💡 Botdan foydalanish:\n"
        "1. /start buyrug'i bilan ro'yxatdan o'ting\n"
        "2. Asosiy menyudan kerakli xizmatni tanlang\n"
        "3. Ko'rsatmalarga amal qiling\n\n"
        "❓ Savollar bo'lsa, /feedback orqali yozing!"
    )
    await update.message.reply_text(help_text)

async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Shows nearby bins status."""
    user_id = update.effective_user.id
    
    # Foydalanuvchi ro'yxatdan o'tganmi tekshirish
    user_info = database.get_user_info(user_id)
    if not user_info:
        await update.message.reply_text(
            "Avval ro'yxatdan o'ting: /start"
        )
        return
    
    # Demo ma'lumotlar - haqiqiy loyihada GPS orqali yaqin qutilarni topish kerak
    status_text = (
        "📍 Yaqin atrofdagi qutilar holati:\n\n"
        "🗑 Quti #001 - Amir Temur ko'chasi\n"
        "   ✅ Bo'sh (25% to'lgan)\n"
        "   📍 500m uzoqlikda\n\n"
        "🗑 Quti #002 - Navoi ko'chasi\n"
        "   ⚠️ Yarim to'la (65% to'lgan)\n"
        "   📍 800m uzoqlikda\n\n"
        "🗑 Quti #003 - Buyuk Ipak Yo'li\n"
        "   🔴 To'la (95% to'lgan)\n"
        "   📍 1.2km uzoqlikda\n\n"
        "💡 Eng yaqin bo'sh quti: Quti #001"
    )
    await update.message.reply_text(status_text)

async def report_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Starts problem reporting process."""
    user_id = update.effective_user.id
    
    # Foydalanuvchi ro'yxatdan o'tganmi tekshirish
    user_info = database.get_user_info(user_id)
    if not user_info:
        await update.message.reply_text(
            "Avval ro'yxatdan o'ting: /start"
        )
        return ConversationHandler.END
    
    # Context'ni yangilash
    context.user_data["name"] = user_info[0]
    context.user_data["phone"] = user_info[1]
    
    reply_markup = ReplyKeyboardMarkup([[KeyboardButton(text="⬅️ Bekor qilish")]], resize_keyboard=True)
    await update.message.reply_text(
        "🗑 Muammo haqida xabar berish\n\n"
        "Iltimos, muammo haqida batafsil ma'lumot bering (matn ko'rinishida):",
        reply_markup=reply_markup,
    )
    return MUAMMO

async def feedback_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Starts feedback process."""
    user_id = update.effective_user.id
    
    # Foydalanuvchi ro'yxatdan o'tganmi tekshirish
    user_info = database.get_user_info(user_id)
    if not user_info:
        await update.message.reply_text(
            "Avval ro'yxatdan o'ting: /start"
        )
        return ConversationHandler.END
    
    # Context'ni yangilash
    context.user_data["name"] = user_info[0]
    context.user_data["phone"] = user_info[1]
    
    reply_markup = ReplyKeyboardMarkup([[KeyboardButton(text="⬅️ Bekor qilish")]], resize_keyboard=True)
    await update.message.reply_text(
        "💬 Fikr va taklif yuborish\n\n"
        "Iltimos, o'z fikr-mulohazalaringizni yozib qoldiring:",
        reply_markup=reply_markup
    )
    return FEEDBACK



async def get_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Stores the name and asks for the phone number."""
    try:
        user_name = update.message.text
        user_id = update.effective_user.id
        logger.info(f"📝 Name received from user {user_id}: {user_name}")
        
        context.user_data["name"] = user_name
        
        # Create a button to share contact and Back button
        contact_button = KeyboardButton(text="📞 Telefon raqamni yuborish", request_contact=True)
        back_button = KeyboardButton(text="⬅️ Orqaga")
        reply_markup = ReplyKeyboardMarkup([[contact_button], [back_button]], one_time_keyboard=True, resize_keyboard=True)

        await update.message.reply_text(
            f"Rahmat, {user_name}!\n\n"
            "Endi, iltimos, telefon raqamingizni yuboring (pastdagi tugmani bosing):",
            reply_markup=reply_markup,
        )
        logger.debug(f"✅ Name stored and phone request sent to user {user_id}")
        return PHONE
        
    except Exception as e:
        logger.error(f"❌ Error in get_name for user {update.effective_user.id}: {e}")
        await update.message.reply_text(
            "Kechirasiz, xatolik yuz berdi. Iltimos, ismingizni qaytadan kiriting:",
            reply_markup=ReplyKeyboardRemove(),
        )
        return NAME

async def get_phone(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Stores the phone number and shows the main menu."""
    try:
        user_id = update.effective_user.id
        logger.info(f"📞 Phone request received from user {user_id}")
        
        if update.message.text == "⬅️ Orqaga":
            logger.debug(f"🔙 User {user_id} went back to name input")
            await update.message.reply_text(
                "F.I.SH (Familiya Ism)ingizni qaytadan kiriting:",
                reply_markup=ReplyKeyboardRemove(),
            )
            return NAME

        contact = update.message.contact
        if not contact:
            logger.warning(f"⚠️ No contact received from user {user_id}")
            await update.message.reply_text("Iltimos, telefon raqamingizni yuboring yoki '⬅️ Orqaga' tugmasini bosing.")
            return PHONE

        phone_number = contact.phone_number
        context.user_data["phone"] = phone_number
        logger.info(f"✅ Phone number received from user {user_id}: {phone_number}")
        
        # Save user to database
        try:
            database.add_user(user_id, context.user_data["name"], phone_number)
            logger.info(f"💾 User saved to database: {context.user_data['name']} ({user_id})")
        except Exception as db_error:
            logger.error(f"❌ Database error saving user {user_id}: {db_error}")
            await update.message.reply_text(
                "Kechirasiz, ma'lumotlarni saqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."
            )
            return PHONE
        
        # Bot haqida ma'lumot berish
        bot_info_text = (
            "🤖 TozaHudud Bot haqida ma'lumot:\n\n"
            "📋 Botning maqsadi:\n"
            "• Shahar tozaligini saqlash va nazorat qilish\n"
            "• Chiqindi muammolarini tez hal qilish\n"
            "• Fuqarolar va hokimiyat o'rtasida aloqa o'rnatish\n\n"
            "🔧 Asosiy imkoniyatlar:\n"
            "• 🗑 Chiqindi muammolari haqida xabar berish\n"
            "• 🔍 Murojaatlar holatini kuzatish\n"
            "• ⭐ Xizmat sifatini baholash\n"
            "• 💬 Fikr va takliflar yuborish\n\n"
            "📍 Qanday ishlaydi:\n"
            "1. Muammoni aniqlang va xabar bering\n"
            "2. Rasm/video va lokatsiya yuboring\n"
            "3. Murojaatingiz tegishli xizmatlarga yuboriladi\n"
            "4. Holat haqida xabardor bo'lib turing\n\n"
            "⚡ Tezkor va samarali xizmat!\n"
            "🏙 Toza shahar - barchamizning ishimiz!\n\n"
            "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi.\n"
            "Quyidagi xizmatlardan birini tanlang:"
        )
        
        reply_markup = get_main_menu_keyboard()

        await update.message.reply_text(
            bot_info_text,
            reply_markup=reply_markup,
        )
        
        logger.info(f"🎉 User registration completed: {context.user_data['name']} ({user_id})")
        return MENU
        
    except Exception as e:
        logger.error(f"❌ Error in get_phone for user {update.effective_user.id}: {e}")
        await update.message.reply_text(
            "Kechirasiz, xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
            reply_markup=ReplyKeyboardRemove(),
        )
        return PHONE

async def menu_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handles main menu button presses."""
    try:
        text = update.message.text
        user_id = update.effective_user.id
        logger.info(f"🎯 Menu button pressed by user {user_id}: {text}")
        
        # Har qanday tugma bosilganda avtomatik chat tozalash
        try:
            await auto_clean_chat(update, context)
            logger.debug(f"🧹 Auto chat clean completed for user {user_id}")
        except Exception as clean_error:
            logger.warning(f"⚠️ Auto chat clean failed for user {user_id}: {clean_error}")
        
        if text == "🗑 Chiqindi bor":
            logger.info(f"🗑 Problem report started by user {user_id}")
            # Foydalanuvchi ma'lumotlarini tekshirish
            user_name = context.user_data.get("name")
            phone_number = context.user_data.get("phone")
            
            # Agar context'da yo'q bo'lsa, database'dan olish
            if not user_name or not phone_number:
                try:
                    user_info = database.get_user_info(user_id)
                    if user_info:
                        user_name = user_info[0]
                        phone_number = user_info[1]
                        context.user_data["name"] = user_name
                        context.user_data["phone"] = phone_number
                        logger.debug(f"👤 User info loaded from database for {user_id}")
                    else:
                        logger.error(f"❌ User info not found in database for {user_id}")
                        await update.message.reply_text(
                            "Kechirasiz, sizning ma'lumotlaringiz topilmadi. Iltimos, qaytadan ro'yxatdan o'ting.\n"
                            "/start buyrug'ini bosing.",
                            reply_markup=ReplyKeyboardRemove()
                        )
                        return ConversationHandler.END
                except Exception as db_error:
                    logger.error(f"❌ Database error getting user info for {user_id}: {db_error}")
                    await update.message.reply_text(
                        "Kechirasiz, ma'lumotlarni yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."
                    )
                    return MENU
            
            reply_markup = ReplyKeyboardMarkup([[KeyboardButton(text="⬅️ Orqaga")]], resize_keyboard=True)
            await update.message.reply_text(
                "Iltimos, muammo haqida batafsil ma'lumot bering (matn ko'rinishida):",
                reply_markup=reply_markup,
            )
            return MUAMMO
            
        elif text == "🔍 Holatni tekshirish":
            logger.info(f"🔍 Status check requested by user {user_id}")
            try:
                problems = database.get_user_problems(user_id)
                
                if not problems:
                    await update.message.reply_text(
                        "Sizda hali murojaatlar yo'q.",
                        reply_markup=get_main_menu_keyboard()
                    )
                else:
                    response_text = "Sizning murojaatlaringiz holati:\n\n"
                    for desc, status, date in problems:
                        response_text += (
                            f"📅 {date}\n"
                            f"❓ {desc[:30]}...\n"
                            f"✅ Holati: {status}\n"
                            f"-------------------\n"
                        )
                    await update.message.reply_text(
                        response_text,
                        reply_markup=get_main_menu_keyboard()
                    )
                logger.debug(f"✅ Status check completed for user {user_id}: {len(problems)} problems")
            except Exception as db_error:
                logger.error(f"❌ Database error getting problems for user {user_id}: {db_error}")
                await update.message.reply_text(
                    "Kechirasiz, ma'lumotlarni yuklashda xatolik yuz berdi.",
                    reply_markup=get_main_menu_keyboard()
                )
            return MENU
            
        elif text == "⭐ Baholash":
            logger.info(f"⭐ Rating started by user {user_id}")
            rating_buttons = [[KeyboardButton(text=str(i)) for i in range(1, 6)], [KeyboardButton(text="⬅️ Orqaga")]]
            reply_markup = ReplyKeyboardMarkup(rating_buttons, resize_keyboard=True)
            await update.message.reply_text(
                "Xizmatimizni baholang (1-5):",
                reply_markup=reply_markup
            )
            return RATING
            
        elif text == "💬 Fikr bildirish":
            logger.info(f"💬 Feedback started by user {user_id}")
            reply_markup = ReplyKeyboardMarkup([[KeyboardButton(text="⬅️ Orqaga")]], resize_keyboard=True)
            await update.message.reply_text(
                "Iltimos, o'z fikr-mulohazalaringizni yozib qoldiring:",
                reply_markup=reply_markup
            )
            return FEEDBACK
            
        elif text == "🚪 Chiqish" and update.effective_user.id in ADMIN_IDS:
            logger.info(f"🚪 Admin {user_id} exiting admin panel")
            return await admin_back(update, context)
        
        logger.warning(f"⚠️ Unknown menu option selected by user {user_id}: {text}")
        await update.message.reply_text("Iltimos, menyudagi tugmalardan birini tanlang:", reply_markup=get_main_menu_keyboard())
        return MENU
        
    except Exception as e:
        logger.error(f"❌ Error in menu_handler for user {update.effective_user.id}: {e}")
        await update.message.reply_text(
            "Kechirasiz, xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
            reply_markup=get_main_menu_keyboard()
        )
        return MENU

async def get_muammo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Stores the problem description and asks for media."""
    muammo_text = update.message.text
    
    # Avtomatik chat tozalash
    await auto_clean_chat(update, context)
    
    if muammo_text == "⬅️ Orqaga" or muammo_text == "⬅️ Bekor qilish":
        reply_markup = get_main_menu_keyboard()
        await update.message.reply_text("Asosiy menyuga qaytdingiz. Xizmatni tanlang:", reply_markup=reply_markup)
        return MENU

    context.user_data["muammo"] = muammo_text
    
    # Create skip and back buttons
    buttons = [
        [KeyboardButton(text="⏭ O'tkazib yuborish")],
        [KeyboardButton(text="⬅️ Bekor qilish")]
    ]
    reply_markup = ReplyKeyboardMarkup(buttons, one_time_keyboard=True, resize_keyboard=True)

    await update.message.reply_text(
        "Rahmat! Endi, agar mavjud bo'lsa, muammo tasvirlangan rasm yoki video yuboring.\n"
        "Agar rasm yoki video bo'lmasa, 'O'tkazib yuborish' tugmasini bosing:",
        reply_markup=reply_markup,
    )
    return MEDIA

async def get_media(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Stores the media (if any) and asks for location."""
    # Avtomatik chat tozalash
    await auto_clean_chat(update, context)
    
    if update.message.text == "⬅️ Orqaga" or update.message.text == "⬅️ Bekor qilish":
        reply_markup = ReplyKeyboardMarkup([[KeyboardButton(text="⬅️ Bekor qilish")]], resize_keyboard=True)
        await update.message.reply_text(
            "Muammo haqida batafsil ma'lumot bering:",
            reply_markup=reply_markup,
        )
        return MUAMMO

    user_id = update.effective_user.id
    
    # Foydalanuvchi ma'lumotlarini tekshirish
    user_name = context.user_data.get("name")
    phone_number = context.user_data.get("phone")
    
    # Agar context'da yo'q bo'lsa, database'dan olish
    if not user_name or not phone_number:
        user_info = database.get_user_info(user_id)
        if user_info:
            user_name = user_info[0]
            phone_number = user_info[1]
            context.user_data["name"] = user_name
            context.user_data["phone"] = phone_number
        else:
            await update.message.reply_text(
                "Kechirasiz, sizning ma'lumotlaringiz topilmadi. Iltimos, qaytadan ro'yxatdan o'ting.\n"
                "/start buyrug'ini bosing.",
                reply_markup=ReplyKeyboardRemove()
            )
            return ConversationHandler.END
    
    muammo_text = context.user_data.get("muammo")
    
    media_type = "Mavjud emas"
    file_id = None
    
    if update.message.photo:
        media_type = "Rasm"
        file_id = update.message.photo[-1].file_id
    elif update.message.video:
        media_type = "Video"
        file_id = update.message.video.file_id
    elif update.message.text == "⏭ O'tkazib yuborish":
        media_type = "O'tkazib yuborildi"
        
    # Save media to context
    context.user_data["media_type"] = media_type
    context.user_data["file_id"] = file_id
    
    # Ask for location
    location_button = KeyboardButton(text="📍 Lokatsiyani yuborish", request_location=True)
    back_button = KeyboardButton(text="⬅️ Orqaga")
    reply_markup = ReplyKeyboardMarkup([[location_button], [back_button]], one_time_keyboard=True, resize_keyboard=True)

    await update.message.reply_text(
        "Rahmat! Endi, iltimos, muammo joylashgan joyning lokatsiyasini yuboring (pastdagi tugmani bosing):",
        reply_markup=reply_markup,
    )
    return LOCATION

async def get_location(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Stores the location and ends the conversation."""
    # Avtomatik chat tozalash
    await auto_clean_chat(update, context)
    
    if update.message.text == "⬅️ Orqaga":
        buttons = [
            [KeyboardButton(text="⏭ O'tkazib yuborish")],
            [KeyboardButton(text="⬅️ Orqaga")]
        ]
        reply_markup = ReplyKeyboardMarkup(buttons, one_time_keyboard=True, resize_keyboard=True)
        await update.message.reply_text(
            "Rasm yoki video yuboring yoki '⏭ O'tkazib yuborish' tugmasini bosing:",
            reply_markup=reply_markup,
        )
        return MEDIA

    user_id = update.effective_user.id
    
    # Context'dan ma'lumotlarni olish
    user_name = context.user_data.get("name")
    phone_number = context.user_data.get("phone")
    
    # Agar context'da ma'lumot yo'q bo'lsa, database'dan olish
    if not user_name or not phone_number:
        user_info = database.get_user_info(user_id)
        if user_info:
            user_name = user_info[0]  # name
            phone_number = user_info[1]  # phone
            # Context'ni yangilash
            context.user_data["name"] = user_name
            context.user_data["phone"] = phone_number
        else:
            # Agar database'da ham yo'q bo'lsa, ro'yxatdan o'tishga yo'naltirish
            await update.message.reply_text(
                "Kechirasiz, sizning ma'lumotlaringiz topilmadi. Iltimos, qaytadan ro'yxatdan o'ting.\n"
                "/start buyrug'ini bosing.",
                reply_markup=ReplyKeyboardRemove()
            )
            return ConversationHandler.END
    
    muammo_text = context.user_data.get("muammo")
    media_type = context.user_data.get("media_type")
    file_id = context.user_data.get("file_id")
    
    # Lokatsiya tekshirish
    if not update.message.location:
        await update.message.reply_text(
            "Iltimos, lokatsiyani yuboring yoki '⬅️ Orqaga' tugmasini bosing.",
            reply_markup=ReplyKeyboardMarkup([[KeyboardButton(text="📍 Lokatsiyani yuborish", request_location=True)], [KeyboardButton(text="⬅️ Orqaga")]], one_time_keyboard=True, resize_keyboard=True)
        )
        return LOCATION
    
    location = update.message.location
    lat = location.latitude
    lon = location.longitude
    
    # Save problem to database
    database.add_problem(user_id, muammo_text, media_type, file_id, lat, lon)
    
    logger.info(f"Problem reported by {user_name} ({phone_number}) at {lat}, {lon}")
    
    admin_text = (
        f"🆕 Yangi murojaat!\n\n"
        f"👤 Ism: {user_name}\n"
        f"📞 Telefon: {phone_number}\n"
        f"❓ Muammo: {muammo_text}\n"
        f"📁 Fayl turi: {media_type}\n"
        f"📍 Lokatsiya: https://www.google.com/maps?q={lat},{lon}"
    )
    
   # Forward to admins
    for admin_id in ADMIN_IDS:
        try:
            await context.bot.send_message(chat_id=admin_id, text=admin_text)
            if file_id:
                if media_type == "Rasm":
                    await context.bot.send_photo(chat_id=admin_id, photo=file_id)
                elif media_type == "Video":
                    await context.bot.send_video(chat_id=admin_id, video=file_id)
            
            if lat and lon:
                await context.bot.send_location(chat_id=admin_id, latitude=lat, longitude=lon)
        except Exception as e:
            logger.error(f"Error forwarding report to admin {admin_id}: {e}")

    reply_markup = get_main_menu_keyboard()

    await update.message.reply_text(
        f"Rahmat! Sizning murojaatingiz qabul qilindi.\n\n"
        f"Ism: {user_name}\n"
        f"Telefon: {phone_number}\n"
        f"Muammo: {muammo_text}\n"
        f"Fayl turi: {media_type}\n"
        f"Lokatsiya: Saqlandi\n\n"
        "Tez orada biz sizni muomongizni ko'rib chiqamiz",
        reply_markup=reply_markup,
    )
    return MENU

async def get_rating(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Stores the rating and returns to the main menu."""
    text = update.message.text
    
    # Avtomatik chat tozalash
    await auto_clean_chat(update, context)
    
    if text == "⬅️ Orqaga":
        reply_markup = get_main_menu_keyboard()
        await update.message.reply_text("Asosiy menyuga qaytdingiz. Xizmatni tanlang:", reply_markup=reply_markup)
        return MENU
    
    if text in ["1", "2", "3", "4", "5"]:
        rating = int(text)
        database.add_rating(update.effective_user.id, rating)
        
        reply_markup = get_main_menu_keyboard()
        await update.message.reply_text(
            f"Bahoyingiz ({rating}) uchun rahmat!\n\n"
            "Asosiy menyuga qaytdingiz:",
            reply_markup=reply_markup
        )
        return MENU
    
    await update.message.reply_text("Iltimos, 1 dan 5 gacha bo'lgan sonni tanlang yoki '⬅️ Orqaga' tugmasini bosing.")
    return RATING

async def get_feedback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Stores the feedback and forwards it to the admin."""
    text = update.message.text
    
    # Avtomatik chat tozalash
    await auto_clean_chat(update, context)
    
    if text == "⬅️ Orqaga":
        reply_markup = get_main_menu_keyboard()
        await update.message.reply_text("Asosiy menyuga qaytdingiz. Xizmatni tanlang:", reply_markup=reply_markup)
        return MENU
    
    user_name = context.user_data.get("name", "Noma'lum")
    phone_number = context.user_data.get("phone", "Noma'lum")
    
    # Save to database
    database.add_feedback(update.effective_user.id, text)
    
    # Forward to admins
    admin_text = (
        f"💬 Yangi fikr-mulohaza!\n\n"
        f"👤 Ism: {user_name}\n"
        f"📞 Telefon: {phone_number}\n"
        f"📝 Fikr: {text}"
    )
    for admin_id in ADMIN_IDS:
        try:
            await context.bot.send_message(chat_id=admin_id, text=admin_text)
        except Exception as e:
            logger.error(f"Error forwarding feedback to admin {admin_id}: {e}")
            
    reply_markup = get_main_menu_keyboard()
    await update.message.reply_text(
        "Fikringiz uchun rahmat! Sizning fikringiz biz uchun muhim.\n\n"
        "Asosiy menyuga qaytdingiz:",
        reply_markup=reply_markup
    )
    return MENU

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancels and ends the conversation."""
    await update.message.reply_text(
        "Murojaat bekor qilindi.", reply_markup=ReplyKeyboardRemove()
    )
    return ConversationHandler.END

# Admin Handlers
async def admin_panel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Shows the admin panel."""
    if update.effective_user.id not in ADMIN_IDS:
        await update.message.reply_text("Sizda admin huquqlari yo'q.")
        return MENU

    reply_markup = ReplyKeyboardMarkup(
        [["📊 Statistika", "📝 Xabarlar"], ["💬 Fikrlar", "👥 Foydalanuvchilar"], ["🚪 Chiqish"]], resize_keyboard=True
    )
    await update.message.reply_text("Admin panelga xush kelibsiz:", reply_markup=reply_markup)
    return ADMIN_MENU

async def admin_back(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Returns to the main menu from admin panel."""
    if update.effective_user.id not in ADMIN_IDS:
        return MENU
    
    reply_markup = get_main_menu_keyboard()
    await update.message.reply_text("Asosiy menyuga qaytdingiz:", reply_markup=reply_markup)
    return MENU

async def admin_stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Shows bot statistics."""
    if update.effective_user.id not in ADMIN_IDS:
        return MENU
    
    total_problems, total_subscribers = database.get_stats()
    await update.message.reply_text(
        f"📊 Statistika:\n\n"
        f"Obunachilar: {total_subscribers}\n"
        f"Murojaatlar: {total_problems}"
    )
    return ADMIN_MENU

async def admin_messages(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Shows recent problem reports."""
    if update.effective_user.id not in ADMIN_IDS:
        return MENU
    
    problems = database.get_recent_problems(limit=5)
    if not problems:
        await update.message.reply_text("Hozircha murojaatlar yo'q.")
        return ADMIN_MENU
    
    text = "📝 Oxirgi 5 ta murojaat:\n\n"
    for desc, m_type, name, phone, date, lat, lon, status, p_id in problems:
        loc_link = f"https://www.google.com/maps?q={lat},{lon}" if lat and lon else "Mavjud emas"
        text += (
            f"👤 {name} ({phone})\n"
            f"📅 {date}\n"
            f"❓ {desc}\n"
            f"📁 Turi: {m_type}\n"
            f"📍 Lokatsiya: {loc_link}\n"
            f"✅ Holati: {status}\n"
            f"-------------------\n"
        )
        # Update status to 'ko'rib chiqildi'
        database.update_problem_status(p_id, "ko'rib chiqildi")
        
    await update.message.reply_text(text)
    return ADMIN_MENU

async def admin_feedbacks(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Shows recent feedbacks."""
    if update.effective_user.id not in ADMIN_IDS:
        return MENU
    
    feedbacks = database.get_recent_feedbacks(limit=5)
    if not feedbacks:
        await update.message.reply_text("Hozircha fikr-mulohazalar yo'q.")
        return ADMIN_MENU
    
    text = "💬 Oxirgi 5 ta fikr-mulohaza:\n\n"
    for f_text, name, phone, date in feedbacks:
        text += (
            f"👤 {name} ({phone})\n"
            f"📅 {date}\n"
            f"📝 {f_text}\n"
            f"-------------------\n"
        )
    await update.message.reply_text(text)
    return ADMIN_MENU

async def admin_users(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Shows user management options."""
    if update.effective_user.id not in ADMIN_IDS:
        return MENU
    
    reply_markup = ReplyKeyboardMarkup(
        [["📋 Barcha foydalanuvchilar", "🔍 Qidirish"], ["⬅️ Orqaga"]], resize_keyboard=True
    )
    await update.message.reply_text(
        "👥 Foydalanuvchilarni boshqarish:\n\n"
        "Quyidagi variantlardan birini tanlang:",
        reply_markup=reply_markup
    )
    return USER_MANAGEMENT

async def admin_all_users(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Shows all users with management options."""
    if update.effective_user.id not in ADMIN_IDS:
        return MENU
    
    users = database.get_all_users()
    if not users:
        await update.message.reply_text("Hozircha foydalanuvchilar yo'q.")
        return USER_MANAGEMENT
    
    text = "👥 Barcha foydalanuvchilar:\n\n"
    for user_id, name, phone, created_at, problems, feedbacks, ratings in users[:10]:  # Faqat birinchi 10 ta
        text += (
            f"🆔 ID: {user_id}\n"
            f"👤 Ism: {name}\n"
            f"📞 Tel: {phone}\n"
            f"📅 Ro'yxat: {created_at}\n"
            f"📊 Statistika: {problems} murojaat, {feedbacks} fikr, {ratings} reyting\n"
            f"-------------------\n"
        )
    
    if len(users) > 10:
        text += f"\n... va yana {len(users) - 10} ta foydalanuvchi\n"
    
    text += "\n💡 Foydalanuvchini o'chirish uchun ID raqamini yuboring"
    
    await update.message.reply_text(text)
    return USER_MANAGEMENT

async def admin_search_users(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handles user search."""
    if update.effective_user.id not in ADMIN_IDS:
        return MENU
    
    await update.message.reply_text(
        "🔍 Foydalanuvchini qidirish:\n\n"
        "Ism, telefon raqam yoki ID raqamini kiriting:",
        reply_markup=ReplyKeyboardMarkup([["⬅️ Orqaga"]], resize_keyboard=True)
    )
    return USER_MANAGEMENT

async def handle_user_management(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handles user management actions."""
    if update.effective_user.id not in ADMIN_IDS:
        return MENU
    
    text = update.message.text
    
    if text == "⬅️ Orqaga":
        return await admin_panel(update, context)
    elif text == "📋 Barcha foydalanuvchilar":
        return await admin_all_users(update, context)
    elif text == "🔍 Qidirish":
        return await admin_search_users(update, context)
    else:
        # Check if it's a user ID for deletion or search query
        if text.isdigit():
            user_id = int(text)
            # Check if user exists
            user_info = database.get_user_info(user_id)
            if user_info:
                name, phone = user_info
                context.user_data['delete_user_id'] = user_id
                context.user_data['delete_user_name'] = name
                
                reply_markup = ReplyKeyboardMarkup(
                    [["✅ Ha, o'chirish", "❌ Yo'q, bekor qilish"]], resize_keyboard=True
                )
                await update.message.reply_text(
                    f"⚠️ OGOHLANTIRISH!\n\n"
                    f"Foydalanuvchini o'chirishni tasdiqlaysizmi?\n\n"
                    f"👤 Ism: {name}\n"
                    f"📞 Tel: {phone}\n"
                    f"🆔 ID: {user_id}\n\n"
                    f"❗ Bu amal qaytarilmaydi!",
                    reply_markup=reply_markup
                )
                return USER_DELETE_CONFIRM
            else:
                await update.message.reply_text("❌ Bunday ID'li foydalanuvchi topilmadi.")
                return USER_MANAGEMENT
        else:
            # Search users
            users = database.search_users(text)
            if not users:
                await update.message.reply_text("❌ Hech kim topilmadi.")
                return USER_MANAGEMENT
            
            search_text = f"🔍 Qidiruv natijalari '{text}' uchun:\n\n"
            for user_id, name, phone, created_at, problems, feedbacks, ratings in users[:5]:
                search_text += (
                    f"🆔 ID: {user_id}\n"
                    f"👤 Ism: {name}\n"
                    f"📞 Tel: {phone}\n"
                    f"📅 Ro'yxat: {created_at}\n"
                    f"📊 {problems} murojaat, {feedbacks} fikr, {ratings} reyting\n"
                    f"-------------------\n"
                )
            
            search_text += "\n💡 O'chirish uchun ID raqamini yuboring"
            await update.message.reply_text(search_text)
            return USER_MANAGEMENT

async def handle_user_delete_confirm(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handles user deletion confirmation."""
    if update.effective_user.id not in ADMIN_IDS:
        return MENU
    
    text = update.message.text
    
    if text == "✅ Ha, o'chirish":
        user_id = context.user_data.get('delete_user_id')
        user_name = context.user_data.get('delete_user_name')
        
        if user_id:
            success, message = database.delete_user_completely(user_id)
            if success:
                await update.message.reply_text(f"✅ {message}")
                logger.info(f"Admin {update.effective_user.id} deleted user {user_id} ({user_name})")
            else:
                await update.message.reply_text(f"❌ {message}")
        
        # Clear context
        context.user_data.pop('delete_user_id', None)
        context.user_data.pop('delete_user_name', None)
        
        return await admin_users(update, context)
    
    elif text == "❌ Yo'q, bekor qilish":
        context.user_data.pop('delete_user_id', None)
        context.user_data.pop('delete_user_name', None)
        await update.message.reply_text("❌ O'chirish bekor qilindi.")
        return await admin_users(update, context)
    
    else:
        await update.message.reply_text("Iltimos, tugmalardan birini tanlang.")
        return USER_DELETE_CONFIRM


async def fallback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handles messages outside of conversation."""
    user_id = update.effective_user.id
    
    # Foydalanuvchi ro'yxatdan o'tganmi tekshirish
    user_info = database.get_user_info(user_id)
    if user_info:
        # Agar ro'yxatdan o'tgan bo'lsa, menyuni ko'rsatish
        reply_markup = get_main_menu_keyboard()
        await update.message.reply_text(
            f"Salom, {user_info[0]}! Quyidagi xizmatlardan birini tanlang:",
            reply_markup=reply_markup,
        )
    else:
        # Agar ro'yxatdan o'tmagan bo'lsa, start buyrug'ini taklif qilish
        await update.message.reply_text(
            "Salom! TozaHudud botidan foydalanish uchun avval ro'yxatdan o'ting.\n"
            "/start buyrug'ini bosing."
        )

async def set_bot_commands(application):
    """Set bot commands for the menu."""
    commands = [
        BotCommand("start", "Botni ishga tushirish va asosiy menyu"),
        BotCommand("help", "Yordam va qo'llanma"),
        BotCommand("status", "Yaqin qutilar holati"),
        BotCommand("report", "Muammo haqida xabar berish"),
        BotCommand("feedback", "Fikr va taklif yuborish"),
        BotCommand("admin", "Admin panel"),
        BotCommand("cancel", "Joriy amalni bekor qilish")
    ]
    
    await application.bot.set_my_commands(commands)
    logger.info("Bot commands set successfully")

def main():
    """Start the bot."""
    if not BOT_TOKEN:
        logger.error("BOT_TOKEN not found in .env file!")
        return

    # Initialize database
    database.init_db()

    # Python 3.14 uchun event loop yaratish
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    application = ApplicationBuilder().token(BOT_TOKEN).build()

    # Add conversation handler
    conv_handler = ConversationHandler(
        entry_points=[
            CommandHandler("start", start),
            CommandHandler("admin", admin_panel),
            CommandHandler("report", report_command),
            CommandHandler("feedback", feedback_command)
        ],
        states={
            NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_name)],
            PHONE: [MessageHandler(filters.CONTACT | filters.TEXT & ~filters.COMMAND, get_phone)],
            MENU: [MessageHandler(filters.TEXT & ~filters.COMMAND, menu_handler)],
            MUAMMO: [
                MessageHandler(filters.Regex("^🚪 Chiqish$") & filters.Chat(ADMIN_IDS), admin_back),
                MessageHandler(filters.TEXT & ~filters.COMMAND, get_muammo)
            ],
            MEDIA: [
                MessageHandler(filters.Regex("^🚪 Chiqish$") & filters.Chat(ADMIN_IDS), admin_back),
                MessageHandler(
                    filters.PHOTO | filters.VIDEO | filters.TEXT & ~filters.COMMAND, 
                    get_media
                )
            ],
            LOCATION: [
                MessageHandler(filters.Regex("^🚪 Chiqish$") & filters.Chat(ADMIN_IDS), admin_back),
                MessageHandler(filters.LOCATION | filters.TEXT & ~filters.COMMAND, get_location)
            ],
            RATING: [
                MessageHandler(filters.Regex("^🚪 Chiqish$") & filters.Chat(ADMIN_IDS), admin_back),
                MessageHandler(filters.TEXT & ~filters.COMMAND, get_rating)
            ],
            FEEDBACK: [
                MessageHandler(filters.Regex("^🚪 Chiqish$") & filters.Chat(ADMIN_IDS), admin_back),
                MessageHandler(filters.TEXT & ~filters.COMMAND, get_feedback)
            ],
            ADMIN_MENU: [
                MessageHandler(filters.Regex("^📊 Statistika$") & filters.Chat(ADMIN_IDS), admin_stats),
                MessageHandler(filters.Regex("^📝 Xabarlar$") & filters.Chat(ADMIN_IDS), admin_messages),
                MessageHandler(filters.Regex("^💬 Fikrlar$") & filters.Chat(ADMIN_IDS), admin_feedbacks),
                MessageHandler(filters.Regex("^👥 Foydalanuvchilar$") & filters.Chat(ADMIN_IDS), admin_users),
                MessageHandler(filters.Regex("^🚪 Chiqish$") & filters.Chat(ADMIN_IDS), admin_back),
            ],
            USER_MANAGEMENT: [
                MessageHandler(filters.TEXT & filters.Chat(ADMIN_IDS) & ~filters.COMMAND, handle_user_management),
            ],
            USER_DELETE_CONFIRM: [
                MessageHandler(filters.TEXT & filters.Chat(ADMIN_IDS) & ~filters.COMMAND, handle_user_delete_confirm),
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        allow_reentry=True,
    )

    application.add_handler(conv_handler)
    
    # Add separate command handlers
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("status", status_command))
    
    # Add fallback handler for messages outside conversation
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, fallback_handler))

    logger.info(f"Bot started using {DB_BACKEND} backend...")
    
    # Set bot commands after starting
    async def post_init(application):
        await set_bot_commands(application)
    
    application.post_init = post_init
    
    # Start the bot
    try:
        application.run_polling()
    except RuntimeError as e:
        if "no current event loop" in str(e).lower():
            logger.info("Creating new event loop...")
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            application.run_polling()
        else:
            raise e

if __name__ == "__main__":
    main()
