const API_KEY =
  '94fdf8223e0cad4a78e94f46b09a6a60f60af72e65c0a14984359a44b94b54bc';

const tickersHandlers = new Map(); // => {} // тикеры на которые я сейчас подписан

export const loadTickers = () => {
  if (tickersHandlers.size === 0) {
    return;
  }

  return fetch(
    `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[
      ...tickersHandlers.keys(),
    ].join(',')}&tsyms=USD&api_key=${API_KEY}`
  )
    .then((response) => response.json())
    .then((rawData) => {
      const updatedPrice = Object.fromEntries(
        Object.entries(rawData).map(([key, value]) => [key, value.USD])
      );

      Object.entries(updatedPrice).forEach(([currency, newPrice]) => {
        // tickersHandlers.get(currency) - вытягивается обработчик подписаного тикера - тобеж какая-то function
        const handlers = tickersHandlers.get(currency) ?? [];

        // и для каждого из этих обработчиков запустить function с новой ценой
        handlers.forEach((fn) => fn(newPrice));
      });
    });
};

// когда ticker обеовится вызови callback
// в mape tickers будет хранится список функций которые надо вызвать когда изменился какой-то ticker
// пример когда в объекте tickers изменился ключ например tickers['DOGE'] надо вызвать список функций
export const subscribeToTicker = (ticker, callback) => {
  const subscribers = tickersHandlers.get(ticker) || [];

  tickersHandlers.set(ticker, [...subscribers, callback]);
};

// мы вытягиваем всех кто подписан (tickers.get) на этот тикер и оставляем там функцию которая отличается от callback
export const unsubscribeToTicker = (ticker) => {
  tickersHandlers.delete(ticker);
  // const subscribers = tickersHandlers.get(ticker) || [];

  // tickersHandlers.set(
  //   ticker,
  //   subscribers.filter((fn) => fn !== callback)
  // );
};

// в таком варианте через subscribe loadtickers будет вызоваться только здесь
setInterval(loadTickers, 5000);

window.tickers = tickersHandlers;
