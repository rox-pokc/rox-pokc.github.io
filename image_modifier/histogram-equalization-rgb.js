function sobelOperators (pixels, newImageData, height, width) {
    var operators1 = [[1,2,1],
        [0,0,0],
        [-1,-2,-1]];
    var operators2 = [[-1,0,1],
        [-2,0,2],
        [-1,0,1]];
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            for (var rgb = 0; rgb <= 3; rgb++) {
                var a = getPos(x, y, width)+rgb;
                if (3 == rgb) {
                    newImageData.data[a] = pixels[a];
                    break;
                }

                var lefttop = getPos(x-1, y-1, width)+rgb;
                var top = getPos(x, y-1, width)+rgb;
                var righttop = getPos(x+1, y-1, width)+rgb;
                var left = getPos(x-1, y, width)+rgb;
                var right = getPos(x+1, y, width)+rgb;
                var leftdown = getPos(x-1, y+1, width)+rgb;
                var down = getPos(x, y+1, width)+rgb;
                var rightdown = getPos(x+1, y+1, width)+rgb;
                pixels[lefttop] = (lefttop < 0 || lefttop > pixels.length) ? 0 : pixels[lefttop];
                pixels[top] = (top < 0 || top > pixels.length) ? 0 : pixels[top];
                pixels[righttop] = (righttop < 0 || righttop > pixels.length) ? 0 : pixels[righttop];
                pixels[left] = (left < 0 || left > pixels.length) ? 0 : pixels[left];
                pixels[right] = (right < 0 || right > pixels.length) ? 0 : pixels[right];
                pixels[leftdown] = (leftdown < 0 || leftdown > pixels.length) ? 0 : pixels[leftdown];
                pixels[down] = (down < 0 || down > pixels.length) ? 0 : pixels[down];
                pixels[rightdown] = (rightdown < 0 || rightdown > pixels.length) ? 0 : pixels[rightdown];
                newImageData.data[a] += Math.abs
                (pixels[lefttop] * operators1[0][0]
                    +pixels[top] * operators1[0][1]
                    +pixels[righttop] * operators1[0][2]
                    +pixels[left] * operators1[1][0]
                    +pixels[a] * operators1[1][1]
                    +pixels[right] * operators1[1][2]
                    +pixels[leftdown] * operators1[2][0]
                    +pixels[down] * operators1[2][1]
                    +pixels[rightdown] * operators1[2][2]);
                newImageData.data[a] += Math.abs
                (pixels[lefttop] * operators2[0][0]
                    +pixels[top] * operators2[0][1]
                    +pixels[righttop] * operators2[0][2]
                    +pixels[left] * operators2[1][0]
                    +pixels[a] * operators2[1][1]
                    +pixels[right] * operators2[1][2]
                    +pixels[leftdown] * operators2[2][0]
                    +pixels[down] * operators2[2][1]
                    +pixels[rightdown] * operators2[2][2]);
                newImageData.data[a] = (255 < newImageData.data[a] ) ? 255 : newImageData.data[a];
            }
        }
    }

    return newImageData;
}
function getPos(x, y, width)
{
    return ((y*width)+x)*4;
}
function histogramEqualization (pixels, newImageData, height, width) {
    var res_newImageData = sobelOperators(pixels, newImageData, height, width);
    var countR = new Array(),
        countG = new Array(),
        countB = new Array();
    for (var i = 0; i < 256; i++) {
        countR[i] = 0;
        countG[i] = 0;
        countB[i] = 0;
    }
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var a = ((y*width)+x)*4;
            countR[pixels[a]]++;
            countG[pixels[a+1]]++;
            countB[pixels[a+2]]++;
        }
    }
    var minR = 256,
        minG = 256,
        minB = 256;
    for (var i = 1; i < 256; i++) {
        countR[i] += countR[i-1];
        countG[i] += countG[i-1];
        countB[i] += countB[i-1];

        minR = ((countR[i] != 0) && (countR[i] < minR)) ? countR[i] : minR;
        minG = ((countG[i] != 0) && (countG[i] < minG)) ? countG[i] : minG;
        minB = ((countB[i] != 0) && (countB[i] < minB)) ? countB[i] : minB;
    }
    for (var i = 0; i < 256; i++) {
        countR[i] = ((countR[i]-minR)/((width*height)-minR))*255;
        countG[i] = ((countG[i]-minG)/((width*height)-minG))*255;
        countB[i] = ((countB[i]-minB)/((width*height)-minB))*255;
    }

        var d1 = [],
            d1pron = [],
            d2 = [],
            d2pron = [],
            d3 = [],
            d3pron = [];
        var options = {
            series: {stack: 0,
                lines: {show: false, steps: false },
                bars: {show: true, barWidth: 0.9, align: 'center',},}
        };
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var a = ((y*width)+x)*4;
                res_newImageData.data[a] = countR[pixels[a]];
                res_newImageData.data[a+1] = countG[pixels[a+1]];
                res_newImageData.data[a+2] = countB[pixels[a+2]];
                res_newImageData.data[a+3] = pixels[a+3];
            }
        }
    return res_newImageData.data;
}