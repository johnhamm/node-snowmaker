# node-snowmaker
A node.js high performance, distributed unique id generator library for Azure storage tables.  This gives Azure table storage autoincrement fields.

This is a pure javascript implementation of Tatham Oddie's awesome [Snowmaker](http://blog.tatham.oddie.com.au/2011/07/14/released-snowmaker-a-unique-id-generator-for-azure-or-any-other-cloud-hosting-environment/) library

## Usage

```javascript
// Simplest usage:
var snowmaker = require('snowmaker');

snowmaker.connect(function (err) {
	snowmaker.nextId("productorders", function(err,value) {		
		console.log("Next productorderid is "+value);
	});
});


```

## Install

<pre>
  npm install snowmaker
</pre>



## API

Snowmaker uses async callbacks to connect to the table storage server and set/return identifiers.  The first time a table is queried, Snowmaker will create a blob container and a blob to store the next identifier.  Snowmaker will "take" a batch of identifiers all at once, which it will then dispense one at a time for every `nextId()` call until the batch is used.  It will then get another batch.  This makes the library high-performance and allows concurrency.

## Snowmaker instance methods

These methods are accessible via the `snowmaker` object, which is a singleton.  Only one instance should be running per domain.

### snowmaker.connect([connectionString,] callback)

Connects to blob storage and creates a new blob container if it doesn't exist that will store all the identifiers for all tables.  Optional `connectionString` is used to supply connection information.  If no connection string is used, then it will connect to the local Azure storage emulator client running on your computer.

#### connect callback signature: callback(err)


### snowmaker.nextId(tableName, callback)

Checks to see if it has any more identifiers left to dispense and if so returns the next one.  If not, it will first connect back to blob storage, and will create a blob if one doesn't exist for the specified table, and will grab another batch of identifiers and will write the max+1 batch identifier to storage.

#### nextId callback signature: callback(err, value)

## Snowmaker instance properties

### int batchSize (default 1000)

This is the number of identifiers that Snowmaker will "reserve" at a time.

### int retries (default 25)

Snowmaker uses Azure's optimistic concurrency feature to make sure its write operation fails if another client running Snowmaker has already written that same batch identifier to blob storage.  This ensures that no two running instances of Snowmaker get the same batches or overwrite each other.  Snowmaker will retry the write operation this many times before giving up.

### string containerName (default "table-ids")

This is the name of the blob container that will store all the identifiers for all the tables in your Azure table storage instance.

### bool alphanumeric (default true)
Snowmaker will use alphanumeric identifiers by default.  If this is set, then Snowmaker will convert the identifier from an int to a base-62 encoded string.  This is useful if you want shorter more human friendly identifiers instead of large ints or GUIDs.  Set to false to use normal ints.  Keep in mind that Azure Table Storage sorts keys alphanumerically, so ints won't appear in numeric order in Table Storage.

#### For instance, this is the same numeric value stored as different types:
Type | Value 
--- | ---
GUID | *00ab1985-0000-0000-0000-000000000000*
int | *11213189*
base62 | *L33T*

## Snowmaker and Concurrency
This is Tatham Oddie's diagram from his blog which explains how Snowmaker handles concurrent clients:

![Snowmaker concurrent model](http://tatham.files.wordpress.com/2011/10/multiple-clients.png?w=479&h=1029 "Snowmaker concurrent model")


## More Information

For more information on Snowmaker, please see [this blog article](http://blog.tatham.oddie.com.au/2011/07/14/released-snowmaker-a-unique-id-generator-for-azure-or-any-other-cloud-hosting-environment/) on Tatham Oddie's blog.
