/**
 * SOL Tap - Bot Setup Script
 *
 * Run this once to configure the Telegram bot's menu button
 * to open the Mini App.
 *
 * Usage:
 *   node bot-setup.js
 *
 * Prerequisites:
 *   npm install node-fetch@2
 *
 * After running this script, you need to host the Mini App files
 * (index.html, game.js, style.css) on HTTPS. Options:
 *
 * Option 1: GitHub Pages (free)
 *   1. Create repo: gh repo create TateLyman/tap-game --public
 *   2. Push the files to main branch
 *   3. Enable GitHub Pages in repo Settings > Pages > Source: main
 *   4. URL will be: https://tatelyman.github.io/tap-game/
 *
 * Option 2: Add to devtools site
 *   1. Copy files to /Users/tatelyman/products/devtools-site/public/tap-game/
 *   2. Push to main (auto-deploys via Vercel)
 *   3. URL will be: https://devtools-site-delta.vercel.app/tap-game/
 *
 * After hosting, update MINI_APP_URL below and re-run this script.
 */

const BOT_TOKEN = '8252019722:AAGkO1ToeAo_gVtoGpmajQm8CpyHrv2Yb-k';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

// UPDATE THIS after hosting
const MINI_APP_URL = 'https://tatelyman.github.io/tap-game/';

async function setup() {
  const fetch = (await import('node-fetch')).default;

  console.log('Setting up SOL Tap Mini App...\n');

  // 1. Set the menu button to open the Mini App
  console.log('1. Setting chat menu button...');
  const menuRes = await fetch(`${API_BASE}/setChatMenuButton`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      menu_button: {
        type: 'web_app',
        text: 'SOL Tap',
        web_app: { url: MINI_APP_URL }
      }
    })
  });
  const menuData = await menuRes.json();
  console.log('   Result:', menuData.ok ? 'Success' : menuData.description);

  // 2. Set bot commands (add /play alongside existing commands)
  console.log('\n2. Adding /play command...');

  // First get existing commands
  const existingRes = await fetch(`${API_BASE}/getMyCommands`);
  const existingData = await existingRes.json();
  const existingCommands = existingData.result || [];

  // Check if /play already exists
  const hasPlay = existingCommands.some(c => c.command === 'play');
  if (!hasPlay) {
    // Add /play to the beginning
    const updatedCommands = [
      { command: 'play', description: 'Play SOL Tap and earn points' },
      ...existingCommands
    ];

    const cmdRes = await fetch(`${API_BASE}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: updatedCommands })
    });
    const cmdData = await cmdRes.json();
    console.log('   Result:', cmdData.ok ? 'Success' : cmdData.description);
  } else {
    console.log('   /play command already exists, skipping.');
  }

  // 3. Set bot description mentioning the game
  console.log('\n3. Setting short description...');
  const descRes = await fetch(`${API_BASE}/setMyShortDescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      short_description: 'Solana Scanner Bot + SOL Tap Mini Game'
    })
  });
  const descData = await descRes.json();
  console.log('   Result:', descData.ok ? 'Success' : descData.description);

  console.log('\n--- Setup Complete ---');
  console.log(`\nMini App URL: ${MINI_APP_URL}`);
  console.log('\nNext steps:');
  console.log('1. Host the game files at the URL above (GitHub Pages or Vercel)');
  console.log('2. Add Stars invoice handler to your bot.js (see below)');
  console.log('\n--- Bot Handler Code (add to bot.js) ---\n');
  console.log(getBotHandlerCode());
}

function getBotHandlerCode() {
  return `
// ========== SOL Tap Mini App Handlers ==========
// Add this to your bot.js message handler

// Handle /play command - send Mini App button
if (text === '/play') {
  return bot.sendMessage(chatId, '\\u{1F3AE} *SOL Tap*\\n\\nTap to mine virtual SOL points!\\nCompete on leaderboards and buy boosts with Stars.', {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[{
        text: '\\u{25B6}\\u{FE0F} Play SOL Tap',
        web_app: { url: '${MINI_APP_URL}' }
      }]]
    }
  });
}

// Handle Mini App data (boost purchases)
bot.on('web_app_data', async (msg) => {
  const chatId = msg.chat.id;
  try {
    const data = JSON.parse(msg.web_app_data.data);

    if (data.action === 'buy_boost') {
      const boostNames = {
        multiplier2x: '2x Multiplier (1 hour)',
        energyRefill: 'Energy Refill',
        autoTap: 'Auto-Tap (30 min)',
        megaTap: 'Mega Tap 5x (30 min)'
      };

      // Create Stars invoice
      await bot.sendInvoice(chatId, {
        title: boostNames[data.boost] || 'Game Boost',
        description: 'SOL Tap game boost',
        payload: JSON.stringify({ boost: data.boost, userId: data.userId }),
        currency: 'XTR', // Telegram Stars
        prices: [{ label: boostNames[data.boost], amount: data.price }]
      });
    }
  } catch(e) {
    console.error('Mini App data error:', e);
  }
});

// Handle successful Stars payment for game boosts
bot.on('pre_checkout_query', async (query) => {
  // Auto-approve all checkout queries
  await bot.answerPreCheckoutQuery(query.id, true);
});

bot.on('successful_payment', async (msg) => {
  const chatId = msg.chat.id;
  try {
    const payload = JSON.parse(msg.successful_payment.invoice_payload);
    if (payload.boost) {
      await bot.sendMessage(chatId,
        '\\u{2705} Boost purchased! Open SOL Tap to activate it.',
        {
          reply_markup: {
            inline_keyboard: [[{
              text: '\\u{25B6}\\u{FE0F} Open SOL Tap',
              web_app: { url: '${MINI_APP_URL}' }
            }]]
          }
        }
      );
    }
  } catch(e) {}
});
// ========== End SOL Tap Handlers ==========
`;
}

setup().catch(console.error);
