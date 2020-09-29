
# node-red-contrib-watson-machine-learning

[Node-RED](http://nodered.org) This is a node-red wrapper for the GET and POST data retrieval and run prediction methods of the [Watson Machine Learning](http://watson-ml-api.mybluemix.net) service.

## Install
Use the manage palette option to install this node

## Usage
This node allows you to run predictions against a deployed
machine learning model.

## Configuration
To make a connection to your Watson Machine Learning service the node will need a connection configuration. Create a configuration by double selecting a node.

### Input
For most modes the node `msg.payload` is not required. The node needs to be configured
to select model and deployment. A list of published models and deployments is
automatically retrieved by the node, making use of the API.

When running a prediction `msg.payload` needs to be select either to an arrays of
an array of values, or an object containing and array of array of values,
against which to run predictions against.
eg. To run a prediction against a model expecting 6 decimal numbers.
````
msg.payload = [[16.4, 48.3, 30, 75.4, 28.9, 20]];
````
To run a prediction for multiple set of values
````
msg.payload = [[16.4, 48.3, 30, 75.4, 28.9, 20], [13.4, 38.3, 30, 75.4, 18.9, 25]];
````
or
````
msg.payload = {values : [[16.4, 48.3, 30, 75.4, 28.9, 20], [13.4, 38.3, 30, 75.4, 18.9, 25]] };
````
or
````
msg.payload = {"input_data":
                [
                  {
                    "fields" :
                      ["COLUMN1","COLUMN2","COLUMN3","COLUMN4","COLUMN5","COLUMN6"],
                    "values" :
                      [
                        [16.4, 48.3, 30, 75.4, 28.9, 20],
                        [2.99, 7.06, 70, 8.05, 87.7, 32]
                      ]
                  }
                ]
              };
````
in this way the fields parameter can also be provided.

### Output
For all modes
the output is a json object on `msg.payload`.

### Sample flow