var FallbackQuery = require('../../layout/FallbackQuery');
var VariableStore = require('../../lib/VariableStore');
var diff = require('deep-diff').diff;

module.exports.tests = {};

module.exports.tests.base_render = function(test, common) {
  test('instance with nothing set should render to base request', function(t) {
    var query = new FallbackQuery();

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');

    var actual = query.render(vs);

    var expected = {
      query: {
        bool: {
          should: []
        }
      },
      size: { $: 'size value' },
      track_scores: { $: 'track_scores value' }
    };

    t.deepEquals(actual, expected);
    t.end();

  });

  test('VariableStore with neighbourhood-only should only include neighbourhood parts and no fallbacks', function(t) {
    var query = new FallbackQuery();

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');
    vs.var('input:neighbourhood', 'neighbourhood value');

    var actual = query.render(vs);

    var expected = {
      query: {
        bool: {
          should: [
            {
              bool: {
                _name: 'fallback.neighbourhood',
                must: [
                  {
                    multi_match: {
                      query: 'neighbourhood value',
                      type: 'phrase',
                      fields: ['parent.neighbourhood', 'parent.neighbourhood_a']
                    }
                  }
                ],
                filter: {
                  term: {
                    layer: 'neighbourhood'
                  }
                }
              }
            }
          ]
        }
      },
      size: { $: 'size value' },
      track_scores: { $: 'track_scores value' }
    };

    t.deepEquals(actual, expected);
    t.end();

  });

  test('VariableStore with query AND street should only add query', function(t) {
    var query = new FallbackQuery();

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');
    vs.var('input:query', 'query value');
    vs.var('input:housenumber', 'house number value');
    vs.var('input:street', 'street value');
    vs.var('input:neighbourhood', 'neighbourhood value');
    vs.var('input:borough', 'borough value');
    vs.var('input:locality', 'locality value');
    vs.var('input:county', 'county value');
    vs.var('input:region', 'region value');
    vs.var('input:country', 'country value');

    var actual = query.render(vs);
    var expected = require('../fixtures/fallbackQuery1.json');

    t.deepEquals(actual, expected);
    t.end();

  });

  test('VariableStore with number+street and less granular fields should include all others', function(t) {
    var query = new FallbackQuery();

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');
    vs.var('input:housenumber', 'house number value');
    vs.var('input:street', 'street value');
    vs.var('input:neighbourhood', 'neighbourhood value');
    vs.var('input:borough', 'borough value');
    vs.var('input:locality', 'locality value');
    vs.var('input:county', 'county value');
    vs.var('input:region', 'region value');
    vs.var('input:country', 'country value');

    var actual = query.render(vs);
    var expected = require('../fixtures/fallbackQuery2.json');

    t.deepEquals(actual, expected);
    t.end();

  });

};

module.exports.tests.scores = function(test, common) {
  test('score with operator specified should be honored and in order', function(t) {
    var score_view1 = function(vs) {
      console.assert(vs !== null);
      return { 'score field 1': 'score value 1' };
    };

    var score_view2 = function(vs) {
      console.assert(vs !== null);
      return { 'score field 2': 'score value 2' };
    };

    var score_view3 = function(vs) {
      console.assert(vs !== null);
      return { 'score field 3': 'score value 3' };
    };

    var score_view4 = function(vs) {
      console.assert(vs !== null);
      return { 'score field 4': 'score value 4' };
    };

    var query = new FallbackQuery();
    query.score(score_view1, 'must');
    query.score(score_view2, 'should');
    query.score(score_view3, 'must');
    query.score(score_view4, 'should');

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');

    var actual = query.render(vs);

    var expected = {
      query: {
        bool: {
          should: [
            { 'score field 2': 'score value 2'},
            { 'score field 4': 'score value 4'}
          ],
          must: [
            { 'score field 1': 'score value 1'},
            { 'score field 3': 'score value 3'}
          ]
        }
      },
      size: { $: 'size value' },
      track_scores: { $: 'track_scores value' }
    };

    t.deepEquals(actual, expected);
    t.end();

  });

  test('score without operator specified should be added as \'should\'', function(t) {
    var score_view = function(vs) {
      console.assert(vs !== null);
      return { 'score field': 'score value' };
    };

    var query = new FallbackQuery();
    query.score(score_view);

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');

    var actual = query.render(vs);

    var expected = {
      query: {
        bool: {
          should: [
            { 'score field': 'score value'}
          ]
        }
      },
      size: { $: 'size value' },
      track_scores: { $: 'track_scores value' }
    };

    t.deepEquals(actual, expected);
    t.end();

  });

  test('score with non-must or -should operator specified should be added as \'should\'', function(t) {
    var score_view = function(vs) {
      console.assert(vs !== null);
      return { 'score field': 'score value' };
    };

    var query = new FallbackQuery();
    query.score(score_view, 'non must or should value');

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');

    var actual = query.render(vs);

    var expected = {
      query: {
        bool: {
          should: [
            { 'score field': 'score value'}
          ]
        }
      },
      size: { $: 'size value' },
      track_scores: { $: 'track_scores value' }
    };

    t.deepEquals(actual, expected);
    t.end();

  });

  test('scores rendering to falsy values should not be added', function(t) {
    var score_views_called = 0;

    var query = new FallbackQuery();

    [
      { 'score field 1': 'score value 1' },
      false, '', 0, null, undefined, NaN,
      { 'score field 2': 'score value 2' },
    ].forEach(function(value) {
      query.score(function(vs) {
        // assert that `vs` was actually passed
        console.assert(vs !== null);
        // make a note that the view was actually called
        score_views_called++;
        return value;
      });
    });

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');

    var actual = query.render(vs);

    var expected = {
      query: {
        bool: {
          should: [
            { 'score field 1': 'score value 1'},
            { 'score field 2': 'score value 2'}
          ]
        }
      },
      size: { $: 'size value' },
      track_scores: { $: 'track_scores value' }
    };

    t.deepEquals(actual, expected);
    t.equals(score_views_called, 8);
    t.end();

  });

};

module.exports.tests.filter = function(test, common) {
  test('all filter views returning truthy values should be added in order to sort', function(t) {
    // the views assert that the VariableStore was passed, otherwise there's no
    // guarantee that it was actually passed
    var filter_views_called = 0;

    var query = new FallbackQuery();

    [
      { 'filter field 1': 'filter value 1' },
      false, '', 0, null, undefined, NaN,
      { 'filter field 2': 'filter value 2' },
    ].forEach(function(value) {
      query.filter(function(vs) {
        // assert that `vs` was actually passed
        console.assert(vs !== null);
        // make a note that the view was actually called
        filter_views_called++;
        return value;
      });
    });

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');

    var actual = query.render(vs);

    var expected_filter = [
      { 'filter field 1': 'filter value 1'},
      { 'filter field 2': 'filter value 2'}
    ];

    t.equals(filter_views_called, 8);
    t.deepEquals(actual.query.bool.filter, expected_filter);
    t.end();

  });
};

module.exports.all = function (tape, common) {
  function test(name, testFunction) {
    return tape('address ' + name, testFunction);
  }
  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};
