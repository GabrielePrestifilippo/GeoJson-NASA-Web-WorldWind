/*jshint -W117 */
/*jshint -W083 */

/*debugging vars*/
var allTime;
var oldVal;
var time = {};
var layer;
/*-----*/

define([
    'src/WorldWind',
    'src/formats/kml/KmlFile',
    'src/formats/kml/controls/KmlTreeVisibility'

], function(
    WorldWind,
    KmlFile,
    KmlTreeVisibility) {



    var DataCreator = function(globe) {

        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_ERROR);
        wwd = new WorldWind.WorldWindow(globe);
        wwd.addLayer(new WorldWind.BMNGOneImageLayer());
        wwd.addLayer(new WorldWind.BingAerialWithLabelsLayer());
    };

    DataCreator.prototype.create = function(options) {


        if (this.layer) {
            wwd.removeLayer(layer);
        }

        if (options.data.selected) {
            this.type = 1; //json
        } else if (options.data.kml) {
            this.type = 0; //kml
        } else {
            return; //no data
        }

        var self = this;
        var callback = function() {
            self.initialize(self, self.layer);
            self.start(self.layer, options.slider);
        };
        this.layer = this.import(options.data, this.type, callback);


        /*** KML CALLBACK ***/
        if (!this.type) {
            var int = setInterval(function() {
                if (layer.renderables.length) {
                    clearInterval(int);
                    self.initialize(self, self.layer);
                    self.start(self.layer, options.slider);
                }
            }, 250);
        }


    };


    DataCreator.prototype.import = function(data, type, callback) {

        //var layer;
        if (type) {
            layer = new WorldWind.RenderableLayer(data.json.name);
            var polygonGeoJSON = new WorldWind.GeoJSONParser(data.json.file);
            polygonGeoJSON.load(this.shapeConfigurationCallback, layer, callback);
            wwd.addLayer(layer);
        } else {
            var kmlFileOptions = {
                url: data.kml.file
            };


            layer = new WorldWind.RenderableLayer(data.kml.name);
            wwd.addLayer(layer);
            layer.enabled = false;
            var kmlFilePromise = new KmlFile(kmlFileOptions);
            kmlFilePromise.then(function(kmlFile) {
                kmlFile.update({
                    layer: layer
                });
            });
        }
        return layer;

    };







    DataCreator.prototype.getValue = function(layer, renderable) {
        if (this.type) {
            return layer.renderables[renderable].attributes.desc;
        } else {
            return layer.renderables[renderable]._node.childNodes[1].textContent;
        }
    };


    DataCreator.prototype.getTime = function(layer, renderable) {
        if (this.type) {
            return layer.renderables[renderable].attributes.name;
        } else {
            return layer.renderables[renderable]._node.childNodes[0].textContent;
        }
    };

    DataCreator.prototype.initialize = function(self, layer) {
        var _self = self;

        var x;

        allTime = [];

        var result = layer.renderables;
        var max = -Infinity;
        var min = Infinity;
        var tmp;
        for (x = 1; x < result.length; x++) {
            tmp = _self.getValue(layer, x);
            max = Math.max(max, tmp);
            min = Math.min(min, tmp);
        }

        $("#min").html("Min: " + min);
        $("#max").html("Max: " + max);
        for (x = 1; x < result.length; x++) {
            var value = _self.getValue(layer, x);
            var col = _self.color(((value - min) / (max - min)) * 100);
            layer.renderables[x]._attributes._interiorColor = col;
            layer.renderables[x]._attributes._outlineColor = new WorldWind.Color.colorFromBytes(0, 0, 0, 255);
            layer.renderables[x]._attributes._outlineWidth = 0.1;

            tmp = _self.getTime(layer, x);
            if (allTime.indexOf(tmp) == -1) {
                allTime.push(tmp);
            }
        }



    };

    DataCreator.prototype.start = function(layer, slider) {
        _self = this;

        layer.enabled = true;

        var size = layer.renderables.length;
        time = {};
        for (var x = 1; x < size; x++) {
            var tmp = this.getTime(layer, x);
            if (!time[tmp]) {
                time[tmp] = [];
            }

            time[tmp].push(layer.renderables[x]);


        }


        this.startSlider(this, slider);


        var lat, lng;
        if (this.type) {
            lng = layer.renderables[1]._boundaries[0].longitude;
            lat = layer.renderables[1]._boundaries[0].latitude;
        } else {
            lng = layer.renderables[1]._node.childNodes[3].childNodes[0].textContent.split(",")[0];
            lat = layer.renderables[1]._node.childNodes[3].childNodes[0].textContent.split(",")[1];
        }
        var anim = new WorldWind.GoToAnimator(wwd);
        anim.goTo(new WorldWind.Position(lat, lng), function() {
            var size = layer.renderables.length;

            layer.removeAllRenderables();


            layer.addRenderables(time[allTime[0]]);

            for (x in time[allTime[0]]) {
                time[allTime[0]][x].attributes.interiorColor.alpha = 1;
                time[allTime[0]][x].attributes.stateKeyInvalid = true;
            }

            wwd.redraw();
            wwd.navigator.range = 100000;
        });


    };

    DataCreator.prototype.startSlider = function(self, slider) {
        var _self = self;


        oldVal = allTime[0];
        var sliderZ = slider.div;
        var spanZ = slider.span;
        var max = allTime.length - 1;

        sliderZ.slider({
            min: 0,
            max: max,
            range: false,
            step: 1,
            slide: function(event, ui) {
                spanZ.html(ui.value);

                if (allTime[ui.value]) {

                    _self.changeSize(allTime[ui.value], oldVal);
                    oldVal = allTime[ui.value];
                    wwd.redraw();
                }
            }
        });

    };

    DataCreator.prototype.changeSize = function(val1, val2) {

        val1 = Number(val1);
        val2 = Number(val2);
        layer.removeAllRenderables();
        layer.addRenderables(time[val1]);

    };


    DataCreator.prototype.color = function(weight) {

        if (weight < 50) {
            color2 = [255, 0, 0];
            color1 = [255, 255, 0];
            p = weight / 50;
        } else {
            color2 = [255, 255, 0];
            color1 = [0, 255, 0];
            p = (weight - 50) / 50;
        }






        var w = p * 2 - 1;
        var w1 = (w / 1 + 1) / 2;
        var w2 = 1 - w1;
        var rgb = [Math.round(color1[0] * w1 + color2[0] * w2),
            Math.round(color1[1] * w1 + color2[1] * w2),
            Math.round(color1[2] * w1 + color2[2] * w2)
        ];
        return new WorldWind.Color.colorFromBytes(rgb[0], rgb[1], rgb[2], 255);


    };


    DataCreator.prototype.shapeConfigurationCallback = function(geometry, properties) {
        var configuration = {};

        if (geometry.isPolygonType() || geometry.isMultiPolygonType()) {
            configuration.attributes = new WorldWind.ShapeAttributes(null);
            configuration.attributes.name = properties.name;
            configuration.attributes.desc = properties.description;
        }

        return configuration;
    };

    return DataCreator;
});