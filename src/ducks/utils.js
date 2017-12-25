export function createFetchActions(name) {
    return {
        start: (data) => ({type: `${name}_START`, data }),
        ok: (data) => ({type: `${name}_OK`, data }),
        error: (data) => ({type: `${name}_ERROR`, data }),
        START: `${name}_START`,
        OK: `${name}_OK`,
        ERROR: `${name}_ERROR`
    };
}