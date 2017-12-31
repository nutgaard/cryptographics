import React, { Component } from 'react';
import LZString from 'lz-string';
import Box from './components/box';
import Chart from './components/chart';
import './application.css';

window.LZString = LZString;

const urls = {
    '2H': (currency) => `https://min-api.cryptocompare.com/data/histominute?fsym=${currency}&tsym=USD&limit=120`,
    '1D': (currency) => `https://min-api.cryptocompare.com/data/histominute?fsym=${currency}&tsym=USD&limit=120&aggregate=12`,
    '1W': (currency) => `https://min-api.cryptocompare.com/data/histohour?fsym=${currency}&tsym=USD&limit=168`,
    '1M': (currency) => `https://min-api.cryptocompare.com/data/histohour?fsym=${currency}&tsym=USD&limit=120&aggregate=6`,
    '1Y': (currency) => `https://min-api.cryptocompare.com/data/histoday?fsym=${currency}&tsym=USD&limit=120&aggregate=3`
};

function fetchData(currency, type) {
    return fetch(urls[type](currency))
        .then((resp) => {
            if (resp.ok) {
                return resp;
            }
            const error = new Error(resp);
            error.currency = currency;
            throw error;
        }, (resp) => {
            const error = new Error(resp);
            error.currency = currency;
            throw error;
        })
        .then((resp) => resp.json())
        .then((json) => {
            if (json.Response === 'Error') {
                const error = new Error(json);
                error.currency = currency;
                throw error;
            } else {
                json.currency = currency;
                return json;
            }
        })
}
function settled(...promises) {
    return Promise.all(promises.map((promise) => promise.then(
        (resp) => ({ state: 'fulfilled', result: resp, currency: resp.currency }),
        (resp) => ({ state: 'rejected', result: resp, currency: resp.currency })
    )));
}

const coins = {
    BTC: 'Bitcoin',
    DASH: 'Dash',
    ETH: 'Ethereum',
    LTC: 'Litecoin',
    XMR: 'Monero',
    XRP: 'Ripple',
    LSK: 'Lisk'
};
const holdings = {
    BTC: 0.0974,
    LTC: 5.9253,
    ETH: 0.2151,
    DASH: 1,
    XMR: 1,
    XRP: 605.18423,
    LSK: 5.65434000
};

function price(state, datapoint, key) {
    if (state.laster) {
        return '0.00$';
    }
    const value = state.data.grouped[datapoint][key].toFixed(2);
    return `${value}$`;
}

function getTime(time, type) {
    const date = new Date(parseInt(time + '000', 10));
    return date.toLocaleString('nb');
}

const storageVersion = 3;
function lastFraLocalstorage() {
    const data = JSON.parse(window.localStorage.getItem('cryptographics'));
    if (data && data.version === storageVersion) {
        return JSON.parse(LZString.decompress(data.content));
    } else {
        return {
            type: '1W',
            laster: true,
            data: null
        };
    }
}

function lagreTilLocalstorage(state) {
    const stateJSON = LZString.compress(JSON.stringify(state));
    const content = JSON.stringify({ version: storageVersion, content: stateJSON });
    window.localStorage.setItem('cryptographics', content);
}

class Application extends Component {
    state = lastFraLocalstorage();

    hentData = () => {
        settled(...Object.keys(holdings).map((currency) => fetchData(currency, this.state.type)))
            .then((data) => {
                const rejected = data
                    .filter((currency) => currency.state === 'rejected')
                    .map((currency) => currency.currency);

                const fulfilled = data
                    .filter((currency) => currency.state === 'fulfilled')
                    .map((currency) => {
                        return {
                            currency: currency.currency,
                            data: currency.result.Data.reduce((acc, { time, close }) => ({ ...acc, [time]: close }), {})
                        };
                    });

                if (fulfilled.length > 0) {
                    const timedGroup = Object.keys(fulfilled[0].data)
                        .reduce((acc, time) => ({
                            ...acc, [time]: {
                                ...fulfilled.reduce((coinacc, ff) => ({
                                    ...coinacc,
                                    [ff.currency]: ff.data[time]
                                }), {})
                            }
                        }), {});

                    Object.values(timedGroup)
                        .forEach((group) => {
                            Object.keys(group)
                                .forEach((c) => {
                                    group[`${c}-USD`] = parseFloat((group[c] * holdings[c]).toFixed(2));
                                });

                            group.total = Object.keys(group)
                                .filter((c) => c.endsWith('-USD'))
                                .reduce((a, b) => a + group[b], 0);
                        });

                    this.setState({
                        laster: false,
                        data: {
                            grouped: timedGroup,
                            rejected,
                            fulfilled
                        }
                    }, () => lagreTilLocalstorage(this.state));
                } else {
                    this.setState({
                        laster: false
                    }, () => lagreTilLocalstorage(this.state));
                }
            });
    };

    setType = (event) => {
        this.setState({ type: event.target.value }, this.hentData);
    }

    componentDidMount() {
        this.hentData();
    }

    render() {
        const times = this.state.laster ? [0] : Object.keys(this.state.data.grouped)
            .sort((a, b) => (b - a));
        const latestdatapoint = times[0];
        const secondtoLastdatapoint = times[1];
        const firstdatapoint = times[times.length - 1];

        const boxes = [
            <Box key="total" title={`Total - ${price(this.state, latestdatapoint, 'total')}`}>
                <Chart state={this.state} currency="total"/>
            </Box>,
            ...Object.keys(holdings)
                .map((currency) => (
                    <Box key={currency}
                         title={`${coins[currency]} (${currency}) - ${price(this.state, latestdatapoint, `${currency}-USD`)}`}>
                        <Chart state={this.state} currency={currency}/>
                    </Box>
                ))];

        const startPrice = price(this.state, secondtoLastdatapoint, 'total');
        const endPrice = price(this.state, latestdatapoint, 'total');
        const firstPrice = price(this.state, firstdatapoint, 'total');

        const isRising = parseFloat(startPrice) < parseFloat(endPrice);
        const diff = `${(parseFloat(endPrice) - parseFloat(startPrice)).toFixed(2)}$`;
        const isRisingFromStart = parseFloat(firstPrice) < parseFloat(endPrice);
        const diffFromStart = `${(parseFloat(endPrice) - parseFloat(firstPrice)).toFixed(2)}$`;
        return (
            <div className="application">
                <Box key="holding" title="Trend" className="trendingbox">
                    <div>
                        <p className="center pricedate">{getTime(latestdatapoint, this.state.type)}</p>
                        <h1 className="center price">{endPrice}</h1>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
                        <div>
                            <div>
                                <p className={isRising ? 'center trend-up' : 'center trend-down'}/>
                            </div>
                            <div>
                                <h2 className="center price">{diff}</h2>
                            </div>
                            <div>
                                <p className="center pricedate">{getTime(secondtoLastdatapoint, this.state.type)}</p>
                                <h2 className="center price">{startPrice}</h2>
                            </div>
                        </div>
                        <div>
                            <div>
                                <p className={isRisingFromStart ? 'center trend-up' : 'center trend-down'}/>
                            </div>
                            <div>
                                <h2 className="center price">{diffFromStart}</h2>
                            </div>
                            <div>
                                <p className="center pricedate">{getTime(firstdatapoint, this.state.type)}</p>
                                <h2 className="center price">{firstPrice}</h2>
                            </div>
                        </div>
                    </div>
                    <div className="types">
                        <input type="radio" name="type" value="2H" id="2H" checked={this.state.type === '2H'}
                               onChange={this.setType}/>
                        <label htmlFor="2H">2H</label>
                        <input type="radio" name="type" value="1D" id="1D" checked={this.state.type === '1D'}
                               onChange={this.setType}/>
                        <label htmlFor="1D">1D</label>
                        <input type="radio" name="type" value="1W" id="1W" checked={this.state.type === '1W'}
                               onChange={this.setType}/>
                        <label htmlFor="1W">1W</label>
                        <input type="radio" name="type" value="1M" id="1M" checked={this.state.type === '1M'}
                               onChange={this.setType}/>
                        <label htmlFor="1M">1M</label>
                        <input type="radio" name="type" value="1Y" id="1Y" checked={this.state.type === '1Y'}
                               onChange={this.setType}/>
                        <label htmlFor="1Y">1Y</label>
                    </div>
                </Box>
                {boxes}
            </div>
        );
    }
}

export default Application;
