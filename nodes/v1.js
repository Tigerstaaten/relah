
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