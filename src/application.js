import React, { Component } from 'react';
import LZString from 'lz-string';
import Box from './components/box';
import Chart from './components/chart';
import './application.css';

window.LZString = LZString;

const urls = {
    'minute': (currency) => `https://min-api.cryptocompare.com/data/histominute?fsym=${currency}&tsym=USD&limit=120&aggregate=3`, // 6 hours
    'hour': (currency) => `https://min-api.cryptocompare.com/data/histohour?fsym=${currency}&tsym=USD&limit=128&aggregate=3`, // 16 days
    'day': (currency) => `https://min-api.cryptocompare.com/data/histoday?fsym=${currency}&tsym=USD&limit=128`, // 64 days
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
    XRP: 'Ripple'
};
const holdings = {
    BTC: 0.0974,
    LTC: 5.9253,
    ETH: 0.2151,
    DASH: 1,
    XMR: 1,
    XRP: 605.18423
};

function price(state, datapoint, key) {
    if (state.laster) {
        return "0.00$";
    }
    const value =  state.data.grouped[datapoint][key].toFixed(2);
    return `${value}$`;
}

function getTime(time, type) {
    const date = new Date(parseInt(time + '000', 10));
    return type !== 'minute' ? date.toLocaleDateString('nb') : date.toLocaleString('nb');
}

const storageVersion = 1;
function lastFraLocalstorage() {
    const data = JSON.parse(window.localStorage.getItem('cryptographics'));
    if (data && data.version === storageVersion) {
        return JSON.parse(LZString.decompress(data.content));
    } else {
        return {
            type: 'hour',
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
        settled(
            fetchData('BTC', this.state.type),
            fetchData('LTC', this.state.type),
            fetchData('DASH', this.state.type),
            fetchData('ETH', this.state.type),
            fetchData('XMR', this.state.type),
            fetchData('XRP', this.state.type)
        ).then((data) => {
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
                    laster: false,
                    data: {
                        rejected,
                        fulfilled
                    }
                }, () => lagreTilLocalstorage(this.state));
            }
        });
    };

    setType = (event) =>{
        this.setState({ type: event.target.value }, this.hentData);
    }

    componentDidMount() {
        this.hentData();
    }

    render() {
        const times = this.state.laster ? [0] : Object.keys(this.state.data.grouped)
            .sort((a,b) => (b - a));
        const latestdatapoint = times[0];
        const secondtoLastdatapoint = times[1];
        const firstdatapoint = times[times.length - 1];

        const boxes = [
            <Box key="total" title={`Total - ${price(this.state, latestdatapoint, 'total')}`}>
                <Chart state={this.state} currency="total"/>
            </Box>,
            ...Object.keys(holdings)
                .map((currency) => (
                    <Box key={currency} title={`${coins[currency]} (${currency}) - ${price(this.state, latestdatapoint, `${currency}-USD`)}`}>
                        <Chart state={this.state} currency={currency}/>
                    </Box>
                ))];

        const startPrice = price(this.state, secondtoLastdatapoint, 'total');
        const endPrice = price(this.state, latestdatapoint, 'total');
        const firstPrice = price(this.state, firstdatapoint, 'total');

        const isRising = parseFloat(startPrice) < parseFloat(endPrice);
        const diff = `${(parseFloat(endPrice) - parseFloat(startPrice)).toFixed(2)}$`;
        const isRisingFromStart = parseFloat(firstPrice) < parseFloat(endPrice);
        const diffFromStart= `${(parseFloat(endPrice) - parseFloat(firstPrice)).toFixed(2)}$`;
        return (
            <div className="application">
                <Box key="holding" title="Trend" className="trendingbox">
                    <div>
                        <p className="center pricedate">{getTime(latestdatapoint, this.state.type)}</p>
                        <h1 className="center price">{endPrice}</h1>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
                        <div>
                            <div>
                                <p className={isRising ? 'center trend-up' : 'center trend-down'} />
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
                                <p className={isRisingFromStart ? 'center trend-up' : 'center trend-down'} />
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
                        <input type="radio" name="type" value="minute" id="minute" checked={this.state.type === 'minute'} onChange={this.setType}/>
                        <label htmlFor="minute">6 hours</label>
                        <input type="radio" name="type" value="hour" id="hour" checked={this.state.type === 'hour'} onChange={this.setType}/>
                        <label htmlFor="hour">16 days</label>
                        <input type="radio" name="type" value="day" id="day" checked={this.state.type === 'day'} onChange={this.setType}/>
                        <label htmlFor="day">128 days</label>
                    </div>
                </Box>
                {boxes}
            </div>
        );
    }
}

export default Application;
