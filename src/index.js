if (typeof global.CustomEvent === 'undefined') {
    global.CustomEvent = class CustomEvent {
        constructor(event, params) {
            params = params || { bubbles: false, cancelable: false, detail: null };
            this.type = event;
            this.detail = params.detail;
        }
    };
}

require('./bot');
require('./services/handlers');

console.log('Started.');
