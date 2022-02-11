// Initialize helper function to convert date strings to date objects
const parseTime = d3.timeParse("%Y-%m-%d");
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const disasterCategories = ["winter-storm-freeze", "flooding", "severe-storm", "drought-wildfire", "tropical-cyclone"];
let data, timeline;

//Load data from CSV file asynchronously and render chart
d3.csv('data/disaster_costs.csv').then(_data => {
  data = _data;
  data.forEach(d => {
    d.cost = +d.cost;
    d.year = +d.year;
    d.date = parseTime(d.mid);

    let yearStart = new Date(d.year, 0, 0);
    d.dayOfYear = d3.timeDay.count(yearStart, d.date);
    d.month = monthLabels[d.date.getMonth()];
    // Optional: other data preprocessing steps
  });
  console.log(data);
  timeline = new Timeline({
    parentElement: '#vis',
    disasterCategories: disasterCategories,
    monthLabels: monthLabels,
    // Optional: other configurations
  }, data);

}).catch(error => console.error(error));

d3.selectAll('.legend-label').on('click', function() {
  // Toggle 'inactive' class
  d3.select(this).classed('inactive', !d3.select(this).classed('inactive'));

  // Check which categories are active
  timeline.selectedCategories = [];
  d3.selectAll('.legend-label:not(.inactive)').each(function() {
    timeline.selectedCategories.push(d3.select(this).attr('data-category'));
  });
  if (timeline.selectedCategories.length === 0) {
    timeline.selectedCategories = disasterCategories;
  }
  console.log(timeline.selectedCategories);
  timeline.data = data.filter(d => timeline.selectedCategories.includes(d.category));
  timeline.updateVis();
});