const API_KEY =
  '7f442910fdc194be6e6ce9934e93de97d1a217ef291cbcacb359c384ae5a7523';

const tickersHandlers = new Map(); // => {} // тикеры на которые я сейчас подписан

// создание websocket
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const AGGREGATE_INDEX = '5';

socket.addEventListener('message', (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: currency,
    PRICE: newPrice,
  } = JSON.parse(e.data);

  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }

  const handlers = tickersHandlers.get(currency) ?? [];
  handlers.forEach((fn) => fn(newPrice));
});

// создание новой функции для выноса socket.send (можно было написать и без новой ф-ка в subscribeToTicker)
function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);

  // если socket открыт сразу шлем сообщение
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }

  // если socket не открыт дождаться пока откроеться и послать сообщение
  socket.addEventListener(
    'open',
    () => {
      socket.send(stringifiedMessage);
    },
    { once: true }
  );
}

export function subscribeToTickerOnWebSocket(ticker) {
  // для удобсттва константа message
  sendToWebSocket({
    action: 'SubAdd',
    subs: [`5~CCCAGG~${ticker}~USD`],
  });
}

function unsubscribeToTickerOnWebSocket(ticker) {
  // для удобсттва константа message
  sendToWebSocket({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${ticker}~USD`],
  });
}

// когда ticker обеовится вызови callback
// в mape tickers будет хранится список функций которые надо вызвать когда изменился какой-то ticker
// пример когда в объекте tickers изменился ключ например tickers['DOGE'] надо вызвать список функций
export const subscribeToTicker = (ticker, callback) => {
  const subscribers = tickersHandlers.get(ticker) || [];

  tickersHandlers.set(ticker, [...subscribers, callback]);

  // тут использую ф-ка с методом send и передаю туда ticker websocket
  subscribeToTickerOnWebSocket(ticker);
};

// мы вытягиваем всех кто подписан (tickers.get) на этот тикер и оставляем там функцию которая отличается от callback
export const unsubscribeToTicker = (ticker) => {
  tickersHandlers.delete(ticker);
  unsubscribeToTickerOnWebSocket(ticker);
  // const subscribers = tickersHandlers.get(ticker) || [];

  // tickersHandlers.set(
  //   ticker,
  //   subscribers.filter((fn) => fn !== callback)
  // );
};

window.tickers = tickersHandlers;
