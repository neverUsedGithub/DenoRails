class HTTP{
    constructor(reqs){
        this.reqs = reqs
    }
}

class HTTPResponse extends HTTP{
    constructor(){
        super(reqs);
        this.status = 0;
        this.headers = {};
        this._text = "";
    }

    /**
     * @param {string} text
     */
    send(text){
        this._text += text;
    }

    status(code){
        
    }
}

class HTTPRequest extends HTTP{
    constructor(){
        super(reqs);
    }
}