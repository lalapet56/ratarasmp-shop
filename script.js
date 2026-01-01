document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const infoGrid = document.getElementById('info-grid');
    const modal = document.getElementById('buyModal');
    const closeModal = document.querySelector('.close');
    const nameInput = document.getElementById('buyer-name');
    const sellerList = document.getElementById('seller-list');
    const themeBtn = document.getElementById('theme-toggle');
    const body = document.body;
    
    let currentProduct = null;
    let config = null;

    // --- Theme Logic ---
    // Check system preference
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    
    // Check local storage for manual override
    const savedTheme = localStorage.getItem('theme');

    // Default to system, fallback to dark (CSS is dark by default, so we only need to add 'light-mode' class if needed)
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        themeBtn.textContent = '🌙';
    } else if (savedTheme === 'dark') {
        body.classList.remove('light-mode');
        themeBtn.textContent = '☀️';
    } else if (prefersLight) {
        body.classList.add('light-mode');
        themeBtn.textContent = '🌙';
    } else {
        // System is dark, or unknown -> Fallback to Dark (default CSS)
        body.classList.remove('light-mode');
        themeBtn.textContent = '☀️';
    }

    themeBtn.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        const isLight = body.classList.contains('light-mode');
        themeBtn.textContent = isLight ? '🌙' : '☀️';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });

    // --- End Theme Logic ---

    // Load Configuration
    fetch('config.yml?v=7')
        .then(response => response.text())
        .then(text => {
            config = jsyaml.load(text);
            initStore(config);
        })
        .catch(e => {
            console.error("Error loading config:", e);
            productGrid.innerHTML = '<p style="text-align:center; color:red;">Error loading store configuration.</p>';
        });

    function initStore(data) {
        // Meta
        document.title = data.site.title || 'Store';
        const fav = document.getElementById('favicon');
        if (data.site.icon) fav.href = data.site.icon;

        // Header
        document.getElementById('shop-title').textContent = data.shop.title;
        document.getElementById('shop-desc').textContent = data.shop.description;

        // Products
        renderProducts(data.products);

        // Info Cards
        if (data.infos) {
            renderInfoCards(data.infos);
        }
    }

    function renderProducts(products) {
        productGrid.innerHTML = '';
        products.forEach((product, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            
            card.innerHTML = `
                <div class="card-img-container">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/400x300?text=No+Image'">
                </div>
                <div class="card-body">
                    <h3 class="card-title">${product.name}</h3>
                    <p class="card-desc">${product.description}</p>
                    <div class="card-footer">
                        <span class="price">${product.price}</span>
                        <button class="btn-buy" data-index="${index}">BUY</button>
                    </div>
                </div>
            `;
            productGrid.appendChild(card);
        });

        // Event Listeners for Buy Buttons
        document.querySelectorAll('.btn-buy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                currentProduct = config.products[index];
                openModal();
            });
        });
    }

    function renderInfoCards(infos) {
        infoGrid.innerHTML = '';
        infos.forEach(info => {
            const card = document.createElement('div');
            card.className = 'info-card';
            card.innerHTML = `
                <h3>${info.title}</h3>
                <p>${info.content}</p>
            `;
            infoGrid.appendChild(card);
        });
    }

    function openModal() {
        modal.classList.add('show');
        nameInput.value = '';
        nameInput.classList.remove('input-error'); // Reset shake
        nameInput.focus();
        
        // Render Seller Buttons
        sellerList.innerHTML = '';
        const sellers = config.sellers || [];
        
        sellers.forEach((sellerStr) => {
            // Format: "Name|Number"
            const parts = sellerStr.split('|');
            const sName = parts[0] ? parts[0].trim() : 'Admin';
            const sNum = parts[1] ? parts[1].trim() : '';

            if (sNum) {
                const btn = document.createElement('button');
                btn.className = 'btn-seller';
                btn.innerHTML = `${sName} <span class="icon">➤</span>`;
                btn.onclick = () => processPurchase(sName, sNum);
                sellerList.appendChild(btn);
            }
        });

        if (sellers.length === 0) {
            sellerList.innerHTML = '<p style="color:red">No sellers configured.</p>';
        }
    }

    function processPurchase(sellerName, sellerNumber) {
        const buyerName = nameInput.value.trim();
        
        // Validation with Shake Animation
        if (!buyerName) {
            nameInput.classList.add('input-error');
            nameInput.focus();
            
            // Remove class after animation finishes so it can run again
            setTimeout(() => {
                nameInput.classList.remove('input-error');
            }, 500);
            
            return;
        }

        // Proceed to WhatsApp
        const message = `Halo ${sellerName}, Saya ${buyerName} berminat membeli *${currentProduct.name}* seharga *${currentProduct.price}*.`;
        
        const encodedMessage = encodeURIComponent(message);
        const waUrl = `https://wa.me/${sellerNumber}?text=${encodedMessage}`;
        
        window.open(waUrl, '_blank');
        closeModalFunc();
    }

    function closeModalFunc() {
        modal.classList.remove('show');
        currentProduct = null;
    }

    closeModal.addEventListener('click', closeModalFunc);
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            closeModalFunc();
        }
    });
});