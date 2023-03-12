
/**
 * Copyright 2018 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
  const debug = require('debug')('node-red-contrib-watson-machine-learning');
  const request = require('request');

  function start(msg, config) {
    return Promise.resolve();
  }

  function checkForParameters(msg, config, m, params) {
    var message = '';

    if (!m || '' === m) {
      message = 'Required mode has not been specified';
    }

    switch (m) {
      case 'getDeploymentDetailsV4':
      case 'deleteDeploymentV4':
      case 'runPrediction':
        if (!config.deployment) {
          message = 'No Deployment Specified for Deployment related Method';
        } else {
          params['deployment'] = config.deployment;
        }
        break;
      case 'getDeploymentDetails':
      case 'deleteDeployment':
        if (!config.deployment) {
          message = 'No Deployment Specified for Deployment related Method';
        } else {
          params['deployment'] = config.deployment;
        }
         // deliberate no break
      case 'getModelDetails':
      case 'getModelDetailsV4':
      case 'listModelMetrics':
      case 'listLearningIterations':
      case 'deleteModel':
      case 'deleteModelV4':
      case 'listModelDeployments':
        if (!config.model) {
          message = 'No Model Specified for Model related Method';
        } else {
          params['model'] = config.model;
        }
        break;
    }

    if (message){
      return Promise.reject(message);
    }
    return Promise.resolve();
  }

  function checkPayload(msg, m, params) {
    var message = '';
    switch (m) {
      case 'runPrediction':
        if (! msg.payload) {
          message = 'Input_Data or Values and Optional fields are required to run a prediction';
        } else if (Array.isArray(msg.payload)) {
          if (0 === msg.payload.length) {
            message = 'zero length array is not valid input data for a prediction';
          } else if (Array.isArray(msg.payload[0])) {
            // allow values to be provided as a straight array, of arrays
            params.values = msg.payload;
          } else {
            // wrap the single array values in another array
            params.values = [msg.payload];
          }

        } else if ('object' !== typeof msg.payload) {
          message = 'Input_Data needs to be provided either as an array or as an object'
        } else if (msg.payload.input_data) {
          params.input_data = msg.payload.input_data;
        } else {
          if (msg.payload.values) {
            params.values = msg.payload.values;
          } else {
            message = 'Can not run a prediction without values.'
          }
          if (msg.payload.fields) {
            params.fields = msg.payload.fields;
          }
        }
        break;
    }

    if (message){
      return Promise.reject(message);
    }
    return Promise.resolve();
  }

  function checkConnection(connectionNode) {
    return p = new Promise(function resolver(resolve, reject) {
      var errorMsg = '';
      //var connString = settings.dbConnectionString();

      if (!connectionNode) {
        errorMsg = 'No Configuration Found';
      } else if (!connectionNode.host) {
        errorMsg = 'No Host set in configuration';
      } else if (!connectionNode.apikey) {
        errorMsg = 'No API Key set in configuration';
      } else if (!connectionNode.instanceid) {
        errorMsg = 'No Access Key set in configuration';
      }

      if (errorMsg) {
        return reject(errorMsg);
      }
      return resolve();
    });
  }

  function getToken(connectionNode, token) {
    return new Promise(function resolver(resolve, reject) {
      var token = null;
      //let uriAddress = connectionNode.host + '/v3/identity/token';
      let uriAddress = "https://iam.bluemix.net/oidc/token";
      let IBM_Cloud_IAM_uid = "bx";
      let IBM_Cloud_IAM_pwd = "bx";

      request({
        uri: uriAddress,
        method: 'POST',
        auth: {
          user: IBM_Cloud_IAM_uid,
          pass: IBM_Cloud_IAM_pwd
        },
        headers : { "Content-Type"  : "application/x-www-form-urlencoded" },
        body    : "apikey=" + connectionNode.apikey + "&grant_type=urn:ibm:params:oauth:grant-type:apikey"
      }, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          var b = JSON.parse(body);
          if (b.access_token) {
            //token = 'Bearer ' + b.token;
            token = b.access_token;
          }
          resolve(token);
        } else if (error) {
          reject(error);
        } else {
          debug('Access Token Error:', error);
          reject('Access Token Error ' + response.statusCode);
        }
      });
    });
  }

  function executeRequest(uriAddress, t) {
    return executeRequestV4Style(uriAddress, t, null);
  }

  function executeRequestV4Style(uriAddress, t, instanceid) {
    return new Promise(function resolver(resolve, reject) {
      let reqObject = {
        uri: uriAddress,
        method: 'GET',
        auth: {
          'bearer': t
        }
      };

      if (instanceid) {
        reqObject.headers = {'ML-Instance-ID' : instanceid};
      }

      request(reqObject, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          data = JSON.parse(body);
          resolve(data);
        } else if (error) {
          reject(error);
        } else {
          reject('Error performing request ' + response.statusCode);
        }
      });
    });
  }

  function executeDeleteRequest(uriAddress, t) {
    return executeDeleteRequestV4Style(uriAddress, t, null);
  }

  function executeDeleteRequestV4Style(uriAddress, t, instanceid) {
    return new Promise(function resolver(resolve, reject){
      let reqObject = {
        uri: uriAddress,
        method: 'DELETE',
        auth: {
          'bearer': t
        }
      };

      if (instanceid) {
        reqObject.headers = {'ML-Instance-ID' : instanceid};
      }

      request(reqObject, (error, response, body) => {
        if (!error && (response.statusCode == 200 || response.statusCode == 204)) {
          resolve({'status':'ok'});
        } else if (error) {
          reject(error);
        } else {
          reject('Error performing request ' + response.statusCode);
        }
      });
    });
  }

  function executePostRequest(uriAddress, t, p) {
    return executePostRequestV4Style(uriAddress, t, p, null);
  }


  function executePostRequestV4Style(uriAddress, t, p, instanceid) {
    return new Promise(function resolver(resolve, reject) {

      let reqObject = {
        headers: {
          'content-type' : 'application/json',
          'Accept': 'application/json'