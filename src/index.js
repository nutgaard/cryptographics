import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Aux from './components/react-aux';
import Background from './background';
import Application from './application';
import registerServiceWorker from './registerServiceWorker';

if (process.env.REACT_APP_WITH_MOCKS === 'true') {
    require('./mocks/index');
}

function App() {
    return (
        <Aux>
            <Background />
            <Application />
        </Aux>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
