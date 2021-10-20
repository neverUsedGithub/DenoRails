
class HttpResponse {
    constructor(reqs) {
        this.status = 200
        this.reqs = reqs

        this._headers = {}
        this._respText = ""
    }

    /**
     * @param {string} text
     */
    send(text) {
        this._respText += text
        return this // Chainability
    }

    /**
     * @param {number} code 
     */
    status(code) {
        this.status = code
        return this // Chainability
    }

    /**
     * @param {string} name
     * @param {string} val
     */
    header(name, val) {
        this._headers[name] = val
    }

    trigger() {
        this.reqs.respondWith(
            new Response(this._respText, {
                status: this.status,
                headers: this._headers
            }),
        )
    }
}

class HttpRequest {
    constructor(reqs) {
        this.reqs = reqs
    }
}

module.exports = class Train{
    /**
     * @typedef {{middleware: string[]}} MiddlewareOptions
     * @param {MiddlewareOptions} options
     */
    constructor(options) {
        this.paths = {}
        this.middleware = options.middleware
    }

    /**
     * @param {string} path
     * @param {function} cb
     */
    get(path, cb) {
        this.paths[path] = {
            method: "GET",
            callback: cb
        }
    }

    /**
     * @param {string} path
     * @param {function} cb
     */
    post(path, cb) {
        this.paths[path] = {
            method: "POST",
            callback: cb
        }
    }

    /**
     * @param {function} cb
     */
    use(cb) {
        this.middleware.push(cb)
    }

    /**
     * @param {number} port
     */
    async listen(port, cb) {
        const server = Deno.listen({ port: port });
        const self = this

        for await (const conn of server) {
            serveHttp(conn);
        }

        if (cb instanceof Function) { cb() }
        
        async function serveHttp(conn) {
            const httpConn = Deno.serveHttp(conn);
            for await (const requestEvent of httpConn) {
                
                let path = requestEvent.request.url.split("/").slice(3).join("/")
                if (path == "") path = "/"

                if (self.paths[path] && requestEvent.request.method == self.paths[path].method) {
                    const request = new HttpRequest(requestEvent)
                    const response = new HttpResponse(requestEvent)  
                    
                    for (const middleware of self.middleware) {
                        const retv = middleware(request, response)
                        
                    }

                    self.paths[path].callback(
                        request,
                        response
                    )

                    response.trigger()
                }
                else {
                    requestEvent.respondWith(
                        new Response(`${path} was not found on this server`, {
                            status: 404,
                        }),
                    )
                }
            }
        }
    }
}