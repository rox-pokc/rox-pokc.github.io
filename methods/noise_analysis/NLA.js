function getSlideWindow(matrix, i, j, height, width) {
    var slideWindow = [];
    if (i > 0 && j > 0) {
        slideWindow.push(matrix[i - 1][j - 1]);
    } else {
        slideWindow.push(null);
    }
    if (i > 0) {
        slideWindow.push(matrix[i - 1][j]);
    } else {
        slideWindow.push(null);
    }
    if (i > 0 && j < width - 1) {
        slideWindow.push(matrix[i - 1][j + 1]);
    } else {
        slideWindow.push(null);
    }
    if (j > 0) {
        slideWindow.push(matrix[i][j - 1]);
    } else {
        slideWindow.push(null);
    }
    slideWindow.push(matrix[i][j]);
    if (j < width - 1) {
        slideWindow.push(matrix[i][j + 1]);
    } else {
        slideWindow.push(null);
    }
    if (i < height - 1 && j > 0) {
        slideWindow.push(matrix[i + 1][j - 1]);
    } else {
        slideWindow.push(null);
    }
    if (i < height - 1) {
        slideWindow.push(matrix[i + 1][j]);
    } else {
        slideWindow.push(null);
    }
    if (i < height - 1 && j < width - 1) {
        slideWindow.push(matrix[i + 1][j + 1]);
    } else {
        slideWindow.push(null);
    }
    return slideWindow;
}

const imageImprovement = false;

function makeImageThicker(newMatrix, i, j, height, width, value) {
    if (i > 0 && j > 0) {
        newMatrix[i - 1][j - 1] = value;
    }
    if (i > 0) {
        newMatrix[i - 1][j] = value;
    }
    if (i > 0 && j < width - 1) {
        newMatrix[i - 1][j + 1] = value;
    }
    if (j > 0) {
        newMatrix[i][j - 1] = value;
    }
    if (j < width - 1) {
        newMatrix[i][j + 1] = value;
    }
    if (i < height - 1 && j > 0) {
        newMatrix[i + 1][j - 1] = value;
    }
    if (i < height - 1) {
        newMatrix[i + 1][j] = value;
    }
    if (i < height - 1 && j < width - 1) {
        newMatrix[i + 1][j + 1] = value;
    }
    return newMatrix;
}

function NLA(outRed, outGreen, outBlue) {
    const chunkArray = (arr, cnt) => arr.reduce((prev, cur, i, a) => !(i % cnt) ? prev.concat([a.slice(i, i + cnt)]) : prev, []);

    var matrixRed = chunkArray(outRed, canvas.width);
    var matrixGreen = chunkArray(outGreen, canvas.width);
    var matrixBlue = chunkArray(outBlue, canvas.width);

    const medianThree = (x, y, z) => {
        return (x + y + z) - Math.max(x, y, z) - Math.min(x, y, z);
    };

    const medianFilter = (matrix) => {
        var newMatrix = new Array(canvas.height).fill(0).map(() => new Array(canvas.width).fill(0));



        for (i = 0; i < canvas.height; i++) {
            for (j = 0; j < canvas.width; j++) {
                var slideWindow = getSlideWindow(matrix, i ,j, canvas.height, canvas.width);

                var m1 = medianThree(slideWindow[0], slideWindow[4], slideWindow[8]);
                var m2 = medianThree(slideWindow[1], slideWindow[4], slideWindow[7]);
                var m3 = medianThree(slideWindow[2], slideWindow[4], slideWindow[6]);
                var m4 = medianThree(slideWindow[3], slideWindow[4], slideWindow[5]);

                var ma = medianThree(slideWindow[4], m1, m3);
                var mb = medianThree(slideWindow[4], m2, m4);

                var m = medianThree(slideWindow[4], ma, mb);

                if (slideWindow[4] != m) {
                    newMatrix[i][j] = slideWindow[4];
                    if (imageImprovement) {
                        newMatrix = makeImageThicker(newMatrix, i, j,  canvas.height, canvas.width, slideWindow[4]);
                    }
                }
            }
        }
        return newMatrix;
    };

    const maxArr = (arr, n, m) => {
        var max = -1;
        for(i = 0; i < n; i++) {
            for(j = 0; j < m; j++) {
                if (arr[i][j] > max) {
                    max = arr[i][j];
                }
            }
        }
        return max;
    };

    const minArr = (arr, n, m) => {
        var min = 256;
        for(i = 0; i < n; i++) {
            for(j = 0; j < m; j++) {
                if (arr[i][j] < min) {
                    min = arr[i][j];
                }
            }
        }
        return min;
    };

    const modifyAmplitude = (arr, n, m, max) => {
        for(i = 0; i < n; i++) {
            for (j = 0; j < m; j++) {
                arr[i][j] = arr[i][j] / max * 255;
            }
        }
        return arr;
    };

    var newMatrixRed = medianFilter(matrixRed);
    var newMatrixGreen = medianFilter(matrixGreen);
    var newMatrixBlue = medianFilter(matrixBlue);

    var maxInRed = maxArr(newMatrixRed, canvas.height, canvas.width);
    var minInRed = minArr(newMatrixRed, canvas.height, canvas.width);
    var modifiedMatrixRed = modifyAmplitude(newMatrixRed, canvas.height, canvas.width, maxInRed);

    var maxInGreen = maxArr(newMatrixGreen, canvas.height, canvas.width);
    var minInGreen = minArr(newMatrixGreen, canvas.height, canvas.width);
    var modifiedMatrixGreen = modifyAmplitude(newMatrixGreen, canvas.height, canvas.width, maxInGreen);

    var maxInBlue = maxArr(newMatrixBlue, canvas.height, canvas.width);
    var minInBlue = minArr(newMatrixBlue, canvas.height, canvas.width);
    var modifiedMatrixBlue = modifyAmplitude(newMatrixBlue, canvas.height, canvas.width, maxInBlue);


    var NLAimage = [];
    for (i = 0; i < canvas.height; i++) {
        for (j = 0; j < canvas.width; j++) {
            NLAimage.push(newMatrixRed[i][j]);
            NLAimage.push(newMatrixGreen[i][j]);
            NLAimage.push(newMatrixBlue[i][j]);
            NLAimage.push(255);
        }
    }

    return NLAimage;
}