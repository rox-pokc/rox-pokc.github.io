const results = {};

var img = new Image();
var srcPrefix = img.src.substring(0, 4);
if (srcPrefix == "http" || srcPrefix == "www.") {
    img.crossOrigin = 'Anonymous';
}

var isAdvancedUpload = function () {
    var div = document.createElement('div');
    return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
}();

const form = document.getElementById('image-loader');
const inputs = document.querySelectorAll('#app aside ul li button');

if (isAdvancedUpload) {
    form.classList.add('has-advanced-upload');

    ['drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop'].forEach(function (event) {
        form.addEventListener(event, function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
    });
    ['dragover', 'dragenter'].forEach(function (event) {
        form.addEventListener(event, function () {
            form.classList.add('uk-dragover');
        });
    });
    ['dragleave', 'dragend', 'drop'].forEach(function (event) {
        form.addEventListener(event, function () {
            form.classList.remove('uk-dragover');
        });
    });
    form.addEventListener('drop', function (e) {
        droppedFiles = e.dataTransfer.files; // the files that were dropped
        loadFile(droppedFiles[0]);
    });
}

const imageInput = document.getElementById('image-input');
imageInput.addEventListener('change', function () {
    loadFile(this.files[0])
}, false);

const loadFile = (file) => {
    const fileReader = new FileReader();
    fileReader.onload = function () {
        img.src = fileReader.result;
    };
    fileReader.readAsDataURL(file);
    form.classList.add('uk-hidden');
    for (const input of inputs) {
        input.removeAttribute('disabled');
    }
};

var canvas = document.getElementById('loaded-image');
var ctx = canvas.getContext('2d');

img.onload = function () {
    var max_size = 650,
        width = img.width,
        height = img.height;
    if (width > height) {
        if (width > max_size) {
            height *= max_size / width;
            width = max_size;
        }
    } else {
        if (height > max_size) {
            width *= max_size / height;
            height = max_size;
        }
    }
    canvas.width = width;
    canvas.height = height;
    updateResults();
    trigger('origin');
};

var origin = function () {
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData;
};

var noise = function () {
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var newImageData = ctx.createImageData(
        canvas.width,
        canvas.height
    );
    const data = histogramEqualization(imageData.data, newImageData, canvas.height, canvas.width);

    const out = [];
    const outRed = [];
    const outGreen = [];
    const outBlue = [];

    for (var i = 0; i < data.length; i += 4) {
        var avg = colorManagment([data[i], data[i + 1], data[i + 2]]);
        var equalizedArg = colorStabilization([data[i], data[i + 1], data[i + 2]]);
        outRed.push(data[i]);
        outGreen.push(data[i + 1]);
        outBlue.push(data[i + 2]);
    }

    var NLAimage = NLA(outRed, outGreen, outBlue);

    return new ImageData(new Uint8ClampedArray(NLAimage), canvas.width, canvas.height);
};

var wavelet = function () {
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var newImageData = ctx.createImageData(
        canvas.width,
        canvas.height
    );
    const data = histogramEqualization(imageData.data, newImageData, canvas.height, canvas.width);
    const out = [];
    for (var i = 0; i < data.length; i += 4) {
        var avg = colorManagment([data[i], data[i + 1], data[i + 2]]);
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
        out.push(avg);
    }
    const arr = new Float32Array(out);
    const input = new ImageAccess(canvas.width, canvas.height);
    input.data = arr;
    const modedarr = Wavelet.analyze(input, 1, 1);
    const modedarrdata = modedarr.data;
    const res = [];
    for (var i = 0; i < modedarrdata.length; i++) {
        res.push(modedarrdata[i]);
        res.push(modedarrdata[i]);
        res.push(modedarrdata[i]);
        res.push(170);
    }
    return new ImageData(new Uint8ClampedArray(res), canvas.width, canvas.height);
};


const restoreDefaults = () => {
    results.origin = undefined;
    results.wavelet = undefined;
    results.noise = undefined;
};

const selectImage = () => {
    canvas.width = 0;
    canvas.height = 0;
    restoreDefaults();
    form.classList.remove('uk-hidden');
    document.getElementById('image-input').click();

    for (const input of inputs) {
        input.setAttribute('disabled', true);
    }
};

const updateResults = () => {
    results.origin = origin();
    if (img.width == img.height) {
        results.wavelet = wavelet();
    } else {
        const waveletButton = document.querySelector('[data-type="wavelet"]');
        waveletButton.setAttribute('disabled', true);
    }
    results.noise = noise();
};

const trigger = (name) => {
    ctx.putImageData(results[name], 0, 0);
};

for (const input of inputs) {
    input.addEventListener('click', function (e) {
        switch (e.target.dataset.type) {
            case 'select-image':
                selectImage();
                break;
            default:
                trigger(e.target.dataset.type);
        }
    });
}
