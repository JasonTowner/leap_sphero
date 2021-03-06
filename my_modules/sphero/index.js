module.exports = function () {

    var Leap = require('leapjs');
    var spheron = require('spheron');

    // Set this to the device Sphero connects as on your computer. found by typing ls /dev/cu.* on your mac after you've paired your sphero.
    var device = '/dev/cu.Sphero-RYR-AMP-SPP';

    var controlSphero = function (sphero) {
        var minSpeed = 60;
        var maxSpeed = 255;
        var minGraphDistance = 30;

        sphero.currentState = {
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

        controller.on('frame', function (frame) {
            if (frame.hands.length && getExtendedFingers(frame.hands[0]).length >= 3) {
                move(frame);
            } else if (sphero.currentState.speed > 0) {
                stopSphero(sphero);
            }
        });

        var getExtendedFingers = function (hand) {
            var extendedFingers = [];
            if (hand.fingers !== undefined) {
                for (var f = 0, finger; finger = hand.fingers[f++];) {
                    if (finger.extended) extendedFingers.push(finger);
                }
            }
            return extendedFingers;
        };

        var move = function (frame) {
            if (frame.hands.length && frame.hands[0]) {
                var hand = frame.hands[0];
                var direction = calculateAngle(hand);
                var speed = calculateSpeed(hand);
                send(speed, direction, 1);
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

        var calculateSpeed = function (hand) {
            var posX = (hand.palmPosition[0] * 3),
                posY = (hand.palmPosition[2] * 3) * -1,
                posZ = (hand.palmPosition[1] * 3) - 200;
            var calculatedSpeed = 0;
            var maxLeapCount = 350;
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

        var distanceFromZero = function (x, y) {
            var xs = x;
            xs = xs * xs;

            var ys = y;
            ys = ys * ys;

            return Math.sqrt(xs + ys);
        };

        var count = 0;
        var send = function (speed, dir, flag) {
            if (isStateChanged(speed, dir, flag)) {
                //console.log(count++ + ': speed: ' + speed + '\ndirection: ' + dir);
                sphero.roll(speed, dir, flag);
                if (speed / maxSpeed < .1) {
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
        };

        // Not currently used, but can be used with gestures to change the heading of the sphero
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

        process.on('SIGINT', function(){
            console.log('ending program...');
            ball.setBackLED(0);
            process.exit(0);
        });
        console.log('connected to Sphero');
        ball.setRGB(spheron.toolbelt.COLORS.ORANGE).setBackLED(255);
        controlSphero(ball);

    });

};
