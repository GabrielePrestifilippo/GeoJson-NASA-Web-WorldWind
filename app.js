/*jshint -W117 */

define(['./scripts/Creator'], function(DataCreator) {

    var data = new DataCreator("canvasOne");

    $("#format").selectmenu({
        change: function(event, ui) {

            var selected, file;

            switch (ui.item.value) {
                case "0":
                    file = "data/doc_small.json";
                    break;
                case "1":
                    file = "data/doc_big.json";
                    break;
                default:
                    return;
            }

            data.create({

                data: {
                    json: {
                        file: file,
                        name: "myJson"
                    }/*,
                    kml: {
                        file: file,
                        name: "data/doc_small.kml"
                    }*/
                },
                slider: {
                    div: $("#sliderZ"),
                    span: $('#ZSpan')
                }

            });
        }
    });
});

