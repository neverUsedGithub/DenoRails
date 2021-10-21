
import { Train } from "../src/Train.js"

const serv = new Train({
    middleware: []
}) 

serv.get("/", (req, res) => {
    res.send("hi 2")
})

serv.get("/test/:id/:name", (req, res) => {
    res.send(`Shoe id: ${req.params.id} with name ${req.params.name}`)
})

serv.get("/secret", (req, res) => {
    if (req.headers.secret == "cool") {
        res.send("Access granted!!!!!!!!!!")
    }
    else {
        res.send("rip no access!!!!")
    }
}) 

serv.listen(3000, () => {
    console.log(`Listening on port 3000`)
})