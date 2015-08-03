var initMS = function(){
    var channel = null,
        chanName = 'com.samsung.HTML5Video',
        ownName = 'TV',
        tvKey = null;

    if (typeof msf === "undefined") {
        Main.log('No <code>msf</code> object available, giving up.');
        return;
    }
    
    tvKey = new Common.API.TVKeyValue();

    Main.log('MultiScreen framework is about to initialize.');

    msf.local(function(err, service){
        if (err) {
            Main.log('Error obtaining service:' + err);
            console.error('Error obtaining service:', err);
            return;
        } else {
            Main.log('MultiScreen initialized.');
        }
        
        channel = service.channel(chanName);
        channel.connect({name:ownName}, function(err){
            if (err) {
                Main.log('Error opening channel' + err);
                console.error('Error opening channel', err);
                return;
            } else {
                Main.log('MultiScreen channel opened.');
            }
        });

        channel.on('cmd', function(cmd, from){
            var command = 'KEY_' + cmd.toUpperCase();
            if (tvKey[command]) {
                Main.keyDown({keyCode: tvKey[command]});
                channel.publish('ack', cmd);
            }
        });
        channel.on('src', function(newSrc, from){
            Main.keyDown({keyCode: tvKey.KEY_GREEN,newSrc:newSrc});
            channel.publish('ack', newSrc);
        });
    });
};