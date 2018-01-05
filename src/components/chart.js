import React from 'react';
import Aux from './react-aux';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory';

const myTheme = VictoryTheme.material;
myTheme.bar.style.data.fill = '#e6e6e6';
myTheme.axis.style.axisLabel.fill = '#e6e6e6';
myTheme.axis.style.tickLabels.fill = '#e6e6e6';
myTheme.axis.style.grid.stroke = 'none';


function Chart({ state, currency }){
    const { laster, data, type } = state;
    if (laster) {
        return <h1>Laster</h1>;
    }

    const d = Object.entries(data.grouped)
        .map(([time, values]) => ({ time: parseInt(`${time}000`, 10), total: values[currency] }));

    const half = Math.round(d.length / 2);
    const tickValues = [d[0], d[half], d[d.length - 1]].map((dv) => dv.time);
    const tickFormat = ['2H', '1D'].includes(type) ? tickValues.map((dV) => new Date(dV).toLocaleTimeString('nb')) : tickValues.map((dV) => new Date(dV).toLocaleDateString('nb'));

    return (
        <Aux>
            <VictoryChart theme={myTheme}>
                <VictoryAxis
                    tickValues={tickValues}
                    tickFormat={tickFormat}
                />
                <VictoryAxis
                    dependentAxis
                    tickFormat={(x) => x >= 1000 ? (`$${x / 1000}k`) : `$${x}`}
                />
                <VictoryBar
                    data={d}
                    x="time"
                    y="total"
                />
            </VictoryChart>
            <div className="touchoverlay" />
        </Aux>
    );
}

Chart.propTypes = {};

export default Chart;
