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

voteTeacherName = "Unknown Teacher"

teacherPinLocation = {
    'zeitman': 'office',
    'vote_teacher':   'office',
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
        if (voteTeacherName.toLowerCase().startsWith('none')){
            alertify.error('No teacher selected yet! Come back at Mon. 10:30 AM');
            return;
        }
        setTimeout(() => {
            confirmThen('Are you sure?', `Are you sure you want to report ${voteTeacherName} at the ` + location.replaceAll("_"," ").capFirst() + '?', () => {
              sendReport(location, 'vote_teacher');
            });
        }, 1000)
      })
        .setting({
          'labels': {
            ok: 'Zeitman',
            cancel: voteTeacherName
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
            alertify.success("Zeiting submitted!");
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
                        extraWidth2 = voteTeacherName.length * 2.8;
                        extraWidth = Math.max(extraWidth, extraWidth2);
                        ctx.fillRect(snapLocations[key][0], snapLocations[key][1], boxSize[0] + extraWidth, boxSize[1] + (Object.keys(data[key]).length * 8));

                        ctx.fillStyle = 'white';
                        ctx.font = '18px Arial bold';
                        ctx.fillText(key.replaceAll("_", " ").capFirst(), snapLocations[key][0] + 5, snapLocations[key][1] + 15);
                        // amount of reports
                        ctx.fillStyle = 'white';
                        ctx.font = '14px Arial';
                        yMod = 0;
                        for (teacher in data[key]){
                            nme = teacher
                            if (teacher == 'vote_teacher') {
                                nme = voteTeacherName
                            }
                            ctx.fillText(`${nme.capFirst()} - ${data[key][teacher]}`, snapLocations[key][0] + 5, snapLocations[key][1] + 35 + yMod);
                            yMod += 15;
                        }
                    }
                }

                vote_teacherPin = new Image();
                vote_teacherPin.src = '/images/vote_teacher.png';
                vote_teacherPin.onload = () => {
                    // ctx.drawImage(zeitmanPin, pinX, pinY - 25, 30, 30);
                    zeitmanLocation = snapLocations[teacherPinLocation['zeitman']]
                    ctx.drawImage(zeitmanPin, zeitmanLocation[0], zeitmanLocation[1] - 25, 30, 30);
                    vote_teacherLocation = snapLocations[teacherPinLocation['vote_teacher']]
                    ctx.drawImage(vote_teacherPin, vote_teacherLocation[0] + 40, vote_teacherLocation[1] - 25, 30, 30);
    
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

// votemenu code ================================================================
updateStandings = () => {
    fetch(`${API_URL}/getstandings`).then((response) => {
        return response.json();
    }).then((data) => {
        firstPlace  = document.getElementsByClassName('current-firstplace')[0];
        secondPlace = document.getElementsByClassName('current-secondplace')[0];
        thirdPlace  = document.getElementsByClassName('current-thirdplace')[0];

        // find the first and second place
        firstPlaceName  = 'None'; firstPlaceVotes  = 0;
        secondPlaceName = 'None'; secondPlaceVotes = 0;
        thirdPlaceName  = 'None'; thirdPlaceVotes  = 0;

        for (var key in data){
            if (data[key] > firstPlaceVotes) {
                thirdPlaceName  = secondPlaceName;
                thirdPlaceVotes = secondPlaceVotes;
                secondPlaceName = firstPlaceName;
                secondPlaceVotes = firstPlaceVotes;
                firstPlaceName  = key;
                firstPlaceVotes = data[key];
            } else if (data[key] > secondPlaceVotes) {
                thirdPlaceName  = secondPlaceName;
                thirdPlaceVotes = secondPlaceVotes;
                secondPlaceName = key;
                secondPlaceVotes = data[key];
            } else if (data[key] > thirdPlaceVotes) {
                thirdPlaceName  = key;
                thirdPlaceVotes = data[key];
            }
        }

        firstPlace.innerHTML  = `${firstPlaceName.capFirst()} - ${firstPlaceVotes}`;
        secondPlace.innerHTML = `${secondPlaceName.capFirst()} - ${secondPlaceVotes}`;
        thirdPlace.innerHTML  = `${thirdPlaceName.capFirst()} - ${thirdPlaceVotes}`;
    });
}

document.getElementsByClassName('votebutton')[0].addEventListener('click', () => {
    document.getElementsByClassName('votemenu')[0].style.display = 'block';
    updateStandings();
})

document.getElementsByClassName('closebutton')[0].addEventListener('click', () => {
    document.getElementsByClassName('votemenu')[0].style.display = 'none';
})

document.getElementsByClassName('votesubmitbutton')[0].addEventListener('click', () => {
    alertify.confirm('Are you sure you want to vote for ' + document.getElementById('teachers').value.capFirst() + '?', () => {
        // check for last vote time
        var lastVoteTime = document.cookie.replace(/(?:(?:^|.*;\s*)last_vote_time\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        if (lastVoteTime != '') {
            if (Date.now() - lastVoteTime < 1000 * 60 * 60 * 24) {
                alertify.error("You can only vote once per day!");
                return;
            }
        }
    
        var d = new Date();
        d.setTime(d.getTime() + (1*24*60*60*1000)); // 1 day
        var expires = "expires="+ d.toUTCString();
        document.cookie = "last_vote_time=" + Date.now() + ";" + expires + ";path=/";
    
        selected = document.getElementById('teachers').value;
        fetch(`${API_URL}/castvote/${selected}`).then((response) => {
            if (response.status == 200) {
                alertify.success("Vote submitted!");
                setTimeout(() => {
                    updateStandings();
                }, 1000)
            } else {
                alertify.error("Error submitting vote!");
            }
        });
    }).set('title', 'Confirm Vote');
})

fetch(`${API_URL}/teacherlist`).then((response) => {
    return response.json();
}).then((data) => {
    teacherList = data;
    teacherSelect = document.getElementById('teachers');
    for (var key in teacherList['teachers']){
        teacherSelect.innerHTML += `<option value="${teacherList['teachers'][key]}">${teacherList['teachers'][key].capFirst()}</option>`;
    }
});

// ===============================================================================

fetch(`${API_URL}/getvoteteacher`).then((response) => {
    return response.text();
}).then((data) => {
    voteTeacherName = data;
    document.getElementById('voteteacherdisp').innerHTML = document.getElementById('voteteacherdisp').innerHTML.replace('??VOTE_TEACHER??', voteTeacherName.capFirst());
});

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
        if (data['vote_teacher'] != teacherPinLocation['vote_teacher']){
            teacherPinLocation['vote_teacher'] = data['vote_teacher'];
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
