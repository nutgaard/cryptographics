
const initialState = {
    viewport: 'hour'
};

export default function reducer(state = initialState, action) {
    return state;
}

export function getViewport(state) {
    return state.ui.viewport;
}

export function getFetchUrl(state, currency) {
    const viewport = getViewport(state);

    switch (viewport) {
        case 'minute':
            return `url-${viewport}`;
        case 'hour':
            return `url-${viewport}`;
        case 'day':
            return `url-${viewport}`;
    }
}