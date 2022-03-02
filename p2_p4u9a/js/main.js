let data, scatterplot, barchart, lexischart, filteredData, genderFilter = "None", idFilter = [];
/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/leaderlist.csv').then(_data => {

  // Convert columns to numerical values
  _data.forEach(d => {
    Object.keys(d).forEach(attr => {
      if (attr === 'pcgdp') {
        d[attr] = (d[attr] === 'NA') ? null : +d[attr];
      } else if (attr !== 'country' && attr !== 'leader' && attr !== 'gender') {
        d[attr] = +d[attr];
      }
    });
  });
  data = _data;
  data.sort((a,b) => a.label - b.label);

  filteredData = data.filter(d => d.oecd === 1 && d.duration > 0);

  barchart = new BarChart({
    parentElement: '#vis-bar'
  }, filteredData);
  barchart.updateVis();
  scatterplot = new ScatterPlot({
    parentElement: '#vis-scatter'
  }, filteredData.filter(d => d.pcgdp !== null));
  scatterplot.updateVis();
  lexischart = new LexisChart({
    parentElement: '#vis-lexis'
  }, filteredData);
  lexischart.updateVis();
}).catch(error => console.error(error));

/**
 * Selector event listener
 */
d3.select('#country-selector').on('change', function() {
  const selection = d3.select(this).property('value');
  filteredData = data.filter(d => d[selection] === 1 && d.duration > 0);

  // Update chart
  genderFilter = "None";
  barchart.data = filteredData;
  barchart.updateVis();
  scatterplot.data = filteredData.filter(d => d.pcgdp !== null);
  scatterplot.updateVis();
  lexischart.data = filteredData;
  lexischart.updateVis();
});

/**
 * Use bar chart as filter and update scatter plot accordingly
 */
function filterByGender() {
  scatterplot.updateVis();
  lexischart.updateVis();
  barchart.renderVis();
}

function updateSelection(d) {
  if (d === null) {
    idFilter = [];
  } else if (idFilter.includes(d.id)) {
    idFilter = idFilter.filter(e => e !== d.id);
  } else {
    idFilter.push(d.id);
  }
  scatterplot.renderVis();
  lexischart.renderVis();
}
/*
 * Todo:
 * - initialize views
 * - filter data
 * - listen to events and update views
 */
