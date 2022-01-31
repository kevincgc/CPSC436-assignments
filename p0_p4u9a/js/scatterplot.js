/**
 * Code is based on scatterplot example from T2 located at:
 * https://codesandbox.io/s/github/UBC-InfoVis/2021-436V-examples/tree/master/d3-static-scatter-plot?file=/js/scatterplot.js
 */
class Scatterplot {
    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 250,
            margin: _config.margin || {top: 20, right: 40, bottom: 20, left: 40}
        }
        this.data = _data;
        this.setTrialDomain();
        this.initVis();
    }

    /**
     * This function contains all the code that gets excecuted only once at the beginning.
     * (can be also part of the class constructor)
     * We initialize scales/axes and append static elements, such as axis titles.
     * If we want to implement a responsive visualization, we would move the size
     * specifications to the updateVis() function.
     */
    initVis() {
        let vis = this;

        // Calculate inner chart size. (margin convention: https://bl.ocks.org/mbostock/3019563)
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Set values for trial range
        vis.yOffset = 40;
        vis.yGap = (240 - vis.yOffset) / vis.trialDomain.length;
        vis.trialRange = [];
        for (let i = 0; i < vis.trialDomain.length; i++) {
            vis.trialRange.push(vis.yOffset + i * vis.yGap);
        }

        // Initialize scales
        vis.yScale = d3.scaleOrdinal()
            .domain(vis.trialDomain)
            .range(vis.trialRange);

        vis.xScale = d3.scaleLinear()
            .range([0, vis.width]);

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(6)
            .tickSize(-vis.height + 15)
            .tickPadding(4)
            .tickFormat(d3.format(".1f"));

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Append group element that will contain our actual chart
        // and position it according to the given margin config
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`);

        // Labels for trial number
        for (let i = 0; i < vis.trialDomain.length; i++) {
            vis.chart.append('text')
                .attr('class', 'trial')
                .attr('y', vis.yScale(vis.trialDomain[i]) + 2)
                .attr('x', -5)
                .attr("fill", "#666666")
                .style('text-anchor', 'end')
                .text(`Trial ${vis.trialDomain[i]}`);
        }

        // Axis title for mean values
        vis.svg.append('text')
            .attr('class', 'title')
            .attr('x', vis.width - 40)
            .attr('y', 20)
            .attr("fill", "#444444")
            .text('Accuracy (mean)');

        // Labels for average mean
        vis.means = d3.rollup(vis.data, v => d3.sum(v, d => d.accuracy) / d3.count(v, d => d.accuracy), d => d.trial);
        console.log(vis.means);
        console.log(vis.trialDomain);
        console.log(vis.means[vis.trialDomain[3]]);
        for (let i = 0; i < vis.trialDomain.length; i++) {
            vis.chart.append('text')
                .attr('class', 'mean')
                .attr('y', vis.yScale(vis.trialDomain[i]) + 3)
                .attr('x', vis.width + 40)
                .attr("fill", "#444444")
                .style('text-anchor', 'end')
                .text(vis.means.get(vis.trialDomain[i]).toFixed(2));
        }
    }

    /**
     * This function contains all the code to prepare the data before we render it.
     * In some cases, you may not need this function but when you create more complex visualizations
     * you will probably want to organize your code in multiple functions.
     */
    updateVis() {
        let vis = this;

        // Specific accessor functions
        vis.xValue = d => d.accuracy;
        vis.yValue = d => d.trial;

        // Set the scale input domains
        vis.xScale.domain([d3.min(vis.data, vis.xValue), d3.max(vis.data, vis.xValue)])
            .nice();

        vis.renderVis();
    }

    /**
     * This function contains the D3 code for binding data to visual elements.
     * We call this function every time the data or configurations change.
     */
    renderVis() {
        let vis = this;

        // Add circles
        vis.chart.selectAll('.point')
            .data(vis.data)
            .enter()
            .append('circle')
            .attr('class', 'point')
            .attr('r', 8)
            .attr('cy', d => vis.yScale(vis.yValue(d)))
            .attr('cx', d => vis.xScale(vis.xValue(d)))
            .attr("fill-opacity", "0.3")
            .style("fill", "#1E6595");

        // Update the axes/gridlines
        // We use the second .call() to remove the axis and just show gridlines
        vis.xAxisG
            .call(vis.xAxis)
            .call(g => g.select('.domain').remove());
    }

    /**
     * This function gets the trials as a sorted set.
     */
    setTrialDomain() {
        let vis = this;

        // Create set of trial numbers
        vis.trialSet = new Set();
        for (let i = 0; i < vis.data.length; i++) {
            vis.trialSet.add(Number(vis.data[i].trial));
        }

        // Sort by numeric order
        vis.trialDomain = Array.from(vis.trialSet).sort(function (a, b) {  return a - b;  });
    }
}