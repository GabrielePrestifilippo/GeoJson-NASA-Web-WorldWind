/*jshint -W117 */
/*jshint -W083 */

var wwd;

define([
    'src/WorldWind',
], function(
    WorldWind) {

    var DataCreator = function(globe) {
        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_ERROR);
        wwd = new WorldWind.WorldWindow(globe);
        wwd.addLayer(new WorldWind.BMNGOneImageLayer());
        wwd.addLayer(new WorldWind.BingAerialWithLabelsLayer());
    };

    DataCreator.prototype.create = function(options) {
        var self = this;
        if (this.layer) {
            wwd.removeLayer(this.layer);
        }


        var callback = function() {
            self.initialize(self, self.layer);
            self.start(self.layer, options.slider);
        };

        this.layer = this.import(options.data, this.type, callback);
    };


    DataCreator.prototype.import = function(data, type, callback) {

        var layer = new WorldWind.RenderableLayer(data.json.name);
        var polygonGeoJSON = new WorldWind.GeoJSONParser(data.json.file);
        polygonGeoJSON.load(this.shapeConfigurationCallback, layer, callback);
        wwd.addLayer(layer);
        return layer;

    };

    DataCreator.prototype.getValue = function(layer, renderable) {
        return layer.renderables[renderable].attributes.desc;
    };


    DataCreator.prototype.getTime = function(layer, renderable) {
        return layer.renderables[renderable].attributes.name;
    };

    DataCreator.prototype.initialize = function(self, layer) {
        var _self = self;

        var x;

        allTime = this.allTime = [];

        var result = layer.renderables;
        var max = -Infinity;
        var min = Infinity;
        var tmp;
        for (x = 1; x < result.length; x++) {
            tmp = _self.getValue(layer, x);
            max = Math.max(max, tmp);
            min = Math.min(min, tmp);
        }

        $("#min").html("Min: <br>" + min);
        $("#max").html("Max: <br>" + max);

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
        self = this;

        layer.enabled = true;

        var size = layer.renderables.length;
        self.time = {};
        for (var x = 1; x < size; x++) {
            var tmp = this.getTime(layer, x);
            if (!self.time[tmp]) {
                self.time[tmp] = [];
            }
            self.time[tmp].push(layer.renderables[x]);
        }

        this.startSlider(slider);

        var lat, lng;
        lng = layer.renderables[1]._boundaries[0].longitude;
        lat = layer.renderables[1]._boundaries[0].latitude;

        var anim = new WorldWind.GoToAnimator(wwd);
        anim.goTo(new WorldWind.Position(lat, lng, 100000), function() {
            var size = layer.renderables.length;
            layer.removeAllRenderables();
            layer.addRenderables(self.time[self.allTime[0]]);
            wwd.redraw();
        });
    };

    DataCreator.prototype.startSlider = function(slider) {
        var self = this;
        self.oldVal = allTime[0];
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
                if (self.allTime[ui.value]) {
                    self.layer.removeAllRenderables();
                    self.layer.addRenderables(self.time[self.allTime[ui.value]]);
                    self.oldVal = self.allTime[ui.value];
                    wwd.redraw();
                }
            }
        });
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


    return DataCreator;
});