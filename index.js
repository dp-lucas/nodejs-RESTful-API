/*
Primary file for the API
*/

const http = require('http');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config.js');
const handlers = require('./lib/handlers.js');
const helpers = require('./lib/helpers.js');

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
    const route = handlers.hasOwnProperty(trimmedPath) ? handlers[trimmedPath] : handlers["notFound"];

    // Build request general data object
    const data = {
      path: trimmedPath,
      queryString: queryStringObject,
      headers: headers,
      method: method,
      payload: helpers.parseJsonToObject(buffer)
    };

    // Route the request to the handler specified in the router
    route(data, (statusCode, payload) => {

      // Use the status code returned from the handler, or set the default status code to 200
      statusCode = typeof(statusCode) === 'number' ? statusCode : 200;

      // Use the payload returned from the handler, or set the default payload to an empty object
      payload = typeof(payload) === 'object' ? payload : {};

      // Convert the payload to a string
      var payloadString = JSON.stringify(payload);

      // Configure the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.write(payloadString);
      res.end();
    });
  });
});

// Start the server
httpServer.listen(config.httpPort, () => {
	console.log('The server is up and running on port ' + config.httpPort + ' | ' + config.envName);
});