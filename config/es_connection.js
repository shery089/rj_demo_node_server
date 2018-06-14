var elasticsearch = require('elasticsearch');
var _ = require('underscore');
var user_mappings = require('../es_mappings/users.mapping');

// Create a ES elastic_client instance
var elastic_client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'trace'
});

var users = {};

elastic_client.ping({
    // ping usually has a 3000ms timeout
    requestTimeout: 1000
}, function (error) {
    if (error) {
        console.trace('elasticsearch cluster is down!');
    } else {
        console.trace('ES connected on port 9200!');
    }
});

var indexName = "users";

/**
 * Delete an existing index
 */
users.deleteIndex = function () {
    return elastic_client.indices.delete({
        index: indexName
    });
}

/**
 * create the index
 */
users.initIndex =  function () {
    return elastic_client.indices.create({
        index: indexName
    }, function(err,resp,status) {
        if(err) {
            console.log(err);
        }
    });
}

/**
 * check if the index exists
 */
users.indexExists = function () {
    return elastic_client.indices.exists({
        index: indexName
    });
}


users.initMapping = function () {
    return elastic_client.indices.putMapping({
        index: indexName,
        type: "user",
        body: user_mappings
    });
};

/**
 * bulkInsertion
 */
users.bulkInsertion = function (data) {

    var userBulkObject = [];

    return new Promise(function (resolve, reject) {
        _.each(data, function (element, index, list) {
            userBulkObject.push({index: {_index: 'users', _type: 'user', _id: element.id}}, element);
        });

        var bulk = elastic_client.bulk({
            index: indexName,
            type: 'user',
            body: userBulkObject
        }, function (err, resp) {
            if(err) {
                return reject(err);
            }
            else {
                return resolve(resp);
            }
        });
    });
};

users.insertUser = function () {
    return new Promise(function (resolve, reject) {
        elastic_client.index({
            index: indexName,
            id: '1',
            type: 'user',
            body: {
                "company_name": "Sheryar",
                "email": "sheryar@gmail.com",
                "id": "1",
                "user_logo": "Borough",
                "user_type": 'Admin',
                "date_created": '2018-06-12 00:00:00',
            }
        },function(err,resp,status) {
            if(err) {
                return reject(err);
            }
            else {
                return resolve(resp);
            }
        });
    })
}


module.exports = users;