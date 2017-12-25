import { combineReducers } from 'redux';
import ui from './ducks/ui';
import currency from './ducks/currency';

export default combineReducers({
    ui,
    currency
});