var express = require('express');
var router = express.Router();
var multer = require('multer');
var Group = require('../../models/group');
var Mongoose = require('mongoose');
var ObjectId = Mongoose.Types.ObjectId;
//var Clear_chat = require('../../models/clear_chat');
var moment = require('moment');

var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./public/uploads/group_pic");
    },
    filename: function (req, file, callback) {
        //console.log('aaaaaa'+ JSON.stringify(file) );
        callback(null, Date.now() + "_" + file.originalname);
    }
});

var upload = multer({storage: Storage}).single("group_pic");

// create new group
router.post('/create-group', function (req, res, next) {
    var bind = {};
    upload(req, res, function (err) {
        if (err) {
            bind.status = 0;
            bind.message = 'Oops! error occur while uploading group picture.';
            bind.error = err;
            return res.json(bind);
        }

        var group_name = req.body.group_name;
        var user_id = req.body.user_id;
        var group_pic = req.file ? 'uploads/group_pic/' + req.file.filename : 'uploads/default/default-channel.jpg';
        var members_id_string = req.body.members_id
        var members_id = members_id_string.split(',');
        
        var newGroup = new Group;
        newGroup.group_name = group_name;
        newGroup.group_pic = group_pic;
        newGroup.user_id = user_id;
        newGroup.created_timestamp = moment().unix();

        for(var i = 0; i< members_id.length ;i++){
            var member_id = members_id[i].trim();
            newGroup.members_id.push( ObjectId(member_id) );
        }
        
        newGroup.save(function (err) {
            if (err) {
                bind.status = 0;
                bind.message = 'Oops! error occur while creating new group';
                bind.error = err;
            } else {
                bind.status = 1;
                bind.message = 'Group was created successfully';
                bind.channel       = newGroup;
            }
            return res.json(bind);
        });
    });
});




router.get('/get-group-info/:group_id', function(req, res){
    var bind = {};
    var group_id = req.params.group_id;
    Group.aggregate([
        {
            $match: { _id: ObjectId(group_id)}
        },
        {
            $lookup: {
                from: 'users',
                localField: 'members_id',
                foreignField: '_id',
                as: 'members_info'
                
                }
            },
            {
                $project: { members_id: 0, __v: 0, 'members_info.__v' : 0, 'members_info.token_id' : 0 }
            }
    ], function(err, groupInfo){
        
        if(err){
            bind.status = 0;
            bind.message = 'Oops! error occured while fetching group info';
            bind.error = err;
        } else if(groupInfo.length > 0){
            bind.status = 1;
            bind.groupInfo = groupInfo[0];
        } else {
            bind.status = 0;
            bind.message = 'No group info found';
        }
        return res.json(bind);
        
    });
    
});

router.post('/add-member-to-group', function(req, res){
    var bind = {};
    var group_id = req.body.group_id;
    var members_id_string = req.body.members_id;
    var members_id = members_id_string.split(',');
        
       Group.findOne({ _id: group_id }, function(err, group){
           if(group){
                for(var i = 0; i< members_id.length ;i++){
                    var member_id = members_id[i].trim();
                    group.members_id.push( ObjectId(member_id) );
                }
                group.save(function (err) {
                if (err) {
                    bind.status = 0;
                    bind.message = 'Oops! error occur while adding participants';
                    bind.error = err;
                } else {
                    bind.status = 1;
                    bind.message = 'Participants was added successfully';
                }
                return res.json(bind);
            });
           } else {
               bind.status = 0;
               bind.message = 'No group found';
               return res.json(bind);
           }
       });
        
        
        
        
});

// get all groups
router.get('/get-all-groups', function (req, res, next) {
    var bind = {};
    Group.find({}, function (err, groups) {
        if (err) {
            bind.status = 0;
            bind.message = 'Oops! error occur while fetching all groups';
            bind.err = err;
        } else if (groups.length > 0) {
            bind.status = 1;
            bind.groups = groups;
        } else {
            bind.status = 0;
            bind.message = 'No groups found';
        }
        return res.json(bind);

    });
});



// testing route
router.get('/testing', function(req, res, next){
   res.json(Date.now());
});



module.exports = router;
