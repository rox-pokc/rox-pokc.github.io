(function(window) {
    "use strict";

    var _Wavelet = {};

    _Wavelet.convolve = function convolve(input, wx, wy) {
        var m = input.width;
        var out = ImageAccess.createEmpty( m, m );

        for (var j = 0; j < m; j++) {
            var x = input.getRow( j );
            var y = _Wavelet.convolver( x, wx );

            out.putRow( j, y );
        }

        for (var i = 0; i < m; i++) {
            x = out.getColumn( i );
            y = _Wavelet.convolver( x, wy );
            out.putColumn( i, y );
        }
        return out;
    };


    _Wavelet.convolver = function(u, mask) {
        var m = u.length;
        var n = mask.length;
        var h = Math.floor(n / 2);
        var nh = n - h;
        var v = [];

        for (var k = 0; k < m; k++) {
            v[k] = 0;

            for(var j = -h; j <= h; j++){
                var km = k - j;

                while (km >= m) {
                    km = -km + 2 * (n - 1);
                }
                while(km < 0) {
                    km = -km;
                    while (km >= m) {
                        km = -km + 2 * (n - 1);
                    }
                }

                v[k] += u[km] * mask[j + h];
            }
        }

        return v;
    };

    _Wavelet.getScalingFunction = function(order) {
        if ( order === 0 ) {
            return [1];
        }
        else if ( order === 1 ) {
            var m = Math.sqrt( 2 );
            return [1 / m, 1 / m, 0];
        }
        else {
            var t = Math.sqrt( 3 );
            var n = 4 * Math.sqrt( 2 );
            return [(1 - t) / n, (3 - t) / n, (3 + t) / n, (1 + t) / n, 0];
        }
    };

    _Wavelet.getWaveletFunction = function(order) {
        if ( order === 0 ) {
            return [1];
        }
        else if ( order === 1 ) {
            var m = Math.sqrt( 2 );
            return [-1 / m, 1 / m, 0];
        }
        else {
            var t = Math.sqrt( 3 );
            var n = 4 * Math.sqrt( 2 );
            return [(-1 - t) / n, (3 + t) / n, (t - 3) / n, (1 - t) / n, 0];
        }
    };

    _Wavelet.reflect = function(arr) {
        var n = arr.length;
        var out = [];
        for (var i = 0; i < n; i++)
            out[i] = arr[n - 1 - i];
        return out;
    };


    _Wavelet.analyze = function(image, n, order) {
        var nx = image.width;
        var ny = image.height;
        var output = image.clone();
        for (var i = 0; i < n; i++) {
            var sub = output.getSubImage( 0, 0, nx, ny );
            sub = _Wavelet.progressAnalyze( sub, order );
            output.putSubImage( 0, 0, sub );
            nx = nx / 2;
            ny = ny / 2;
        }

        return output;
    };

    _Wavelet.progressAnalyze = function(input, order) {
        var m = input.width;
        var s = _Wavelet.getScalingFunction( order );
        var w = _Wavelet.getWaveletFunction( order );
        var merge = ImageAccess.createEmpty( m, m );

        merge.putSubImage( 0, 0, _Wavelet.downSample( _Wavelet.convolve( input, s, s ) ) );
        merge.putSubImage( m / 2, 0, _Wavelet.downSample( _Wavelet.convolve( input, w, s ) ) );
        merge.putSubImage( 0, m / 2, _Wavelet.downSample( _Wavelet.convolve( input, s, w ) ) );
        merge.putSubImage( m / 2, m / 2, _Wavelet.downSample( _Wavelet.convolve( input, w, w ) ) );
        return merge;
    };

    _Wavelet.synthesize = function(image, n, order) {
        var div = Math.pow( 2, n - 1 );
        var nx = image.width / div;
        var ny = image.height / div;
        var output = image.clone();
        for (var i = 0; i < n; i++) {
            var sub = output.getSubImage( 0, 0, nx, ny );
            sub = _Wavelet.progressSynthesize( sub, order );
            output.putSubImage( 0, 0, sub );
            nx = nx * 2;
            ny = ny * 2;
        }
        return output;
    };

    _Wavelet.progressSynthesize = function(coef, order) {
        var m = coef.width;
        var s = _Wavelet.reflect( _Wavelet.getScalingFunction( order ) );
        var w = _Wavelet.reflect( _Wavelet.getWaveletFunction( order ) );
        var LL = coef.getSubImage( 0, 0, m / 2, m / 2 );
        var HL = coef.getSubImage( m / 2, 0, m / 2, m / 2 );
        var LH = coef.getSubImage( 0, m / 2, m / 2, m / 2 );
        var HH = coef.getSubImage( m / 2, m / 2, m / 2, m / 2 );
        LL = _Wavelet.convolve( _Wavelet.upSample( LL ), s, s );
        HL = _Wavelet.convolve( _Wavelet.upSample( HL ), w, s );
        LH = _Wavelet.convolve( _Wavelet.upSample( LH ), s, w );
        HH = _Wavelet.convolve( _Wavelet.upSample( HH ), w, w );
        LL.add( LH );
        LL.add( HL );
        LL.add( HH );

        return LL;
    };

    _Wavelet.downSample = function(input) {
        var m = Math.floor(input.width / 2);
        var out = new ImageAccess( m, m );
        for (var k = 0; k < m; k++)
            for (var l = 0; l < m; l++)
                out.putPixel( k, l, input.getPixel( 2 * k, 2 * l ) );
        return out;
    };

    _Wavelet.upSample = function(input) {
        var m = input.width;
        var out = ImageAccess.createEmpty( m * 2, m * 2 );
        for (var k = 0; k < m; k++)
            for (var l = 0; l < m; l++)
                out.putPixel( 2 * k, 2 * l, input.getPixel( k, l ) );
        return out;
    };

    _Wavelet.keepLowpass = function(input, n) {
        var nx = input.width;
        var ny = input.height;
        var p = Math.pow(2, n);

        var out = ImageAccess.createEmpty( nx, ny );
        var sub = input.getSubImage( 0, 0, nx / p, ny / p );
        out.putSubImage( 0, 0, sub );
        return out;
    };

    _Wavelet.doSoftThreshold = function(input, threshold) {
        var nx = input.width;
        var ny = input.height;

        var output = ImageAccess.createEmpty( nx, ny );
        for (var x = 0; x < nx; x++)
            for (var y = 0; y < ny; y++) {
                var pixel = input.getPixel( x, y );
                if ( pixel < -threshold ) {
                    pixel = pixel + threshold;
                }
                else if ( pixel > threshold ) {
                    pixel = pixel - threshold;
                }
                else {
                    pixel = 0.0;
                }
                output.putPixel( x, y, pixel );
            }
        return output;
    };

    _Wavelet.denoiseAuto = function(input) {
        var coef = _Wavelet.analyze( input, 3, 2 );
        var nx = input.width;
        var ny = input.height;
        var sub = coef.getSubImage( nx / 2, ny / 2, nx / 2, ny / 2 );
        var threshold = _Wavelet.stdDev( sub );
        return _Wavelet.synthesize( _Wavelet.doSoftThreshold( coef, threshold ), 3, 2 );
    };

    _Wavelet.stdDev = function(image) {
        var mean = image.getMean();
        var stdDev = 0.0;
        for (var i = 0; i < image.width; i++)
            for (var j = 0; j < image.height; j++) {
                var v = image.getPixel( i, j );
                stdDev += (v - mean) * (v - mean);
            }
        return Math.sqrt( stdDev / (image.width * image.height) );
    };

    _Wavelet.splines = {};
    _Wavelet.splines.analyze = function(input, n, order) {
        var nx = input.width;
        var ny = input.height;
        for (var i = 0; i < n; i++) {
            var sub = input.getSubImage(0, 0, nx, ny);
            sub = _Wavelet.splines.progressAnalysis(sub, order);
            input.putSubImage(0, 0, sub);
            nx = nx / 2;
            ny = ny / 2;
        }

        return input;
    };
    _Wavelet.splines.progressAnalysis = function(input, order) {
        var nx = input.width;
        var ny = input.height;
        var u = [];
        var v = [];
        var filters = _Wavelet.splines.getSplineFilter(order);

        for (var y = 0; y < ny; y++) {
            u = input.getRow(y);
            v = _Wavelet.splines.splitMirror(u, filters.h, filters.g);
            input.putRow(y, v);
        }

        for (var x = 0; x < nx; x++) {
            u = input.getColumn(x);
            v = _Wavelet.splines.splitMirror(u, filters.h, filters.g);
            input.putColumn(x, v);
        }

        return input;
    };

    _Wavelet.splines.synthesis = function(input, scales, order) {
        var div = Math.floor( Math.pow(2, scales - 1) );
        var nx = Math.max(1, input.width / div);
        var ny = Math.max(1, input.height / div);
        var out = input.clone();

        for ( var i=0; i<scales; i++) {
            var sub = out.getSubImage(0, 0, nx, ny);
            sub = _Wavelet.splines.progressSynthesis(sub, order);
            out.putSubImage(0, 0, sub);
            nx = nx * 2;
            ny = ny * 2;
        }

        return out;
    };

    _Wavelet.splines.progressSynthesis = function(input, order) {
        var nx = input.width;
        var ny = input.height;
        var u = [];
        var v = [];
        var filters = _Wavelet.splines.getSplineFilter(order);

        for (var y = 0; y < ny; y++) {
            u = input.getRow(y);
            v = _Wavelet.splines.mergeMirror(u, filters.h, filters.g);
            input.putRow(y, v);
        }

        for (var x = 0; x < nx; x++) {
            u = input.getColumn(x);
            v = _Wavelet.splines.mergeMirror(u, filters.h, filters.g);
            input.putColumn(x, v);
        }

        return input;
    };

    _Wavelet.splines.splitMirror = function(vin, h, g){
        var n = vin.length;
        var n2 = Math.floor(n / 2);
        var nh = h.length;
        var ng = g.length;
        var vout = [];

        var pix;
        var j, k, j1, j2;
        var period = 2 * n - 2;

        for (var i = 0; i < n2; i++) {
            j = i * 2;
            pix = vin[j] * h[0];
            for (k = 1; k < nh; k++) {
                j1 = j - k;
                if (j1 < 0) {
                    while (j1 < 0)
                        j1 += period;
                    if (j1 >= n)
                        j1 = period - j1;
                }
                j2 = j + k;
                if (j2 >= n) {
                    while (j2 >= n)
                        j2 -= period;
                    if (j2 < 0)
                        j2 = -j2;
                }
                pix +=  h[k] * (vin[j1] + vin[j2]);
            }
            vout[i] = pix;

            j = j + 1;
            pix = vin[j] * g[0];
            for (k = 1; k < ng; k++) {
                j1 = j - k;
                if (j1 < 0) {
                    while (j1 < 0)
                        j1 += period;
                    if (j1 >= n)
                        j1 = period - j1;
                }
                j2 = j + k;
                if (j2 >= n) {
                    while (j2 >= n)
                        j2 -= period;
                    if (j2 < 0)
                        j2 = -j2;
                }
                pix += g[k] * (vin[j1] + vin[j2]);
            }
            vout[i + n2] = pix;
        }

        return vout;
    };

    _Wavelet.splines.mergeMirror = function(vin, h, g) {
        var n = vin.length;
        var n2 = Math.floor(n / 2);
        var nh = h.length;
        var ng = g.length;

        var vout = [];

        var pix1, pix2;
        var j, k, kk, i1, i2;
        var k01 = Math.floor(nh / 2) * 2 - 1;
        var k02 = Math.floor(ng / 2) * 2 - 1;

        var period = 2 * n2 - 1;

        for (var i = 0; i < n2; i++) {
            j = 2 * i;
            pix1 = h[0] * vin[i];
            for (k = 2; k < nh; k += 2) {
                i1 = i - (k / 2);
                if (i1 < 0) {
                    i1 = (-i1) % period;
                    if (i1 >= n2)
                        i1 = period - i1;
                }
                i2 = i + (k / 2);
                if (i2 > n2 - 1) {
                    i2 = i2 % period;
                    if (i2 >= n2)
                        i2 = period - i2;
                }
                pix1 = pix1 + h[k] * (vin[i1] + vin[i2]);
            }

            pix2 = 0.;
            for (k = -k02; k < ng; k += 2) {
                kk = Math.abs(k);
                i1 = i + (k - 1) / 2;
                if (i1 < 0) {
                    i1 = (-i1 - 1) % period;
                    if (i1 >= n2)
                        i1 = period - 1 - i1;
                }
                if (i1 >= n2) {
                    i1 = i1 % period;
                    if (i1 >= n2)
                        i1 = period - 1 - i1;
                }
                pix2 = pix2 + g[kk] * vin[i1 + n2];
            }

            vout[j] = (pix1 + pix2);

            j = j + 1;
            pix1 = 0.;
            for (k = -k01; k < nh; k += 2) {
                kk = Math.abs(k);
                i1 = i + (k + 1) / 2;
                if (i1 < 0) {
                    i1 = (-i1) % period;
                    if (i1 >= n2)
                        i1 = period - i1;
                }
                if (i1 >= n2) {
                    i1 = (i1) % period;
                    if (i1 >= n2)
                        i1 = period - i1;
                }
                pix1 = pix1 + h[kk] * vin[i1];
            }
            pix2 = g[0] * vin[i + n2];
            for (k = 2; k < ng; k += 2) {
                i1 = i - (k / 2);
                if (i1 < 0) {
                    i1 = (-i1 - 1) % period;
                    if (i1 >= n2)
                        i1 = period - 1 - i1;
                }
                i2 = i + (k / 2);
                if (i2 > n2 - 1) {
                    i2 = i2 % period;
                    if (i2 >= n2)
                        i2 = period - 1 - i2;
                }
                pix2 = pix2 + g[k] * (vin[i1 + n2] + vin[i2 + n2]);
            }
            vout[j] = (pix1 + pix2);
        }

        return vout;
    };


    _Wavelet.splines.getSplineFilter = function(order) {
        var h = [], g = [];
        switch (order) {
            case 1:
                h = [
                    0.81764640621546, 0.39729708810751, -0.06910098743038, -0.05194534825542, 0.01697104840045, 0.00999059568192, -0.00388326235731, -0.00220195129177, 0.00092337104427, 0.00051163604209, -0.00022429633694, -0.00012268632858,
                    0.00005535633860, 0.00003001119291, -0.00001381880394, -0.00000744435611, 0.00000347980027, 0.00000186561005, -0.00000088225856, -0.00000047122304, 0.00000022491351, 0.00000011976480, -0.00000005759525, -0.00000003059265,
                    0.00000001480431, 0.00000000784714, -0.00000000381742, -0.00000000201987, 0.00000000098705, 0.00000000052147, -0.00000000025582, -0.00000000013497, 0.00000000006644, 0.00000000003501, -0.00000000001729, -0.00000000000910,
                    0.00000000000451, 0.00000000000237, -0.00000000000118, -0.00000000000062, 0.00000000000031, 0.00000000000016, -0.00000000000008, -0.00000000000004, 0.00000000000002, 0.00000000000001, 0
                ];
                break;

            case 3:
                h = [
                    0.76613005375980, 0.43392263358931, -0.05020172467149, -0.11003701838811, 0.03208089747022, 0.04206835144072, -0.01717631549201, -0.01798232098097, 0.00868529481309, 0.00820147720600, -0.00435383945777, -0.00388242526560,
                    0.00218671237015, 0.00188213352389, -0.00110373982039, -0.00092719873146, 0.00055993664336, 0.00046211522752, -0.00028538371867, -0.00023234729403, 0.00014604186978, 0.00011762760216, -0.00007499842461, -0.00005987934057,
                    0.00003863216129, 0.00003062054907, -0.00001995254847, -0.00001571784835, 0.00001032898225, 0.00000809408097, -0.00000535805976 - 0.00000417964096, 0.00000278450629, 0.00000216346143, -0.00000144942177, -0.00000112219704,
                    0.00000075557065, 0.00000058316635, -0.00000039439119, -0.00000030355006, 0.00000020610937, 0.00000015823692, -0.00000010783016, -0.00000008259641, 0.00000005646954, 0.00000004316539, -0.00000002959949, -0.00000002258313,
                    0.00000001552811, 0.00000001182675, -0.00000000815248, -0.00000000619931, 0.00000000428324, 0.00000000325227, -0.00000000225188, -0.00000000170752, 0.00000000118465, 0.00000000089713, -0.00000000062357, -0.00000000047167,
                    0.00000000032841, 0.00000000024814, -0.00000000017305, -0.00000000013062, 0.00000000009123, 0.00000000006879, -0.00000000004811, -0.00000000003625, 0.00000000002539, 0.00000000001911, -0.00000000001340, -0.00000000001008,
                    0.00000000000708, 0.00000000000532, -0.00000000000374, -0.00000000000281, 0.00000000000198, 0.00000000000148, -0.00000000000104, -0.00000000000078, 0.00000000000055, 0.00000000000041, -0.00000000000029, -0.00000000000022,
                    0.00000000000015, 0.00000000000012, -0.00000000000008 - 0.00000000000006, 0.00000000000004, 0.00000000000003, -0.00000000000002, -0.00000000000002, 0.00000000000001, 0.00000000000001, -0.00000000000001, -0.00000000000000,
                    0
                ];
                break;

            case 5:
                h = [
                    0.74729, 0.4425, -0.037023, -0.12928, 0.029477, 0.061317, -0.021008, -0.032523, 0.014011, 0.01821, -0.0090501, -0.010563, 0.0057688, 0.0062796, -0.0036605, -0.0037995, 0.0023214, 0.0023288, -0.0014738, -0.0014414, 0.00093747,
                    0.00089889, -0.00059753, -0.00056398, 0.00038165, 0.00035559, -0.00024423, -0.00022512, 0.00015658, 0.00014301, -0.00010055, -9.1113e-05, 6.4669e-05, 5.8198e-05, -4.1649e-05, -3.7256e-05, 2.729e-05, 2.458e-05, -2.2593e-05,
                    -3.5791e-05, -1.7098e-05, -2.9619e-06, 0
                ];
                break;
        }

        if ( order > 0 ) {
            g[0] = h[0];
            for (var k = 1; k < h.length; k++) {
                if ( k % 2 == 0 )
                    g[k] = h[k];
                else
                    g[k] = -h[k];
            }
        }
        else {
            g[0] = -h[0];
        }

        return {h: h, g: g};
    };


    window.Wavelet = _Wavelet;
}( window ));