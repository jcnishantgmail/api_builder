"use strict";
const db = require("../models");
var mongoose = require("mongoose");

async function contactUsList(req, res) {
    try {
        const contactMessages = await db.contactus.find({});
        return res.status(200).json({contact: contactMessages, success: true});
    } catch(err) {
        res.status(err.code).json({message: err.message, success: false});
    }
}

async function contactUsDelete(req, res) {
    const {contactUsId} = req.query;
    if(!contactUsId) {
        return res.status(400).json({message: "contactUsId required!", code: 400});
    }
    try {
        await db.contactus.deleteOne({_id: contactUsId});
        return res.status(200).json({message: "Message deleted successfully", code: 200});
    } catch(err) {
        res.status(err.code).json({message: err.message, success: false});
    } 
}

async function contactUsDetail(req, res) {
    const { contactUsId } = req.query;
    if(!contactUsId) {
        return res.status(400).json({message: "contactUsId required!", code: 400});
    }
    try {
        const detail = await db.contactus.findOne({_id: contactUsId});
        return res.status(200).json({detail: detail, success: true});
    } catch(err) {
        res.status(err.code).json({message: err.message, success: false});
    }
}

async function contactUsAdd(req, res) {
    const { firstName, lastName, email, message } = req.body;
    try {
        const created = await db.contactus.create({firstName, lastName, email, message});
        return res.status(200).json({success: true});
    } catch(err) {
        return res.status(err.code).json({message: err.message, code: err.code});
    }
    
}
module.exports = {
    contactUsList,
    contactUsDelete,
    contactUsDetail,
    contactUsAdd
};