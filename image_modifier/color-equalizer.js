
function colorManagment(pixel) {
    return (pixel[0] + pixel[1] + pixel[2]) / 3;
}

function colorStabilization(pixel) {
    return Math.round(pixel[0] * 0.299 + pixel[1] * 0.587 + pixel[2] * 0.114);
}