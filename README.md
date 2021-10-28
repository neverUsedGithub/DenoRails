# Rails

**Rails** is an express inspired web framework for **Deno**. To begin first import the latest version: 
```js
import { Rails } from "https://deno.land/x/rails@2.0.2/src/Rails.ts";
```
To create a web server you first have to initialize a `Rails` instance like so:
```js
const app = new Rails();
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
    res.send("Hello Rails!");
})
```
To run our server we have to listen on a port.
```js
app.listen(3000, () => {
    console.log("The server is up!");
})
```
And you successfully made your first web server with **Rails**!

The full code: 
```js
import { Rails } from "https://deno.land/x/rails@2.0.2/src/Rails.ts";

const app = new Rails();

app.get("/", (req, res) => {
    res.send("Hello Rails!");
})

app.listen(3000, () => {
    console.log("The server is up!");
})
```