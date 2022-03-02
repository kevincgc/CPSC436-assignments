class LexisChart {

    /**
     * Class constructor with initial configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1000,
            containerHeight: 380,
            margin: {top: 15, right: 15, bottom: 20, left: 25},
            tooltipPadding: _config.tooltipPadding || 15
        }
        this.data = _data;
        this.initVis();
    }

    /**
     * Create scales, axes, and append static elements
     */
    initVis() {
        let vis = this;

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('id', 'lexis-chart')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Append group element that will contain our actual chart
        // and position it according to the given margin config
        vis.chartArea = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.chart = vis.chartArea.append('g');

        // Todo: initialize scales, axes, static elements, etc.
        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Initialize scales
        vis.xScale = d3.scaleLinear()
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(6)
            .tickSize(-vis.height - 10);
        // .tickPadding(10)
        // .tickFormat(d => d + ' km');

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(6)
            .tickSize(-vis.width - 10)
        //.tickPadding(10);
    }


    updateVis() {
        let vis = this;

        vis.xStartValue = d => d.start_year;
        vis.xEndValue = d => d.end_year;
        vis.yStartValue = d => d.start_age;
        vis.yEndValue = d => d.end_age;

        // Set the scale input domains
        vis.xScale.domain([1950, 2021]);
        vis.yScale.domain([25, 95]);

        vis.filteredData = vis.data.filter(d => genderFilter === "None" ? true : (d.gender === genderFilter));

        vis.renderVis();
    }


    renderVis() {
        let vis = this;

        // Add circles
        const lines = vis.chart.selectAll('.unselected')
            .data(vis.filteredData, d => d)
            .join('line')
            .attr('class', 'arrow unselected')
            .attr("x1", d => vis.xScale(vis.xStartValue(d)))
            .attr("y1", d => vis.yScale(vis.yStartValue(d)))
            .attr("x2", d => vis.xScale(vis.xEndValue(d)))
            .attr("y2", d => vis.yScale(vis.yEndValue(d)))
            .attr('marker-end', d => idFilter.includes(d.id) ? vis.marker("#FFA500", vis) :
                (d.label === 1 ? vis.marker("#999", vis) : vis.marker("#ddd", vis)))
            .style("stroke", d => idFilter.includes(d.id) ? "#FFA500" : (d.label === 1 ? "#999" : "#ddd"))
            .style("stroke-width", d => (d.label === 1 || idFilter.includes(d.id)) ? 4 : 1);

        lines
            .on('mouseover', function (event, d) {
                if (!idFilter.includes(d.id)) {
                    d3.select(this)
                        .style("stroke", "#999")
                        .style("stroke-width", 3)
                        .attr('marker-end', vis.marker("#999", vis));
                }
                d3.select('#tooltip')
                .style('display', 'block')
                .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                .html(`
                  <div class="tooltip-title">${d.leader}</div>
                  <div><i>${d.country}, ${d.start_year} - ${d.end_year}</i></div>
                  <ul>
                    <li>Age at inauguration: ${d.start_age}</li>
                    <li>Time in office: ${d.duration} ${d.duration > 1 ? "years" : "year"}</li>
                    <li>GDP/Capita: ${d.pcgdp === null ? "Not Available" : Math.round(d.pcgdp)}</li>
                  </ul>
                `);
            })
            .on('mouseleave', function (event, d) {
                if (!idFilter.includes(d.id) && d.label !== 1) {
                    d3.select(this)
                        .style("stroke", "#ddd")
                        .style("stroke-width", 1)
                        .attr('marker-end', d => d.label === 1 ? vis.marker("#999", vis) : vis.marker("#ddd", vis));
                }
                d3.select('#tooltip').style('display', 'none');
            })
            .on('click', function (event, d) {
                if (d.gender === genderFilter || genderFilter === "None") {
                    updateSelection(d);
                }
            });
    }

    marker(color, vis) {
        // Create default arrow head
        // Can be applied to SVG lines using: `marker-end`
        vis.chart.append('defs').append('marker')
            .attr('id', color.replace("#", ""))
            .attr('markerUnits', 'strokeWidth')
            .attr('refX', '2')
            .attr('refY', '2')
            .attr('markerWidth', '10')
            .attr('markerHeight', '10')
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,0 L2,2 L 0,4')
            .attr('stroke', color)
            .attr('fill', 'none');
        return "url(" + color + ")";
    }
}