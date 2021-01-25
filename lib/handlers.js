/*
Routes handler
- We receive the request general data in case we need it here.
- We also receive the response object because router is outside the server file scope.
    - It is helpful since we can handle the response header on each route in case we need to send different content type for example.
*/

// Dependencies
const _data = require('./data.js');
const helpers = require('./helpers.js');

// Define the handlers
const routes = {};

routes.users = (data, callback) => {
  // Figure out which method is requested and then pass it along to some subhandlers
  const acceptableMethods = ['post', 'get', 'put', 'delete'];  

  if (acceptableMethods.indexOf(data.method) > -1) {
    routes._users[data.method](data, callback);
  } else {
    callback(405, { "message": "Method not allowed" });
  };
};

// Container for the users submethods
routes._users = {};

// Users - post
// Required fields: firstName, lastName, email, password, tosAgreement
// Optional data: none
routes._users.post = (data, callback) => {
  // Check all required fields are filled out
  const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const email = typeof(data.payload.email) === 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  const tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true ? true : false;

  if (firstName && lastName && email && password && tosAgreement){
    // Make sure that the user does not already exist
    _data.read('users', email, (err, data) => {
      if(err){
        // Hash the password
        const hashedPassword = helpers.hash(password);

        // Create the user object
        if(hashedPassword){
          const userObject = {
            'firstName': firstName,
            'lastName': lastName,
            'email': email,
            'hashedPassword': hashedPassword,
            'tosAgreement': true
          };
  
          //Store the user
          _data.create('users', email, userObject, (err) => {
            if(!err){
              callback(200, { "message": "Successfully created a new user" });
            } else {
              console.log(err);
              callback(500, { "message": "Could not create the new user" });
            }
          });
        } else {
          callback(500, { "message": "Could not hash the user password" });
        }        
      } else {
        // User already exists
        callback(400, { "message": "A user with that email address already exists" });
      }
    });
  } else {
    callback(400, { "message": "Missing required fields" });
  }
};

// Users - get
routes._users.get = (data, res) => {
  
};

// Users - put
routes._users.put = (data, res) => {
  
};

// Users - delete
routes._users.delete = (data, res) => {
  
};

routes.ping = (data, callback) => {
  // this function is called if the path is '/ping'
  callback(200, { "message": "Server is up and running" });
};

routes.notFound = (data, res) => {
  //this one gets called if no route matches
  callback(404, { "message": "File Not Found" });
};

// Export the module
module.exports = routes;