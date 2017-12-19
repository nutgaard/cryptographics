import React, { Component } from 'react';
import Box from './components/box';
import Chart from './components/chart';
import './application.css';

function fetchData(currency) {
    return fetch(`https://min-api.cryptocompare.com/data/histoday?fsym=${currency}&tsym=USD&limit=122&aggregate=3`)
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

function getTime(time) {
    return new Date(parseInt(time + '000', 10)).toLocaleDateString('nb');
}

class Application extends Component {
    state = {
        laster: true,
        data: null
    };

    componentDidMount() {
        settled(
            fetchData('BTC'),
            fetchData('LTC'),
            fetchData('DASH'),
            fetchData('ETH'),
            fetchData('XMR'),
            fetchData('XRP')
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
                });
            } else {
                this.setState({
                    laster: false,
                    data: {
                        rejected,
                        fulfilled
                    }
                });
            }
        })
    }

    render() {
        const times = this.state.laster ? [0] : Object.keys(this.state.data.grouped)
            .sort((a,b) => b - a);
        const latestdatapoint = times[0];
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

        const startPrice = price(this.state, firstdatapoint, 'total');
        const endPrice = price(this.state, latestdatapoint, 'total');
        const isRising = parseFloat(startPrice) < parseFloat(endPrice);
        return (
            <div className="application">
                <Box key="holding" title="Trend">
                    <div style={{marginTop: '2rem'}}>
                        <p className="center pricedate">{getTime(latestdatapoint)}</p>
                        <h1 className="center price">{endPrice}</h1>
                    </div>
                    <div>
                        <p className={isRising ? 'center trend-up' : 'center trend-down'} />
                    </div>
                    <div>
                        <p className="center pricedate">{getTime(firstdatapoint)}</p>
                        <h2 className="center price">{startPrice}</h2>
                    </div>
                </Box>
                {boxes}
            </div>
        );
    }
}

export default Application;

//https://min-api.cryptocompare.com/data/