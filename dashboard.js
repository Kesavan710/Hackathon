document.addEventListener('DOMContentLoaded', function() {
    const LOCATIONIQ_API_KEY = 'pk.ace5c9ce9975451c9ec861c0c0873d3a';
    const LOCATIONIQ_API_URL = 'https://us1.locationiq.com/v1';

    // DOM elements
    const calculateBtn = document.getElementById('calculate-btn');
    const resultDiv = document.getElementById('result');
    const distanceSpan = document.getElementById('distance');
    const emissionSpan = document.getElementById('emission');
    const comparisonText = document.getElementById('comparison-text');
    const ecoTipText = document.getElementById('eco-tip-text');
    const transportButtons = document.querySelectorAll('.transport-options button');
    const startInput = document.getElementById('start');
    const endInput = document.getElementById('end');
    
    // Create dropdown containers
    const startDropdown = document.createElement('div');
    startDropdown.id = 'start-dropdown';
    startDropdown.className = 'suggestions-dropdown hidden';
    startInput.parentNode.appendChild(startDropdown);
    
    const endDropdown = document.createElement('div');
    endDropdown.id = 'end-dropdown';
    endDropdown.className = 'suggestions-dropdown hidden';
    endInput.parentNode.appendChild(endDropdown);

    // Cache for API responses
    const locationCache = {};
    let debounceTimer;

    // Set initial active transport
    let currentTransport = 'car';

    // Transport click handlers
    transportButtons.forEach(button => {
        button.addEventListener('click', function() {
            transportButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentTransport = this.dataset.mode;
        });
    });

    // Emission factors (kg CO₂ per km)
    const emissionFactors = {
        car: 0.12,
        bus: 0.08,
        train: 0.04,
        airplane: 0.25,
        motorcycle: 0.09,
        bicycle: 0.00,
        walking: 0.00
    };

    // Eco tips
    const ecoTips = [
        "Consider taking the train instead of driving for shorter trips - it emits 70% less CO₂!",
        "A single tree can absorb about 21 kg of CO₂ per year. Plant one today!",
        "Carpooling with just one other person cuts your travel emissions in half.",
        "Electric vehicles produce about 50% less emissions over their lifetime compared to gas cars.",
        "Walking or cycling for short trips keeps you healthy and produces zero emissions!"
    ];

    // Autocomplete functionality
    startInput.addEventListener('input', () => handleInput(startInput, startDropdown));
    endInput.addEventListener('input', () => handleInput(endInput, endDropdown));
    
    // Close dropdowns when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!startInput.contains(e.target)) {
            startDropdown.classList.add('hidden');
        }
        if (!endInput.contains(e.target)) {
            endDropdown.classList.add('hidden');
        }
    });

    function handleInput(inputElement, dropdown) {
        const query = inputElement.value.trim();
        
        if (query.length < 2) {
            dropdown.classList.add('hidden');
            return;
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            try {
                // Check cache first
                if (locationCache[query]) {
                    showSuggestions(locationCache[query], dropdown);
                    return;
                }

                const response = await fetch(
                    `${LOCATIONIQ_API_URL}/autocomplete.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(query)}&limit=8`
                );
                const data = await response.json();
                
                // Cache results
                locationCache[query] = data;
                
                showSuggestions(data, dropdown);
                
            } catch (error) {
                console.error("Autocomplete error:", error);
                dropdown.classList.add('hidden');
            }
        }, 300);
    }

    function showSuggestions(suggestions, dropdown) {
        dropdown.innerHTML = '';
        
        if (!suggestions || suggestions.length === 0) {
            dropdown.classList.add('hidden');
            return;
        }
        
        suggestions.forEach(item => {
            const suggestion = document.createElement('div');
            suggestion.className = 'suggestion-item';
            suggestion.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <div>
                    <div class="name">${item.display_name.split(',')[0]}</div>
                    <div class="address">${item.display_name.split(',').slice(1, 3).join(',').trim()}</div>
                </div>
            `;
            
            suggestion.addEventListener('click', () => {
                const input = dropdown.id === 'start-dropdown' ? startInput : endInput;
                input.value = item.display_name;
                dropdown.classList.add('hidden');
            });
            
            dropdown.appendChild(suggestion);
        });
        
        dropdown.classList.remove('hidden');
        positionDropdown(dropdown);
    }

    function positionDropdown(dropdown) {
        const input = dropdown.id === 'start-dropdown' ? startInput : endInput;
        const inputRect = input.getBoundingClientRect();
        dropdown.style.top = `${inputRect.bottom + window.scrollY}px`;
        dropdown.style.left = `${inputRect.left + window.scrollX}px`;
        dropdown.style.width = `${inputRect.width}px`;
    }

    async function getCoordinates(location) {
        const response = await fetch(
           ` ${LOCATIONIQ_API_URL}/search.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(location)}&format=json&limit=1`
        );
        
        if (!response.ok) {
            throw new Error(`Location service unavailable (${response.status})`);
        }
        
        const data = await response.json();
        
        if (!data[0]?.lat || !data[0]?.lon) {
            throw new Error(`"${location}" not found. Try "City, Country" format.`);
        }
        
        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
        };
    }
});
