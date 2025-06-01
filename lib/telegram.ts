import { Telegraf } from 'telegraf';
import { AIModelWithDetails } from './models/ai-model';
import { KnowledgeItemWithDetails } from './models/knowledge-item';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const chatId = process.env.TELEGRAM_CHAT_ID!;

// Helper function to check if text contains HTML special characters
function containsHtmlSpecialChars(text: string): boolean {
  return /[<>]/.test(text);
}

// Helper function to check if any of the fields contain HTML special characters
function shouldUsePlainText(item: AIModelWithDetails | KnowledgeItemWithDetails): boolean {
  const fieldsToCheck = [
    'name' in item ? item.name : item.title,
    item.description,
    item.category_name,
    item.author_first_name,
    item.author_last_name
  ].filter((field): field is string => typeof field === 'string');

  return fieldsToCheck.some(field => containsHtmlSpecialChars(field));
}

export async function sendNewAIModelNotification(model: AIModelWithDetails) {
  const usePlainText = shouldUsePlainText(model);
  
  const message = usePlainText
    ? `🤖 Нейросети | ${model.category_name}\n\n${model.name}\n\n${model.description}\n\n👤 ${model.author_first_name}${model.author_last_name ? ' ' + model.author_last_name : ''}`
    : `<blockquote>🤖 Нейросети | ${model.category_name}</blockquote>\n\n<b>${model.name}</b>\n\n${model.description}\n\n<code>👤 ${model.author_first_name}${model.author_last_name ? ' ' + model.author_last_name : ''}</code>`;

  const keyboard = model.website_url ? {
    inline_keyboard: [[
      { text: 'Перейти на сайт', url: model.website_url }
    ]]
  } : undefined;

  if (model.cover_url) {
    await bot.telegram.sendPhoto(chatId, model.cover_url, {
      caption: message,
      ...(usePlainText ? {} : { parse_mode: 'HTML' }),
      ...(keyboard && { reply_markup: keyboard })
    });
  } else {
    await bot.telegram.sendMessage(chatId, message, {
      ...(usePlainText ? {} : { parse_mode: 'HTML' }),
      ...(keyboard && { reply_markup: keyboard })
    });
  }
}

export async function sendNewKnowledgeItemNotification(item: KnowledgeItemWithDetails) {
  const usePlainText = shouldUsePlainText(item);
  
  const message = usePlainText
    ? `📚 База знаний | ${item.category_name}\n\n${item.title}\n\n${item.description}\n\n👤 ${item.author_first_name}${item.author_last_name ? ' ' + item.author_last_name : ''}`
    : `<blockquote>📚 База знаний | ${item.category_name}</blockquote>\n\n<b>${item.title}</b>\n\n${item.description}\n\n<code>👤 ${item.author_first_name}${item.author_last_name ? ' ' + item.author_last_name : ''}</code>`;

  const keyboard = item.url ? {
    inline_keyboard: [[
      { text: 'Перейти на сайт', url: item.url }
    ]]
  } : undefined;

  if (item.cover_url) {
    await bot.telegram.sendPhoto(chatId, item.cover_url, {
      caption: message,
      ...(usePlainText ? {} : { parse_mode: 'HTML' }),
      ...(keyboard && { reply_markup: keyboard })
    });
  } else {
    await bot.telegram.sendMessage(chatId, message, {
      ...(usePlainText ? {} : { parse_mode: 'HTML' }),
      ...(keyboard && { reply_markup: keyboard })
    });
  }
} 