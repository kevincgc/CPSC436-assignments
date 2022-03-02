let data, scatterplot, barchart, lexischart, filteredData, genderFilter, idFilter = [];
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
  }, filteredData, filteredData.filter(d => d.pcgdp !== null), []);
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
  barchart.data = filteredData;
  barchart.updateVis();
  scatterplot.data = filteredData;
  genderFilter = "None";
  filterByGender();
});

/**
 * Use bar chart as filter and update scatter plot accordingly
 */
function filterByGender() {
  if (genderFilter === "None") {
    scatterplot.dataActive = filteredData.filter(d => d.pcgdp !== null);
    scatterplot.dataInactive = [];
  } else {
    scatterplot.dataActive = filteredData.filter(d => d.gender === genderFilter && d.pcgdp !== null);
    scatterplot.dataInactive = filteredData.filter(d => d.gender !== genderFilter && d.pcgdp !== null);
  }
  scatterplot.updateVis();
}

function updateSelection(d) {
  if (idFilter.includes(d.id)) {
    idFilter = idFilter.filter(e => e !== d.id);
    console.log(idFilter);
  } else {
    idFilter.push(d.id);
    console.log(idFilter);
  }
  scatterplot.updateVis();
}
/*
 * Todo:
 * - initialize views
 * - filter data
 * - listen to events and update views
 */
