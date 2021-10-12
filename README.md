# crypto-bot

A trading bot for trading cryptocurrency

The algorithm is based on the <a href="https://en.wikipedia.org/wiki/Coppock_curve" target="_blank">Coppock Curve</a> for **BUY** indication and ATR (WMA10 of TR) for **SELL** indication

CoinGecko is used to get current price data  
<a href="https://docs.google.com/spreadsheets/d/1wTTuxXt8n9q7C4NDXqQpI3wpKu1_5bGVmP9Xz0XGSyU/edit#gid=0" target="_blank">Available coins at Coingecko</a>

CCXT is used to connect to exchange  
<a href="https://ccxt.readthedocs.io/en/latest/manual.html#exchanges" target="_blank">Available exchanges with CCXT</a>

_ATT: This is built mostly for fun. I am no trading expert, use this at your own risk_

### TODO

- [x] Finish algorithm for BUY
- [x] Finish algorithm for SELL
- [ ] Test and fine tune algorithms until good BUY/SELL results
- [x] Connect to Graph frontend
- [x] Allow multiple concurrent orders
- [x] Connect to exchange
- [ ] Log BUY/SELL to file (for tax reports)
- [ ] Earn money
