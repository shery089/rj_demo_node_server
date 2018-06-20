var express = require('express');
var router = express.Router();
var model = require('../models/index');
var check = require('express-validator/check');
var users = model.users;
var sequelize = model.sequelize;
var config = require(__dirname + '/../config/config.json');
var elastic_client = require('../config/es_connection');

//E1: Get users by pagination

router.get('/:page', function (req, res, next) {
    let limit = config.records_limit;   // number of records per page
    let offset = 0;
    users.findOne({
        attributes: [[sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        where:{
            user_type: 1
        },
        raw: true
    })
    .then((users_data) => {
        if(users_data.count > 0) {
            let page = req.params.page;      // page number
            let pages = Math.ceil(users_data.count / limit);
            offset = limit * (page - 1);
            users.findAll({
                attributes: ['id', 'company_name', 'email'],
                where:{
                    user_type: 1
                },
                order: [
                    ['id', 'DESC']
               ],
                limit: limit,
                offset: offset
            })
            .then(function(users){
                res.json({
                    error: false,
                    users_count: users_data.count,
                    data: users,
                });
            })
            .catch(error => res.json({
                error: true,
                data: [],
                error_message: error
            }));
        }
        else {
            res.json({
                error: false,
                data: []
            });
        }
    })
    .catch(error => res.json({
        error: true,
        data: [],
        error_message: error
    }));
});


//E2: GET users by pagination and one JOIN
/*router.get('/:page', function (req, res, next) {
    let limit = config.records_limit;   // number of records per page
    let offset = 0;
    users.findOne({
        attributes: [[sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        where:{
            user_type: 1
        },
        raw: true
    })
    .then((users_data) => {
        if(users_data.count > 0) {
            let page = req.params.page;      // page number
            let pages = Math.ceil(users_data.count / limit);
            offset = limit * (page - 1);
            sequelize.query('SELECT `users`.`id`, `users`.`company_name`, `users`.`email`, `ausers`.`nickname` FROM users' +
            ' LEFT JOIN `ausers` ON `users`.`created_by_auser` = `ausers`.`id` WHERE' +
            ' `users`.`user_type` = 2 ORDER BY `users`.`id` DESC LIMIT ' + offset + ', ' + limit, { type: sequelize.QueryTypes.SELECT })
            .then(function(users){
                res.json({
                    error: false,
                    users_count: users_data.count,
                    data: users,
                });
            })
            .catch(error => res.json({
                error: true,
                data: [],
                error_message: error
            }));
        }
        else {
            res.json({
                error: false,
                data: []
            });
        }
    })
    .catch(error => res.json({
        error: true,
        data: [],
        error_message: error
    }));
});*/

//E1: Get all users for bulk insertion
router.get('/user_bulk_insertion', function (req, res, next) {
    let limit = config.records_limit;   // number of records per page
    let offset = 0;
    sequelize.query("SELECT COUNT(`users`.`id`) AS `count` FROM users WHERE `users`.`user_type` = 2",
        { type: sequelize.QueryTypes.SELECT })
    .then((users_data) => {
        users_data_count = users_data.map((data) => {
            return data.count;
        });

        users_data_count = users_data_count[0];
        if(users_data_count > 0) {
            for (var i = 0; i < users_data_count; i += 50) {
                if (i >= 50) {
                    if (users_data_count >= 50) {
                        let page = i / 50;      // page number
                        // let page = 1;      // page number
                        let pages = Math.ceil(users_data_count / limit);
                        offset = limit * (page - 1);
                        limit_str = "LIMIT " + offset + ", " + limit;
                    }
                    else {
                        limit_str = "";
                    }

                    sequelize.query("SELECT `users`.`id`, `users`.`company_name`, `users`.`email`, `users`.`user_logo`, `users`.`date_created` FROM users" +
                        " WHERE `users`.`user_type` = 2 ORDER BY `users`.`id` DESC " + limit_str, {type: sequelize.QueryTypes.SELECT})
                        .then(function (users) {
                            elastic_client.bulkInsertion(users).then(function (data) {
                                // res.json(data);
                            });
                        })
                        .catch(error => res.json({
                            error: true,
                            data: [],
                            error_message: error
                        }));
                } // for loop
            }
        }
        else {
            res.json({
                error: false,
                data: []
            });
        }
    })
    .catch(error => res.json({
        error: true,
        data: [],
        error_message: error
    }));
});

router.get('/create_index', function (req, res, next) {
    elastic_client.indexExists().then(function (exists) {
        if (exists) {
            elastic_client.deleteIndex();
            elastic_client.initIndex();
        }
        else {
            elastic_client.initIndex();
        }

        res.json({
            error: false,
            data: {
                index_created: true
            }
        });

    }).catch(function (error) {
        res.json(error);
    });
});

router.get('/create_mapping', function (req, res, next) {
    elastic_client.initMapping().then(function (data) {
        res.json(data);
    });
});

router.get('/insert_user', function (req, res, next) {
    elastic_client.insertUser().then(function (data, err) {
        if(err) {
            res.json(err);
        }
        else {
            res.json(data);
        }
    }).catch(function (e) {
        res.json(e);
    });
});

// E3: Insert User
router.post('/insert',function (req, res, next) {

    /**
     * Validations
     */
    req.checkBody('company_name').trim().escape().isLength({ min: 3, max: 255 }).withMessage('Name should be at least ' +
        '3 chars and at most 255 chars').matches(/^[a-z-/\s]+$/i).withMessage('Only alphabet and hyphens characters are allowed');

    if(req.checkBody('email').exists){
        req.checkBody('email').trim().escape().isEmail().withMessage('Invalid email');
    }

    var errors = req.validationErrors();
    if(errors){
        res.json(errors);
    }
    else {
        users.create({
            email: req.body.email,
            company_name: req.body.company_name,
            // created_at: new Date(),
            // updated_at: new Date()
        })
            .then(cause => res.status(201).json({
                error: false,
                data: cause,
                message: 'New User created.'
            }))
            .catch(error => res.json({
                error: true,
                data: [],
                message: error
            }));
    }
});

module.exports = router;