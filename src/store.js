import { createStore, applyMiddleware, compose, Store } from 'redux';
import thunkMiddleware from 'redux-thunk';
import reducer, { AppState } from './reducer';

function create() {
    const useExtension = window.__REDUX_DEVTOOLS_EXTENSION__ !== undefined;
    const composer = useExtension ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose;

    const composed = composer(
        applyMiddleware(thunkMiddleware)
    );

    return composed(createStore)(reducer, {});
}

let store = null;
export default function getStore() {
    if(!store) {
        store = create();
    }
    return store;
}