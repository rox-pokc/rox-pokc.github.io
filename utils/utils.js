/**
 * Created by Favre Cyril on 28.02.17.
 */

var uniqueId = function() {
    return 'id-' + Math.random().toString( 36 ).substr( 2, 16 );
};

function sign(x) {
    return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
}

function assert(condition, message) {
    if ( !condition ) {
        log( message || "An error has occurred.", "error" );
        throw message || "User assertion failed";
    }
    return condition;
}

/**
 *
 * @param {object} object
 * @return {boolean}
 */
function isInteger(object) {
    return Number( object ) === object && object % 1 === 0;
}

/**
 *
 * @param {object} object
 * @return {boolean}
 */
function isArray(object) {
    return Object.prototype.toString.call( object ) === '[object Array]';
}

function log(msg, level, indent) {
    var log,
        color,
        messages;

    level = level || "info";
    indent = indent || 0;

    log = $( "#log" );

    switch (level) {
        case "error":
            log.slideDown();
            color = "red";
            break;
        case "comment":
            color = "gray";
            break;
        case "warning":
            color = "orange";
        case "info":
        default:
            color = "black";
    }

    messages = log.find( "span" );
    if ( messages.length > 500 ) {
        messages.first().remove();
    }

    log.append( $( "<span>" ).css( {"color": color, "padding-left": (indent * 25 + "px")} ).text( msg ) );
    log.scrollTop( log.prop( "scrollHeight" ) );

    console.log( msg );
}