var colorScales = {
    'linearBlackAndWhite': function(values){
        return d3.scale.linear()
            .domain(d3.extent(values))
            .range(['#000', '#fff']);
    },
    'histogramEqualize': function(values){
        var buckets = 100;
        var quantiles = d3.scale.quantile()
            .domain(values)
            .range(d3.range(buckets))
            .quantiles();

        var stopCount = quantiles.length;
        var linearScale = d3.scale.linear()
            .domain([0, stopCount - 1])
            .range([d3.rgb('rgb(0, 0, 0)'), d3.rgb('rgb(255, 255, 255)')]);

        var grayScale = d3.range(stopCount).map(function(d){
            return linearScale(d);
        });

        return d3.scale.linear().domain(quantiles).range(grayScale);
    }
};

function equalization(imgData){
    var rasterData = [];
    for(j = 0; j < (imgData.data.length / 4); j++){
        var brightness = d3.lab(d3.rgb(imgData.data[j * 4],
            imgData.data[j * 4 + 1],
            imgData.data[j * 4 + 2])).l;
        rasterData.push(imgData.data[j * 4] === 0 ? null : brightness);
    }

    var scale = colorScales.histogramEqualize(rasterData);

    for(j = 0; j < rasterData.length; j++){
        var scaledColor = scale(rasterData[j]);
        var color = d3.rgb(scaledColor);
        imgData.data[j * 4] = color.r;
        imgData.data[j * 4 + 1] = color.g;
        imgData.data[j * 4 + 2] = color.b;
        imgData.data[j * 4 + 3] = 255;
    }

    return imgData;
};