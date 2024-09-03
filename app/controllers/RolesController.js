const db = require('../models');
const constants = require('../utls/constants');
var mongoose = require('mongoose');

module.exports = {
    /**
     * Creating roles
     */

    createRoles: async (req, res) => {
        try {
            const data = req.body;

            if (!req.body.name || !req.body.permissions) {
                return res.status(400).json({
                    success: false,
                    error: { code: 400, message: constants.onBoarding.PAYLOAD_MISSING },
                });
            }

            var query = {};
            query.isDeleted = false;
            query.name = data.name;
            const existed = await db.roles.findOne(query);

            if (existed) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 400,
                        message: constants.roles.ALREADY_EXIST,
                    },
                });
            }
            console.log(data)
            const created = await db.roles.create(data);

            return res.status(200).json({
                success: true,
                message: constants.roles.CREATED,
            });
        } catch (err) {
            console.log(err)
            return res.status(400).json({
                success: false,
                error: { code: 400, message: '' + err },
            });
        }
    },

    /**Getting roles detail data using id */
    roleDetail: async (req, res) => {
        try {
            const id = req.query.id;

            const roles = await db.roles.findById(id);

            return res.status(200).json({
                success: true,
                data: roles,
            });
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: '' + err },
            });
        }
    },

    updateRole: async (req, res) => {
        try {
            if (!req.body.id || !req.body.name || !req.body.permissions) {
                return res.status(400).json({
                    success: false,
                    error: { code: 400, message: constants.onBoarding.PAYLOAD_MISSING },
                });
            }
            let id = req.body.id
            delete req.body.id

            const updatedCategory = await db.roles.updateOne(
                { _id: id },
                req.body
            );

            return res.status(200).json({
                success: true,
                message: constants.roles.UPDATED,
            });
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: '' + err },
            });
        }
    },

    getAllRoles: async (req, res) => {
        try {
            var search = req.query.search;
            var page = req.query.page;
            var sortBy = req.query.sortBy;
            let status = req.query.status;

            var count = req.query.count;

            var query = {};

            if (search) {
                query.$or = [
                    {
                        name: { $regex: search, $options: 'i' },
                    },
                ];
            }

            query.isDeleted = false;

            var sortquery = {};
            if (sortBy) {
                var order = sortBy.split(' ');
                var field = order[0];
                var sortType = order[1];
            }

            sortquery[field ? field : 'createdAt'] = sortType
                ? sortType == 'desc'
                    ? -1
                    : 1
                : -1;
            if (status) {
                query.status = status;
            }

            const pipeline = [
                {
                    $project: {
                        id: '$_id',
                        name: '$name',
                        permissions: '$permissions',
                        status: '$status',
                        createdAt: '$createdAt',
                        updatedAt: '$updatedAt',
                        isDeleted: '$isDeleted',
                    },
                },
                {
                    $match: query,
                },
                {
                    $sort: sortquery,
                },
            ];

            const total = await db.roles.aggregate([...pipeline]);

            if (page && count) {
                var skipNo = (Number(page) - 1) * Number(count);

                pipeline.push(
                    {
                        $skip: Number(skipNo),
                    },
                    {
                        $limit: Number(count),
                    }
                );
            }

            const result = await db.roles.aggregate([...pipeline]);
            // .toArray();

            return res.status(200).json({
                success: true,
                data: result,
                total: total.length,
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                error: { code: 500, message: '' + err },
            });
        }
    },

    changeStatus: async (req, res) => {
        try {
            const id = req.body.id;
            const status = req.body.status;

            const updatedStatus = await db.roles.updateOne(
                { _id: id },
                { status: status }
            );

            return res.status(200).json({
                success: true,
                message: constants.roles.STATUS_CHANGED,
            });
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: '' + err },
            });
        }
    },

    deleteRole: async (req, res) => {
        try {
            const id = req.query.id;
            const deletedUser = await db.roles.updateOne(
                { _id: id },
                { isDeleted: true }
            );

            return res.status(200).json({
                success: true,
                message: constants.roles.DELETED,
            });
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: '' + err },
            });
        }
    },


};