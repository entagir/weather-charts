window.addEventListener('load', init);

async function init(){
    window.addEventListener('resize', refreshPlot);
    document.querySelector('form').addEventListener('submit', function(e){e.preventDefault();});

    initCityWidget();

    plot();
}

async function plot(){
    // Plot weather data
    const selectCity = document.querySelector('#select-city');
    const lat = selectCity.dataset.lat;
    const lon = selectCity.dataset.lon;
    const city = selectCity.dataset.city;

    const data = await loadWeatherData(lat, lon);
    const chartElem = document.querySelector('#chart');

    let tempTrace = {
        type: "scatter",
        mode: "lines",
        name: 'Temperature [C]',
        x: data.dateTime,
        y: data.temp,
        line: {color: '#ec407a'}
    }

    let humidityTrace = {
        type: "scatter",
        mode: "lines",
        name: 'Humidity [%]',
        x: data.dateTime,
        y: data.humidity,
        line: {color: '#5c6bc0'}
    }

    let pressureTrace = {
        type: "scatter",
        mode: "lines",
        name: 'Pressure [mm]',
        x: data.dateTime,
        y: data.pressure,
        line: {color: '#ba68c8'}
    }

    let chartData = [tempTrace, humidityTrace, pressureTrace];
   
    let layout = {
        title: 'Weather in ' + city + ' [' + data.info.lat.toFixed(4) + ', ' +
            data.info.lon.toFixed(4) + ']',
        xaxis: {
            range: [ data.dateTime[0], data.dateTime[data.dateTime.length - 1] ],
            type: 'date',
            title: 'UTC',
        },
        yaxis: {
        },
        height: chartElem.clientHeight,
        font: {family: 'Roboto', size: '1.2rem', color: '#333333'}
    };

    Plotly.newPlot(chartElem, chartData, layout);
}

async function loadWeatherData(lat, lon){
    // Load weather data from Weather API
    // Set get params
    const url = new URL('https://api.weather.entagir.ru');
    url.searchParams.set('lat', lat);
    url.searchParams.set('lon', lon);
    url.searchParams.set('lang', 'en');
    url.searchParams.set('limit', '5');
    url.searchParams.set('hours', 'true');

    const res = await fetch(url);
    const json = await res.json();
    console.info(json);

    // Prepare data
    let data = { dateTime: [], temp: [], humidity: [], pressure: [], info: {} };
    data.info = { lat: json.info.lat, lon: json.info.lon, timeZone: json.info.tzinfo.name };
    
    for(let day of json.forecasts){
        
        let dayDate = day.date.split('-');
        let currentDate = new Date(Date.UTC(dayDate[0], dayDate[1]-1, dayDate[2]));

        for(let hour of day.hours){
            currentDate.setUTCHours(parseInt(hour.hour));

            data.dateTime.push(dateToPlotlyString(currentDate));
            data.temp.push(hour.temp);
            data.humidity.push(hour.humidity);
            data.pressure.push(hour.pressure_mm);
        }
    }

    return data;

    function dateToPlotlyString(date){
        let dateParts = date.toISOString().slice(0, -5).split('T');

        return dateParts[0] + ' ' + dateParts[1];
    }
}

function refreshPlot(){
	let chartElem = document.querySelector('#chart');
	
	if(chartElem.classList.contains('js-plotly-plot')){
		Plotly.relayout('chart', {
			width: chartElem.clientWidth,
			height: chartElem.clientHeight
		});
	}
}

function initCityWidget(){
    // Widget init
    const widget = document.querySelector('#select-city');
    const widgetInput = widget.querySelector('.search-widget__input');
    const widgetSelect = widget.querySelector('.search-widget__select');

    widgetInput.value = widget.dataset.city;
    
    widgetSelect.addEventListener('click', function(e){
        widgetInput.value = e.target.innerHTML;
        widget.dataset.city = e.target.innerHTML;
        widget.dataset.lat = e.target.dataset.lat;
        widget.dataset.lon = e.target.dataset.lon;

        widgetSelect.classList.toggle('hidden', true);
        widgetSelect.innerHTML = '';

        plot();
    });
   
    widgetInput.addEventListener('focus', widgetShow);
    widgetInput.addEventListener('input', async function(e){
        if(widgetInput.value.length < 3){return;}
        
        // Load list of cities from Nominatim API
        const query = widgetInput.value;
        const url = new URL('https://nominatim.openstreetmap.org/search.php');
        url.searchParams.set('city', query);
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('format', 'geojson');

        const res = await fetch(url, {
            headers: {'Accept-Language': 'en-US,en;q=0.5'},
        });
        const geojson = await res.json();
        console.info(geojson);

        // Update search results
        widgetSelect.innerHTML = '';

        for(let city of geojson.features){
            if(city.properties['type'] != 'city' & city.properties['type'] != 'town'){continue;}

            const option = document.createElement('div');
            
            const cityName = city.properties['address']['city'] || city.properties['address']['town'];
            option.innerHTML = cityName + ', ' + city.properties['address']['country'];
            option.classList.toggle('search-widget__item', true);
            option.dataset.lat = city.geometry.coordinates[1];
            option.dataset.lon = city.geometry.coordinates[0];

            widgetSelect.appendChild(option);
        }
        
        // Show results
        widgetShow();
    })
    
    widget.addEventListener('click', function(e){
        e.widget = true;
    });
    document.body.addEventListener('click', function(e){
        if(e.widget){return;}
        widgetSelect.classList.toggle('hidden', true);
    });

    function widgetShow()
    {
        if(widgetSelect.childElementCount == 0){return;}
        widgetSelect.classList.toggle('hidden', false);
    }
}