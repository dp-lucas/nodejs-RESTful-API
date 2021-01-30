/*
Routes handler
- We receive the request general data in case we need it here.
- We also receive the response object because router is outside the server file scope.
    - It is helpful since we can handle the response header on each route in case we need to send different content type for example.
*/

// Dependencies
const _data = require('./data.js');
const helpers = require('./helpers.js');
const config = require('./config.js');

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
routes._users.get = (data, callback) => {
  // Check the email provided is valid
  const email = typeof(data.queryString.get('email')) === 'string' && data.queryString.get('email').trim().length > 0 ? data.queryString.get('email').trim() : false;
  
  if(email){
    // Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

    // Verify that the given token is valid for the email
    routes._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Lookup the user
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
        callback(403, { "message": "Missing required token in header, or token is invalid" });
      }
    });
  } else {
    callback(400, { "message": "Missing required fields" });
  }
};

// Users - put
// Required data: email
// Optional data: firstName, lastName, password (at least one must be specified)
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

      // Get the token from the headers
      const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

      // Verify that the given token is valid for the email
      routes._tokens.verifyToken(token, email, (tokenIsValid) => {
        if (tokenIsValid) {
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
          callback(403, { "message": "Missing required token in header, or token is invalid" });
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
routes._users.delete = (data, callback) => {
  // Check the email provided is valid
  const email = typeof(data.queryString.get('email')) === 'string' && data.queryString.get('email').trim().length > 0 ? data.queryString.get('email').trim() : false;
  
  if(email){
    // Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

    // Verify that the given token is valid for the email
    routes._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        _data.read('users', email, (err, userData) => {
          if(!err && userData){
            _data.delete('users', email, (err) => {
              if(!err) {
                // Delete each of the checks associated with the user
                const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
                const checksToDelete = userChecks.length;

                if (checksToDelete > 0) {
                  let checksDeleted = 0;
                  let deletionErrors = false;
                  
                  // Loop through the checks
                  userChecks.forEach((checkId) => {
                    _data.delete('checks', checkId, (err) => {
                      if (err) {
                        deletionErrors = true;
                      }

                      checksDeleted++;

                      if (checksDeleted === checksToDelete) {
                        if (!deletionErrors) {
                          callback(200)
                        } else {
                          callback(500, { "message": "Errors encountered while attempting to delete all of the user's checks" })
                        }
                      }

                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500, { "message": "Could not delete the specified user" });
              }
            });
          } else {
            callback(400, { "message": "User does not exist" });
          }
        });
      } else {
        callback(403, { "message": "Missing required token in header, or token is invalid" });
      }
    });
  } else {
    callback(400, { "message": "Missing required fields" });
  }
};

routes.tokens = (data, callback) => {
  // Figure out which method is requested and then pass it along to some subhandlers
  const acceptableMethods = ['post', 'get', 'put', 'delete'];  

  if (acceptableMethods.indexOf(data.method) > -1) {
    routes._tokens[data.method](data, callback);
  } else {
    callback(405, { "message": "Method not allowed" });
  };
};

// Container for all the tokens methods
routes._tokens = {};

// Tokens - post
// Required data: email, password
// Optional data: none
routes._tokens.post = (data, callback) => {
  const email = typeof(data.payload.email) === 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if(email && password) {
    // Lookup the user who matches that email
    _data.read('users', email, (err, userData) => {
      if(!err && userData) {
        // Hash the sent password and compare to the password stored in the user object
        const hashedPassword = helpers.hash(password);

        if (hashedPassword === userData.hashedPassword) {
          // If valid, create a new token with a random name.
          // Set expiration date 1 hour in the future
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + (1000 * 60 * 60);

          const tokenObject = {
            "email": email,
            "id": tokenId,
            "expires": expires
          };

          // Store the token
          _data.create('tokens', tokenId, tokenObject, (err) => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { "message": "Could not create the new token" });
            }
          });
        } else {
          callback(400, { "message": "Password did not match the specified user's stored password" });
        }
      } else {
        callback(400, { "message": "Could not find the specified user" });
      }
    });

  } else {
    callback(400, { "message": "Missing required fields" });
  }
};

// Tokens - get
// Required data: Id
// Optional data: none
routes._tokens.get = (data, callback) => {
  // Check that the id sent is valid
  const id = typeof(data.queryString.get('id')) === 'string' && data.queryString.get('id').trim().length == 20 ? data.queryString.get('id').trim() : false;
  
  if(id){
    _data.read('tokens', id, (err, tokenData) => {
      if(!err && tokenData){
        callback(200, tokenData);
      } else {
        callback(404, { "message": "User does not exist" });
      }
    });
  } else {
    callback(400, { "message": "Missing required fields" });
  }
};

// Tokens - put
// Required fields: Id, extend
// Optional data: none
routes._tokens.put = (data, callback) => {
  const id = typeof(data.queryString.get('id')) === 'string' && data.queryString.get('id').trim().length == 20 ? data.queryString.get('id').trim() : false;
  const extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend === true ? data.payload.extend : false;

  console.log(typeof(data.queryString.get('extend')) == 'boolean');

  if (id && extend) {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // Check to make sure the token is not already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + (1000 * 60 * 60);

          // Store the new updates
          _data.update('tokens', id, tokenData, (err) => {
            if (!err) {
              callback(200, tokenData);
            } else {
              callback(500, { "message": "Could not update the token's expiration date" });
            }
          });
        } else {
          callback(400, { "message": "The token has already expired and cannot be extended" });
        }
      } else {
        callback(400, { "message": "Specified token does not exist" });
      }
    });
  } else {
    callback(400, { "message": "Missing required field(s) or field(s) are invalid" });
  }
};

// Tokens - delete
// Required data: id
// Optional data: none
routes._tokens.delete = (data, callback) => {
  // Check the id provided is valid
  const id = typeof(data.queryString.get('id')) === 'string' && data.queryString.get('id').trim().length == 20 ? data.queryString.get('id').trim() : false;
  
  if(id){
    _data.read('tokens', id, (err, tokenData) => {
      if(!err && tokenData){
        _data.delete('tokens', id, (err) => {
          if(!err) {
            callback(200, { "message": "Token successfully deleted" });
          } else {
            callback(500, { "message": "Could not delete the specified token" });
          }
        });
      } else {
        callback(400, { "message": "Token does not exist" });
      }
    });
  } else {
    callback(400, { "message": "Missing required fields" });
  }
};

// Verify if a given id is currently valid for a given user
routes._tokens.verifyToken = (id, email, callback) => {
  // Lookup the token
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // Check the token is for the given user and has not expired
      if (tokenData.email === email && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  })
};

routes.checks = (data, callback) => {
  // Figure out which method is requested and then pass it along to some subhandlers
  const acceptableMethods = ['post', 'get', 'put', 'delete'];  

  if (acceptableMethods.indexOf(data.method) > -1) {
    routes._checks[data.method](data, callback);
  } else {
    callback(405, { "message": "Method not allowed" });
  };
};

// Container for all the checks methods
routes._checks = {};

// Checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional data: none
routes._checks.post = (data, callback) => {
  // Validate inputs
  const protocol = typeof(data.payload.protocol) === 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  const url = typeof(data.payload.url) === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  const method = typeof(data.payload.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  const successCodes = typeof(data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  const timeoutSeconds = typeof(data.payload.timeoutSeconds) === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // Check the user has provided a token and it matches his account
    // Get the token from the header
    const token = typeof(data.headers.token) === 'string' && data.headers.token.length === 20 ? data.headers.token : false;
    
    // Lookup the user by reading the token
    _data.read('tokens', token, (err, tokenData) => {
      if (!err && tokenData) {
        // Get user email address
        const userEmail = tokenData.email;

        // Lookup the user data
        _data.read('users', userEmail, (err, userData) => {
          if (!err && userData) {
            const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];

            // Verify the user has less than the number of max-checks-per-user
            if (userChecks.length < config.maxChecks) {
              // Create a random id for the check
              const checkId = helpers.createRandomString(20);

              // Create the check object and include the user's email
              const checkObject = {
                "id": checkId,
                "userEmail": userEmail,
                "protocol": protocol,
                "url": url,
                "method": method,
                "successCodes": successCodes,
                "timeoutSeconds": timeoutSeconds
              };

              // Save the object
              _data.create('checks', checkId, checkObject, (err) => {
                if (!err) {
                  // Add new checkId to the user
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update('users', userEmail, userData, (err) => {
                    if (!err) {
                      // Return the data about the new check
                      callback(200, checkObject);
                    } else {
                      callback(500, { "message": "Could not update the user with the new check" })
                    }
                  });
                } else {
                  callback(500, { "message": "Could not create the new check" })
                }
              });
            } else {
              callback(400, { "message": "The user already has the maximum number of checks (" + config.maxChecks + ")" });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403, { "message": "Invalid token" });
      }
    });
  } else {
    callback(400, { "message": "Missing required inputs or inputs are invalid" })
  }
};

// Checks - get
// Required data: id
// Optional data: none
routes._checks.get = (data, callback) => {
  // Check the check id provided is valid
  const id = typeof(data.queryString.get('id')) === 'string' && data.queryString.get('id').trim().length === 20 ? data.queryString.get('id').trim() : false;
  
  if(id){
    // Lookup the check
    _data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        // Get the token from the headers
        const token = typeof(data.headers.token) === 'string' && data.headers.token.length === 20 ? data.headers.token : false;

        // Verify that the given token is valid for the email
        routes._tokens.verifyToken(token, checkData.userEmail, (tokenIsValid) => {
          if (tokenIsValid) {
            // Return the check data
            callback(200, checkData);
          } else {
            callback(403, { "message": "Missing required token in header, or token is invalid" });
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { "message": "Missing required fields" });
  }
};

// Checks - put
// Required data: id
// Optional data: protocol, url, method, successCodes, timeoutSeconds (at least one must be sent)
routes._checks.put = (data, callback) => {
  // Validate inputs
  const id = typeof(data.queryString.get('id')) === 'string' && data.queryString.get('id').trim().length === 20 ? data.queryString.get('id').trim() : false;
  const protocol = typeof(data.payload.protocol) === 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  const url = typeof(data.payload.url) === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  const method = typeof(data.payload.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  const successCodes = typeof(data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  const timeoutSeconds = typeof(data.payload.timeoutSeconds) === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

  // Check to make sure the id is valid
  if (id) {
    // Check to make sure one or more optional fields has been sent
    if (protocol || url || method || successCodes || timeoutSeconds) {
      // Lookup the check
      _data.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
          // Get the token from the headers
          const token = typeof(data.headers.token) === 'string' && data.headers.token.length === 20 ? data.headers.token : false;

          // Verify that the given token is valid for the email
          routes._tokens.verifyToken(token, checkData.userEmail, (tokenIsValid) => {
            if (tokenIsValid) {
              // Update the check where necessary
              checkData.protocol = protocol || checkData.protocol;
              checkData.url = url || checkData.url;
              checkData.method = method || checkData.method;
              checkData.successCodes = successCodes || checkData.successCodes;
              checkData.timeoutSeconds = timeoutSeconds || checkData.timeoutSeconds;

              // Store the updates
              _data.update('checks', id, checkData, (err) => {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { "message": "Could not update the check" });
                }
              });
           } else {
              callback(403, { "message": "Missing required token in header, or token is invalid" });
            }
          });
        } else {
          callback(400, { "message": "Check Id does not exist" });
        }
      });
    } else {
      callback(400, { "message": "Missing fields to update" });
    }
  } else {
    callback(400, { "message": "Missing required field" });
  }
};

// Checks - delete
// Required data: id
// Optional data: none
routes._checks.delete = (data, callback) => {
  // Check the id provided is valid
  const id = typeof(data.queryString.get('id')) === 'string' && data.queryString.get('id').trim().length == 20 ? data.queryString.get('id').trim() : false;

  if(id){
    // Lookup the check
    _data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        // Get the token from the headers
        const token = typeof(data.headers.token) === 'string' && data.headers.token.length === 20 ? data.headers.token : false;

        // Verify that the given token is valid for the email
        routes._tokens.verifyToken(token, checkData.userEmail, (tokenIsValid) => {
          if (tokenIsValid) {
            // Delete the check data
            _data.delete('checks', id, (err) => {
              if (!err) {
                _data.read('users', checkData.userEmail, (err, userData) => {
                  if (!err && userData) {
                    const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];

                    // Remove the deleted check from the list of checks
                    const checkPosition = userChecks.indexOf(id);

                    if (checkPosition > -1) {
                      userChecks.splice(checkPosition, 1);

                      // Re save user data
                      _data.update('users', checkData.userEmail, userData, (err) => {
                        if (!err) {
                          callback(200);
                        } else {
                          callback(500, { "message": "Could not update the user" });
                        }
                      });
                    } else {
                      callback(500, { "message": "Could not find the check on user's object" });
                    }
                  } else {
                    callback(500, { "message": "Could not find the user who created the check" });
                  }
                });
              } else {
                callback(500, { "message": "Could not delete the specified check" });
              }
            });

          } else {
            callback(400, { "message": "Missing required token in header, or token is invalid" });
          }
        });
      } else {
        callback(400, { "message": "The specified check id does not exist" });
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