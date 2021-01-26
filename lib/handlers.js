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
// Required data: email
// Optional data: none
// @TODO only let an authenticated user access their object
// Do not let them access anyone else's
routes._users.get = (data, callback) => {
  // Check the email provided is valid
  const email = typeof(data.queryString.get('email')) === 'string' && data.queryString.get('email').trim().length > 0 ? data.queryString.get('email').trim() : false;
  
  if(email){
    _data.read('users', email, (err, data) => {
      if(!err && data){
        // Remove the hashed password from user object before returning it to the requester
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(400, { "message": "User does not exist" });
      }
    });
  } else {
    callback(400, { "message": "Missing required fields" });
  }
};

// Users - put
// Required data: email
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO only let an authenticaded user update their own object
// Do not let them update anyone else's
routes._users.put = (data, callback) => {
  // Check for the required field
  const email = typeof(data.payload.email) === 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;

  // Check for the optional fields
  const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if the email is invalid
  if(email){
    // Error if nothing is sent to update
    if(firstName || lastName || password){
      // Lookup the user
      _data.read('users', email, (err, userData) => {
        if(!err && data){
          // Update the fields
          if(firstName){
            userData.firstName = firstName;
          }
          if(lastName){
            userData.lastName = lastName;
          }
          if(password){
            userData.hashedPassword = helpers.hash(password);
          }

          // Store the new updates
          _data.update('users', email, userData, (err) => {
            if(!err){
              callback(200, { "message": "User successfully updated" });
            } else {
              console.log(err);
              callback(500, { "message": "Could not update the user" });
            }
          })
        } else {
          callback(400, { "message": "The specified user does not exist" });
        }
      });
    } else {
      callback(400, { "message": "Missing fields to update" });
    }
  } else {
    callback(400, { "message": "Missing required fields" });
  }
};

// Users - delete
// Required field: email
// Optional fields: none
// @TODO only let an authenticaded user delete their own object
// Do not let them delete anyone else's
// Clean up (delete) any other data files associated with this user
routes._users.delete = (data, callback) => {
  // Check the email provided is valid
  const email = typeof(data.queryString.get('email')) === 'string' && data.queryString.get('email').trim().length > 0 ? data.queryString.get('email').trim() : false;
  
  if(email){
    _data.read('users', email, (err, data) => {
      if(!err && data){
        _data.delete('users', email, (err) => {
          if(!err) {
            callback(200, { "message": "User successfully deleted" });
          } else {
            callback(500, { "message": "Could not delete the specified user" });
          }
        });
      } else {
        callback(400, { "message": "User does not exist" });
      }
    });
  } else {
    callback(400, { "message": "Missing required fields" });
  }
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