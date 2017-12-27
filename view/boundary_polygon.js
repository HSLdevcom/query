
module.exports = function( vs ){

  // validate required params
  if( !vs.isset('boundary:polygon') ||
      !vs.isset('centroid:field') ){
    return null;
  }

  // base view
  var view = {
    geo_polygon: {}
  };

  // polygon
  view.geo_polygon[ vs.var('centroid:field') ] = {
    points: vs.var('boundary:polygon')
  };

  return view;
};
