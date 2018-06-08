var express = require('express');
var router = express.Router();
var model = require('../models/index');
var check = require('express-validator/check');
var users = model.users;
var sequelize = model.sequelize;
var config = require(__dirname + '/../config/config.json');

//E1: Get users by pagination
/*
router.get('/:page', function (req, res, next) {
    let limit = config.records_limit;   // number of records per page
    let offset = 0;
    users.findOne(({
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
*/

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



//E1: Search Company Name "Like Query"
router.post('/:page', function (req, res, next) {
    /**
     * Validations
     */

    // page
    req.checkParams('page').trim().escape().isLength({ min: 1, max: 11 }).withMessage('Page Number should be at least ' +
        '1 chars and at most 11 chars').isInt().withMessage('Only numeric values are allowed');

    req.checkBody('company_name').trim().escape().isLength({ min: 3, max: 255 }).withMessage('Company Name should be at least ' +
        '3 chars and at most 255 chars').matches(/^[a-z\-\s]+$/i).withMessage('Only alphabets are allowed');

    var errors = req.validationErrors();
    if(errors){ // Validation Failed
        res.json(errors);
    }
    else { // Validation Passed
        let limit = config.records_limit;   // number of records per page
        let offset = 0;
        sequelize.query("SELECT COUNT(`users`.`id`) AS `count` FROM users LEFT JOIN `ausers` ON `users`.`created_by_auser` = `ausers`.`id` " +
            "WHERE `users`.`company_name` LIKE '%"  + req.body.company_name + "%' AND `users`.`user_type` = 2 ",
            { type: sequelize.QueryTypes.SELECT })
        .then((users_data) => {
            users_data_count = users_data.map((data) => {
                return data.count;
            });

            users_data_count = users_data_count[0];
            if(users_data_count > 0) {
                if(users_data_count > 50) {
                    let page = req.params.page;      // page number
                    let pages = Math.ceil(users_data_count / limit);
                    offset = limit * (page - 1);
                    limit_str = "LIMIT " + offset + ", " + limit;
                }
                else {
                    limit_str = "";
                }

                sequelize.query("SELECT `users`.`id`, `users`.`company_name`, `users`.`email`, `ausers`.`nickname` FROM users" +
                    " LEFT JOIN `ausers` ON `users`.`created_by_auser` = `ausers`.`id` WHERE `users`.`company_name` LIKE '%"  + req.body.company_name +
                    "%' AND `users`.`user_type` = 2 ORDER BY `users`.`id` DESC " + limit_str, { type: sequelize.QueryTypes.SELECT })
                    .then(function(users){
                        res.json({
                            error: false,
                            users_count: users_data_count,
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
    }
});


module.exports = router;