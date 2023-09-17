require('dotenv').config();
const ccxt = require('ccxt');
const moment = require('moment');
const TelegramBot = require('node-telegram-bot-api');

async function main() {
  // replace 'YOUR_BOT_TOKEN' with the token you received from BotFather
  const bot = new TelegramBot(process.env.YOUR_BOT_TOKEN, { polling: true });
  // Listen for any kind of message
//   bot.on('message', async (msg) => {
//     const chatId = msg.chat.id;
//     if(msg.text.includes('/')){
//         const price = await getCryptoCurrency(msg.text);
//         bot.sendMessage(
//           chatId,
//           `
//           ${msg.text}
//           Time:${price[price.length - 1].timestamp}
//           open:${price[price.length - 1].open},
//           high:${price[price.length - 1].high},
//           low:${price[price.length - 1].low},
//           close: ${price[price.length - 1].close},
//           volume: ${price[price.length - 1].volume}`
//         );
//     }
//     else if(msg.text.includes('funding fee')){
//         const topFundingFeeCoins = await getTopFundingFeeCoin(msg.text.slice(4,5)) // Ex: 'Top 5 funding fee' => Get '5'
//         let message = msg.text
//         for (const coin of topFundingFeeCoins) {
//             message += `\nPair: ${coin.pair}, \nFundingFee: ${Math.round(coin.fundingRate * 100) / 100}%
//             `;
//         }
//         await bot.sendMessage(chatId, message);
//     }
//     else{
//         bot.sendMessage(chatId, 'Having 2 action BINANCE: \n1.Find detail currency (Ex: BTC/USDT)\n2.Find top funding fee (Ex: Top 5 funding fee)')
//     }
//   });
bot.onText(/\/start/, (msg) => {
    const options = {
      reply_markup: {
        keyboard: [
          ['TOP 5 FUNDING FEE'],
          ['TOP 10 FUNDING FEE']
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    };
  
    bot.sendMessage(msg.chat.id, 'Choose an option:', options);
  });
  
  bot.onText(/TOP (\d+)/, async (msg, match) => {
    const option = match[1];
    const topFundingFeeCoins = await getTopFundingFeeCoin(option) // Ex: 'Top 5 funding fee' => Get '5'
        let message = msg.text
        for (const coin of topFundingFeeCoins) {
            message += `\nPair: ${coin.pair}, \nFundingFee: ${Math.round(coin.fundingRate * 100) / 100}%
            `;
        }
        await bot.sendMessage(msg.chat.id, message);
  });
}

async function getCryptoCurrency(currency) {
  const binance = new ccxt.binance();
  const btcprice = await binance.fetchOHLCV(currency, '30m', undefined, 20);

  const btc = btcprice.map((price) => {
    return {
      timestamp: moment(price[0]).format(),
      open: price[1],
      high: price[2],
      low: price[3],
      close: price[4],
      volume: price[5],
    };
  });
  return btc;
}

/**
 * Get top funding fee coin
 * @param top: Number
 * @returns topFundingFeeCoin 
 */
async function getTopFundingFeeCoin(top){
    const exchange = new ccxt.binance();
    const markets = await exchange.fetchFundingRates();
    let topFundingFeeCoin = [];
    for (const pair in markets) {
      let fundingRate = markets[pair].fundingRate;
      if (fundingRate < 0) fundingRate = fundingRate * -1;
      topFundingFeeCoin.push({ pair, fundingRate: fundingRate * 100 });
    }
    topFundingFeeCoin = topFundingFeeCoin
      .sort((a, b) => b.fundingRate - a.fundingRate)
      .slice(0, Number(top));
    return topFundingFeeCoin
}

main();
