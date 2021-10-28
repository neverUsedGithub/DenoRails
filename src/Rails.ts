class HttpResponse {
    #status: number
    #reqs: Deno.RequestEvent
    #headers: { [key: string]: string }
    #respText: string | Uint8Array

    constructor(reqs: Deno.RequestEvent) {
        this.#status = 200
        this.#reqs = reqs
        this.#headers = {
            "content-type": "text/html"
        }
        this.#respText = ""
    }

    /**
     * @param {string} text
     */
    send(text: string) {
        this.#respText += text
        return this
    }

    /**
     * @param {string} path 
     */
    sendFile(path: string) {
        const FileExtHeaders: { [extension: string]: string } = {
            ".png": "image/png",
            ".gif": "image/gif",
            ".jpeg": "image/jpeg",
            ".tiff": "image/tiff",
            ".csv": "text/csv",
            ".xml": "text/xml",
            ".md": "text/markdown",
            ".html": "text/html",
            ".htm": "text/html",
            ".json": "application/json",
            ".map": "application/json",
            ".txt": "text/plain",
            ".ts": "text/typescript",
            ".tsx": "text/tsx",
            ".js": "application/javascript",
            ".jsx": "text/jsx",
            ".gz": "application/gzip",
            ".css": "text/css",
            ".wasm": "application/wasm",
            ".mjs": "application/javascript",
            ".svg": "image/svg+xml",
        }

        let contents
        try {
            contents = Deno.readFileSync(path)
        } catch(e) {
            console.error(`Cant open file ${path}`)
            return this
        }

        this.#respText = contents
        let contType = ""
        if (FileExtHeaders[path.split(".")[1]]) {
            contType = "." + FileExtHeaders[path.split(".")[1]]
        }
        this.#headers["content-type"] = contType

        return this
    }

    /**
     * @param {number} code 
     */
    status(code: number) {
        this.#status = code
        return this // Chainability
    }

    /**
     * @param {string} name
     * @param {string} val
     */
    header(name: string, val: string) {
        this.#headers[name] = val
        return this
    }

    dontCallThisMethod() {
        this.#reqs.respondWith(
            new Response(this.#respText, {
                status: this.#status,
                headers: this.#headers
            }),
        )
    }
}

class HttpRequest {
    headers: {[key: string]: string}
    cookies: {[key: string]: string}
    params: {[key: string]: string}
    query: {[key: string]: string}
    #reqs: Deno.RequestEvent
    path: string
    url: string

    constructor(reqs: Deno.RequestEvent, path: string, vars: {[key: string]: string}) {
        this.#reqs = reqs
        
        this.path = path
        
        const headerObj: {[key: string]: string} = {}
        for (const pair of reqs.request.headers) {
            headerObj[pair[0]] = pair[1]
        }

        this.url = "/" + this.#reqs.request.url.split("/").slice(3).join("/")
        
        this.query = {}
        const queryStr = this.url.split("?")
        if (queryStr.length > 1) {
            const pairs = queryStr[1].split("&").map(x => x.split("="))
            for (const [name, val] of pairs) {
                this.query[name] = decodeURIComponent(val)
            }
        }

        this.cookies = {}
        console.log(this.#reqs.request.headers)

        this.headers = headerObj
        this.params = vars
    }
}

class Rails {
    paths: {[key: string]: {[key: string]: any}}
    middleware: Function[]

    constructor() {
        this.paths = {}
        this.middleware = []
    }

    /**
     * @param {string} path
     * @param {function} cb
     */
    get(path: string, cb: (req: HttpRequest, res: HttpResponse) => void) {
        this.paths[path] = {
            method: "GET",
            callback: cb
        }
    }

    /**
     * @param {stirng} path
     * @param {function} cb
     */
    post(path: string, cb: (req: HttpRequest, res: HttpResponse) => void) {
        this.paths[path] = {
            method: "POST",
            callback: cb
        }
    }

    /**
     * @param {string} path
     * @param {string} urlpath
     */
    useStatic(path: string, urlpath?: string) {
        function addPaths(main: string, sub: string) {
            return main.endsWith("/") ? main + sub : main + "/" + sub
        }

        // Recursively walk path
        function getEntries(dir: string) {
            let entries: string[] = []
            for (const entry of Deno.readDirSync(dir)) {
                if (entry.isFile) {
                    entries.push(addPaths(dir, entry.name))
                }
                if (entry.isDirectory) {
                    entries = entries.concat(getEntries(addPaths(dir, entry.name)))
                }
            }
            return entries
        }
        
        const entries: string[] = getEntries(path)

        for (const entry of entries) {
            let useEntry = entry

            if (urlpath) {
                let urlP = urlpath
                if (!urlP.endsWith("/")) urlP += "/"
                if (!urlP.startsWith("/")) urlP = "/" + urlP

                useEntry = entry.replace(path, urlP)
            }

            this.get(useEntry, (req, res) => {
                res.sendFile(entry)
            })
        }
    }

    /**
     * @ param {function} cb
     */
    use(cb: (req: HttpRequest, res: HttpResponse, next: Function) => void) {
        this.middleware.push(cb)
    }

    /**
     * @param {number} port
     */
    async listen(opts: any, cb: Function) {
        const port = opts.port || 3000
        //const certFile = opts.certFile
        //const keyFile = opts.keyFile

        const options: any = { port: port }

        //if (certFile && keyFile) {
        //    options.certFile = certFile
        //    options.keyFile = keyFile
        //}

        const server = Deno.listen(options);

        // deno-lint-ignore no-this-alias
        const self = this
        
        if (cb instanceof Function) {
            cb()
        }

        for await (const conn of server) {
            serveHttp(conn);
        }
        
        async function serveHttp(conn: Deno.Conn) {
            const httpConn = Deno.serveHttp(conn);
            for await (const requestEvent of httpConn) {
                let path = requestEvent.request.url.split("/").slice(3).join("/")
                path = "/" + path
                path = path.split("?")[0]

                let vars = {}
                let forceRequest = false

                for (const inpath of Object.keys(self.paths)) {
                    const path1 = path.split("/").filter(x => x != "")
                    const path2 = inpath.split("/").filter(x => x != "")
                    const save: {[key: string]: string} = {}
                    let matches = 0

                    let i = 0
                    while (i < path1.length) {
                        if (path1[i] == path2[i]) {
                            matches++
                        }
                        else {
                            if ((path2[i] || "").includes(":")) {
                                save[path2[i].replace(/:/g, "")] = path1[i]
                                matches++
                            }
                        }
                        i++
                    }

                    // deno-lint-ignore no-inner-declarations
                    function getDots(arr: string[]) {
                        let c = 0
                        for (const elem of arr) {
                            if (elem.includes(":")) c++
                        }
                        return c
                    }

                    if (matches == path1.length - getDots(path1) && Object.keys(save).length == (inpath.match(/:/g) || []).length && Object.keys(save).length != 0) {
                        vars = JSON.parse(JSON.stringify(save))
                        forceRequest = true
                        path = inpath
                        break
                    }
                }

                
                if ((self.paths[path] && requestEvent.request.method == self.paths[path].method) || forceRequest) {
                    const request = new HttpRequest(requestEvent, path, vars)
                    const response = new HttpResponse(requestEvent)
                    
                    const nextF = () => {
                        // deno-lint-ignore no-unused-vars
                        return new Promise((res, rej) => {
                            self.paths[path].callback(
                                request,
                                response
                            )
                            res(0)
                        })
                    }

                    if (self.middleware.length > 0) {
                        for (const middleware of self.middleware) {
                            middleware(request, response, nextF)
                        }
                    } else {
                        await nextF()
                    }

                    response.dontCallThisMethod()
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

export { Rails }