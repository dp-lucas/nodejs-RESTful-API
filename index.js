/*
Primary file for the API
*/

const http = require('http');
const StringDecoder = require('string_decoder').StringDecoder;
const routes = require('./routes.js');
const _data = require('./lib/data');

// Instantiate the HTTP server
const httpServer = http.createServer((req, res) => {    

  // General request data
  const parsedUrl = new URL(req.url, 'http://localhost:3000'); // Raw URL
  const trimmedPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, ''); // Get the path from raw URL
  const queryStringObject = parsedUrl.searchParams; // Query string as an object: parameters
  const method = req.method.toLowerCase(); // HTTP method
  const headers = req.headers; // Request headers as an object

  // Get request payload if any
  const decoder = new StringDecoder('utf-8'); // Decode buffer bytes into utf-8
  let buffer = '';	
  req.on('data', (data) => {
    buffer += decoder.write(data);
  });

  // When request 'end' event is called -> Route the path to its handler
  req.on("end", () => {

    // Push what is left on buffer
    buffer += decoder.end();

    // Match a rout. If undefined then route to default "not found".
    const route = routes.hasOwnProperty(trimmedPath) ? routes[trimmedPath] : routes["notFound"];

    // Build request general data object
    const data = {
      path: trimmedPath,
      queryString: queryStringObject,
      headers: headers,
      method: method,
      payload: buffer
    };

    //pass request general data in case we need info about the request
    //pass the response object because router is outside our scope
    route(data, res);
  });
});

// Start the server
httpServer.listen(3000, () => {
  console.log('The server is up and running on port 3000');
});