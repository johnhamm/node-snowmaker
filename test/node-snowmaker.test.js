var expect = require('chai').expect;

var azure     = require('azure-storage'),   
    snowmaker = require('../lib/snowmaker');

describe('#connect()', function () {
   it('should connect without error', function (done) {
      snowmaker.connect(done);
   });

   it('should autocreate the default container', function(done) {
      snowmaker.connect(function (err) { 
         var blobService = azure.createBlobService(snowmaker.connectionString);        
         blobService._doesContainerExist(snowmaker.containerName, true, {}, function (err, exists) {
            expect(exists).to.be.true;
            done(err);
         });
      });
   });
});

describe('#nextId()', function () {
   var blobService, testTableName = "testtable";
   
   before(function () {
      blobService = azure.createBlobService(snowmaker.connectionString);
   });
   
   it('should create a blob for table "' + testTableName + '" and return a string of "1" for next id', function (done) {
      this.timeout(500);

      snowmaker.connect(function (err) {
         expect(err).to.not.be.ok;
         blobService.deleteBlobIfExists(snowmaker.containerName, testTableName, true, function (err) {
            expect(err).to.not.be.ok;
            snowmaker.nextId(testTableName, function (err, value) {
               expect(err).to.not.be.ok;
               expect(value).to.equal("1");
               blobService._doesBlobExist(snowmaker.containerName, testTableName, true, {}, function (err, exists) {
                  expect(err).to.not.be.ok;
                  expect(exists).to.be.true;
                  done(err);
               });
            });
         });
      });
   });

   it('should set the blob value in the "' + testTableName + '" blob to "6" after creating the "' + testTableName + '" blob when batchSize is set to 5', function (done) {
      snowmaker.connect(function (err) {
         expect(err).to.not.be.ok;
         blobService.deleteBlobIfExists(snowmaker.containerName, testTableName, {}, function (err) {
            expect(err).to.not.be.ok;
            snowmaker.batchSize = 5;
            snowmaker.nextId(testTableName, function (err, value) {
               expect(err).to.not.be.ok;
               expect(value).to.equal("1");
               blobService._doesBlobExist(snowmaker.containerName, testTableName, true, {}, function (err, exists) {
                  expect(err).to.not.be.ok;
                  expect(exists).to.be.true;
                  blobService.getBlobToText(snowmaker.containerName, testTableName, true, {}, function (err, value) {
                     expect(value).to.equal("6");
                     done(err);
                  });                  
               });
            });
         });
      });
   });
});
