(function (window, document, undefined, Butter) {

  var trackEvents,
    urlRegex, videoURL,
    DOMDB, iframe, iframeBody,
    popcornString, butterId,
    userSetMedia, videoString,
    popcornURL, iframeHEADz;

  Butter.registerModule( "previewer", {

    // setup function used to set default values, as well as setting up the iframe
    setup: function( options ) {
      
      iframeHEADz = {};
      popcornURL = options.popcornURL || "http://popcornjs.org/code/dist/popcorn-complete.js";
      urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;
      layout = options.layout;
      DOMDB = { target: [], media: [] };
      butterIds = {};
      userSetMedia = options.media;

      var that = this,
          targetSrc = document.getElementById( options.target );

        // check if target is a div or iframe
      if ( targetSrc.tagName === "DIV" ) {

        target = document.getElementById( options.target );

        // force iframe to fill parent and set source
        iframe = document.createElement( "IFRAME" );
        iframe.src = layout;
        iframe.width = target.style.width;
        iframe.height = target.style.height;
        target.appendChild( iframe );

        // begin scraping once iframe has loaded, remove listener when complete
        iframe.addEventListener( "load", function (e) {
          that.scraper( iframe, options.callback );
          this.removeEventListener( "load", arguments.callee, false );
        }, false);

      } else if ( targetSrc.tagName === "IFRAME" ) {

        iframe = targetSrc;
        iframe.src = options.layout;

        targetSrc.addEventListener( "load", function (e) {
          that.scraper( iframe, options.callback );
          this.removeEventListener( "load", arguments.callee, false );
        }, false);
      } // else
    }, // setup

    extend: {

      // scraper function that scrapes all DOM elements of the given layout,
      // only scrapes elements with the butter-data attribute
      scraper: function( iframe, callback ) {

        console.log(this);
        // obtain a reference to the iframes body
        var body = iframe.contentWindow.document.getElementsByTagName( "BODY" ),
            that = this;
        
        Butter.extend( iframeHEADz, iframe.contentWindow.document.head );

        //iframeHEADz = iframe.contentWindow.document.head;

        // store original iframeBody incase we rebuild
        iframeBody = "<body>" + iframe.contentWindow.document.body.innerHTML + "</body>\n";

        // function to ensure body is actually there
        var ensureLoaded = function() {

          if ( body.length < 1 ) {
            setTimeout( function() {
              ensureLoaded();
            }, 5 );      
          } else {

            // begin scraping once body is actually there, call callback once done
            ok( body[ 0 ].children );
            callback();
          } // else
        } // ensureLoaded

        ensureLoaded();

        // scraping is done here
        function ok( children ) {

          // loop for every child of the body
          for( var i = 0; i < children.length; i++ ) {
            
            // if DOM element has an data-butter tag that is equal to target or media,
            // add it to butters target list with a respective type
            if( children[ i ].getAttribute( "data-butter" ) === "target" ) {
              that.addTarget( { 
                name: children[ i ].id, 
                type: "target"
              } );
            } else if( children[ i ].getAttribute( "data-butter" ) === "media" ) {
              that.addMedia( { 
                name: children[ i ].id, 
                media: userSetMedia
              } );
            } // else

            // ensure we get every child, search recursively
            if ( children[ i ].children.length > 0 ) {

              ok ( children[ i ].children );
            } // if
          } // for
        } // ok

      }, // scraper

      // buildPopcorn function, builds an instance of popcorn in the iframe and also
      // a local version of popcorn
      buildPopcorn: function( videoTarget, callback ) {

        videoURL = this.getCurrentMedia().getMedia();

        // default to first butter-media tagged object if none is specified
        videoTarget = videoTarget || this.getAllMedia()[ 0 ].getName();

        iframe.contentWindow.document.body.innerHTML = iframeBody;
        
        // create a string that will create an instance of popcorn with the proper video source
        popcornString = "document.addEventListener('DOMContentLoaded', function () {\n";        

        var regexResult = urlRegex.exec( videoURL ) || "",
            players = [];

        players[ "youtu" ] = function() {
          iframe.contentWindow.document.getElementById( videoTarget ).innerHTML = "";
          videoString = "popcorn = Popcorn( Popcorn.youtube( '" + videoTarget + "', '" +
            videoURL + "', {\n" + 
            "width: 430, height: 300\n" + 
          "} ) );\n";
        };

        players[ "vimeo " ] = function() {
          iframe.contentWindow.document.getElementById( videoTarget ).innerHTML = "";
          videoString = "popcorn = Popcorn( Popcorn.vimeo( '" + videoTarget + "', '" +
          videoURL + "', {\n" +
            "css: {\n" +
              "width: '430px',\n" +
              "height: '300px'\n" +
            "}\n" +
          "} ) );\n";
        };

        players[ "soundcloud" ] = function() {
          iframe.contentWindow.document.getElementById( videoTarget ).innerHTML = "";
          videoString = "popcorn = Popcorn( Popcorn.soundcloud( '" + videoTarget + "'," +
          " '" + videoURL + "' ) );\n";
        };

        players[ "baseplayer" ] = function() {
          iframe.contentWindow.document.getElementById( videoTarget ).innerHTML = "";
          videoString = "popcorn = Popcorn( Popcorn.baseplayer( '" + videoTarget + "' ) );\n";
        };

        players[ undefined ] = function() {
          var src = document.createElement( "source" );
          src.src = videoURL;

          iframe.contentWindow.document.getElementById( videoTarget ).appendChild( src );

          var vidId = "#" + videoTarget;          

          videoString = "popcorn = Popcorn( '" + vidId + "');\n";
        }; 

        // call certain player function depending on the regexResult
        players[ regexResult[ 1 ] ]();

        popcornString += videoString;    

        // if for some reason the iframe is refreshed, we want the most up to date popcorn code
        // to be represented in the head of the iframe, incase someone views source
        if ( trackEvents ) {

          // loop through each track event
          for ( var k = 0; k < trackEvents.length; k++ ) {
            
            // obtain all of the options in the manifest
            var options = trackEvents[ k ]._natives.manifest.options;
            popcornString += " popcorn." + trackEvents[ k ]._natives.type + "({\n"; 

            // for each option
            for ( item in options ) {

              if ( options.hasOwnProperty( item ) ) {

                // add the data to the string so it looks like normal popcorn code
                // that someone would write
                popcornString += item + ": '" + trackEvents[ k ][ item ] + "',\n";
              } // if
            } // for

            popcornString += "});";

          }// for
        } // if
        
        popcornString += "}, false);";     

        this.fillIframe( callback );
      },

      getPopcorn: function( callback ) {
        var popcorn = "var " + videoString;
        
        // if for some reason the iframe is refreshed, we want the most up to date popcorn code
        // to be represented in the head of the iframe, incase someone views source
        if ( trackEvents ) {

          // loop through each track event
          for ( var k = 0; k < trackEvents.length; k++ ) {
            
            // obtain all of the options in the manifest
            var options = trackEvents[ k ]._natives.manifest.options;
            popcorn += "popcorn." + trackEvents[ k ]._natives.type + "({\n"; 

            // for each option
            for ( item in options ) {

              if ( options.hasOwnProperty( item ) ) {

                // add the data to the string so it looks like normal popcorn code
                // that someone would write
                popcorn += item + ": '" + trackEvents[ k ][ item ] + "',\n";
              } // if
            } // for

            popcorn += "});\n";

          } // for
        } // if

        return popcorn;

      },
    
      // fillIframe function used to populate the iframe with changes made by the user,
      // which is mostly managing track events added by the user
      fillIframe: function( callback ) {
        
        var popcornScript, iframeHead, body,
            that = this, doc = iframe.contentWindow.document;

        // create a script within the iframe and populate it with our popcornString
        popcornScript = doc.createElement( "script" );
        popcornScript.innerHTML = popcornString;

        doc.head.appendChild( popcornScript );
        console.log(iframeHEADz.innerHTML);
        // create a new head element with our new data
        iframeHead = "<head>" + iframeHEADz.innerHTML + "\n<script src='" + popcornURL + "'>" + 
          "</script>\n<script>\n" + popcornString + "</script>\n</head>\n";
        console.log(iframeHead);
        // create a new body element with our new data
        body = doc.body.innerHTML;

        // open, write our changes to the iframe, and close it
        doc.open();
        doc.write( "<html>\n" + iframeHead + body + "\n</html>" );
        doc.close();

        // listen for a trackeventadded
        this.listen( "trackeventadded", function( e ) {

          // ensure our global iframe version of popcorn is their
          var popcornReady = function( e ) {
            
            var framePopcorn = iframe.contentWindow.popcorn;

            if ( !framePopcorn ) {
              setTimeout( function() {
                popcornReady( e );
              }, 10 );
            } else {

              // add track events to the iframe verison of popcorn
              framePopcorn[ e.type ]( iframe.contentWindow.Popcorn.extend( {},
                e.popcornOptions ) );

              butterIds[ e.getId() ] = framePopcorn.getLastTrackEventId();

              e.manifest = framePopcorn.getTrackEvent( butterIds[ e.getId() ] )._natives.manifest;

              // store a reference to track events
              trackEvents = framePopcorn.getTrackEvents();
              callback && callback();
            } // else
          } // function

          popcornReady( e );
        } ); // listener

        this.listen( "trackeventremoved", function( e ) {
          iframe.contentWindow.popcorn.removeTrackEvent( butterIds[ e.getId() ] );
        } );

        this.listen( "mediachanged", function( e ) {
          that.buildPopcorn( e.getName() );
        } );

        this.listen( "timeupdate", function( e ) {
          //iframe.contentWindow.popcorn.video.currentTime = e; 
        } );

      } // fillIframe
    }, // exnteds
    
  });
})(window, document, undefined, Butter);
