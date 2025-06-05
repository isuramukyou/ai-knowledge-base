import os
import json
from typing import List, Optional
import aiohttp
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineQueryResultArticle, InputTextMessageContent
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize bot and dispatcher
bot = Bot(token=os.getenv("TELEGRAM_BOT_TOKEN"))
dp = Dispatcher()

# API endpoint for search
API_URL = os.getenv("API_URL", "http://app:3000")

async def search_items(query: str) -> List[dict]:
    """Search for items using the API"""
    async with aiohttp.ClientSession() as session:
        # Search in AI models
        async with session.get(f"{API_URL}/api/models", params={"search": query, "limit": 5}) as response:
            models = await response.json()
            model_items = models.get("models", [])

        # Search in knowledge base
        async with session.get(f"{API_URL}/api/knowledge", params={"search": query, "limit": 5}) as response:
            knowledge = await response.json()
            knowledge_items = knowledge.get("items", [])

        return model_items + knowledge_items

@dp.inline_query()
async def inline_search(inline_query: types.InlineQuery):
    """Handle inline search queries"""
    query = inline_query.query.strip()
    if not query:
        return

    try:
        items = await search_items(query)
        results = []

        for item in items:
            # Determine if it's an AI model or knowledge item
            is_model = "name" in item
            title = item.get("name") if is_model else item.get("title")
            description = item.get("description", "")
            url = item.get("website_url") if is_model else item.get("url")

            # Create message text
            message_text = f"*{title}*\n\n{description}"
            if url:
                message_text += f"\n\n[Источник]({url})"

            # Create inline result
            result = InlineQueryResultArticle(
                id=str(item["id"]),
                title=title,
                description=description[:100] + "..." if len(description) > 100 else description,
                input_message_content=InputTextMessageContent(
                    message_text=message_text,
                    parse_mode="Markdown"
                )
            )
            results.append(result)

        await inline_query.answer(results=results, cache_time=300)

    except Exception as e:
        print(f"Error in inline search: {e}")
        await inline_query.answer(results=[], cache_time=300)

async def main():
    """Start the bot"""
    await dp.start_polling(bot)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main()) 