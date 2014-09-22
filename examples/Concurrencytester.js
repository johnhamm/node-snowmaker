// Run multiple instances of this to test concurrency
// e.g. to generate 1000 ints with 125ms delay inbetween:
// node Concurrencytester.js 1000 125 true

var generator = require('../lib/snowmaker'),
    async = require('async'),
    fs = require('fs');

var maxCount = Number(process.argv[2]) || 1000,
    delay = Number(process.argv[3]) || 250;

    generator.alphanumeric = !(process.argv[4] && process.argv[4] === "true");

generator.connect("UseDevelopmentStorage=true;", function (err) {
    var count = 0;

    async.whilst(
        function () { return count < maxCount; },
        function (callback) {
            count++;
            setTimeout(function() {
                generator.nextId("accounts", function(err, value) {
                    if (err) {
                        console.log("ERROR" + err.message);
                        callback(err);
                    }
                    else {
                        console.log(value);
                        fs.appendFile("values.txt", value, function(err) {
                            callback(err);
                        });
                    }
                });
            }, delay);
        },
        function (err) {
            // 5 seconds have passed
        }
    );
});