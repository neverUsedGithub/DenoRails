# Train

**Train** is an express inspired web framework for **Deno**. To begin first import the latest version: 
```js
import { Train } from "https://deno.land/x/trainjs@1.0.7/src/Train.js";
```
To create a web server you first have to initialize a `Train` instance like so:
```js
const app = new Train();
```
To register a route do:
```js
app.get("/");
```
But this will not output anything for now. To make it send something we need to specify a callback.
```js
app.get("/", (req, res) => {

})
```
This will still not do anything but we only need 1 more line of code:
```js
app.get("/", (req, res) => {
    res.send("Hello Train!");
})
```
To run our server we have to listen on a port.
```js
app.listen(3000, () => {
    console.log("The server is up!");
})
```
And you successfully made your first web server with **Train**!

The full code: 
```js
import { Train } from "https://deno.land/x/trainjs@1.0.4/src/Train.js";

const app = new Train();

app.get("/", (req, res) => {
    res.send("Hello Train!");
})

app.listen(3000, () => {
    console.log("The server is up!");
})
```