// Initialize helper function to convert date strings to date objects
const parseTime = d3.timeParse("%Y-%m-%d");

//Load data from CSV file asynchronously and render chart
d3.csv('data/disaster_costs.csv').then(data => {
  data.forEach(d => {
    d.cost = +d.cost;
    d.year = +d.year;
    d.date = parseTime(d.mid);
    let yearStart = new Date(d.year, 1, 1);
    d.dayOfYear = d3.timeDay.count(yearStart, d.date);
    d.month = d.date.getMonth();
    // Optional: other data preprocessing steps
  });
  console.log(data);
  const timeline = new Timeline({
    parentElement: '#vis',
    disasterCategories: ["winter-storm-freeze", "flooding", "severe-storm", "drought-wildfire", "tropical-cyclone"],
    // Optional: other configurations
  }, data);

}).catch(error => console.error(error));

d3.selectAll('.legend-btn').on('click', function() {
  // Toggle 'inactive' class
  d3.select(this).classed('inactive', !d3.select(this).classed('inactive'));

  // Check which categories are active
  let selectedDifficulty = [];
  d3.selectAll('.legend-btn:not(.inactive)').each(function() {
    selectedDifficulty.push(d3.select(this).attr('data-difficulty'));
  });

  // Filter data accordingly and update vis
  scatterplot.data = data.filter(d => selectedDifficulty.includes(d.difficulty));
  scatterplot.updateVis();
});