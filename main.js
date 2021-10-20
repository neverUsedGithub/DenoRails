//const Train = require("./modules.js");
// require is undefined - not in node lol

import { Train } from "./Train.js"

// make a github repo
// ok


const serv = new Train({
    middleware: []
}) 

serv.get("/", (req, res) => {
    res.send("hi 2")
})

serv.listen(3000, () => {
    console.log(`Listening on port 3000`)
})