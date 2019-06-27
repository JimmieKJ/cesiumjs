var runQuickStart = function() {
    var intro = introJs();
    intro.setOptions({
        steps: [{ 
            element: document.querySelector('#cesiumContainer'),
            intro: "This is the virtual globe and visualized data. Drag with your mouse to rotate the globe; Hold Ctrl button and drag to rotate the camera; Hold Shift button and drag to pan the view."
        }, {
            element: document.querySelector('#dataSelector'),
            intro: "These are 3 datasets we currently supported. Click one of them to switch the dataset to visualize."
        }, {
            element: document.querySelector('#toolbar'),
            intro: "This is the toolbox controls all the behavior of data visualization."
        }, {
            element: document.querySelector('#time-progressor'),
            intro: "This is a Date indicator for data. It also serves as a progress bar if the data is of time-series. Click the some point on the bar to change the date of data."
        }, {
            element: document.querySelector('#cntAniCtrl'),
            intro: "Click the Run/Pause button to visualize time-series data sequentially. The slider on the right controls the playback speed. These controls may be disabled if the data is static."
        }, {
            element: document.querySelector('.onoffswitch[checked]').parentElement,
            intro: "This is one of the available variables in current dataset. Click the switch on the right to visualize or hide the variable."
        }, {
            element: $('.cvsFunction:not(*[_disabled]):not(*[pin])')[0],
            intro: "It provides some control on currently visualized variable."
        }, {
            element: document.querySelector('#tbiPickValue'),
            intro: "Click to investigate values of visualized variable, if it is supported."
        }, {
            element: document.querySelector('#tbiLegendSwith'),
            intro: "Click to show/hide legend."
        }, {
            element: document.querySelector('#stbiChangeBasemap'),
            intro: "Click to change basemap."
        }, {
            element: document.querySelector('.fa-home'),
            intro: "Click to reset camera."
        }, {
            element: document.querySelector('.fa-arrows-alt'),
            intro: "Click to Enter/Exit fullscreen."
        }, {
            element: document.querySelector('.fa-compress'),
            intro: "Click to Minimize/Restore toolbox."
        }, {
            element: document.querySelector('#legendTable'),
            intro: "The legend for currently visualized variable. Click it to customize the color scheme. Click 'More Color' in the bottom to pick one from the presets."
        }, {
            element: document.querySelector('#btnQuickStart'),
            intro: "Enjoy exploring the data! Click here to start the tutorial again."
        }]
    });

    intro.start(); 
};
