if (window.navigator.platform.indexOf("Mac") === 0) {
    document.getElementById("fullscreen").style.display = "block";
    document.getElementById("mac").style.display = "inline";
} else if (window.navigator.platform.indexOf("Win") === 0) {
    document.getElementById("fullscreen").style.display = "block";
    document.getElementById("windows").style.display = "inline";
}