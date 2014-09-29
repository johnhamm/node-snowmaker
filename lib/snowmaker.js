var azure = require('azure-storage'),
    async = require('async'),
    base62 = require('base62'),
    base36 = require('codify');

function updateBatchBlob(value, scope, accessCondition, callback) {
    scope.id = value;
    scope.batchMaxId = scope.id + self.batchSize;
    
    blobSvc.createBlockBlobFromText(self.containerName, scope.name, String(scope.batchMaxId + 1), { accessConditions: accessCondition },
        function (err, result, response) {
            if (!err) {
                scope.id++;
            }
            callback(err);
        });
}

function updateFromSyncStore(scope, callback) {
    var attempts = 0,
        breakLoop = false,
        i = 0;
    
    async.whilst(
        function () { return !breakLoop && attempts < self.retries; },
        function (callbackDone) {
            blobSvc.getBlobToText(self.containerName, scope.name,
                function (err, blobContent, blob) {
                    if (err) {
                        if (err.code === "BlobNotFound") {
                            updateBatchBlob(0, scope, { 'if-none-match': '*'}, function (err) {
                                if (!err) {
                                    breakLoop = true;
                                }
                                else {
                                    attempts++;
                                }
                                callbackDone();
                            });
                        }
                        else {
                            attempts++;
                            callbackDone();
                        }
                    } else {
                        var nextId = parseInt(blobContent, 10);
                        updateBatchBlob(nextId - 1, scope, { 'if-match': blob.etag }, function (err) {
                            if (!err) {
                                breakLoop = true;
                            }
                            else {
                                console.log("ERROR: " + err.message + "\r\n");
                                attempts++;
                            }
                            callbackDone();
                        });
                    }
                });
        },
        function (err) { callback(err); }
    );
}

var upperLimit = 0, currentId = 0, blobSvc = null, scopes = {}, blobs = {};

var self = module.exports = {
    connectionString: "UseDevelopmentStorage=true;",
    batchSize: 1000,
    retries: 25,
    containerName: "table-ids",
    alphaNumeric: true,
    caseSensitive: true,
    connect: function (connectionString, callback) {
        if (typeof connectionString == "function") {
           callback = connectionString;
        }
        else {
           self.connectionString = connectionString;
        }
        
        blobSvc = azure.createBlobService(self.connectionString);
        blobSvc.createContainerIfNotExists(self.containerName, function (err, result, response) {
            callback(err);
        });
    },
    nextId: function (tableName, callback) {
        if (!scopes[tableName]) {
            scopes[tableName] = { name: tableName, id: 0, batchMaxId: 0 };
        }
        var scope = scopes[tableName];
        
        if (scope.id === scope.batchMaxId) {
            updateFromSyncStore(scope, function (err) {
                callback(undefined, self.alphaNumeric ? (caseSensitive ? base62.encode(scope.id) : base32.fromInt(scope.id)) : scope.id);
            });
        }
        else {
            scope.id++;
            callback(undefined, self.alphaNumeric ? (caseSensitive ? base62.encode(scope.id) : base32.fromInt(scope.id)) : scope.id);
        }
    }
};