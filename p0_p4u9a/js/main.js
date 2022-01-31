/**
 * Load data from CSV file asynchronously and visualize it
 *
 * Code is based on scatterplot example from T2 located at:
 * https://codesandbox.io/s/github/UBC-InfoVis/2021-436V-examples/tree/master/d3-static-scatter-plot?file=/js/main.js
 */
d3.csv('data/experiment_data.csv')
    .then(data => {
        // Convert strings to numbers
        data.forEach(d => {
            d.trial = +d.trial;
            d.accuracy = +d.accuracy;
        });

        // Print data
        console.log(data);

        // Initialize chart
        const scatterplot = new Scatterplot({parentElement: '#vis'}, data);

        // Show chart
        scatterplot.updateVis();
    })
    .catch(error => console.error(error));