
module.exports = function( vs ){

  // validate required params
  if( !vs.isset('input:name') ||
      !vs.isset('phrase:analyzer') ||
      (!vs.isset('phrase:field') && !vs.isset('phrase:multifield')) ||
      !vs.isset('phrase:boost') ||
      !vs.isset('phrase:slop') ){
    return null;
  }

  var view;

  if (vs.isset('phrase:multifield')) {
      // multi match query
    view = { 'multi_match': {
      analyzer: vs.var('phrase:analyzer'),
      boost: vs.var('phrase:boost'),
      query: vs.var('input:name'),
      fields: vs.var('phrase:multifield'),
    }};

    if (vs.isset('multi_match:fuzziness')) {
      view.multi_match.fuzziness = vs.var('multi_match:fuzziness');
    }
    if (vs.isset('phrase:type')) {
      view.multi_match.type = vs.var('phrase:type');
    }
  }
  else {
    // base view
    view = { 'match': {} };

    // match query
    view.match[ vs.var('phrase:field') ] = {
      analyzer: vs.var('phrase:analyzer'),
      type: 'phrase',
      boost: vs.var('phrase:boost'),
      slop: vs.var('phrase:slop'),
      query: vs.var('input:name')
    };
  }

  if (vs.isset('phrase:cutoff_frequency')) {
    view.match[ vs.var('phrase:field') ].cutoff_frequency = vs.var('phrase:cutoff_frequency');
  }

  return view;
};
