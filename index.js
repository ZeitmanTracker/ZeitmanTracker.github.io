// CONFIG =========================
API_URL = 'http://localhost' // DEVELOPMENT
// API_URL = 'https://zietman-tracker.ziettracker.repl.co' // PRODUCTION

// ================================

selectedLocation = "||location||"
fetch(`${API_URL}/getlocation`).then((response) => {
    return response.text()
}).then((data) => {
    window.selectedLocation = data.trim()
})

if (window.matchMedia('(display-mode: standalone)').matches){
    document.getElementsByClassName('gettheapp')[0].style.display = 'none';
} else if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
    // If we wanna force getting the app
} else {
    document.getElementsByClassName('gettheapp')[0].style.display = 'none';
}

mouseX = 0;
mouseY = 0;

teacherPinLocation = {
    'zeitman': 'office',
    'holey':   'office',
}

String.prototype.capFirst = function() {return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });};

snapLocations = {
    '100_hall': [645, 210],
    '200_hall': [377, 190],
    '300_hall': [740, 379],
    '400_hall': [604, 406],
    'media_center': [512, 284],
    'main_gym': [416, 394],
    'aux_gym': [445, 603],
    'cafeteria': [321, 337],
    'office': [516, 201],
    'weight_room': [312, 521], 
    'parking_lot': [60, 300],
    '100_hall_bathroom': [800, 150],
    '200_hall_bathroom': [217, 145],
    '400_hall_bathroom': [740, 450],
    'bathroom_o': [380, 260],
    'pool_area': [300, 700],
}

boxSize = [100, 40]; // height and min width of the box

ctx = document.getElementsByClassName('map')[0].getContext('2d');

document.getElementsByClassName('map')[0].addEventListener('click', () => {
    // console.log(mouseX, mouseY);

    // check if the mouse is in a snap location
    for (var key in snapLocations) {
        if (snapLocations.hasOwnProperty(key)) {
            extraWidth = key.length * 2.8;
            if (mouseX >= snapLocations[key][0] && mouseX <= snapLocations[key][0] + (boxSize[0]) + extraWidth && mouseY >= snapLocations[key][1] && mouseY <= snapLocations[key][1] + (boxSize[1] + 10)) {
                getReportChoice(key);
            }
        }
    }
});

document.getElementsByClassName('map')[0].addEventListener('mousemove', (e) => {
    var pos = getRelativeMousePosition(e);
    mouseX = pos.x;
    mouseY = pos.y;
});

getReportChoice = (location) => {
    return new Promise((resolve, reject) => {
      alertify.confirm('Who would you like to report?', () => {
        setTimeout(() => {
            confirmThen('Are you sure?', 'Are you sure you want to report Zeitman at the ' + location.replaceAll("_"," ").capFirst() + '?', () => {
              sendReport(location, 'zeitman');
            });
        }, 1000)
      },
      () => {
        setTimeout(() => {
            confirmThen('Are you sure?', 'Are you sure you want to report Holey at the ' + location.replaceAll("_"," ").capFirst() + '?', () => {
              sendReport(location, 'holey');
            });
        }, 1000)
      })
        .setting({
          'labels': {
            ok: 'Zeitman',
            cancel: 'Holey'
          },
          'title': 'Submit a report for ' + location.replaceAll("_", " ").capFirst() + '?',
          'invokeOnCloseOff': true, // so we can close the dialog without invoking the callback
        })
    });
};

confirmThen = (title, message, then) => {
    alertify.confirm(title, message, then, () => {}).setting({
        'labels': {
            ok: 'Yes',
            cancel: 'No'
        }
    });
}

getRelativeMousePosition = (e) => {
    var rect = document.getElementsByClassName('map')[0].getBoundingClientRect(),
        scaleX = document.getElementsByClassName('map')[0].width / rect.width,
        scaleY = document.getElementsByClassName('map')[0].height / rect.height;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    }
}

sendReport = (location, teacher) => {
    if (localStorage['amt'] == undefined) {
        localStorage['amt'] = 0;
    } else if (localStorage['amt'] == 0) {
       localStorage['amt'] = 1;
       localStorage['time'] = Date.now();
    } else {
        localStorage['amt'] = parseInt(localStorage['amt']) + 1;
    }

    if (localStorage['time'] == undefined) localStorage['time'] = Date.now();

    if (Date.now() - localStorage['time'] > 5 * 60 * 60 * 1000) localStorage['amt'] = 0; // 5 hours (in milliseconds)

    if (localStorage['amt'] > 10) {
        alertify.error("You have submitted too many reports!");
        return;
    }

    fetch(`${API_URL}/submitreport/${teacher}/${location}`, {
        method: 'POST'
    }).then((response) => {
        if (response.status == 200) {
            alertify.success("Report submitted!");
            redrawMap()
        } else {
            alertify.error("Error submitting report!");
        }
    });
}

redrawMap = () => {
    ctx = document.getElementsByClassName('map')[0].getContext('2d');
    ctx.scale(1, 1);
    var img = new Image();

    img.onload = function() {
        ctx.drawImage(img, 0, 0);
        
        // draw /images/the_man_noexif.png at pinX, pinY
        var zeitmanPin = new Image();
        zeitmanPin.onload = function() {
            fetch(`${API_URL}/reports`).then((response) => {
                return response.json();
            }).then((data) => {
                for (var key in data){
                    if (snapLocations.hasOwnProperty(key)) {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                        extraWidth = key.capFirst().length * 2.8;
                        ctx.fillRect(snapLocations[key][0], snapLocations[key][1], boxSize[0] + extraWidth, boxSize[1] + (Object.keys(data[key]).length * 8));

                        ctx.fillStyle = 'white';
                        ctx.font = '18px Arial bold';
                        ctx.fillText(key.replaceAll("_", " ").capFirst(), snapLocations[key][0] + 5, snapLocations[key][1] + 15);
                        // amount of reports
                        ctx.fillStyle = 'white';
                        ctx.font = '14px Arial';
                        yMod = 0;
                        for (teacher in data[key]){
                            ctx.fillText(`${teacher} - ${data[key][teacher]}`, snapLocations[key][0] + 5, snapLocations[key][1] + 35 + yMod);
                            yMod += 15;
                        }
                    }
                }

                holeyPin = new Image();
                holeyPin.src = '/images/holey.png';
                holeyPin.onload = () => {
                    // ctx.drawImage(zeitmanPin, pinX, pinY - 25, 30, 30);
                    zeitmanLocation = snapLocations[teacherPinLocation['zeitman']]
                    ctx.drawImage(zeitmanPin, zeitmanLocation[0], zeitmanLocation[1] - 25, 30, 30);
                    holeyLocation = snapLocations[teacherPinLocation['holey']]
                    ctx.drawImage(holeyPin, holeyLocation[0] + 40, holeyLocation[1] - 25, 30, 30);
    
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.fillRect(0, 0, 300, 30);
                    ctx.fillStyle = 'white';
                    ctx.font = '16px Arial';
                    ctx.fillText('Click a location to report it', 5, 20);
        
                    // scale the cavas to fit on the screen without scrolling
                    var scale = Math.min(document.getElementsByClassName('map')[0].width / img.width, document.getElementsByClassName('map')[0].height / img.height);
                    ctx.scale(scale, scale);
                }
            });

        }
        zeitmanPin.src="/images/the_man_noexif.jpg"
    }
    img.src = '/images/map_noexif.jpg';

    document.getElementsByClassName('map')[0].width = img.width;
    document.getElementsByClassName('map')[0].height = img.height;
}

// load the image into the canvas
ctx = document.getElementsByClassName('map')[0].getContext('2d');
var img = new Image();

img.onload = function() {
    ctx.drawImage(img, 0, 0);
}
img.src = '/images/map_noexif.jpg';
// set the canvas size to the image size
document.getElementsByClassName('map')[0].width = img.width;
document.getElementsByClassName('map')[0].height = img.height;

setTimeout(() => {
    locationChecker()
    redrawMap()
}, 1000)

locationChecker = () => {
    fetch(`${API_URL}/getlocation`).then((response) => {
        return response.json()
    }).then((data) => {
        if (data['zeitman'] != teacherPinLocation['zeitman']){
            teacherPinLocation['zeitman'] = data['zeitman'];
            redrawMap();
        }
        if (data['holey'] != teacherPinLocation['holey']){
            teacherPinLocation['holey'] = data['holey'];
            redrawMap();
        }
    })
}

setInterval(() => {
    // if document is hidden, don't update
    if (document.hidden) return;
    // Automatic location updater
    locationChecker()
}, 10*1000)// 10 seconds