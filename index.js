if (window.matchMedia('(display-mode: standalone)').matches){
    document.getElementsByClassName('gettheapp')[0].style.display = 'none';
} else if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
    // If we wanna force getting the app
} else {
    document.getElementsByClassName('gettheapp')[0].style.display = 'none';
}



mouseX = 0;
mouseY = 0;

pinX = 25;
pinY = 25;

String.prototype.capFirst = function() {return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });};

snapLocations = {
    '100_hall': [645, 210],
    '200_hall': [377, 205],
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
    console.log(mouseX, mouseY);

    // check if the mouse is in a snap location
    for (var key in snapLocations) {
        if (snapLocations.hasOwnProperty(key)) {
            extraWidth = key.length * 2.75;
            if (mouseX >= snapLocations[key][0] && mouseX <= snapLocations[key][0] + boxSize[0] + extraWidth && mouseY >= snapLocations[key][1] && mouseY <= snapLocations[key][1] + boxSize[1]) {
                if (confirm("Are you sure you want to report " + key.replaceAll("_", " ").capFirst() + "?")) {
                    sendReport(key);
                }
            }
        }
    }
});

document.getElementsByClassName('map')[0].addEventListener('mousemove', (e) => {
    var pos = getRelativeMousePosition(e);
    mouseX = pos.x;
    mouseY = pos.y;
});

getRelativeMousePosition = (e) => {
    var rect = document.getElementsByClassName('map')[0].getBoundingClientRect(),
        scaleX = document.getElementsByClassName('map')[0].width / rect.width,
        scaleY = document.getElementsByClassName('map')[0].height / rect.height;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    }
}

sendReport = (location) => {
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
        alert("You have submitted too many reports (10)! Come back later (5h).")
        return;
    }

    // send a post request to /submitreport/<location>
    fetch('https://zietman-tracker.ziettracker.repl.co/submitreport/' + location, {
        method: 'POST'
    }).then((response) => {
        if (response.status == 200) {
            alert("Report submitted!");
            redrawMap()
        } else {
            alert("Report failed to submit!");
        }
    });
}

redrawMap = () => {
    ctx = document.getElementsByClassName('map')[0].getContext('2d');
    ctx.scale(1, 1);
    var img = new Image();

    if (selectedLocation != undefined) {
        pinX = snapLocations[selectedLocation][0];
        pinY = snapLocations[selectedLocation][1];
    }

    img.onload = function() {
        ctx.drawImage(img, 0, 0);

        
        // draw /images/the_man_noexif.png at pinX, pinY
        var pin = new Image();
        pin.onload = function() {
            // draw the snap locations
            fetch('https://zietman-tracker.ziettracker.repl.co/reports').then((response) => {
                return response.json();
            }).then((data) => {
                for (var key in snapLocations) {
                    if (snapLocations.hasOwnProperty(key)) {
                        // draw a box with text inside it
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                        // ctx.fillRect(snapLocations[key][0], snapLocations[key][1], boxSize[0], boxSize[1]);
                        extraWidth = key.length * 2.75;
                        ctx.fillRect(snapLocations[key][0], snapLocations[key][1], boxSize[0] + extraWidth, boxSize[1]);
                        
                        ctx.fillStyle = 'white';
                        ctx.font = '18px Arial bold';
                        ctx.fillText(key.replaceAll("_", " ").capFirst(), snapLocations[key][0] + 5, snapLocations[key][1] + 15);
                        // amount of reports
                        ctx.fillStyle = 'white';
                        ctx.font = '14px Arial';
                        ctx.fillText(data[key] + ' report(s)', snapLocations[key][0] + 5, snapLocations[key][1] + 35);
                    }
                }
            });


            ctx.drawImage(pin, pinX, pinY - 25, 30, 30);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, 300, 30);
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.fillText('Click a location to report it', 5, 20);

            // scale the cavas to fit on the screen without scrolling
            var scale = Math.min(document.getElementsByClassName('map')[0].width / img.width, document.getElementsByClassName('map')[0].height / img.height);
            ctx.scale(scale, scale);
        }
        pin.src="/images/the_man_noexif.jpg"
    }
    img.src = '/images/map_noexif.jpg';

    // draw the pin at pinX, pinY
    // set the canvas size to the image size
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
  redrawMap()
  redrawMap()
}, 1000)

setInterval(() => {
    // if document is hidden, don't update
    if (document.hidden) return;
    // Automatic location updater
    fetch("https://zietman-tracker.ziettracker.repl.co/getlocation").then((response) => {
        return response.text()
    }).then((data) => {
        if (data.trim() != selectedLocation){
            console.log("He moved!!!")
            window.location.reload()
        }
    })
}, 10*1000)// 10 seconds

// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", function() {
//     if (navigator.serviceWorker.controller) {
//       console.log("Active service worker found, no need to register");
//     } else {
//         const registration = navigator.serviceWorker.register("/sw.js",
//             {scope: "/"}
//         );
    
//         registration.then(function(registration) {
//           console.log("ServiceWorker registration successful with scope: ", registration.scope);
//         }, function(err) {
//             console.log("ServiceWorker registration failed: ", err);
//         });
//     }
//   })
// }