import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import createStore from './store';
import './index.css';
import Aux from './components/aux';
import Background from './background';
import Application from './application';

const store = createStore();

function App() {
    return (
        <Provider store={store}>
            <Aux>
                <Background />
                <Application />
            </Aux>
        </Provider>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
