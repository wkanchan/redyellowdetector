var fb_me;
var fb_authResponse; // .uid .accessToken
var required_permissions = 'email,user_likes,user_subscriptions,read_friendlists,read_stream';

$(document).ready(function() {
  console.log('ready!');
  $.ajaxSetup({ cache: true });
  $.getScript('//connect.facebook.net/en_UK/all.js', function(){
    window.fbAsyncInit = function() {
      // init the FB JS SDK
      FB.init({
          appId      : '440731572690658',                        // App ID from the app dashboard
          channelUrl : '//redyellowdetector.herokuapp.com/channel.html', // Channel file for x-domain comms
          status     : true,                                 // Check Facebook Login status
          xfbml      : true                                  // Look for social plugins on the page
        });
      console.log('FB sdk inited');

      // Subscribe to login event
      FB.Event.subscribe('auth.login', function(response) {
        // do something with response
        console.log("auth.login response changed. Probably the user has just logged in.");
        // for (var key in response) {
        //   console.log("auth.login: "+key+": "+response[key]);
        // }
        // for (var key in response.authResponse) {
        //   console.log("authResponse: "+key+": "+response.authResponse[key]); 
        // }
      });

      checkUser();

    };
  });
});

/* ------------ Click handlers --------------- */

function clickToLoginHandler() {
    $('#showButton').attr('disabled','disabled');
    $('#showButton').html('Waiting for user');
    FB.login(function(response) {
      // Check if user has really granted us
      checkUser();
    }, {scope: required_permissions});
};

function clickToStartHandler() {
  start();
}

/* -------- Login, permission functions ------------ */

function checkUser() {
  // Check whether the user is logged in
  //
  FB.getLoginStatus(function(response) {
    if (response.status === 'connected') {
      // Logged in
      fb_authResponse = response;

      // Check required permissions
      console.log("checking permissions..");
      FB.api('/me/permissions', function(response) {
        for (var key in response.data[0]) {
          console.log("permissions: "+key+" = "+response.data[0][key]);
        }

        var list = required_permissions.split(',');
        for (var i=0; i<list.length; i++) {
          console.log("checking permission of "+list[i]);
          if (response.data[0][list[i]] === undefined) {
            promptLogin("Click to grant us more required permissions");
            return;
          }
        }

        // It will reach here if all permissions are granted.
        promptStart();
      });

    } else if (response.status === 'not_authorized') {
      // the user is logged in to Facebook, 
      // but has not authenticated your app
      promptLogin("Click here to authorize this app");

    } else {
      // the user isn't logged in to Facebook.
      promptLogin("Click here to login");
    }
  });
}

function promptLogin(request_message) {
  $('#showButton').removeAttr('disabled');
  $('#showButton').html(request_message);
  $('#showButton').off('click'); // remove previous handler
  $('#showButton').click(clickToLoginHandler);
}

function promptStart() {
  // Show name
  FB.api('/me?fields=name', function(response) {
    $('#fbName').html(response.name);
  });

  $('#showButton').removeAttr('disabled');
  $('#showButton').html('<br>Everything is good. Click here to start!<br>&nbsp;');
  $('#showButton').off('click');
  $("#showButton").click(clickToStartHandler);
}

/* ------------- Main functions --------------- */

function start() {
  $('#showButton').attr('disabled','disabled');
  $('#results').html('Processing..');

  FB.api('/me?fields=likes,subscribedto', function(response) {
    $('#results').html('');

    fb_response = response;

    var liked_red=0,subscribedto_red=0,liked_yellow=0,subscribedto_yellow=0;

    // Likes
    $('#results').append("<p>Total "+response.likes.data.length+" page(s) liked.</p>");
    for (var i=0; i<response.likes.data.length; i++) {
      var like = response.likes.data[i];
      if (like.id in red_pages)
        liked_red++;
      else if (like.id in yellow_pages)
        liked_yellow++;
      // console.log(i+": "+status.message);
    }
    $('#results').append("<p>You liked <span class='verybig'>"+liked_red+"</span> RED pages, \
      <span class='verybig'>"+liked_yellow+"</span> YELLOW pages.");

    // Subscribed to
    $('#results').append("<p>You subscribed to "+response.subscribedto.summary.total_count+" people.</p>");
    for (var i=0; i<response.subscribedto.data.length; i++) {
      var subscription = response.subscribedto.data[i];
      if (subscription.id in red_people)
        subscribedto_red++;
      else if (subscription.id in yellow_people)
        subscribedto_yellow++;
    }
    $('#results').append("<p>You are following <span class='verybig'>"+subscribedto_red+"</span>\
     RED people, <span class='verybig'>"+subscribedto_yellow+"</span> YELLOW people.");

    var red_score = liked_red+subscribedto_red;
    var yellow_score = liked_yellow+subscribedto_yellow;
    if (red_score > yellow_score) {
      $('#results').append("<p><span class='verybig'>You are RED.</span>\
        <br><img src='/thaksin.jpg'></p>")
    } else if (red_score < yellow_score) {
      $('#results').append("<p><span class='verybig'>You are YELLOW.\
        </span><br><img src='/sondhi.jpg'></p>")
    } else {
      $('#results').append("<p><span class='verybig'>You are IN-BETWEEN.\
        </span><br><img src='/inbetween.jpg'></p>")
    }

    $('#showButton').removeAttr('disabled');
  });
}