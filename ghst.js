class HTTP{
    constructor(reqs){
        this._reqs = reqs
    }
}

class HTTPResponse extends HTTP{
    constructor(){
        super(_reqs);
        this.status = 0;
        this.headers = {};
        this._text = "";
    }

    /**
     * @param {string} text
     */
    send(text){
        this._text += text;
        return this;
    }

    /**
     * @param {number} code
     */
    status(code){
        this.status = code;
        return this;
    }

    _send(){
        this._reqs.respondWith(
            new Response(this._text, {
                status: this.status,
                headers: this.headers
            })
        );
    }

    /**
     * @param {string} name
     */
    addHeaders(name,val){
        this.headers[name] = val;
    }
}

class HTTPRequest extends HTTP{
    /**
     * @param {string} path
     */
    constructor(path){
        super(_reqs);
        this.headers = this._reqs.request.headers;
        this.path = path;
    }
}

module.exports = class Train{
    /**
     * @typedef {{middleware: string[]}} MiddlewareOptions
     * @param {MiddlewareOptions} options
     */
    constructor(options){
        this.middleware = options.middleware || [];
        this.requests = {};
    }

    /**
     * @typedef {{path: string, req_type: string}} RequestOptions
     * @param {RequestOptions} options
     * @param {function} callback
     */
    makeRequest(options,callback){
        this.requests[options.path] = {
            type: options.req_type,
            callbacks: [callback]
        }
    }

    /**
     * @param {number} port
     * @param {function} callback
     */
    async start(port,callback){
        const server = Deno.listen({
            port: port
        });

        // deno-lint-ignore no-this-alias
        const self = this;

        if(callback instanceof Function){
            callback(port);
        }

        for await(const connection of server){
            serverHTTP(connection);
        }

        async function serverHTTP(connection) {
            const httpConn = Deno.serveHttp(connection);

            for await(const reqEvent of httpConn){
                const path = reqEvent
            }
        }
    }
}