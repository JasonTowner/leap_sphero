module.exports = function () {

    var Leap = require('leapjs');
    var spheron = require('spheron');

    // Set this to the device Sphero connects as on your computer.
    var device = '/dev/cu.Sphero-RYR-AMP-SPP';

    var safeMode = true; //Turn this off if Sphero is in water or you like to live dangerously!

    var controlSphero = function (sphero) {
        var minSpeed = 60;
        var maxSpeed = 200;
        var minAngle = 0.2;
        var minGraphDistance = 50;

        sphero.currentState = {
            speed: 0,
            dir: 0,
            flag: 0
        };

        sphero.proposedState = {
            speed: 0,
            dir: 0,
            flag: 0
        };

        var controller = new Leap.Controller({
            frameEventName: 'deviceFrame',
            enableGestures: true
        });

        controller.on('connect', function () {
            console.log('connected to leap motion');
        });
        controller.on('ready', function () {
            console.log('ready');
        });
        controller.on('focus', function () {
            console.log('focus');
        });
        controller.on('deviceStreaming', function () {
            console.log('device connected');
        });
        controller.on('deviceStopped', function () {
            console.log('device disconnected');
        });
        //var count = 0;
        controller.on('frame', function (frame) {
            if (frame.pointables.length > 3) {
                move(frame);
            } else if (sphero.currentState.speed > 0) {
                stopSphero(sphero);
            }

            //if (frame.gestures.length) {
            //    var g = frame.gestures[0];
            //
            //    if (g.type == 'swipe' && g.state === 'stop') {
            //        handleSwipe(g);
            //    } else if (frame.pointables.length > 3){
            //
            //    } else if (frame.pointables.length === 0) {
            //        sphero.stop();
            //    }
            //}
        });

        var move = function (frame) {
            if (frame.hands.length && frame.hands[0]) {
                var hand = frame.hands[0];

                var direction = calculateAngle(hand);
                var speed = calculateSpeed(hand);
                send(speed, direction, 1);

                //var roll = hand.roll(); // 0 < left & 0 > right
                //var pitch = hand.pitch(); // 0 < forward & 0 > back
                //
                //if (pitch > minAngle) {
                //    //console.log('backwards');
                //    send(getSpeed(pitch), 180, 1);
                //} else if (pitch < (0 - minAngle)) {
                //    //console.log('straight');
                //    send(getSpeed(pitch), 0, 1);
                //} else if (roll > minAngle) {
                //    //console.log('left');
                //    send(getSpeed(roll), 270, 1);
                //} else if (roll < (0 - minAngle)) {
                //    //console.log('right');
                //    send(getSpeed(roll), 90, 1);
                //} else {
                //    stopSphero();
                //}
            } else {
                stopSphero();
            }

        };

        var calculateAngle = function (hand) {
            var posX = (hand.palmPosition[0] * 3),
                posY = (hand.palmPosition[2] * 3) * -1;

            var angle = Math.atan2(posX, posY) * 57.2957795;
            angle = angle < 0 ? angle + 360 : angle;
            return Math.floor(angle);
        };

        var calculateSpeed = function (hand){
            var posX = (hand.palmPosition[0] * 3),
                posY = (hand.palmPosition[2] * 3) * -1,
                posZ = (hand.palmPosition[1] * 3) - 200;
            var calculatedSpeed = 0;
            var maxLeapCount = 400;
            var distance = distanceFromZero(posX, posY);
            if (posZ < 0 || distance < minGraphDistance) {
                return 0;
            } else {
                calculatedSpeed = (distance / maxLeapCount) * maxSpeed;
                if (calculatedSpeed < minSpeed) {
                    calculatedSpeed = minSpeed;
                } else if (calculatedSpeed > maxSpeed) {
                    calculatedSpeed = maxSpeed;
                }
            }
            return Math.floor(calculatedSpeed);
        };

        var distanceFromZero = function(x, y)
        {
            var xs = x;
            xs = xs * xs;

            var ys = y;
            ys = ys * ys;

            return Math.sqrt( xs + ys );
        };

        var count = 0;
        var send = function (speed, dir, flag) {
            if (isStateChanged(speed, dir, flag)) {
                console.log(count++ + ': speed: ' + speed + '\ndirection: ' + dir);
                sphero.roll(speed, dir, flag);
                if (speed/maxSpeed < .1) {
                    ball.setRGB(spheron.toolbelt.COLORS.YELLOW).setBackLED(255);
                } else if (speed == minSpeed) {
                    ball.setRGB(spheron.toolbelt.COLORS.GREEN).setBackLED(255);
                } else {
                    ball.setRGB(spheron.toolbelt.COLORS.BLUE).setBackLED(255);
                }
                sphero.currentState = {
                    speed: speed,
                    dir: dir,
                    flag: flag
                };
            }
        };

        var isStateChanged = function (speed, dir, flag) {
            if (Math.abs(sphero.currentState.speed - speed) < 10) {
                if (Math.abs(sphero.currentState.dir - dir) < 10) {
                    if (sphero.currentState.flag == flag) {
                        return false;
                    }
                }
            }

            return true;
        }

        var setHeading = function (g) {
            if (g.state === 'stop') {
                if (g.normal[2] < 0) {
                    send(0, 45, 0);
                } else {
                    send(0, 315, 0);
                }
                sphero.write(spheron.commands.api.setHeading(0));
            }
        };

        var stopSphero = function (sphero) {
            ball.setRGB(spheron.toolbelt.COLORS.RED).setBackLED(255);
            send(0, 0, 0);
        };

        controller.connect();
        console.log('waiting for Leap Motion connection...');
    };

    var ball = spheron.sphero().resetTimeout(true);
    ball.open(device);

    console.log("waiting for Sphero connection...");
    ball.on('open', function () {
        console.log('connected to Sphero');
        ball.setRGB(spheron.toolbelt.COLORS.ORANGE).setBackLED(255);
        controlSphero(ball);
    });

};
