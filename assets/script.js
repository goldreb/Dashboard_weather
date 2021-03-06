const weatherApiKey = "b75ec9a9249bcbc83cae6dd1a9e3609c";
var userForm = document.querySelector("#user-form");
var cityInput = document.querySelector("#city-name");
var citiesList = document.querySelector("#city-container ul");
var citySearched = document.querySelector("#city-searched");
var currentWeather = document.querySelector("#current-weather-container");
var forecastContainer = document.querySelector("#forecast-container");
var clearBtn = document.querySelector("#clear-btn");
var cities = JSON.parse(localStorage.getItem("citiesSearched")) || [];
var citySearchedData;



// to check if  an object is empty
var isEmpty = function (obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
};


// capitalize the letter of each word
function titleCase(str) {
    var splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {

        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1).toLowerCase();
    }

    return splitStr.join(' ');
}



// to enter input city

var formSubmitHandler = function(event) {
    event.preventDefault();
    var city = titleCase(cityInput.value.trim());

    if (city) {
        getCurrentWeather(city);
        cityInput.value = "";

    } else {
        alert("Please enter a city!");
    }
};

// to fetch current weather conditions, day and time, longitude and latitute

var getCurrentWeather = function (cityName) {

    var api = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=imperial&appid=${weatherApiKey}`;

    fetch(api)
        .then(response => response.json())
        .then(data => {
            displayCurrentWeather(data, cityName);
            return data.coord;

        })
        .then(coord => {
            getUvIndex(coord.lat, coord.lon);
            get5dayForecast(coord.lat, coord.lon);
        })
        .catch(error => {
            alert("Error!");
            forecastContainer.innerHTML = "";
            if (cities.includes(cityName)) {
                var index = cities.indexOf(cityName);
                if (index > -1) {
                    cities.splice(index, 1);
                }
                localStorage.setItem("citiesSearched", JSON.stringify(cities));
                searchHistory();
            }
           // console.log("alert Cities")

        });
};


// to display currnt weather conditions

var displayCurrentWeather = (data, cityName) => {
    currentWeather.innerHTML = "";
    citySearched.textContent = cityName;

    if (!cities.includes(cityName)) {
        cities.push(cityName);
        cities.sort();
        localStorage.setItem("citiesSearched", JSON.stringify(cities));
        searchHistory();
    }

    if (isEmpty(data)) {
        currentWeather.textContent = "No weather data in this location";
        return;

    }
    // calculate local day and time zone
    citySearchedData= moment.unix(data.dt + data.timezone).utc().format("MMMM Do YYYY, h:mm a");

    var iconId = data.weather[0].icon;
    //console.log("current weather icon")
    citySearched.innerHTML = `${cityName} (${citySearchedData}) <span id="weather-icon"><img src="https://openweathermap.org/img/wn/${iconId }@2x.png"/></span>`;

    var temperatureEl = document.createElement("p");
    temperatureEl.textContent = "Temperature: " + data.main.temp + " °F";
    currentWeather.appendChild(temperatureEl);

    var humidityEl = document.createElement("p");
    humidityEl.textContent = "Humidity: " + data.main.humidity + "%";
    currentWeather.appendChild(humidityEl);

    var windEl = document.createElement("p");
    windEl.textContent = "Wind Speed: " + data.wind.speed + " mph";
    currentWeather.appendChild(windEl);


}
// to get UV index
var getUvIndex = (lat, lon) => {
    var api = `https://api.openweathermap.org/data/2.5/uvi?appid=${weatherApiKey}&lat=${lat}&lon=${lon}`;
    fetch(api)
        .then(response => response.json())
        .then(data => {
            var index = parseFloat(data.value);
            displayUVindex(index);
        })

        .catch(error => alert("Error fetching UV index"));

}

var displayUVindex = index => {
    var indexClass;
    if (index < 3) {
        indexClass = "bg-success";
    }
    else if (index < 6) {
        indexClass = "bg-warning";

    }
    else {
        indexClass = "bg-danger";

    }

    var UVindexEl = document.createElement("p");
    UVindexEl.innerHTML = `UV index: <span class=${indexClass} p-2 text-white rounded"> ${index}</span>`;
    currentWeather.appendChild(UVindexEl);

}


// get 5day forecast
var get5dayForecast = (lat, lon) => {
    var api = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${weatherApiKey}`;

    fetch(api)
        .then(response => response.json())
        .then(data => display5dayforecast(data))
        .catch(error => alert("Error fetching forecast for this city"));
};


var display5dayforecast = data => {
    forecastContainer.innerHTML = '<h4 class="d-block pt-4 pb-2">5-Day Morning Forecast <span id="time-forecast"></span></h4>';
    var cardsContainerEl = document.createElement("div");
    cardsContainerEl.setAttribute("class", "row");

    //first forecast date
    var firstForecast;
    var todayStartOfHour = moment(citySearchedData, "MMMM Do YYYY, h:mm a").startOf("hour").format("YYYY-MM-DD HH:mm:ss");
    var todayNow = moment(citySearchedData, "MMMM Do YYYY, h:mm a").format("YYYY-MM-DD") + " 06:00:00";
    if (todayStartOfHour > todayNow) {
        firstForecast = moment(citySearchedData, "MMMM Do YYYY, h:mm a").add(1, "d").format("YYYY-MM-DD") + " 12:00:00";
    } else {
        firstForecast = moment(citySearchedData, "MMMM Do YYYY, h:mm a").format("YYYY-MM-DD") + " 12:00:00";
    }
    var arrDays = data.list;
    console.log(arrDays);
    var startIndex;

    arrDays.forEach(day => {
        if (day.dt_txt === firstForecast) {
            startIndex = arrDays.indexOf(day);
            return;
        }
    });

    for (i = startIndex; i < arrDays.length; i+=8) {
        var dayForecastContainer = document.createElement("div");
        dayForecastContainer.setAttribute("class", "mx-auto");
        var cardEl = document.createElement("div");
        cardEl.setAttribute("class", "card bg-primary text-white");
        var cardBodyEl = document.createElement("div");
        cardBodyEl.setAttribute("class", "card-body");

        var date = moment(arrDays[i].dt_txt.split(" ")[0], "YYYY-MM-DD").format("MMMM Do YYYY");
        var dateEl = document.createElement("h4");
        dateEl.setAttribute("class", "card-title");
        dateEl.textContent = `${date}`;
        cardBodyEl.appendChild(dateEl);

        var iconId = arrDays[i].weather[0].icon;
        if (iconId[iconId.length - 1] === "n") {         
            iconId = iconId.slice(0, -1) + "d";         
        }
        var iconEl = document.createElement("i");
        iconEl.innerHTML = `<img src="https://openweathermap.org/img/wn/${iconId}.png"/>`;
        cardBodyEl.appendChild(iconEl);

        var tempEl = document.createElement("p");
        tempEl.setAttribute("class", "card-text");
        tempEl.textContent = `Temp: ${arrDays[i].main.temp} °F`;
        cardBodyEl.appendChild(tempEl);

        var humidityEl = document.createElement("p");
        humidityEl.setAttribute("class", "card-text");
        humidityEl.textContent = `Humidity: ${arrDays[i].main.humidity} %`;
        cardBodyEl.appendChild(humidityEl);

        cardEl.appendChild(cardBodyEl);
        dayForecastContainer.appendChild(cardEl);
        cardsContainerEl.appendChild(dayForecastContainer);
    };
    forecastContainer.appendChild(cardsContainerEl);
}


var searchHistory = () => {
    // clear previous search history
    citiesList.innerHTML = " ";

    cities.forEach(function (city) {
        var cityEl = document.createElement("li");
        cityEl.setAttribute("class", "list-group-item");
        cityEl.textContent = city;
        citiesList.appendChild(cityEl);
    });
};


var cityClickHandler = event => {
    var cityName = event.target.textContent;
    getCurrentWeather(cityName);
}

var clearSearchHistory = () => {
    cities = [];
    localStorage.setItem("citiesSearched", JSON.stringify(cities));
    searchHistory();
}

//addEventListener
userForm.addEventListener("submit", formSubmitHandler);
citiesList.addEventListener("click", cityClickHandler);
clearBtn.addEventListener("click", clearSearchHistory);

searchHistory();