import { Telegraf } from 'telegraf';
import { AIModelWithDetails } from './models/ai-model';
import { KnowledgeItemWithDetails } from './models/knowledge-item';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const chatId = process.env.TELEGRAM_CHAT_ID!;

export async function sendNewAIModelNotification(model: AIModelWithDetails) {
  const message = `
<blockquote>🤖 Нейросети | ${model.category_name}</blockquote>

<b>${model.name}</b>

${model.description}

<code>👤 ${model.author_first_name}${model.author_last_name ? ' ' + model.author_last_name : ''}</code>
`;

  const keyboard = model.website_url ? {
    inline_keyboard: [[
      { text: 'Перейти на сайт', url: model.website_url }
    ]]
  } : undefined;

  if (model.cover_url) {
    await bot.telegram.sendPhoto(chatId, model.cover_url, {
      caption: message,
      parse_mode: 'HTML',
      ...(keyboard && { reply_markup: keyboard })
    });
  } else {
    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      ...(keyboard && { reply_markup: keyboard })
    });
  }
}

export async function sendNewKnowledgeItemNotification(item: KnowledgeItemWithDetails) {
  const message = `
<blockquote>📚 База знаний | ${item.category_name}</blockquote>

<b>${item.title}</b>

${item.description}

<code>👤 ${item.author_first_name}${item.author_last_name ? ' ' + item.author_last_name : ''}</code>
`;

  const keyboard = item.url ? {
    inline_keyboard: [[
      { text: 'Перейти на сайт', url: item.url }
    ]]
  } : undefined;

  if (item.cover_url) {
    await bot.telegram.sendPhoto(chatId, item.cover_url, {
      caption: message,
      parse_mode: 'HTML',
      ...(keyboard && { reply_markup: keyboard })
    });
  } else {
    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      ...(keyboard && { reply_markup: keyboard })
    });
  }
} 