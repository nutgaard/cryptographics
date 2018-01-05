import mock from 'fetch-mock';
import qs from 'query-string';

const now = new Date();

function respondWith(handler) {
    return (url, config, extra) => {
        const queryParams = qs.parse(qs.extract(url));

        return handler(url, config, {queryParams, extra});
    }
}

console.log('Mock loaded');
const TIME_AGGREGATE = {
    MINUTE: { ms: 60 * 1000, fixto: 60*1000 },
    HOUR: { ms: 60 * 60 * 1000, fixto: 60*1000 },
    DAY: { ms: 24 * 60 * 60 * 1000, fixto: 30*60*1000 }
};

function getTimeAggregate(url) {
    if (url.includes('histominute')) {
        return TIME_AGGREGATE.MINUTE
    } else if (url.includes('histohour')) {
        return TIME_AGGREGATE.HOUR
    } else {
        return TIME_AGGREGATE.DAY
    }
}

function getLastEntry(fixto) {
    const rest = now % fixto;
    return now - rest;
}

function generateTimeseries(lastEntry, stepsize, stepcount) {
    const series = new Array(stepcount);
    series[0] = lastEntry;
    for (let i = 1; i < stepcount; i++) {
        series[i] = series[i - 1] - stepsize;
    }
    return series;
}

const basemap = {
    BTC: 15000,
    LTC: 240,
    XRP: 2.5,
    XRB: 32,
    DASH: 1100,
    ETH: 970,
    XMR: 370,
    LSK: 25,
    REQ: 0.8,
};

mock.get('begin:https://min-api.cryptocompare.com/data/', respondWith((url, config, extra) => {
    let aggregateConfig = getTimeAggregate(url);
    const aggregateSize = parseInt(extra.queryParams.aggregate || '1', 10) * aggregateConfig.ms;
    const lastEntry = getLastEntry(aggregateConfig.fixto);
    const timeseries = generateTimeseries(lastEntry, aggregateSize, extra.queryParams.limit);

    const basevalue = basemap[extra.queryParams.fsym];
    const baseoffset = (Math.random() * 0.1 * basevalue) - (0.05 * basevalue);
    let value = basevalue + baseoffset;

    const data = timeseries
        .map((time) => {
            value += (Math.random() * 0.01 * basevalue) - (0.005 * basevalue)
            return {
                time: time / 1000,
                close: value
            };
        });

    return { Data: data };
}));

mock.mock('*', respondWith((url, config, extra) => {
    console.log('fallback used for', url, config, extra);
    return mock.realFetch.call(window, url, config);

}));