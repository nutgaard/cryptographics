import { getFetchUrl } from './ui';
import { createFetchActions } from './utils';

const actions = createFetchActions('HENT_DATA');
const initialState = {
    currencies: {}
};

export default function reducer(state = initialState, action) {
    const { type, data } = action;
    switch (type) {
        case actions.START:

        case actions.OK:

        case actions.ERROR:
        default:
            return state;
    }
}


export function hentData(currency) {
    return (dispatch, getState) => {
        dispatch(actions.start());
        const state = getState();
        return fetch(getFetchUrl(state, currency))
            .then((resp) => {
                if (resp.ok) {
                    return resp.json();
                } else {
                    throw new Error(resp);
                }
            })
            .then(
                (json) => actions.ok({ currency, json }),
                (error) => actions.error(currency, error)
            );
    };
}