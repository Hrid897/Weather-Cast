// Configuration
const CONFIG = {
    API_KEY: '1c8fe6d5661bbe92efe24c2af7df1547',
    BASE_URL: 'https://api.openweathermap.org/data/2.5',
    GEO_URL: 'https://api.openweathermap.org/geo/1.0',
    AUTO_REFRESH_INTERVAL: 300000, // 5 minutes
    SEARCH_DEBOUNCE: 500,
    DEFAULT_LOCATION: {
        lat: 51.5074,
        lon: -0.1278,
        name: 'London, UK'
    }
};

// State management
let state = {
    map: null,
    marker: null,
    weatherCanvas: null,
    canvasContext: null,
    searchTimeout: null,
    currentLocation: null,
    isNight: false,
    hourlyOffset: 0,
    searchResults: [],
    selectedResultIndex: -1,
    currentWeather: null,
    animationFrame: null,
    particles: []
};

// DOM Elements cache
const elements = {
    searchInput: document.getElementById('searchInput'),
    locationBtn: document.getElementById('locationBtn'),
    clearSearch: document.getElementById('clearSearch'),
    searchPreview: document.getElementById('searchPreview'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    errorMessage: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn'),
    weatherContent: document.getElementById('weatherContent'),
    currentTime: document.getElementById('currentTime'),
    currentDate: document.getElementById('currentDate'),
    cityName: document.getElementById('cityName'),
    countryName: document.getElementById('countryName'),
    coordinates: document.getElementById('coordinates'),
    lastUpdated: document.getElementById('lastUpdated'),
    currentTemp: document.getElementById('currentTemp'),
    weatherIcon: document.getElementById('weatherIcon'),
    weatherDesc: document.getElementById('weatherDesc'),
    weatherCondition: document.getElementById('weatherCondition'),
    feelsLike: document.getElementById('feelsLike'),
    tempMax: document.getElementById('tempMax'),
    tempMin: document.getElementById('tempMin'),
    humidity: document.getElementById('humidity'),
    humidityBar: document.getElementById('humidityBar'),
    windSpeed: document.getElementById('windSpeed'),
    windDirectionIcon: document.getElementById('windDirectionIcon'),
    windDirection: document.getElementById('windDirection'),
    windmill: document.getElementById('windmill'),
    windmillBlades: document.getElementById('windmillBlades'),
    pressure: document.getElementById('pressure'),
    visibility: document.getElementById('visibility'),
    visibilityQuality: document.getElementById('visibilityQuality'),
    uvIndex: document.getElementById('uvIndex'),
    uvLevel: document.getElementById('uvLevel'),
    sunrise: document.getElementById('sunrise'),
    sunset: document.getElementById('sunset'),
    airQualityValue: document.getElementById('airQualityValue'),
    airQualityLabel: document.getElementById('airQualityLabel'),
    cloudCover: document.getElementById('cloudCover'),
    cloudBar: document.getElementById('cloudBar'),
    hourlyContainer: document.getElementById('hourlyContainer'),
    dailyContainer: document.getElementById('dailyContainer'),
    map: document.getElementById('map'),
    mapLat: document.getElementById('mapLat'),
    mapLon: document.getElementById('mapLon'),
    zoomIn: document.getElementById('zoomIn'),
    zoomOut: document.getElementById('zoomOut'),
    prevHour: document.querySelector('.prev-hour'),
    nextHour: document.querySelector('.next-hour'),
    refreshTimer: document.getElementById('refreshTimer'),
    alertsContainer: document.getElementById('alertsContainer'),
    alertsContent: document.getElementById('alertsContent'),
    weatherBg: document.getElementById('weatherBg'),
    weatherCanvas: document.getElementById('weatherCanvas'),
    weatherEffects: document.getElementById('weatherEffects'),
    tempCurveCanvas: document.getElementById('tempCurveCanvas'),
    hourlyTempRange: document.getElementById('hourlyTempRange'),
    hourlyRainProb: document.getElementById('hourlyRainProb'),
    hourlyAvgWind: document.getElementById('hourlyAvgWind'),
    hourlyAvgHumidity: document.getElementById('hourlyAvgHumidity'),
    summaryContent: document.getElementById('summaryContent')
};

// Particle class for weather effects
class Particle {
    constructor(canvas, type = 'rain') {
        this.canvas = canvas;
        this.type = type;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height - this.canvas.height;
        
        switch(this.type) {
            case 'rain':
                this.speed = Math.random() * 5 + 10;
                this.length = Math.random() * 15 + 10;
                this.opacity = Math.random() * 0.3 + 0.3;
                break;
            case 'snow':
                this.speed = Math.random() * 1 + 0.5;
                this.size = Math.random() * 3 + 2;
                this.opacity = Math.random() * 0.6 + 0.4;
                this.drift = Math.random() * 0.5 - 0.25;
                break;
            case 'stars':
                this.speed = Math.random() * 0.1 + 0.05;
                this.size = Math.random() * 2 + 0.5;
                this.opacity = Math.random() * 0.5 + 0.3;
                this.twinkle = Math.random() * Math.PI * 2;
                break;
            case 'clouds':
                this.speed = Math.random() * 0.3 + 0.1;
                this.size = Math.random() * 60 + 30;
                this.opacity = Math.random() * 0.2 + 0.1;
                break;
        }
    }

    update() {
        this.y += this.speed;
        
        if (this.type === 'snow') {
            this.x += this.drift;
        } else if (this.type === 'stars') {
            this.twinkle += 0.05;
        } else if (this.type === 'clouds') {
            this.x += this.speed;
        }
        
        if (this.y > this.canvas.height || (this.type === 'clouds' && this.x > this.canvas.width + 100)) {
            this.reset();
        }
    }

    draw(ctx) {
        ctx.save();
        
        switch(this.type) {
            case 'rain':
                ctx.strokeStyle = `rgba(174, 194, 224, ${this.opacity})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x, this.y + this.length);
                ctx.stroke();
                break;
                
            case 'snow':
                ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'stars':
                const twinkleOpacity = this.opacity * (0.5 + 0.5 * Math.sin(this.twinkle));
                ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'clouds':
                ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.arc(this.x + this.size * 0.5, this.y, this.size * 0.7, 0, Math.PI * 2);
                ctx.arc(this.x + this.size, this.y, this.size * 0.8, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
}

// Initialize the app
async function init() {
    // Initialize canvas
    initCanvas();
    
    // Initialize time display
    updateTime();
    setInterval(updateTime, 1000);
    
    // Setup event listeners
    setupEventListeners();
    
    // Try to get user's location
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                state.currentLocation = { lat: latitude, lon: longitude };
                getWeatherByCoords(latitude, longitude);
            },
            (error) => {
                console.log('Geolocation failed:', error);
                getWeatherByCoords(CONFIG.DEFAULT_LOCATION.lat, CONFIG.DEFAULT_LOCATION.lon);
            },
            { 
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 60000
            }
        );
    } else {
        getWeatherByCoords(CONFIG.DEFAULT_LOCATION.lat, CONFIG.DEFAULT_LOCATION.lon);
    }
}

// Initialize canvas for weather effects
function initCanvas() {
    const canvas = elements.weatherCanvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    state.canvasContext = canvas.getContext('2d');
    
    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Redraw temperature curve if hourly data exists
        if (state.hourlyData) {
            drawTemperatureCurve(state.hourlyData);
        }
    });
}

// Update dynamic background based on weather and time
function updateDynamicBackground(weatherData) {
    const { weather, sys, dt } = weatherData;
    const weatherMain = weather[0].main.toLowerCase();
    const weatherDesc = weather[0].description.toLowerCase();
    
    // Determine if it's night
    state.isNight = isNightTime(sys.sunrise, sys.sunset, dt);
    
    // Stop any existing animation
    if (state.animationFrame) {
        cancelAnimationFrame(state.animationFrame);
    }
    
    // Clear existing particles
    state.particles = [];
    
    // Set background based on conditions
    let backgroundClass = '';
    let particleType = null;
    let particleCount = 0;
    
    if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) {
        backgroundClass = state.isNight ? 'bg-rainy-night' : 'bg-rainy-day';
        particleType = 'rain';
        particleCount = weatherMain.includes('thunderstorm') ? 200 : 150;
    } else if (weatherMain.includes('snow')) {
        backgroundClass = state.isNight ? 'bg-snowy-night' : 'bg-snowy-day';
        particleType = 'snow';
        particleCount = 100;
    } else if (weatherMain.includes('cloud')) {
        backgroundClass = state.isNight ? 'bg-cloudy-night' : 'bg-cloudy-day';
        particleType = 'clouds';
        particleCount = 5;
    } else if (weatherMain.includes('clear')) {
        backgroundClass = state.isNight ? 'bg-clear-night' : 'bg-clear-day';
        particleType = state.isNight ? 'stars' : null;
        particleCount = state.isNight ? 100 : 0;
    } else if (weatherMain.includes('mist') || weatherMain.includes('fog') || weatherMain.includes('haze')) {
        backgroundClass = state.isNight ? 'bg-foggy-night' : 'bg-foggy-day';
        particleType = 'clouds';
        particleCount = 10;
    } else {
        backgroundClass = state.isNight ? 'bg-clear-night' : 'bg-clear-day';
        particleType = state.isNight ? 'stars' : null;
        particleCount = state.isNight ? 100 : 0;
    }
    
    // Remove all background classes
    const bgElement = elements.weatherBg;
    bgElement.className = 'weather-background';
    
    // Add new background class
    bgElement.classList.add(backgroundClass);
    
    // Create particles
    if (particleType && particleCount > 0) {
        for (let i = 0; i < particleCount; i++) {
            state.particles.push(new Particle(elements.weatherCanvas, particleType));
        }
        animateWeather();
    }
    
    // Add thunderstorm effect
    if (weatherMain.includes('thunderstorm')) {
        createLightningEffect();
    }
}

// Animate weather particles
function animateWeather() {
    const ctx = state.canvasContext;
    ctx.clearRect(0, 0, elements.weatherCanvas.width, elements.weatherCanvas.height);
    
    state.particles.forEach(particle => {
        particle.update();
        particle.draw(ctx);
    });
    
    state.animationFrame = requestAnimationFrame(animateWeather);
}

// Create lightning effect for thunderstorms
function createLightningEffect() {
    setInterval(() => {
        if (Math.random() < 0.1) { // 10% chance every interval
            elements.weatherBg.style.filter = 'brightness(1.5)';
            setTimeout(() => {
                elements.weatherBg.style.filter = 'brightness(1)';
            }, 100);
        }
    }, 2000);
}

// Update time display
function updateTime() {
    const now = new Date();
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    elements.currentTime.textContent = now.toLocaleTimeString('en-US', timeOptions);
    elements.currentDate.textContent = now.toLocaleDateString('en-US', dateOptions);
}

// Setup event listeners
function setupEventListeners() {
    // Search input with debounce
    elements.searchInput.addEventListener('input', debounce(handleSearchInput, CONFIG.SEARCH_DEBOUNCE));
    
    // Search input focus/blur
    elements.searchInput.addEventListener('focus', () => {
        if (state.searchResults.length > 0) {
            elements.searchPreview.classList.add('active');
        }
    });
    
    elements.searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            elements.searchPreview.classList.remove('active');
        }, 200);
    });
    
    // Clear search button
    elements.clearSearch.addEventListener('click', () => {
        elements.searchInput.value = '';
        elements.searchInput.focus();
        elements.clearSearch.style.display = 'none';
        elements.searchPreview.classList.remove('active');
    });
    
    // Search input key events
    elements.searchInput.addEventListener('keydown', handleSearchKeydown);
    
    // Location button
    elements.locationBtn.addEventListener('click', getUserLocation);
    
    // Retry button
    elements.retryBtn.addEventListener('click', () => {
        if (state.currentLocation) {
            getWeatherByCoords(state.currentLocation.lat, state.currentLocation.lon);
        } else {
            getWeatherByCoords(CONFIG.DEFAULT_LOCATION.lat, CONFIG.DEFAULT_LOCATION.lon);
        }
    });
    
    // Forecast navigation
    if (elements.prevHour) {
        elements.prevHour.addEventListener('click', () => navigateHourly(-1));
    }
    if (elements.nextHour) {
        elements.nextHour.addEventListener('click', () => navigateHourly(1));
    }
    
    // Map zoom controls
    if (elements.zoomIn) {
        elements.zoomIn.addEventListener('click', () => {
            if (state.map) state.map.zoomIn();
        });
    }
    if (elements.zoomOut) {
        elements.zoomOut.addEventListener('click', () => {
            if (state.map) state.map.zoomOut();
        });
    }
}



// Debounce function
function debounce(func, wait) {
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(state.searchTimeout);
            func(...args);
        };
        clearTimeout(state.searchTimeout);
        state.searchTimeout = setTimeout(later, wait);
    };
}

// Handle search input
async function handleSearchInput(e) {
    const query = e.target.value.trim();
    
    if (query.length === 0) {
        elements.clearSearch.style.display = 'none';
        elements.searchPreview.innerHTML = '';
        elements.searchPreview.classList.remove('active');
        state.searchResults = [];
        return;
    }
    
    elements.clearSearch.style.display = 'block';
    
    if (query.length < 2) return;
    
    try {
        const response = await fetch(
            `${CONFIG.GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${CONFIG.API_KEY}`
        );
        
        if (!response.ok) throw new Error('Search failed');
        
        const results = await response.json();
        state.searchResults = results;
        displaySearchResults(results);
        
    } catch (error) {
        console.error('Search error:', error);
        elements.searchPreview.innerHTML = '<div class="search-error">Search failed. Try again.</div>';
    }
}

// Display search results
function displaySearchResults(results) {
    if (results.length === 0) {
        elements.searchPreview.innerHTML = '<div class="search-no-results">No locations found</div>';
        elements.searchPreview.classList.add('active');
        return;
    }
    
    elements.searchPreview.innerHTML = results.map((result, index) => `
        <div class="search-result-item ${index === state.selectedResultIndex ? 'selected' : ''}" 
             data-index="${index}"
             onclick="selectSearchResult(${index})">
            <div class="result-location">
                <i class="fas fa-map-marker-alt"></i>
                <span class="result-name">${result.name}</span>
                ${result.state ? `<span class="result-state">, ${result.state}</span>` : ''}
                <span class="result-country">, ${result.country}</span>
            </div>
            <div class="result-coords">${result.lat.toFixed(2)}°, ${result.lon.toFixed(2)}°</div>
        </div>
    `).join('');
    
    elements.searchPreview.classList.add('active');
}

// Handle search keydown
function handleSearchKeydown(e) {
    if (state.searchResults.length === 0) return;
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        state.selectedResultIndex = Math.min(
            state.selectedResultIndex + 1,
            state.searchResults.length - 1
        );
        displaySearchResults(state.searchResults);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        state.selectedResultIndex = Math.max(state.selectedResultIndex - 1, -1);
        displaySearchResults(state.searchResults);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (state.selectedResultIndex >= 0) {
            selectSearchResult(state.selectedResultIndex);
        }
    } else if (e.key === 'Escape') {
        elements.searchPreview.classList.remove('active');
        elements.searchInput.blur();
    }
}

// Select search result
function selectSearchResult(index) {
    const result = state.searchResults[index];
    if (result) {
        elements.searchInput.value = `${result.name}${result.state ? ', ' + result.state : ''}, ${result.country}`;
        elements.searchPreview.classList.remove('active');
        state.selectedResultIndex = -1;
        getWeatherByCoords(result.lat, result.lon);
    }
}

// Get user location
function getUserLocation() {
    elements.locationBtn.disabled = true;
    elements.locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span class="btn-text">Locating...</span>';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                state.currentLocation = { lat: latitude, lon: longitude };
                getWeatherByCoords(latitude, longitude);
                
                elements.locationBtn.disabled = false;
                elements.locationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i><span class="btn-text">Locate Me</span>';
            },
            (error) => {
                console.error('Location error:', error);
                elements.locationBtn.disabled = false;
                elements.locationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i><span class="btn-text">Locate Me</span>';
                showError('Unable to get your location');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
    showLoading();
    
    try {
        // Fetch current weather
        const weatherResponse = await fetch(
            `${CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.API_KEY}`
        );
        
        if (!weatherResponse.ok) throw new Error('Weather fetch failed');
        const weatherData = await weatherResponse.json();
        
        // Fetch forecast
        const forecastResponse = await fetch(
            `${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.API_KEY}`
        );
        
        if (!forecastResponse.ok) throw new Error('Forecast fetch failed');
        const forecastData = await forecastResponse.json();
        
        // Fetch air quality
        const airQualityResponse = await fetch(
            `${CONFIG.BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`
        );
        let airQualityData = null;
        if (airQualityResponse.ok) {
            airQualityData = await airQualityResponse.json();
        }
        
        // Store current weather
        state.currentWeather = weatherData;
        
        // Display all data
        displayWeatherData(weatherData, forecastData, airQualityData);
        updateDynamicBackground(weatherData);
        updateWindmill(weatherData.wind.speed);
        
        // Setup auto-refresh
        setupAutoRefresh(lat, lon);
        startRefreshTimer();
        
        hideLoading();
        elements.weatherContent.style.display = 'block';
        
    } catch (error) {
        console.error('Weather error:', error);
        showError('Unable to fetch weather data. Please try again.');
    }
}

// Display weather data
function displayWeatherData(weatherData, forecastData, airQualityData) {
    const { main, weather, wind, clouds, sys, name, coord, visibility, dt } = weatherData;
    
    // Location info
    const cityText = name || `${coord.lat.toFixed(2)}°, ${coord.lon.toFixed(2)}°`;
    elements.cityName.querySelector('span').textContent = cityText;
    elements.countryName.textContent = sys.country || '--';
    elements.coordinates.textContent = `${coord.lat.toFixed(4)}°, ${coord.lon.toFixed(4)}°`;
    elements.lastUpdated.textContent = `Updated: ${formatTime(new Date(dt * 1000))}`;
    
    // Current weather
    elements.currentTemp.textContent = Math.round(main.temp);
    elements.feelsLike.textContent = Math.round(main.feels_like);
    elements.tempMax.textContent = Math.round(main.temp_max);
    elements.tempMin.textContent = Math.round(main.temp_min);
    
    // Weather icon and description
    const iconCode = weather[0].icon;
    elements.weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    elements.weatherDesc.textContent = weather[0].description;
    elements.weatherCondition.textContent = weather[0].main;
    
    // Weather details
    elements.humidity.textContent = `${main.humidity}%`;
    elements.humidityBar.style.width = `${main.humidity}%`;
    
    elements.windSpeed.textContent = `${Math.round(wind.speed * 3.6)} km/h`;
    elements.windDirection.textContent = getWindDirection(wind.deg);
    elements.windDirectionIcon.style.transform = `rotate(${wind.deg}deg)`;
    
    elements.pressure.textContent = `${main.pressure} hPa`;
    
    const visibilityKm = (visibility / 1000).toFixed(1);
    elements.visibility.textContent = `${visibilityKm} km`;
    elements.visibilityQuality.textContent = getVisibilityQuality(visibility);
    
    // Cloud cover
    elements.cloudCover.textContent = `${clouds.all}%`;
    elements.cloudBar.style.width = `${clouds.all}%`;
    
    // Sunrise/Sunset
    elements.sunrise.textContent = formatTime(new Date(sys.sunrise * 1000));
    elements.sunset.textContent = formatTime(new Date(sys.sunset * 1000));
    
    // UV Index (estimated based on time and cloud cover)
    const uvIndex = estimateUVIndex(sys.sunrise, sys.sunset, clouds.all, dt);
    elements.uvIndex.textContent = uvIndex;
    elements.uvLevel.textContent = getUVLevel(uvIndex);
    
    // Air Quality
    if (airQualityData && airQualityData.list && airQualityData.list.length > 0) {
        const aqi = airQualityData.list[0].main.aqi;
        elements.airQualityValue.textContent = aqi;
        const aqiInfo = getAirQualityInfo(aqi);
        elements.airQualityLabel.textContent = aqiInfo.label;
        elements.airQualityLabel.style.color = aqiInfo.color;
    }
    
    // Update map
    updateMap(coord.lat, coord.lon, cityText);
    elements.mapLat.textContent = coord.lat.toFixed(4);
    elements.mapLon.textContent = coord.lon.toFixed(4);
    
    // Display forecast
    displayHourlyForecast(forecastData.list);
    displayDailyForecast(forecastData.list);
}

// Update windmill animation based on wind speed
function updateWindmill(windSpeed) {
    const speedKmh = windSpeed * 3.6; // Convert m/s to km/h
    let animationDuration;
    
    if (speedKmh < 5) {
        animationDuration = 8; // Slow
    } else if (speedKmh < 15) {
        animationDuration = 4; // Medium
    } else if (speedKmh < 30) {
        animationDuration = 2; // Fast
    } else {
        animationDuration = 1; // Very fast
    }
    
    elements.windmillBlades.style.animationDuration = `${animationDuration}s`;
    elements.windmillBlades.style.animationPlayState = speedKmh > 1 ? 'running' : 'paused';
}

// Display hourly forecast
function displayHourlyForecast(hourlyData) {
    const hours = hourlyData.slice(0, 24); // Next 24 hours (3-hour intervals = 8 items)
    state.hourlyData = hours; // Store for resize events
    
    elements.hourlyContainer.innerHTML = hours.map(hour => {
        const date = new Date(hour.dt * 1000);
        const temp = Math.round(hour.main.temp);
        const icon = hour.weather[0].icon;
        
        return `
            <div class="hourly-item">
                <div class="hourly-time">${formatHour(date)}</div>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${hour.weather[0].description}" class="hourly-icon" />
                <div class="hourly-temp">${temp}°</div>
                <div class="hourly-details">
                    <div><i class="fas fa-tint"></i> ${hour.main.humidity}%</div>
                    <div><i class="fas fa-wind"></i> ${Math.round(hour.wind.speed * 3.6)} km/h</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Calculate insights
    const temps = hours.map(h => h.main.temp);
    const minTemp = Math.round(Math.min(...temps));
    const maxTemp = Math.round(Math.max(...temps));
    
    const avgWind = hours.reduce((sum, h) => sum + h.wind.speed, 0) / hours.length;
    const avgHumidity = hours.reduce((sum, h) => sum + h.main.humidity, 0) / hours.length;
    
    // Calculate rain probability (if pop exists)
    const rainProbs = hours.map(h => (h.pop || 0) * 100);
    const maxRainProb = Math.max(...rainProbs);
    
    // Update insights
    elements.hourlyTempRange.textContent = `${minTemp}° to ${maxTemp}°`;
    elements.hourlyRainProb.textContent = `${Math.round(maxRainProb)}%`;
    elements.hourlyAvgWind.textContent = `${Math.round(avgWind * 3.6)} km/h`;
    elements.hourlyAvgHumidity.textContent = `${Math.round(avgHumidity)}%`;
    
    // Generate weather summary
    generateWeatherSummary(hours);
    
    // Draw temperature curve
    drawTemperatureCurve(hours);
}

// Generate weather conditions summary
function generateWeatherSummary(hours) {
    const conditions = {};
    const warnings = [];
    
    // Count weather conditions
    hours.forEach(hour => {
        const condition = hour.weather[0].main;
        conditions[condition] = (conditions[condition] || 0) + 1;
    });
    
    // Get dominant condition
    const dominantCondition = Object.keys(conditions).reduce((a, b) => 
        conditions[a] > conditions[b] ? a : b
    );
    
    // Check for warnings
    const maxWind = Math.max(...hours.map(h => h.wind.speed * 3.6));
    const maxRain = Math.max(...hours.map(h => (h.pop || 0) * 100));
    
    if (maxWind > 40) {
        warnings.push('<span class="condition-tag"><i class="fas fa-wind"></i> Strong Winds Expected</span>');
    }
    
    if (maxRain > 70) {
        warnings.push('<span class="condition-tag"><i class="fas fa-cloud-rain"></i> High Rain Probability</span>');
    }
    
    const temps = hours.map(h => h.main.temp);
    const tempDiff = Math.max(...temps) - Math.min(...temps);
    if (tempDiff > 10) {
        warnings.push('<span class="condition-tag"><i class="fas fa-temperature-high"></i> Large Temperature Variation</span>');
    }
    
    // Build summary
    let summaryHTML = '';
    
    if (warnings.length > 0) {
        summaryHTML = warnings.join('');
    } else {
        const conditionIcons = {
            'Clear': 'fa-sun',
            'Clouds': 'fa-cloud',
            'Rain': 'fa-cloud-rain',
            'Snow': 'fa-snowflake',
            'Thunderstorm': 'fa-bolt',
            'Drizzle': 'fa-cloud-rain',
            'Mist': 'fa-smog',
            'Fog': 'fa-smog'
        };
        
        const icon = conditionIcons[dominantCondition] || 'fa-cloud';
        summaryHTML = `<span class="condition-tag"><i class="fas ${icon}"></i> Mostly ${dominantCondition}</span>`;
        summaryHTML += '<div class="summary-text" style="margin-top: 12px;">Conditions look stable for the next 24 hours. Perfect for outdoor activities!</div>';
    }
    
    elements.summaryContent.innerHTML = summaryHTML;
}

// Draw temperature curve
function drawTemperatureCurve(hourlyData) {
    const canvas = elements.tempCurveCanvas;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const padding = 40;
    
    // Extract temperatures
    const temps = hourlyData.map(h => h.main.temp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const tempRange = maxTemp - minTemp || 1;
    
    // Calculate points
    const points = temps.map((temp, i) => {
        const x = padding + (i * (width - 2 * padding)) / (temps.length - 1);
        const y = height - padding - ((temp - minTemp) / tempRange) * (height - 2 * padding);
        return { x, y, temp };
    });
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get colors (using consistent dark theme colors)
    const lineColor = 'rgba(96, 165, 250, 1)';
    const fillColor = 'rgba(96, 165, 250, 0.2)';
    const textColor = 'rgba(241, 245, 249, 0.8)';
    
    // Draw gradient fill
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding);
    points.forEach((point, i) => {
        if (i === 0) {
            ctx.lineTo(point.x, point.y);
        } else {
            // Smooth curve
            const prevPoint = points[i - 1];
            const cpX = (prevPoint.x + point.x) / 2;
            ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cpX, (prevPoint.y + point.y) / 2);
            ctx.quadraticCurveTo(cpX, (prevPoint.y + point.y) / 2, point.x, point.y);
        }
    });
    ctx.lineTo(points[points.length - 1].x, height - padding);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, fillColor);
    gradient.addColorStop(1, 'rgba(96, 165, 250, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((point, i) => {
        if (i === 0) return;
        const prevPoint = points[i - 1];
        const cpX = (prevPoint.x + point.x) / 2;
        ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cpX, (prevPoint.y + point.y) / 2);
        ctx.quadraticCurveTo(cpX, (prevPoint.y + point.y) / 2, point.x, point.y);
    });
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw points and labels
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = textColor;
    
    points.forEach((point, i) => {
        // Draw point
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = lineColor;
        ctx.fill();
        ctx.strokeStyle = 'rgba(15, 23, 42, 1)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw temperature label
        if (i % 2 === 0 || temps.length <= 12) {
            ctx.fillStyle = textColor;
            ctx.fillText(`${Math.round(point.temp)}°`, point.x, point.y - 15);
        }
    });
}

// Display daily forecast
function displayDailyForecast(hourlyData) {
    // Group by day
    const dailyMap = new Map();
    
    hourlyData.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toDateString();
        
        if (!dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, {
                date: date,
                temps: [],
                weather: item.weather[0],
                humidity: [],
                wind: []
            });
        }
        
        dailyMap.get(dateKey).temps.push(item.main.temp);
        dailyMap.get(dateKey).humidity.push(item.main.humidity);
        dailyMap.get(dateKey).wind.push(item.wind.speed);
    });
    
    // Convert to array and take first 7 days
    const dailyArray = Array.from(dailyMap.values()).slice(0, 7);
    
    elements.dailyContainer.innerHTML = dailyArray.map(day => {
        const tempMax = Math.round(Math.max(...day.temps));
        const tempMin = Math.round(Math.min(...day.temps));
        const avgHumidity = Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length);
        const avgWind = Math.round((day.wind.reduce((a, b) => a + b, 0) / day.wind.length) * 3.6);
        
        return `
            <div class="daily-item">
                <div class="daily-date">
                    <div class="daily-day">${formatDayName(day.date)}</div>
                    <div class="daily-date-text">${formatDateShort(day.date)}</div>
                </div>
                <div class="daily-weather">
                    <img src="https://openweathermap.org/img/wn/${day.weather.icon}@2x.png" alt="${day.weather.description}" class="daily-icon" />
                    <span class="daily-desc">${day.weather.description}</span>
                </div>
                <div class="daily-temp">
                    <span class="temp-max"><i class="fas fa-thermometer-full"></i>${tempMax}°</span>
                    <span class="temp-min"><i class="fas fa-thermometer-empty"></i>${tempMin}°</span>
                </div>
                <div class="daily-details">
                    <span><i class="fas fa-tint"></i> ${avgHumidity}%</span>
                    <span><i class="fas fa-wind"></i> ${avgWind} km/h</span>
                </div>
            </div>
        `;
    }).join('');
}

// Navigate hourly forecast
function navigateHourly(direction) {
    state.hourlyOffset += direction;
    const container = elements.hourlyContainer;
    const itemWidth = container.firstElementChild?.offsetWidth || 120;
    const scrollAmount = itemWidth * 2 * direction;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
}

// Update or initialize map
function updateMap(lat, lon, cityName) {
    // Remove existing map if it exists
    if (state.map) {
        state.map.remove();
        state.map = null;
    }
    
    // Initialize new map
    state.map = L.map('map').setView([lat, lon], 10);
    
    // Add tile layer - using light/white style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        subdomains: 'abcd'
    }).addTo(state.map);
    
    // Add marker with custom icon
    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: '<i class="fas fa-map-marker-alt"></i>',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });
    
    state.marker = L.marker([lat, lon], { icon: customIcon })
        .addTo(state.map)
        .bindPopup(`<b>${cityName}</b><br>Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`)
        .openPopup();
    
    // Update coordinate display
    elements.mapLat.textContent = lat.toFixed(4);
    elements.mapLon.textContent = lon.toFixed(4);
}

// Setup auto-refresh
function setupAutoRefresh(lat, lon) {
    if (state.refreshInterval) {
        clearInterval(state.refreshInterval);
    }
    
    state.refreshInterval = setInterval(() => {
        getWeatherByCoords(lat, lon);
    }, CONFIG.AUTO_REFRESH_INTERVAL);
}

// Start refresh timer
function startRefreshTimer() {
    let seconds = CONFIG.AUTO_REFRESH_INTERVAL / 1000;
    
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
    }
    
    state.timerInterval = setInterval(() => {
        seconds--;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        elements.refreshTimer.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        if (seconds <= 0) {
            seconds = CONFIG.AUTO_REFRESH_INTERVAL / 1000;
        }
    }, 1000);
}

// Helper functions
function isNightTime(sunrise, sunset, currentTime) {
    return currentTime < sunrise || currentTime > sunset;
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

function formatHour(date) {
    const hour = date.getHours();
    return hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`;
}

function formatDateShort(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatDayName(date) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
}

function getWindDirection(deg) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(deg / 22.5) % 16;
    return directions[index];
}

function getVisibilityQuality(visibility) {
    if (visibility >= 10000) return 'Excellent';
    if (visibility >= 5000) return 'Good';
    if (visibility >= 2000) return 'Moderate';
    if (visibility >= 1000) return 'Poor';
    return 'Very Poor';
}

function estimateUVIndex(sunrise, sunset, cloudCover, currentTime) {
    // Simple UV estimation
    if (currentTime < sunrise || currentTime > sunset) return 0;
    
    const dayProgress = (currentTime - sunrise) / (sunset - sunrise);
    const maxUV = 11;
    const sineProgress = Math.sin(dayProgress * Math.PI);
    const baseUV = Math.round(maxUV * sineProgress);
    const cloudFactor = 1 - (cloudCover / 200); // Clouds reduce UV
    
    return Math.max(0, Math.round(baseUV * cloudFactor));
}

function getUVLevel(uv) {
    if (uv <= 2) return 'Low';
    if (uv <= 5) return 'Moderate';
    if (uv <= 7) return 'High';
    if (uv <= 10) return 'Very High';
    return 'Extreme';
}

function getAirQualityInfo(aqi) {
    const qualities = [
        { label: 'Good', color: '#00e400' },
        { label: 'Fair', color: '#ffff00' },
        { label: 'Moderate', color: '#ff7e00' },
        { label: 'Poor', color: '#ff0000' },
        { label: 'Very Poor', color: '#8f3f97' }
    ];
    return qualities[aqi - 1] || { label: '--', color: '#999' };
}

function showLoading() {
    elements.loadingState.style.display = 'block';
    elements.errorState.style.display = 'none';
    elements.weatherContent.style.display = 'none';
}

function hideLoading() {
    elements.loadingState.style.display = 'none';
}

function showError(message) {
    elements.loadingState.style.display = 'none';
    elements.weatherContent.style.display = 'none';
    elements.errorState.style.display = 'block';
    elements.errorMessage.textContent = message;
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);