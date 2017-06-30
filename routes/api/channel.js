var express = require('express');
var router = express.Router();
var multer = require('multer');
var Channel = require('../../models/channel');

var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./public/uploads/channel_pic");
    },
    filename: function (req, file, callback) {
        //console.log('aaaaaa'+ JSON.stringify(file) );
        callback(null, Date.now() + "_" + file.originalname);
    }
});

var upload = multer({storage: Storage}).single("channel_pic");

var chatStorage = multer.diskStorage({
    destination: function(req, file, callback){
     callback(null, "./public/uploads/chat_media");   
    },
    filename: function(req, file, callback){
        callback(null, Date.now() + "_" + file.originalname);
    }
});

var chatUpload = multer({ storage: chatStorage}).single("chat_media");

// create new channel doc
router.get('/create-channel/doc', function (req, res, next) {
    var bind = {};
    bind.field_name = ['channel_name', 'channel_description', 'link', 'channel_type', 'user_id', 'channel_pic'];
    bind.method = 'post';
    bind.type = 'multipart';
    res.json(bind);
});

// upload chat media
router.post('/upload-chat-media', function(req, res, next){
    var bind = {};
    chatUpload(req, res, function(err){
        if(err){
            bind.status = 0;
            bind.message = 'Oops! error occur while uploading chat media.';
            bind.error = err;
        } else{
            bind.status = 1;
            bind.media_url = 'uploads/chat_media/' + req.file.filename;
        }
        return res.json(bind);
    });
});

// create new channel
router.post('/create-channel', function (req, res, next) {
    var bind = {};
    upload(req, res, function (err) {
        if (err) {
            bind.status = 0;
            bind.message = 'Oops! error occur while uploading channel picture.';
            bind.error = err;
            return res.json(bind);
        }

        var channel_name = req.body.channel_name;
        var channel_description = req.body.channel_description;
        var channel_type = req.body.channel_type; // 'public', 'private'
        var user_id = req.body.user_id;
        var channel_pic = req.file ? 'uploads/channel_pic/' + req.file.filename : 'uploads/default/default-channel.jpg';
        var link = req.body.link;
        
        Channel.findOne({link: link}, function (err, channels) {

            if (!channels) {
                var newChannel = new Channel;
                newChannel.channel_name = channel_name;
                newChannel.channel_description = channel_description;
                newChannel.channel_type = channel_type;
                newChannel.channel_pic = channel_pic;
                newChannel.user_id = user_id;
                newChannel.link = link;

                newChannel.save(function (err) {
                    if (err) {
                        bind.status = 0;
                        bind.message = 'Oops! error occur while creating new channel';
                        bind.error = err;
                    } else {
                        bind.status = 1;
                        bind.message = 'Channel was created successfully';
                        bind.channel       = newChannel;
                    }
                    return res.json(bind);
                });
            } else {
                bind.status = 0;
                bind.message = 'link is already exists!';

                return res.json(bind);
            }


        });



    });
});

// get all channels
router.get('/get-all-channels', function (req, res, next) {
    var bind = {};
    Channel.find({}, function (err, channels) {
        if (err) {
            bind.status = 0;
            bind.message = 'Oops! error occur while fetching all channels';
            bind.err = err;
        } else if (channels.length > 0) {
            bind.status = 1;
            bind.channels = channels;
        } else {
            bind.status = 0;
            bind.message = 'No channels found';
        }
        return res.json(bind);

    });
});

// search channel
router.get('/search-channel/:term', function (req, res, next) {
    var bind = {};
    var term = req.param('term');
    var pattern = new RegExp(term, 'i');

    Channel.find({channel_name: {$regex: pattern}}, function (err, channels) {
        if (err) {
            bind.status = 0;
            bind.message = 'Oops! error occur while fetching all channels';
            bind.err = err;
        } else if (channels.length > 0) {
            bind.status = 1;
            bind.channels = channels;
        } else {
            bind.status = 0;
            bind.message = 'No channels found';
        }
        return res.json(bind);
    });


});

// remove channels of a user
router.get('/remove-channels/:user_id', function(req, res, next){
    var bind = {};
    var user_id = req.param('user_id');
    
    Channel.remove({ user_id: user_id }, function(err){
        if (err) {
            bind.status = 0;
            bind.message = 'Oops! error occur while deleting channels';
            bind.err = err;
        } else {
            bind.status = 1;
            bind.message = 'Channels was deleted successfully';
        }
        return res.json(bind);
    });
});


// delete a channel
router.get('/delete-channel/:channel_id', function(req, res, next){
    var bind = {};
    var channel_id = req.param('channel_id');
    Channel.remove({ _id: channel_id }, function(err){
        if(err){
            bind.status = 0;
            bind.message = 'Oops! error occur while deleting a channel';
            bind.err = err;
        } else {
            bind.status = 1;
            bind.message = 'Channel was deleted successfully';
        }
        return res.json(bind);
    });
});

//router.get('/get-channel-info');

router.get('/testing', function(req, res, next){
    var bind = {};
    var channel_id = '594c5dfb3196d2399fb8ee9d';
    var user_id = '5907fb6e2351d154a5339268';
    Channel.findOne({ _id: channel_id }, function(err, channel){
        if(err){
            bind.status = 0;
            bind.message = 'Oops! error occured while fetching channel by channel id';
            return res.json(err);
        }
        if(channel){
            var index = channel.members_id[user_id];
            if(index == undefined){
                bind.status = 0;
                bind.message = 'index is undefined';
                bind.channel = channel;
                bind.channel.index = channel.members_id[user_id];
            } else {
                bind.status = 0;
                bind.message = 'index is not undefined';
                bind.index = index;
                bind.channel = channel;
            }
            return res.json(bind);
        }
    });
});



module.exports = router;
