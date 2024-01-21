"use strict";

(async () => {

    //  General definitions and functions related to the whole project:

    // A function to pause and resume the video that is in the background
    function pauseResumeVideo() {
        const video = document.getElementById("video-background");
        const pauseResumeButton = document.getElementById("pauseResumeVideo");
        if (video.paused) {
            video.play();
            pauseResumeButton.innerHTML = "Pause Video";
        }
        else {
            video.pause();
            pauseResumeButton.innerHTML = "Resume Video";
        };
    };
    const pauseResumeButton = document.getElementById("pauseResumeVideo");
    pauseResumeButton.addEventListener("click", pauseResumeVideo);

    // A function to get data from the url
    async function getJson(url) {
        const response = await fetch(url);
        const json = await response.json();
        return json;
    };

    // Save the selected coins to local storage
    function saveChosenCoinsToLocalStorage() {
        // Convert Map to array to save it in localStorage
        const chosenCoinsArray = Array.from(chosenCoins);
        localStorage.setItem('chosenCoins', JSON.stringify(chosenCoinsArray));
    };

    // Load from storage the selected coins
    function loadChosenCoinsFromLocalStorage() {
        const chosenCoinsArrayStorage = JSON.parse(localStorage.getItem('chosenCoins')) || [];

        // Iterate over the loaded coins and populate the chosenCoins Map
        for (const [coinId, coinName] of chosenCoinsArrayStorage) {
            chosenCoins.set(coinId, coinName);

            // Update the corresponding checkbox in the DOM
            const checkBoxToCheck = document.getElementById(coinId);
            if (checkBoxToCheck) {
                checkBoxToCheck.checked = true;
            }
        }
    };

    const clearChosenCoins = document.getElementById("clearChosenCoins");
    clearChosenCoins.addEventListener("click", () => {
        // Clear the chosenCoins Map
        chosenCoins.clear();

        // Uncheck the corresponding checkboxes in the DOM
        const checkboxes = document.querySelectorAll(".checkBox"); 
        checkboxes.forEach((checkbox) => {
            checkbox.checked = false;
        });

        // Save the updated state of chosenCoins to LocalStorage
        saveChosenCoinsToLocalStorage();
    });

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//

    // Home tab and home functions:

    const coinsJson = await getJson("assets/json/coins.json");
    const coins = coinsJson.data.coins;

    function displayCoins(coins) {
        const container = document.getElementById("container");
        let content = "";

        // A loop for the coins length to display them
        for (let i = 0; i < coins.length; i++) {
            const div = `<div class="card" id="coin${i}">
                <label class="switch">
                <input type="checkbox" class="checkBox" id="${i}">
                <span class="slider"></span>
                </label>
                    <img src="${coins[i].iconUrl}">
                    <div id="coinNameCard">${coins[i].name}</div>
                    <div id="coinSymbolCard">${coins[i].symbol}</div>
                    <hr>
                    <button type="button" id="btn${i}" data-coin-id="${i}" class="btn btn-dark" type="button" data-bs-toggle="collapse" data-bs-target="#div${i}" aria-expanded="false" aria-controls="#div${i}">More Info</button>
                    <div class="spinner">
                        <div class="spinner-border text-secondary" role="status">
                        <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    <div class="more-info">
                        <div id="div${i}" class="collapse multi-collapse">
                        <div class="moreInfoDiv" class="card card-body"></div>
                        </div>
                    </div>
            </div>`; // Write a code in the HTMLDOM written by the loop
            content += div
        };
        container.innerHTML = content;  // Merge the code write in the loop into the real HTML code

        // A loop that separates each button that is inside the element of a card, for each click on a certain button, will activate the function.
        const buttonsMoreInfo = document.querySelectorAll(".card > button")
        for (const buttonToggle of buttonsMoreInfo) {
            buttonToggle.addEventListener("click", toggleMoreInfo);
        };

        // A loop that separates each individual checkBox that exists from all the checkBoxes that exist, every time a checkBox is clicked(checked), will activate the function.
        const checkedBoxes = document.querySelectorAll(".checkBox");
        for (const checkBox of checkedBoxes) {
            checkBox.addEventListener("change", favoritesCoins);
        };

        // Identifying the input of the search, for each change (of a letter) will activate the function
        const searchInput = document.getElementById("searchBox");
        searchInput.addEventListener("input", searchSpecificCoin);
    };

    async function getMoreInformation(coin) {
        let prices = JSON.parse(localStorage.getItem(coin.name));
        if (prices) return prices;

        const eurIlsValue = await getJson("https://api.exchangerate-api.com/v4/latest/USD"); // For EUR and ILS;
        const usdValue = await getJson(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coin.symbol}&tsyms=USD`)  // For usd coin value

        // Calculations of the correct price
        const usd = usdValue[coin.symbol].USD.toFixed(0);
        const eur = (usd * eurIlsValue.rates.EUR).toFixed(0);
        const ils = (usd * eurIlsValue.rates.ILS).toFixed(0);
        prices = { usd, eur, ils };

        // Save in the storage
        localStorage.setItem(coin.name, JSON.stringify(prices));

        return prices;
    };

    async function toggleMoreInfo() {
        let timeoutIds = {};
        const spinner = this.nextElementSibling;
        const moreInfoDiv = spinner.nextElementSibling;

        // Getting information of the value coins
        const coin = coins[this.getAttribute("data-coin-id")];
        const prices = await getMoreInformation(coin);

        // If element moreInfoDiv is visible, in the next click, hide it and remove timeout for deletion
        if (moreInfoDiv.style.display === "block") {
            moreInfoDiv.style.display = "none";
            clearTimeout(timeoutIds[coin.name]);
            return;
        }

        // Show spinner
        spinner.style.display = "block";
        // Adds a class to moreInfoDiv
        moreInfoDiv.classList.add('styleMoreInfo');

        // Waits for a 1.5 seconds (shows the spinner during this time), and then does the commands within this phenom of time
        setTimeout(() => {
            // Displaying the correct price via the API
            moreInfoDiv.innerHTML = `
                <div>USD: ${prices.usd}$</div>
                <div>EUR: ${prices.eur}€</div>
                <div>ILS: ${prices.ils}₪</div>
            `;

            // Hide spinner and display info
            spinner.style.display = "none";
            moreInfoDiv.style.display = "block";
            // Remove any existing timeout for deletion
            clearTimeout(timeoutIds[coin.name]);
        }, 1500);

        // Set timeout to remove data from localStorage after 2 minutes
        setTimeout(() => {
            localStorage.removeItem(coin.name);
            moreInfoDiv.style.display = "none"; // Hide the info after removing from localStorage
        }, 120000);
    };

    function searchSpecificCoin() {
        // Obtaining all the cards (coins), and the value of user search and converted to lowercase letters
        const searchValue = this.value.toLowerCase();
        const coinsCards = document.querySelectorAll(".card");
        // Make a flag
        let coinFound = false;
        let noResultsMessage = document.getElementById("noResultsMessage");

        // Hide all the cards
        for (const card of coinsCards) {
            card.style.display = "none";
        }

        // A loop that goes through all the coins and checks if the name of the coin contains the value of the search
        for (let i = 0; i < coins.length; i++) {
            const coinName = coins[i].name.toLowerCase();
            const cardToShow = document.getElementById(`coin${i}`);
            // If there is a match, the card is shown and the flag change to true
            if (coinName.includes(searchValue)) {
                cardToShow.style.display = "inline-flex";
                coinFound = true;
            }
        }

        // If the flag still false, checking for generating an error message
        if (!coinFound) {
            // If the flag false and there is no error message either, create one for me
            if (!noResultsMessage) {
                const container = document.getElementById("container");
                noResultsMessage = document.createElement("p");
                noResultsMessage.id = "noResultsMessage";
                noResultsMessage.textContent = "There are no matching coins, we are sorry 😔";
                container.appendChild(noResultsMessage);
            }
            // Else, show me the error message (no result message)
            else {
                noResultsMessage.style.display = "block";
            }
        }
        // Else if the flag is true, hide or remove the no result message if it exists
        else {
            if (noResultsMessage) {
                noResultsMessage.style.display = "none";
            }
        }
    };

    // New map for the user chosen/selected coins
    let chosenCoins = new Map();
    function favoritesCoins() {
        const coin = coins[this.id];
        const coinName = coin.name;

        // Check if the coin is not in chosenCoins and the checkbox is checked, if its true (isn't in chosenCoins and he checked), push him to the map
        if (!chosenCoins.has(this.id) && this.checked) {
            chosenCoins.set(this.id, coinName);
        };
        // Check if the coin is in chosenCoins and the checkbox is not checked, if its true, delete the coin (ID) from chosenCoins Map.
        if (chosenCoins.has(this.id) && !this.checked) {
            chosenCoins.delete(this.id);
        };

        // Equipment and map size is greater than 5, please do the following lines
        if (chosenCoins.size > 5) {
            // Open modal by a function
            createModal();

            const modalContainer = document.getElementById("modalContainer");
            for (const valueFavoriteCoin of chosenCoins) {
                const coinId = valueFavoriteCoin[0];
                // Generate buttons for each selected coin in the modal with the iconUrl and the name
                modalContainer.innerHTML += `<div class="chosenCoinDiv">
                    <button class="chosenCoinBtn" id="${coins[coinId].name}">
                        <img src="${coins[coinId].iconUrl}" class="img-fluid"><br>${coins[coinId].name}
                    </button>
                </div>`;
            };

            const favoritesCoinsButtons = document.querySelectorAll(".chosenCoinDiv > button");
            let currencyClicked = false;    // Make a flag to check if the user click on some coin from the modal to delete
            let coinToDelete = "";      // An external variable to be used afterwards
            for (const btn of favoritesCoinsButtons) {
                btn.addEventListener("click", function () {
                    // General design for those who did not click on it.
                    for (const favoriteCoinBtn of favoritesCoinsButtons) {
                        favoriteCoinBtn.style.boxShadow = "0 0 0";
                        favoriteCoinBtn.style.border = "";
                        favoriteCoinBtn.style.borderRadius = "";
                    }
                    // Special design for those who clicked on it
                    this.style.boxShadow = "10px 10px 20px";
                    this.style.border = `5px solid rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
                    this.style.borderRadius = "20px";
                    // Change the flag to true (the user selected some coin from the modal to delete)
                    currencyClicked = true;
                    // Put the chosen id of the coin that the user want to delete
                    coinToDelete = this.id;
                });
            };

            const saveChangesModalBtn = document.getElementById("saveChangesBTN");
            saveChangesModalBtn.addEventListener("click", () => {
                // If the flag is false, its mean that the user didn't choose one coin to remove from the favorite coins, so pop up alert that he must the choose one
                if (!currencyClicked) {
                    alert("You must choose one coin to delete!");
                    return;
                };
                deleteCoin(coinToDelete);
            });

            const cancelBtn = document.getElementById("cancelBtn");
            cancelBtn.addEventListener("click", () => {
                // A warning message on whether the action was intended and an explanation of what it does
                const sure = window.confirm("Are you sure? This will delete the last coin you selected");
                // If he "cancelled" his action and did not confirm, return
                if (!sure) return;
                // Else
                deleteCoin(favoritesCoinsButtons[favoritesCoinsButtons.length - 1].id);
            });
        };

        // Save the chosen coins to local storage
        saveChosenCoinsToLocalStorage();
    };

    function deleteCoin(valueOfTheCoin) {
        let coinToRemoveId;

        // Loop through the chosenCoins Map to find the matching value and get its key (ID)
        chosenCoins.forEach((value, key) => {
            if (value === valueOfTheCoin) {
                coinToRemoveId = key;
            }
        });

        // If a matching coin is found
        if (coinToRemoveId) {
            // Update the corresponding checkbox in the DOM (uncheck it)
            const inputToUnchecked = document.getElementById(coinToRemoveId);
            if (inputToUnchecked) {
                inputToUnchecked.checked = false;
            }

            // Remove the coin from the chosenCoins Map
            chosenCoins.delete(coinToRemoveId);
        };

        // Save the updated chosenCoins Map to local storage
        saveChosenCoinsToLocalStorage();

        // Clear the content of the modal container in the DOM (so as not to create a duplicate of the model in the future)
        const divContainer = document.getElementById("divModalContainer");
        if (divContainer) {
            divContainer.innerHTML = "";
        }

        // Close the Modal
        document.getElementById("modal").style.display = "none";
        document.getElementById("myModal").style.display = "none";
        document.getElementById("myModal").classList.remove("show");
    };

    // Create HTML modal (from BootStrap) and design with my style
    function createModal() {
        const divContainer = document.getElementById("divModalContainer");

        // Create HTML for the modal (take from BootStrap)
        divContainer.innerHTML += `<div class="modal-header">
                <h3 class="modal-title">You can choose only 5 coins</h3>
                <button type="button" id="cancelBtn">❌</button>
            </div>
            <div class="modal-body">
                    <p>Please remove one of the coins</p>
                    <div id="modalContainer" class="iconButton"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-primary" id="saveChangesBTN">Save changes</button>
            </div>`;

        // Style for the Modal, and show him when call to this function
        document.getElementById("modal").style.display = "block";
        document.getElementById("myModal").style.display = "block";
        document.getElementById("myModal").classList.add("show");
    };

    async function createHome() {
        // Let them see the searchBox at the top corner
        const searchBox = document.getElementById("searchBox");
        searchBox.style.display = "block";

        // A call to the main function for this page
        displayCoins(coins);

        // If the coin name is found in the all of coins we have (because of the getMoreInformation function) and it is not deleted (due to a refresh or crash), delete it now
        for (const coin of coins) {
            localStorage.removeItem(coin.name);
        }

        // Load what is now in storage (after the previous deletion)
        loadChosenCoinsFromLocalStorage();

    };

    // When the user click on Home Tab, what it will do
    const homeLink = document.getElementById("homeLink");
    homeLink.addEventListener("click", () => {
        // Call the function that create this page
        createHome();
    });

    // Right when the site goes up, it will show me the following function:
    document.onload = createHome();

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//

    // About tab and about functions:
    
    function createAboutInformation() {
        const container = document.getElementById("container");
        // Create about information, includes my photo
        container.innerHTML = `<div id="aboutDiv">
                <h2>Welcome to my Digital Coins Project!</h2>
                <hr>
                <p id="aboutMeP">About me,<br>
                    Hello, my name is Maayan Pesach. I am 21 years old, born and raised in Yokne'am Illit. I am currently serving in the military due to the ongoing war.<br>
                    Daily, I work as a computer technician in an agriculture development company. I am a person who loves to enjoy life, and my hobbies mainly include going out, traveling, exploring new places around the world, and creating experiences with friends and family.<br>
                    Why did I start learning programming (FullStack WEB)?<br>
                    This field fascinates me because it unveils the mystery behind every website or application. Behind every small button, image, or paragraph, there is a function that people cannot see, yet they simply enjoy clicking. The programming world, in my point of view, is vast and always evolving, requiring constant exploration. It's a field that I love, and I want to know better about it.<br>
                    After you get to know me, let me explain to you about my project.. This project deals with the world of digital coins. On its main page, you can see various digital coins and their values in euros, shekels, and dollars. You can select up to 5 currencies to explore further.<br>
                    The project is built using the "Single Page Application" method, which means that when you navigate from page to page (above), the content changes in JS code that is embedded in the HTML depending on the click and the page you selected.<br>
                    In this project, I specifically dealt with programming languages such as JavaScript, HTML, CSS, Bootstrap, and more.<br>
                    Enjoy 😊😊
                </p>
        </div>
        <img src="assets/images/Me.png" id="photoAbout">`;
    };

    // When the user click on About Tab, what it will do
    function createAbout() {
        // Canceling the ability to see the search box above
        const searchBox = document.getElementById("searchBox");
        searchBox.style.display = "none";

        // A call to the main function for this page
        createAboutInformation();
    };

    // When the user click on About Tab, what it will do
    const aboutLink = document.getElementById("aboutLink");
    aboutLink.addEventListener("click", createAbout);

})();