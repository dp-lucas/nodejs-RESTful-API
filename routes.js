/*
Routes handler
- We receive the request general data in case we need it here.
- We also receive the response object because router is outside the server file scope.
    - It is helpful since we can handle the response header on each route in case we need to send different content type for example.
*/

const routes = {
    'hello': (data, res) => {
      // this function is called if the path is '/hello'
      const payload = {
        'Welcome': 'You have successfully reached /hello route.',
        'code': 200
      };
      const payloadStr = JSON.stringify(payload);

      // Configure the response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);
      res.write(payloadStr);
      res.end();
    },
    'notFound': (data, res) => {
      //this one gets called if no route matches
      const payload = {
        'message': "File Not Found",
        'code': 404
      };
      const payloadStr = JSON.stringify(payload);
      
      // Configure the response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(404);  
      res.write(payloadStr);
      res.end();
    }
  };

  module.exports = routes;