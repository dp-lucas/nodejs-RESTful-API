/*
Create and export configuration variables
*/

// Container for all the environments
const environments = {};

// Staging (default) environment
environments.staging = {
  'httpPort': 3000,
  'envName': 'staging',
  'hashingSecret': 'thisIsASecret'
};

// Determine which environment was passed as a command-line argument
const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above
// If not, default it to staging
const environmentToExport = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;