/*
Library for storing and editin data
*/

// Dependencies
const fs = require('fs');
const path = require('path'); // To normalize the path to different directories

// Container for the module (to be exported)
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

console.log(lib.baseDir + 'test' + '/' + 'newFile' + '.json');

// Write data to a file
lib.create = (dir, file, data, callback) => {
  // Open the file for writing
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // Convert data to string
      const stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData, (err) => {
        if (!err) {
          fs.close(fileDescriptor, (err) => {
            if(!err) {
              callback(false);
            } else {
              callback('Error closing new file');
            }
          });
        } else {
          callback('Error writing to new file');
        }
      });
    } else {
      callback('Could not create new file, it may already exist');
    }
  });
};

// Read data from a file
lib.read = (dir, file, callback) => {
  fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', (err, data) => {
    callback(err, data);
  });
};

// Update data inside a file
lib.update = (dir, file, data, callback) => {
// Open the file for writing
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // Convert data to string
      const stringData = JSON.stringify(data);

      // Truncate the content of the file before we write on top of it
      fs.ftruncate(fileDescriptor, (err) => {
        if (!err) {
          // Write to the file and close it
          fs.writeFile(fileDescriptor, stringData, (err) => {
            if (!err) {
              fs.close(fileDescriptor, (err) => {
                if (!err) {
                  callback(false);
                } else {
                  callback('There was an error closing the file');
                }
              });
            } else {
              callback('Error writing to existing file');
            }
          });
        } else {
          callback('Error truncating file');
        }
      });
    } else {
      callback('Could not open the file for updating, it may not exist yet');
    }
  });
};

// Delete a file
lib.delete = (dir, file, callback) => {
  // Unlink the file
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err) => {
    if (!err) {
      callback(false);
    } else {
      callback('Error deleting the file');
    }
  });
};

// Export the module
module.exports = lib;