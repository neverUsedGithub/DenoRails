
class HttpResponse {
    constructor(reqs) {
        this._status = 200
        this._reqs = reqs
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
        this._status = code
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
        this._reqs.respondWith(
            new Response(this._respText, {
                status: this._status,
                headers: this._headers
            }),
        )
    }
}

class HttpRequest {
    constructor(reqs, path, vars) {
        this._reqs = reqs
        
        this.path = path
        this.headers = reqs.request.headers
        this.params = vars
    }
}

class Train {
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
     * @param {stirng} path
     * @param {function} cb
     */
    post(path, cb) {
        this.paths[path] = {
            method: "POST",
            callback: cb
        }
    }


    /**
     * @ param {function} cb
     */
    /*
        use(cb) {
            this.middleware.push(cb)
        }
    */

    /**
     * @param {number} port
     */
    async listen(port, cb) {
        const server = Deno.listen({ port: port });
        // deno-lint-ignore no-this-alias
        const self = this
        
        if (cb instanceof Function) {
            cb()
        }

        for await (const conn of server) {
            serveHttp(conn);
        }
        
        async function serveHttp(conn) {
            const httpConn = Deno.serveHttp(conn);
            for await (const requestEvent of httpConn) {
                
                let path = requestEvent.request.url.split("/").slice(3).join("/")
                path = "/" + path
                let vars = {}
                let forceRequest = false

                for (const inpath of Object.keys(self.paths)) {
                    const path1 = path.split("/")
                    const path2 = inpath.split("/")
                    const save = {}

                    let i = 0
                    while (i < path1.length) {
                        if (path1[i] == path2[i]) {}
                        else if (!path1[i] || !path2[i]) {}
                        else {
                            save[path2[i].replace(/:/g, "")] = path1[i]
                        }
                        i++
                    }
                    
                    if (Object.keys(save).length == (inpath.match(/:/g) || []).length && Object.keys(save).length != 0) {
                        vars = JSON.parse(JSON.stringify(save))
                        forceRequest = true
                        path = inpath
                        break
                    }
                }

                if ((self.paths[path] && requestEvent.request.method == self.paths[path].method) || forceRequest) {
                    const request = new HttpRequest(requestEvent, path, vars)
                    const response = new HttpResponse(requestEvent)  
                    
                    for (const middleware of self.middleware) {
                        middleware(request, response)
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

export { Train }